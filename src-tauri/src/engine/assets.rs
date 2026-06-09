use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use rayon::prelude::*;

use crate::models::{AssetReport, AssetInfo, AssetSummary, AssetDuplicate, OrphanAsset, OptimizationHint};
use crate::engine::duplicate::compute_sha256;

include!(concat!(env!("OUT_DIR"), "/assets_gen.rs"));

pub fn get_asset_config(extension: &str) -> Option<AssetConfig> {
    let ext_lower = extension.to_lowercase();
    GENERATED_ASSET_CONFIGS
        .iter()
        .find(|&&(ext, _)| ext == ext_lower)
        .map(|&(_, config)| config)
}

fn get_png_dimensions(path: &Path) -> Option<(u32, u32)> {
    let mut file = File::open(path).ok()?;
    let mut header = [0u8; 24];
    file.read_exact(&mut header).ok()?;
    
    // Check PNG signature: [137, 80, 78, 71, 13, 10, 26, 10]
    if &header[0..8] == &[137, 80, 78, 71, 13, 10, 26, 10] {
        let width = u32::from_be_bytes([header[16], header[17], header[18], header[19]]);
        let height = u32::from_be_bytes([header[20], header[21], header[22], header[23]]);
        Some((width, height))
    } else {
        None
    }
}

fn get_jpeg_dimensions(path: &Path) -> Option<(u32, u32)> {
    let mut file = File::open(path).ok()?;
    let mut marker = [0u8; 2];
    
    file.read_exact(&mut marker).ok()?;
    if marker != [0xFF, 0xD8] {
        return None;
    }
    
    loop {
        if file.read_exact(&mut marker).is_err() {
            break;
        }
        
        if marker[0] != 0xFF {
            break;
        }
        
        let marker_type = marker[1];
        if marker_type == 0xD9 || marker_type == 0xDA {
            break;
        }
        
        let mut len_bytes = [0u8; 2];
        if file.read_exact(&mut len_bytes).is_err() {
            break;
        }
        let length = u16::from_be_bytes(len_bytes) as i64;
        
        if marker_type == 0xC0 || marker_type == 0xC2 {
            let mut sof_data = [0u8; 5];
            if file.read_exact(&mut sof_data).is_err() {
                break;
            }
            let height = u16::from_be_bytes([sof_data[1], sof_data[2]]) as u32;
            let width = u16::from_be_bytes([sof_data[3], sof_data[4]]) as u32;
            return Some((width, height));
        } else {
            if file.seek(SeekFrom::Current(length - 2)).is_err() {
                break;
            }
        }
    }
    
    None
}

fn extract_metadata(path: &Path, extension: &str) -> HashMap<String, String> {
    let mut meta = HashMap::new();
    
    match extension {
        "png" => {
            if let Some((w, h)) = get_png_dimensions(path) {
                meta.insert("dimensions".to_string(), format!("{}x{}", w, h));
                meta.insert("width".to_string(), w.to_string());
                meta.insert("height".to_string(), h.to_string());
            }
        }
        "jpg" | "jpeg" => {
            if let Some((w, h)) = get_jpeg_dimensions(path) {
                meta.insert("dimensions".to_string(), format!("{}x{}", w, h));
                meta.insert("width".to_string(), w.to_string());
                meta.insert("height".to_string(), h.to_string());
            }
        }
        _ => {}
    }
    
    meta
}

fn detect_asset_edges(assets: &[AssetInfo], root: &Path) -> Vec<(String, String)> {
    use std::sync::Mutex;
    let edges = Mutex::new(Vec::new());

    assets.par_iter().for_each(|parent| {
        let ext = parent.extension.as_str();
        if ext == "tscn" || ext == "tres" || ext == "meta" || ext == "dxf" || ext == "gdns" || ext == "gdnlib" 
           || ext == "prefab" || ext == "unity" || ext == "asset" || ext == "import" || ext == "uproject" {
            let abs_path = root.join(&parent.path);
            if let Ok(content) = std::fs::read_to_string(&abs_path) {
                let mut local_edges = Vec::new();
                for child in assets {
                    if parent.path != child.path && child.name.len() > 3 {
                        if content.contains(&child.name) {
                            local_edges.push((parent.path.clone(), child.path.clone()));
                        }
                    }
                }
                if !local_edges.is_empty() {
                    edges.lock().unwrap().extend(local_edges);
                }
            }
        }
    });

    edges.into_inner().unwrap()
}

fn detect_orphans(
    assets: &[AssetInfo],
    code_paths: &[PathBuf],
    asset_edges: &[(String, String)],
) -> Vec<OrphanAsset> {
    use std::sync::Mutex;
    
    let detected_indices = Mutex::new(HashSet::new());
    
    // 1. Scan code files for references
    code_paths.par_iter().for_each(|code_path| {
        if let Ok(content) = std::fs::read_to_string(code_path) {
            let mut local_detected = Vec::new();
            for (idx, asset) in assets.iter().enumerate() {
                if asset.name.len() > 3 && content.contains(&asset.name) {
                    local_detected.push(idx);
                }
            }
            
            if !local_detected.is_empty() {
                let mut guard = detected_indices.lock().unwrap();
                for idx in local_detected {
                    guard.insert(idx);
                }
            }
        }
    });
    
    let mut detected = detected_indices.into_inner().unwrap();
    
    // 2. Add assets that are referenced by other assets (e.g. textures in scenes)
    for (_, dest) in asset_edges {
        for (idx, asset) in assets.iter().enumerate() {
            if &asset.path == dest {
                detected.insert(idx);
            }
        }
    }
    
    let mut orphans = Vec::new();
    for (idx, asset) in assets.iter().enumerate() {
        if !detected.contains(&idx) {
            orphans.push(OrphanAsset {
                path: asset.path.clone(),
                name: asset.name.clone(),
                category: asset.category.clone(),
                size: asset.size,
            });
        }
    }
    
    orphans
}

