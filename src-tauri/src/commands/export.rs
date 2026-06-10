use std::fs::File;
use std::io::Write;
use crate::models::{ProjectSummary, LanguageStats};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportOptions {
    pub include_code: bool,
    pub include_multimedia: bool,
    pub include_game: bool,
    pub include_cad: bool,
    pub include_documents: bool,
}

#[tauri::command]
pub async fn export_report(
    path: String,
    format: String,
    mut summary: ProjectSummary,
    options: ExportOptions,
) -> Result<(), String> {
    // 1. Filter code files based on options
    let is_ext_excluded = |ext: &str| -> bool {
        if let Some(cfg) = crate::engine::assets::get_asset_config(ext) {
            let is_multimedia = cfg.category == "multimedia";
            let is_game = cfg.category == "game_3d";
            let is_cad = cfg.category == "cad_drawing";
            let is_doc = cfg.category == "document" || cfg.category == "font" || cfg.category == "archive" || cfg.category == "data";

            if is_multimedia && !options.include_multimedia {
                return true;
            }
            if is_game && !options.include_game {
                return true;
            }
            if is_cad && !options.include_cad {
                return true;
            }
            if is_doc && !options.include_documents {
                return true;
            }
        }
        false
    };

    let mut active_files = Vec::new();
    if options.include_code {
        for f in summary.files {
            if let Some(ext) = f.path.split('.').last() {
                let ext_lower = ext.to_lowercase();
                if is_ext_excluded(&ext_lower) {
                    continue;
                }
            }
            active_files.push(f);
        }
    }
    summary.files = active_files;

    // 2. Filter asset report
    if let Some(ref mut ar) = summary.asset_report {
        ar.assets.retain(|a| {
            let is_multimedia = a.category == "multimedia";
            let is_game = a.category == "game_3d";
            let is_cad = a.category == "cad_drawing";
            let is_doc = a.category == "document" || a.category == "font" || a.category == "archive" || a.category == "data";

            (is_multimedia && options.include_multimedia)
                || (is_game && options.include_game)
                || (is_cad && options.include_cad)
                || (is_doc && options.include_documents)
        });

        ar.orphans.retain(|o| {
            let is_multimedia = o.category == "multimedia";
            let is_game = o.category == "game_3d";
            let is_cad = o.category == "cad_drawing";
            let is_doc = o.category == "document" || o.category == "font" || o.category == "archive" || o.category == "data";

            (is_multimedia && options.include_multimedia)
                || (is_game && options.include_game)
                || (is_cad && options.include_cad)
                || (is_doc && options.include_documents)
        });

        ar.duplicates.retain(|d| {
            if d.files.is_empty() {
                return false;
            }
            if let Some(ext) = d.files[0].split('.').last() {
                let ext_lower = ext.to_lowercase();
                if is_ext_excluded(&ext_lower) {
                    return false;
                }
            }
            true
        });

        ar.optimization_hints.retain(|h| {
            if let Some(ext) = h.path.split('.').last() {
                let ext_lower = ext.to_lowercase();
                if is_ext_excluded(&ext_lower) {
                    return false;
                }
            }
            true
        });
    }

    // 3. Recalculate statistics
    let mut total_code = 0;
    let mut total_comments = 0;
    let mut total_blanks = 0;
    let mut lang_groups: HashMap<String, (u32, u64, u64, u64)> = HashMap::new();

    for f in &summary.files {
        total_code += f.code;
        total_comments += f.comments;
        total_blanks += f.blanks;

        let entry = lang_groups
            .entry(f.lang.clone())
            .or_insert((0, 0, 0, 0));
        entry.0 += 1;
        entry.1 += f.code;
        entry.2 += f.comments;
        entry.3 += f.blanks;
    }

    if let Some(ref ar) = summary.asset_report {
        for a in &ar.assets {
            let cat = &a.category;
            let is_doc_related = cat == "document" || cat == "font" || cat == "archive" || cat == "data";
            
            let should_add = (cat == "multimedia" && options.include_multimedia)
                || (cat == "game_3d" && options.include_game)
                || (cat == "cad_drawing" && options.include_cad)
                || (is_doc_related && options.include_documents);

            if should_add {
                let lang_name = a.subcategory.to_uppercase();
                let entry = lang_groups
                    .entry(lang_name)
                    .or_insert((0, 0, 0, 0));
                entry.0 += 1;
            }
        }
    }

    summary.total_files = summary.files.len() as u32;
    if let Some(ref ar) = summary.asset_report {
        summary.total_files += ar.assets.len() as u32;
    }
    
    summary.total_code = total_code;
    summary.total_comments = total_comments;
    summary.total_blanks = total_blanks;
    summary.total_loc = total_code + total_comments + total_blanks;

    // Recalculate duplicates based on active code files
    if !options.include_code {
        summary.duplicates = 0;
        summary.duplicate_groups = Vec::new();
    } else {
        let mut active_paths = std::collections::HashSet::new();
        for f in &summary.files {
            active_paths.insert(f.path.clone());
        }

        let mut filtered_groups = Vec::new();
        for group in summary.duplicate_groups {
            let filtered_group: Vec<String> = group
                .into_iter()
                .filter(|p| active_paths.contains(p))
                .collect();
            if filtered_group.len() > 1 {
                filtered_groups.push(filtered_group);
            }
        }

        summary.duplicates = filtered_groups.iter().map(|g| g.len() as u32).sum();
        summary.duplicate_groups = filtered_groups;
    }

    let total_loc_f64 = summary.total_loc as f64;
    let mut languages: Vec<LanguageStats> = lang_groups
        .into_iter()
        .map(|(name, (files, code, comments, blanks))| {
            let pct = if total_loc_f64 > 0.0 {
                ((code + comments + blanks) as f64 / total_loc_f64) * 100.0
            } else {
                0.0
            };
            LanguageStats { name, files, code, comments, blanks, pct }
        })
        .collect();

    languages.sort_by(|a, b| (b.code + b.comments + b.blanks).cmp(&(a.code + a.comments + a.blanks)));
    summary.languages = languages;
    summary.total_languages = summary.languages.len() as u32;

    // Recalculate average complexity & complexity distribution
    let mut total_complexity = 0.0;
    let mut complexity_dist = vec![0u32; 10];
    for f in &summary.files {
        total_complexity += f.complexity;
        let comp_idx = match f.complexity as u32 {
            0..=1 => 0,
            2..=3 => 1,
            4..=5 => 2,
            6..=7 => 3,
            8..=9 => 4,
            10..=12 => 5,
            13..=15 => 6,
            16..=18 => 7,
            19..=20 => 8,
            _ => 9,
        };
        complexity_dist[comp_idx] += 1;
    }
    summary.average_complexity = if !summary.files.is_empty() {
        total_complexity / summary.files.len() as f64
    } else {
        1.0
    };
    summary.complexity_dist = complexity_dist;

    let content = match format.to_lowercase().as_str() {
        "json" => {
            serde_json::to_string_pretty(&summary)
                .map_err(|e| format!("Failed to generate JSON: {}", e))?
        }
        "csv" => {
            let mut csv = String::new();
            csv.push_str("File Name,Path,Category/Language,Lines of Code (LOC),Source Code,Comments,Blanks,Size (Bytes),Complexity\n");
            
            if options.include_code {
                for f in &summary.files {
                    let name = f.name.replace('"', "\"\"");
                    let fpath = f.path.replace('"', "\"\"");
                    csv.push_str(&format!(
                        "\"{}\",\"{}\",\"{}\",{},{},{},{},{},{:.1}\n",
                        name, fpath, f.lang, f.loc, f.code, f.comments, f.blanks, f.size_bytes, f.complexity
                    ));
                }
            }

            if let Some(ref ar) = summary.asset_report {
                for a in &ar.assets {
                    let is_multimedia = a.category == "multimedia";
                    let is_game = a.category == "game_3d";
                    let is_cad = a.category == "cad_drawing";
                    let is_doc = a.category == "document" || a.category == "font" || a.category == "archive" || a.category == "data";

                    if (is_multimedia && options.include_multimedia)
                        || (is_game && options.include_game)
                        || (is_cad && options.include_cad)
                        || (is_doc && options.include_documents)
                    {
                        let name = a.name.replace('"', "\"\"");
                        let fpath = a.path.replace('"', "\"\"");
                        csv.push_str(&format!(
                            "\"{}\",\"{}\",\"{}\",0,0,0,0,{},0.0\n",
                            name, fpath, a.category, a.size
                        ));
                    }
                }
            }
            csv
        }
        "markdown" => {
            let mut md = String::new();
            md.push_str(&format!("# Codebase Analysis Report: {}\n\n", summary.path));
            md.push_str(&format!("*Scan Duration:* {} ms\n\n", summary.scan_duration_ms));
            
            if options.include_code {
                md.push_str("## Project Summary (Code)\n\n");
                md.push_str(&format!("- **Total Files:** {}\n", summary.total_files));
                md.push_str(&format!("- **Total Languages:** {}\n", summary.total_languages));
                md.push_str(&format!("- **Total Lines of Code (LOC):** {} (Code: {}, Comments: {}, Blanks: {})\n", summary.total_loc, summary.total_code, summary.total_comments, summary.total_blanks));
                md.push_str(&format!("- **Average Cyclomatic Complexity:** {:.1}\n", summary.average_complexity));
                md.push_str(&format!("- **Duplicate Files:** {}\n\n", summary.duplicates));

                md.push_str("## Language Distribution\n\n");
                md.push_str("| Language | Files | Code Lines | Comment Lines | Blank Lines | Percentage |\n");
                md.push_str("| --- | --- | --- | --- | --- | --- |\n");
                for l in &summary.languages {
                    md.push_str(&format!(
                        "| {} | {} | {} | {} | {} | {:.1}% |\n",
                        l.name, l.files, l.code, l.comments, l.blanks, l.pct
                    ));
                }
                md.push_str("\n");
            }

            if let Some(ref ar) = summary.asset_report {
                if options.include_multimedia {
                    let count = ar.summary.category_counts.get("multimedia").copied().unwrap_or(0);
                    let size = ar.summary.category_sizes.get("multimedia").copied().unwrap_or(0) as f64 / (1024.0 * 1024.0);
                    md.push_str("## Multimedia Assets\n\n");
                    md.push_str(&format!("- **Total Files:** {}\n", count));
                    md.push_str(&format!("- **Total Size:** {:.2} MB\n\n", size));
                }
                if options.include_game {
                    let count = ar.summary.category_counts.get("game_3d").copied().unwrap_or(0);
                    let size = ar.summary.category_sizes.get("game_3d").copied().unwrap_or(0) as f64 / (1024.0 * 1024.0);
                    md.push_str("## Game & 3D Assets\n\n");
                    md.push_str(&format!("- **Total Files:** {}\n", count));
                    md.push_str(&format!("- **Total Size:** {:.2} MB\n\n", size));
                }
                if options.include_cad {
                    let count = ar.summary.category_counts.get("cad_drawing").copied().unwrap_or(0);
                    let size = ar.summary.category_sizes.get("cad_drawing").copied().unwrap_or(0) as f64 / (1024.0 * 1024.0);
                    md.push_str("## CAD Drawings\n\n");
                    md.push_str(&format!("- **Total Files:** {}\n", count));
                    md.push_str(&format!("- **Total Size:** {:.2} MB\n\n", size));
                }
                if options.include_documents {
                    let doc_count = ar.summary.category_counts.get("document").copied().unwrap_or(0);
                    let doc_size = ar.summary.category_sizes.get("document").copied().unwrap_or(0) as f64 / (1024.0 * 1024.0);
                    md.push_str("## Documents & Other Assets\n\n");
                    md.push_str(&format!("- **Total Files:** {}\n", doc_count));
                    md.push_str(&format!("- **Total Size:** {:.2} MB\n\n", doc_size));
                }
            }
            md
        }
        "html" => {
            let mut html = String::new();
            html.push_str("<!DOCTYPE html>\n<html>\n<head>\n");
            html.push_str("<title>Codebase Analysis Report</title>\n");
            html.push_str("<style>\n");
            html.push_str("body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0d0c15; color: #e2e1e6; margin: 40px; }\n");
            html.push_str("h1, h2 { color: #f59e0b; }\n");
            html.push_str("table { width: 100%; border-collapse: collapse; margin-top: 20px; }\n");
            html.push_str("th, td { border: 1px solid #2a2935; padding: 12px; text-align: left; }\n");
            html.push_str("th { background-color: #1a1825; }\n");
            html.push_str("tr:nth-child(even) { background-color: #14121e; }\n");
            html.push_str("</style>\n</head>\n<body>\n");
            html.push_str(&format!("<h1>Codebase Analysis Report</h1>\n"));
            html.push_str(&format!("<p><strong>Target Directory:</strong> {}</p>\n", summary.path));
            html.push_str(&format!("<p><strong>Scan Duration:</strong> {} ms</p>\n", summary.scan_duration_ms));
            
            if options.include_code {
                html.push_str("<h2>Summary Metrics (Code)</h2>\n<ul>\n");
                html.push_str(&format!("<li><strong>Total Files:</strong> {}</li>\n", summary.total_files));
                html.push_str(&format!("<li><strong>Total Lines of Code (LOC):</strong> {}</li>\n", summary.total_loc));
                html.push_str(&format!("<li><strong>Average Complexity:</strong> {:.1}</li>\n", summary.average_complexity));
                html.push_str("</ul>\n");
                
                html.push_str("<h2>Language Distribution</h2>\n<table>\n<thead>\n<tr>\n<th>Language</th><th>Files</th><th>Code</th><th>Comments</th><th>Blanks</th><th>Percentage</th>\n</tr>\n</thead>\n<tbody>\n");
                for l in &summary.languages {
                    html.push_str(&format!(
                        "<tr><td>{}</td><td>{}</td><td>{}</td><td>{}</td><td>{}</td><td>{:.1}%</td></tr>\n",
                        l.name, l.files, l.code, l.comments, l.blanks, l.pct
                    ));
                }
                html.push_str("</tbody>\n</table>\n");
            }

            if let Some(ref ar) = summary.asset_report {
                if options.include_multimedia {
                    let count = ar.summary.category_counts.get("multimedia").copied().unwrap_or(0);
                    let size = ar.summary.category_sizes.get("multimedia").copied().unwrap_or(0) as f64 / (1024.0 * 1024.0);
                    html.push_str(&format!("<h2>Multimedia Assets</h2>\n<p><strong>Total Files:</strong> {}</p>\n<p><strong>Total Size:</strong> {:.2} MB</p>\n", count, size));
                }
                if options.include_game {
                    let count = ar.summary.category_counts.get("game_3d").copied().unwrap_or(0);
                    let size = ar.summary.category_sizes.get("game_3d").copied().unwrap_or(0) as f64 / (1024.0 * 1024.0);
                    html.push_str(&format!("<h2>Game & 3D Assets</h2>\n<p><strong>Total Files:</strong> {}</p>\n<p><strong>Total Size:</strong> {:.2} MB</p>\n", count, size));
                }
                if options.include_cad {
                    let count = ar.summary.category_counts.get("cad_drawing").copied().unwrap_or(0);
                    let size = ar.summary.category_sizes.get("cad_drawing").copied().unwrap_or(0) as f64 / (1024.0 * 1024.0);
                    html.push_str(&format!("<h2>CAD Drawings</h2>\n<p><strong>Total Files:</strong> {}</p>\n<p><strong>Total Size:</strong> {:.2} MB</p>\n", count, size));
                }
                if options.include_documents {
                    let count = ar.summary.category_counts.get("document").copied().unwrap_or(0);
                    let size = ar.summary.category_sizes.get("document").copied().unwrap_or(0) as f64 / (1024.0 * 1024.0);
                    html.push_str(&format!("<h2>Documents & Other Assets</h2>\n<p><strong>Total Files:</strong> {}</p>\n<p><strong>Total Size:</strong> {:.2} MB</p>\n", count, size));
                }
            }
            
            html.push_str("</body>\n</html>\n");
            html
        }
        _ => return Err(format!("Unsupported export format: {}", format)),
    };

    let mut file = File::create(path).map_err(|e| format!("Failed to create export file: {}", e))?;
    file.write_all(content.as_bytes())
        .map_err(|e| format!("Failed to write export file: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn write_text_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(path, content).map_err(|e| e.to_string())
}
