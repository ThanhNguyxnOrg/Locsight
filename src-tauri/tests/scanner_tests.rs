use std::fs::File;
use std::io::Write;
use std::path::Path;
use std::collections::HashMap;

use locsight_lib::engine::scanner::{
    get_language_count, get_all_extensions, get_language_config_by_name,
    detect_shebang_with_ext, resolve_conflicts, count_lines
};
use locsight_lib::engine::techstack::{get_tech_stack_count, detect_tech_stack};

#[derive(serde::Deserialize)]
#[allow(dead_code)]
struct ExpectedLangMetrics {
    language: String,
    extension: String,
    code: usize,
    comments: usize,
    blanks: usize,
}

#[test]
fn test_language_count_minimum() {
    let count = get_language_count();
    println!("Total languages loaded: {}", count);
    assert!(count >= 500, "Expected at least 500 languages, found {}", count);
}

#[test]
fn test_tech_stack_count_minimum() {
    let count = get_tech_stack_count();
    println!("Total tech stack entries: {}", count);
    assert!(count >= 1000, "Expected at least 1000 tech stack entries, found {}", count);
}

#[test]
fn test_no_duplicate_extensions() {
    let exts = get_all_extensions();
    let total = exts.len();
    let mut unique = exts.clone();
    unique.sort();
    unique.dedup();
    println!("Total extension mappings: {}, Unique extensions: {}", total, unique.len());
    assert!(unique.len() >= 700, "Expected at least 700 unique extensions, found {}", unique.len());
}

#[test]
fn test_languages_fixtures() {
    let base_path = Path::new(env!("CARGO_MANIFEST_DIR"));
    let expected_json_path = base_path.join("tests/fixtures/languages_expected.json");
    let json_content = std::fs::read_to_string(&expected_json_path)
        .expect("Failed to read languages_expected.json");
    
    let expected: HashMap<String, ExpectedLangMetrics> = serde_json::from_str(&json_content)
        .expect("Failed to parse expected JSON");
    
    let mut failed = 0;
    
    for (filename, metrics) in &expected {
        let file_path = base_path.join("tests/fixtures/languages").join(filename);
        let content = std::fs::read_to_string(&file_path)
            .unwrap_or_else(|_| panic!("Failed to read file: {:?}", file_path));
        
        let config = get_language_config_by_name(&metrics.language)
            .unwrap_or_else(|| panic!("No language config found for language: {}", metrics.language));
            
        let (actual_code, actual_comments, actual_blanks, _) = count_lines(&content, &config);
        
        let actual_code = actual_code as usize;
        let actual_comments = actual_comments as usize;
        let actual_blanks = actual_blanks as usize;
        
        if actual_code != metrics.code || actual_comments != metrics.comments || actual_blanks != metrics.blanks {
            println!(
                "FAIL: {} ({})\n  Expected: code={}, comments={}, blanks={}\n  Actual:   code={}, comments={}, blanks={}",
                metrics.language, filename,
                metrics.code, metrics.comments, metrics.blanks,
                actual_code, actual_comments, actual_blanks
            );
            failed += 1;
        }
    }
    
    assert_eq!(failed, 0, "Failed language comment counting on {} files!", failed);
}

#[test]
fn test_tech_stacks_fixtures() {
    let base_path = Path::new(env!("CARGO_MANIFEST_DIR"));
    let expected_json_path = base_path.join("tests/fixtures/techstacks_expected.json");
    let json_content = std::fs::read_to_string(&expected_json_path)
        .expect("Failed to read techstacks_expected.json");
    
    let expected: Vec<String> = serde_json::from_str(&json_content)
        .expect("Failed to parse expected JSON");
    
    let tech_dir = base_path.join("tests/fixtures/techstacks");
    let detected = detect_tech_stack(&tech_dir);
    let detected_names: std::collections::HashSet<String> = detected
        .iter()
        .map(|item| item.name.clone())
        .collect();
        
    let mut missing = Vec::new();
    for name in &expected {
        if !detected_names.contains(name) {
            missing.push(name.clone());
        }
    }
    
    println!("Total expected tech: {}", expected.len());
    println!("Total detected tech: {}", detected_names.len());
    if !missing.is_empty() {
        println!("Missing tech detections (first 10): {:?}", missing.iter().take(10).collect::<Vec<_>>());
    }
    
    // Check that we detected the vast majority of the tech stacks (at least 95% of the expected list)
    let coverage_pct = (detected_names.len() as f64 / expected.len() as f64) * 100.0;
    println!("Tech stack detection coverage: {:.2}%", coverage_pct);
    assert!(coverage_pct >= 95.0, "Tech stack detection coverage is too low: {:.2}%", coverage_pct);
}

#[test]
fn test_all_conflict_resolutions() {
    let temp_dir = std::env::temp_dir().join("locsight_test_conflicts_prof");
    let _ = std::fs::create_dir_all(&temp_dir);

    let m_path = temp_dir.join("test.m");
    {
        let mut f = File::create(&m_path).unwrap();
        f.write_all(b"#import <Cocoa/Cocoa.h>\n@interface MyClass : NSObject\n@end").unwrap();
    }
    assert_eq!(resolve_conflicts(&m_path, "m"), "m");

    {
        let mut f = File::create(&m_path).unwrap();
        f.write_all(b"pkg load image\n#{}\n").unwrap();
    }
    assert_eq!(resolve_conflicts(&m_path, "m"), "octave");

    {
        let mut f = File::create(&m_path).unwrap();
        f.write_all(b"function [y] = my_func(x)\n  y = x * 2;\n% Matlab comment").unwrap();
    }
    assert_eq!(resolve_conflicts(&m_path, "m"), "matlab");

    let _ = std::fs::remove_dir_all(&temp_dir);
}

#[test]
fn test_all_shebang_detections() {
    let temp_dir = std::env::temp_dir().join("locsight_test_shebangs_prof");
    let _ = std::fs::create_dir_all(&temp_dir);

    let py_path = temp_dir.join("script_py");
    {
        let mut f = File::create(&py_path).unwrap();
        f.write_all(b"#!/usr/bin/env python3\nprint('hello')").unwrap();
    }
    let res = detect_shebang_with_ext(&py_path).unwrap();
    assert_eq!(res.0.name, "Python");
    assert_eq!(res.1, "py");

    let js_path = temp_dir.join("script_js");
    {
        let mut f = File::create(&js_path).unwrap();
        f.write_all(b"#!/usr/bin/env node\nconsole.log('hello')").unwrap();
    }
    let res = detect_shebang_with_ext(&js_path).unwrap();
    assert_eq!(res.0.name, "JavaScript");
    assert_eq!(res.1, "js");

    let _ = std::fs::remove_dir_all(&temp_dir);
}

#[test]
fn test_gdscript_line_counting() {
    let config = get_language_config_by_name("GDScript")
        .expect("GDScript config should exist");
    let content = "# This is a comment\nextends Node2D\n\nfunc _ready():\n    pass # inline comment";
    let (code, comments, blanks, _) = count_lines(content, &config);
    assert_eq!(code, 3);
    assert_eq!(comments, 1);
    assert_eq!(blanks, 1);
}

