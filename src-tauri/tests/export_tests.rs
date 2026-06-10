use locsight_lib::models::{ProjectSummary, FileInfo, AssetReport, AssetSummary, AssetInfo, AssetDuplicate, OrphanAsset, OptimizationHint};
use locsight_lib::commands::export::{export_report, ExportOptions};
use std::collections::HashMap;
use std::fs;

fn create_dummy_summary() -> ProjectSummary {
    let files = vec![
        FileInfo {
            name: "main.rs".to_string(),
            path: "src/main.rs".to_string(),
            lang: "Rust".to_string(),
            loc: 100,
            code: 80,
            comments: 10,
            blanks: 10,
            size_bytes: 3000,
            complexity: 5.5,
        },
        FileInfo {
            name: "main_copy.rs".to_string(),
            path: "src/main_copy.rs".to_string(),
            lang: "Rust".to_string(),
            loc: 100,
            code: 80,
            comments: 10,
            blanks: 10,
            size_bytes: 3000,
            complexity: 5.5,
        },
        FileInfo {
            name: "helper.py".to_string(),
            path: "src/helper.py".to_string(),
            lang: "Python".to_string(),
            loc: 50,
            code: 40,
            comments: 5,
            blanks: 5,
            size_bytes: 1500,
            complexity: 2.0,
        },
        FileInfo {
            name: "logo.png".to_string(),
            path: "assets/logo.png".to_string(),
            lang: "PNG".to_string(),
            loc: 0,
            code: 0,
            comments: 0,
            blanks: 0,
            size_bytes: 50000,
            complexity: 0.0,
        },
    ];

    let mut category_counts = HashMap::new();
    category_counts.insert("multimedia".to_string(), 1);
    category_counts.insert("document".to_string(), 1);

    let mut category_sizes = HashMap::new();
    category_sizes.insert("multimedia".to_string(), 50000);
    category_sizes.insert("document".to_string(), 2000);

    let mut subcategory_counts = HashMap::new();
    subcategory_counts.insert("image".to_string(), 1);
    subcategory_counts.insert("office".to_string(), 1);

    let asset_report = AssetReport {
        summary: AssetSummary {
            total_files: 2,
            total_size: 52000,
            category_counts,
            category_sizes,
            subcategory_counts,
        },
        assets: vec![
            AssetInfo {
                path: "assets/logo.png".to_string(),
                name: "logo.png".to_string(),
                extension: "png".to_string(),
                size: 50000,
                category: "multimedia".to_string(),
                subcategory: "image".to_string(),
                description: "PNG image".to_string(),
                sha256: Some("hash1".to_string()),
                metadata: HashMap::new(),
            },
            AssetInfo {
                path: "docs/readme.md".to_string(),
                name: "readme.md".to_string(),
                extension: "md".to_string(),
                size: 2000,
                category: "document".to_string(),
                subcategory: "office".to_string(),
                description: "Markdown doc".to_string(),
                sha256: Some("hash2".to_string()),
                metadata: HashMap::new(),
            },
        ],
        duplicates: vec![
            AssetDuplicate {
                sha256: "hash1".to_string(),
                size: 50000,
                files: vec!["assets/logo.png".to_string(), "assets/logo_copy.png".to_string()],
            }
        ],
        orphans: vec![
            OrphanAsset {
                path: "docs/readme.md".to_string(),
                name: "readme.md".to_string(),
                category: "document".to_string(),
                size: 2000,
            }
        ],
        optimization_hints: vec![
            OptimizationHint {
                path: "assets/logo.png".to_string(),
                name: "logo.png".to_string(),
                message: "Optimize image".to_string(),
                severity: "info".to_string(),
                potential_savings: 10000,
            }
        ],
        edges: vec![],
    };

    ProjectSummary {
        path: "/dummy/project".to_string(),
        total_files: 6,
        total_languages: 3,
        total_code: 220,
        total_comments: 25,
        total_blanks: 25,
        total_loc: 270,
        languages: vec![],
        files,
        duplicates: 2,
        duplicate_groups: vec![vec!["src/main.rs".to_string(), "src/main_copy.rs".to_string()]],
        average_complexity: 4.33,
        complexity_dist: vec![0, 1, 2, 0, 0, 0, 0, 0, 0, 0],
        edges: vec![],
        scan_duration_ms: 42,
        uloc: 200,
        dryness: 0.8,
        role_distribution: HashMap::new(),
        annotations: vec![],
        secrets: vec![],
        git_available: false,
        file_churn: vec![],
        top_contributors: vec![],
        tech_stack: vec![],
        asset_report: Some(asset_report),
        architecture_report: None,
        change_coupling: vec![],
    }
}

