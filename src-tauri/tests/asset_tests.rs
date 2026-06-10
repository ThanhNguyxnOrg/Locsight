use locsight_lib::engine::assets::get_asset_config;

#[test]
fn test_get_asset_config() {
    let png_cfg = get_asset_config("png").expect("PNG should be registered");
    assert_eq!(png_cfg.name, "PNG");
    assert_eq!(png_cfg.category, "multimedia");
    assert_eq!(png_cfg.subcategory, "image");

    let fbx_cfg = get_asset_config("fbx").expect("FBX should be registered");
    assert_eq!(fbx_cfg.name, "FBX");
    assert_eq!(fbx_cfg.category, "game_3d");

    let dxf_cfg = get_asset_config("dxf").expect("DXF should be registered");
    assert_eq!(dxf_cfg.name, "DXF");
    assert_eq!(dxf_cfg.category, "cad_drawing");
}

#[test]
fn test_scan_assets_with_ignore_rules() {
    use std::fs::{self, File};
    use std::io::Write;
    use locsight_lib::engine::scanner::scan_project_directory;

    // 1. Setup temp mock project directory
    let temp_dir = std::env::temp_dir().join("locsight_mock_project");
    let _ = fs::remove_dir_all(&temp_dir); // clean start
    fs::create_dir_all(&temp_dir).unwrap();

    // Create subfolders
    fs::create_dir_all(temp_dir.join("assets")).unwrap();
    fs::create_dir_all(temp_dir.join("public/images")).unwrap();
    fs::create_dir_all(temp_dir.join("dist/assets")).unwrap();
    fs::create_dir_all(temp_dir.join("node_modules/library")).unwrap();
    fs::create_dir_all(temp_dir.join("src")).unwrap();

    // 2. Create mock source code files
    fs::write(temp_dir.join("src/main.rs"), b"fn main() {}").unwrap();
    fs::write(temp_dir.join("public/index.js"), b"console.log('hello');").unwrap();

    // 3. Create mock assets (png file signature for dimensions check if necessary, or just mock data)
    // We write PNG bytes to be safe (since the scanner extracts PNG dimensions metadata)
    let mut png_bytes = vec![0u8; 24];
    png_bytes[0..8].copy_from_slice(&[137, 80, 78, 71, 13, 10, 26, 10]);
    png_bytes[8..12].copy_from_slice(&[0, 0, 0, 13]);
    png_bytes[12..16].copy_from_slice(&[73, 72, 68, 82]);
    png_bytes[16..20].copy_from_slice(&[0, 0, 0, 100]); // width 100
    png_bytes[20..24].copy_from_slice(&[0, 0, 0, 100]); // height 100

    fs::write(temp_dir.join("assets/logo.png"), &png_bytes).unwrap();
    fs::write(temp_dir.join("public/images/banner.png"), &png_bytes).unwrap();
    fs::write(temp_dir.join("dist/assets/minified_bundle.png"), &png_bytes).unwrap();
    fs::write(temp_dir.join("node_modules/library/dep_logo.png"), &png_bytes).unwrap();

    // 4. Create .gitignore file containing standard rules
    let mut gitignore = File::create(temp_dir.join(".gitignore")).unwrap();
    writeln!(gitignore, "node_modules/").unwrap();
    writeln!(gitignore, "dist/").unwrap();
    writeln!(gitignore, "*.log").unwrap();

    // 5. Execute scan command
    let scan_res = scan_project_directory(&temp_dir.to_string_lossy());
    assert!(scan_res.is_ok(), "Scan should complete successfully");
    
    let summary = scan_res.unwrap();
    
    // Verify file count (only main.rs and index.js should be scanned as code files)
    assert_eq!(summary.total_files, 2);
    let scanned_code_paths: Vec<String> = summary.files.iter().map(|f| f.path.replace('\\', "/")).collect();
    assert!(scanned_code_paths.contains(&"src/main.rs".to_string()));
    assert!(scanned_code_paths.contains(&"public/index.js".to_string()));

    // Verify asset report
    let asset_report = summary.asset_report.expect("Asset report should be present");
    
    // Total assets must be exactly 2 (assets/logo.png and public/images/banner.png)
    // dist/... and node_modules/... must be ignored!
    let scanned_asset_paths: Vec<String> = asset_report.assets.iter().map(|a| a.path.replace('\\', "/")).collect();
    
    assert_eq!(
        asset_report.summary.total_files, 2, 
        "Only 2 assets should be scanned (others must be ignored). Found assets: {:?}", 
        scanned_asset_paths
    );
    
    assert!(scanned_asset_paths.contains(&"assets/logo.png".to_string()));
    assert!(scanned_asset_paths.contains(&"public/images/banner.png".to_string()));
    
    // Double check that ignored folder assets are not in the list
    assert!(!scanned_asset_paths.contains(&"dist/assets/minified_bundle.png".to_string()));
    assert!(!scanned_asset_paths.contains(&"node_modules/library/dep_logo.png".to_string()));

    // 6. Cleanup
    let _ = fs::remove_dir_all(&temp_dir);
}