pub fn scan_assets(asset_paths: &[PathBuf], root: &Path, code_paths: &[PathBuf]) -> AssetReport {
    // 1. Scan asset info in parallel using Rayon
    let asset_infos: Vec<AssetInfo> = asset_paths
        .par_iter()
        .filter_map(|path| {
            let relative_path = path.strip_prefix(root).ok()?.to_string_lossy().to_string();
            let name = path.file_name()?.to_string_lossy().to_string();
            let extension = path.extension()?.to_string_lossy().to_string().to_lowercase();
            
            let config = get_asset_config(&extension)?;
            let size = std::fs::metadata(path).ok()?.len();
            
            // Compute SHA-256 for duplicates check
            let sha256 = compute_sha256(path).ok();
            
            // Extract format-specific metadata
            let metadata = extract_metadata(path, &extension);
            
            Some(AssetInfo {
                path: relative_path,
                name,
                extension,
                size,
                category: config.category.to_string(),
                subcategory: config.subcategory.to_string(),
                description: config.description.to_string(),
                sha256,
                metadata,
            })
        })
        .collect();

    // 2. Aggregate summary
    let mut total_files = 0;
    let mut total_size = 0;
    let mut category_counts = HashMap::new();
    let mut category_sizes = HashMap::new();
    let mut subcategory_counts = HashMap::new();

    for asset in &asset_infos {
        total_files += 1;
        total_size += asset.size;
        
        *category_counts.entry(asset.category.clone()).or_insert(0) += 1;
        *category_sizes.entry(asset.category.clone()).or_insert(0) += asset.size;
        *subcategory_counts.entry(asset.subcategory.clone()).or_insert(0) += 1;
    }

    let summary = AssetSummary {
        total_files,
        total_size,
        category_counts,
        category_sizes,
        subcategory_counts,
    };

    // 3. Find duplicates by SHA-256
    let mut sha_map: HashMap<String, Vec<String>> = HashMap::new();
    let mut sha_sizes: HashMap<String, u64> = HashMap::new();

    for asset in &asset_infos {
        if let Some(ref sha) = asset.sha256 {
            sha_map.entry(sha.clone()).or_default().push(asset.path.clone());
            sha_sizes.insert(sha.clone(), asset.size);
        }
    }

    let mut duplicates = Vec::new();
    for (sha256, files) in sha_map {
        if files.len() > 1 {
            let size = sha_sizes.get(&sha256).copied().unwrap_or(0);
            duplicates.push(AssetDuplicate {
                sha256,
                size,
                files,
            });
        }
    }

    // Sort duplicates by wasted space desc
    duplicates.sort_by(|a, b| {
        let wasted_a = a.size * (a.files.len() as u64 - 1);
        let wasted_b = b.size * (b.files.len() as u64 - 1);
        wasted_b.cmp(&wasted_a)
    });

    // 4. Base optimization hints
    let mut optimization_hints = Vec::new();
    for asset in &asset_infos {
        // Warning if PNG or JPEG is > 5MB
        if (asset.subcategory == "image") && (asset.extension == "png" || asset.extension == "jpg" || asset.extension == "jpeg") && asset.size > 5 * 1024 * 1024 {
            let savings = asset.size - (500 * 1024);
            optimization_hints.push(OptimizationHint {
                path: asset.path.clone(),
                name: asset.name.clone(),
                message: format!("Very large image file ({:.2} MB). Consider compressing or converting it to WebP format to save space.", asset.size as f64 / (1024.0 * 1024.0)),
                severity: "warning".to_string(),
                potential_savings: savings,
            });
        }
        
        // Suggest WebP conversion for PNG
        if asset.extension == "png" && asset.size > 500 * 1024 {
            let savings = (asset.size as f64 * 0.7) as u64;
            optimization_hints.push(OptimizationHint {
                path: asset.path.clone(),
                name: asset.name.clone(),
                message: "PNG format occupies a lot of storage. Converting to WebP can reduce file size by up to 70% without quality degradation.".to_string(),
                severity: "info".to_string(),
                potential_savings: savings,
            });
        }
        
        // Info if WAV is > 10MB
        if (asset.subcategory == "audio") && asset.extension == "wav" && asset.size > 10 * 1024 * 1024 {
            let savings = (asset.size as f64 * 0.85) as u64;
            optimization_hints.push(OptimizationHint {
                path: asset.path.clone(),
                name: asset.name.clone(),
                message: format!("Large uncompressed WAV audio file ({:.2} MB). Consider converting it to MP3 or OGG format.", asset.size as f64 / (1024.0 * 1024.0)),
                severity: "info".to_string(),
                potential_savings: savings,
            });
        }
    }

    // Sort optimization hints by potential savings desc
    optimization_hints.sort_by(|a, b| b.potential_savings.cmp(&a.potential_savings));

    // 5. Detect asset relationships
    let edges = detect_asset_edges(&asset_infos, root);

    // 6. Detect Orphans (considering asset-to-asset edges)
    let orphans = detect_orphans(&asset_infos, code_paths, &edges);

    AssetReport {
        summary,
        assets: asset_infos,
        duplicates,
        orphans,
        optimization_hints,
        edges,
    }
}