#[test]
fn test_export_report_full_options() {
    tauri::async_runtime::block_on(async {
        let summary = create_dummy_summary();
        let temp_dir = std::env::temp_dir();
        let export_path = temp_dir.join("locsight_report_full.json");
        let export_path_str = export_path.to_string_lossy().to_string();

        let options = ExportOptions {
            include_code: true,
            include_multimedia: true,
            include_game: true,
            include_cad: true,
            include_documents: true,
        };

        let result = export_report(export_path_str.clone(), "json".to_string(), summary, options).await;
        assert!(result.is_ok());

        let content = fs::read_to_string(&export_path).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&content).unwrap();

        // Verify recalculations
        assert_eq!(parsed["totalFiles"].as_u64().unwrap(), 6); // 4 code files + 2 asset files
        assert_eq!(parsed["totalLoc"].as_u64().unwrap(), 250);
        assert_eq!(parsed["duplicates"].as_u64().unwrap(), 2);
        
        // Clean up
        let _ = fs::remove_file(export_path);
    });
}

#[test]
fn test_export_report_exclude_multimedia() {
    tauri::async_runtime::block_on(async {
        let summary = create_dummy_summary();
        let temp_dir = std::env::temp_dir();
        let export_path = temp_dir.join("locsight_report_no_media.json");
        let export_path_str = export_path.to_string_lossy().to_string();

        let options = ExportOptions {
            include_code: true,
            include_multimedia: false, // tắt multimedia
            include_game: true,
            include_cad: true,
            include_documents: true,
        };

        let result = export_report(export_path_str.clone(), "json".to_string(), summary, options).await;
        assert!(result.is_ok());

        let content = fs::read_to_string(&export_path).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&content).unwrap();

        // Verify recalculations:
        // - 3 files code (main.rs, main_copy.rs, helper.py) + 1 file doc (readme.md) = 4 total files
        // - File logo.png (code & asset) bị loại bỏ hoàn toàn
        assert_eq!(parsed["totalFiles"].as_u64().unwrap(), 4);
        assert_eq!(parsed["totalLoc"].as_u64().unwrap(), 250);
        
        // Assets verify
        let assets = parsed["assetReport"]["assets"].as_array().unwrap();
        assert_eq!(assets.len(), 1);
        assert_eq!(assets[0]["name"].as_str().unwrap(), "readme.md");

        // Clean up
        let _ = fs::remove_file(export_path);
    });
}

#[test]
fn test_export_report_exclude_code() {
    tauri::async_runtime::block_on(async {
        let summary = create_dummy_summary();
        let temp_dir = std::env::temp_dir();
        let export_path = temp_dir.join("locsight_report_no_code.json");
        let export_path_str = export_path.to_string_lossy().to_string();

        let options = ExportOptions {
            include_code: false, // tắt code
            include_multimedia: true,
            include_game: true,
            include_cad: true,
            include_documents: true,
        };

        let result = export_report(export_path_str.clone(), "json".to_string(), summary, options).await;
        assert!(result.is_ok());

        let content = fs::read_to_string(&export_path).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&content).unwrap();

        // Verify recalculations:
        // - 0 code files + 2 asset files = 2 total files
        // - totalLoc = 0
        // - duplicates = 0 (vì code bị tắt)
        assert_eq!(parsed["totalFiles"].as_u64().unwrap(), 2);
        assert_eq!(parsed["totalLoc"].as_u64().unwrap(), 0);
        assert_eq!(parsed["duplicates"].as_u64().unwrap(), 0);

        // Clean up
        let _ = fs::remove_file(export_path);
    });
}
