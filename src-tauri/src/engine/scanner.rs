use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::Path;
use std::time::Instant;
use rayon::prelude::*;
use walkdir::WalkDir;
use globset::{Glob, GlobSet, GlobSetBuilder};

use crate::models::{FileInfo, LanguageStats, ProjectSummary};
use super::complexity::analyze_complexity;
use super::duplicate::find_duplicates;
use super::uloc;
use super::roles;
use super::annotations::{self, Annotation};
use super::secrets::{self, SecretFinding};
use super::git;
use super::config;
use super::techstack;
use super::assets;
use super::architecture;


#[derive(Clone, Copy)]
pub struct LanguageConfig {
    pub name: &'static str,
    pub single_line_comments: &'static [&'static str],
    pub multi_line_comments: &'static [(&'static str, &'static str)],
}

fn make_static_config(mapping: &config::CustomLanguageMapping) -> LanguageConfig {
    let name = Box::leak(mapping.name.clone().into_boxed_str());
    
    let single_lines: Vec<&'static str> = mapping.single_line_comments
        .iter()
        .map(|s| Box::leak(s.clone().into_boxed_str()) as &'static str)
        .collect();
    let single_line_comments = Box::leak(single_lines.into_boxed_slice());

    let multi_lines: Vec<(&'static str, &'static str)> = mapping.multi_line_comments
        .iter()
        .map(|(s, e)| {
            (
                Box::leak(s.clone().into_boxed_str()) as &'static str,
                Box::leak(e.clone().into_boxed_str()) as &'static str,
            )
        })
        .collect();
    let multi_line_comments = Box::leak(multi_lines.into_boxed_slice());

    LanguageConfig {
        name,
        single_line_comments,
        multi_line_comments,
    }
}

include!(concat!(env!("OUT_DIR"), "/languages_gen.rs"));

pub fn get_language_count() -> usize {
    GENERATED_LANGUAGE_CONFIGS.len()
}

pub fn get_all_extensions() -> Vec<&'static str> {
    GENERATED_LANGUAGE_CONFIGS.iter().map(|&(ext, _)| ext).collect()
}

pub fn get_language_config(extension: &str) -> Option<LanguageConfig> {
    GENERATED_LANGUAGE_CONFIGS.iter().find(|&&(ext, _)| ext == extension).map(|&(_, config)| config)
}

pub fn get_language_config_by_name(lang_name: &str) -> Option<LanguageConfig> {
    GENERATED_LANGUAGE_CONFIGS.iter().find(|&&(_, config)| config.name == lang_name).map(|&(_, config)| config)
}

pub fn detect_shebang_with_ext(path: &Path) -> Option<(LanguageConfig, String)> {
    use std::io::BufRead;
    let file = fs::File::open(path).ok()?;
    let mut reader = std::io::BufReader::new(file);
    let mut first_line = String::new();
    reader.read_line(&mut first_line).ok()?;
    let trimmed = first_line.trim();
    
    if trimmed.starts_with("#!") {
        let parts: Vec<&str> = trimmed[2..].split_whitespace().collect();
        if parts.is_empty() {
            return None;
        }
        
        let mut interpreter = Path::new(parts[0])
            .file_name()?
            .to_str()?;
            
        if interpreter == "env" {
            if let Some(actual_interp) = parts.iter().skip(1).find(|s| !s.starts_with('-')) {
                interpreter = actual_interp;
            }
        }
        
        let interpreter_lower = interpreter.to_lowercase();
        let ext = GENERATED_SHEBANG_MAPPINGS
            .iter()
            .find(|&&(interp, _)| interp == interpreter_lower.as_str())
            .map(|&(_, ext)| ext)?;
        
        get_language_config(ext).map(|cfg| (cfg, ext.to_string()))
    } else {
        None
    }
}

pub fn resolve_conflicts(path: &Path, ext: &str) -> String {
    match ext {
        "m" => {
            if let Ok(content) = fs::read_to_string(path) {
                let limit = content.len().min(1000);
                let sample = &content[..limit];
                if sample.contains("#import") || sample.contains("@interface") || sample.contains("@implementation") || sample.contains("@protocol") || sample.contains("@end") || sample.contains("NSLog(") {
                    "m".to_string()
                } else if sample.contains("#{") || sample.contains("pkg load") {
                    "octave".to_string()
                } else if sample.contains("function") || sample.contains("%") {
                    "matlab".to_string()
                } else {
                    "m".to_string()
                }
            } else {
                "m".to_string()
            }
        }
        "v" => {
            if let Ok(content) = fs::read_to_string(path) {
                let limit = content.len().min(1000);
                let sample = &content[..limit];
                if sample.contains("Require Import") || sample.contains("Theorem") || sample.contains("Proof") || sample.contains("Qed.") || sample.contains("Lemma") {
                    "coq".to_string()
                } else if sample.contains("fn ") || sample.contains("struct ") || sample.contains("import ") {
                    "vlang".to_string()
                } else {
                    "v".to_string()
                }
            } else {
                "v".to_string()
            }
        }
        "cl" => {
            if let Ok(content) = fs::read_to_string(path) {
                let limit = content.len().min(1000);
                let sample = &content[..limit];
                if sample.contains(';') || sample.contains("(defun ") || sample.contains("(defparameter ") || sample.contains("(let ") {
                    "commonlisp".to_string()
                } else {
                    "cl".to_string()
                }
            } else {
                "cl".to_string()
            }
        }
        "h" => {
            if let Ok(content) = fs::read_to_string(path) {
                let limit = content.len().min(1000);
                let sample = &content[..limit];
                if sample.contains("#import") || sample.contains("@class") || sample.contains("@interface") || sample.contains("@protocol") {
                    "m".to_string()
                } else if sample.contains("template<") || sample.contains("template <") || sample.contains("class ") || sample.contains("namespace ") {
                    "hpp".to_string()
                } else {
                    "h".to_string()
                }
            } else {
                "h".to_string()
            }
        }
        "inc" => {
            if let Ok(content) = fs::read_to_string(path) {
                let limit = content.len().min(1000);
                let sample = &content[..limit];
                if sample.contains("<?php") {
                    "php".to_string()
                } else if sample.contains("#include") || sample.contains("public ") || sample.contains("native ") {
                    "inc".to_string()
                } else {
                    "f90".to_string()
                }
            } else {
                "inc".to_string()
            }
        }
        "pro" => {
            if let Ok(content) = fs::read_to_string(path) {
                let limit = content.len().min(1000);
                let sample = &content[..limit];
                if sample.contains("QT +=") || sample.contains("TEMPLATE =") || sample.contains("TARGET =") {
                    "pro".to_string()
                } else if sample.contains(":-") {
                    "pl".to_string()
                } else {
                    "pro".to_string()
                }
            } else {
                "pro".to_string()
            }
        }
        "pp" => {
            if let Ok(content) = fs::read_to_string(path) {
                let limit = content.len().min(1000);
                let sample = &content[..limit];
                if sample.contains("class {") || sample.contains("define ") || sample.contains("node ") {
                    "pp".to_string()
                } else {
                    "pas".to_string()
                }
            } else {
                "pp".to_string()
            }
        }
        "pl" => {
            if let Ok(content) = fs::read_to_string(path) {
                let limit = content.len().min(1000);
                let sample = &content[..limit];
                if sample.contains(":-") || sample.contains("consult(") {
                    "pl".to_string()
                } else {
                    "pl".to_string()
                }
            } else {
                "pl".to_string()
            }
        }
        "r" => {
            if let Ok(content) = fs::read_to_string(path) {
                let limit = content.len().min(1000);
                let sample = &content[..limit];
                if sample.to_lowercase().contains("rebol") {
                    "r".to_string()
                } else {
                    "r".to_string()
                }
            } else {
                "r".to_string()
            }
        }
        "mod" => {
            if let Ok(content) = fs::read_to_string(path) {
                let limit = content.len().min(1000);
                let sample = &content[..limit];
                if sample.starts_with("module ") {
                    "mod".to_string()
                } else if sample.contains("IMPLEMENTATION MODULE") || sample.contains("DEFINITION MODULE") || sample.contains("MODULE ") {
                    "mod".to_string()
                } else {
                    "mod".to_string()
                }
            } else {
                "mod".to_string()
            }
        }
        "fs" => {
            if let Ok(content) = fs::read_to_string(path) {
                let limit = content.len().min(1000);
                let sample = &content[..limit];
                if sample.contains("open ") || sample.contains("let ") {
                    "fs".to_string()
                } else if sample.contains(": ") || sample.contains(" ;") {
                    "fs".to_string()
                } else {
                    "glsl".to_string()
                }
            } else {
                "fs".to_string()
            }
        }
        _ => ext.to_string(),
    }
}

fn get_file_language_config(path: &Path, custom_cfg: &config::CustomConfig) -> Option<(LanguageConfig, String)> {
    if let Some(filename) = path.file_name().and_then(|s| s.to_str()) {
        let filename_lower = filename.to_lowercase();
        if let Some(&(_, ext)) = GENERATED_FILENAME_MAPPINGS.iter().find(|&&(fname, _)| fname == filename_lower.as_str()) {
            if let Some(cfg) = get_language_config(ext) {
                return Some((cfg, ext.to_string()));
            }
        }
    }

    if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
        let ext_lower = ext.to_lowercase();
        if let Some(ref custom_langs) = custom_cfg.custom_languages {
            if let Some(mapping) = custom_langs.iter().find(|m| m.extension.to_lowercase() == ext_lower) {
                return Some((make_static_config(mapping), ext_lower));
            }
        }
        let resolved_ext = resolve_conflicts(path, &ext_lower);
        get_language_config(&resolved_ext).map(|cfg| (cfg, resolved_ext))
    } else {
        detect_shebang_with_ext(path)
    }
}

pub fn count_lines(content: &str, config: &LanguageConfig) -> (u64, u64, u64, Vec<u64>) {
    let mut code = 0;
    let mut comments = 0;
    let mut blanks = 0;
    let mut in_multiline = false;
    let mut active_ml_end = "";
    let mut line_hashes = Vec::new();

    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            blanks += 1;
            continue;
        }

        if in_multiline {
            comments += 1;
            if !active_ml_end.is_empty() && trimmed.contains(active_ml_end) {
                in_multiline = false;
                active_ml_end = "";
            }
            continue;
        }

        let mut is_sl = false;
        for sl in config.single_line_comments {
            if !sl.is_empty() && trimmed.starts_with(sl) {
                comments += 1;
                is_sl = true;
                break;
            }
        }
        if is_sl {
            continue;
        }

        let mut is_ml_start = false;
        for &(start, end) in config.multi_line_comments {
            if !start.is_empty() && trimmed.starts_with(start) {
                comments += 1;
                is_ml_start = true;
                if !end.is_empty() && !trimmed.ends_with(end) {
                    in_multiline = true;
                    active_ml_end = end;
                }
                break;
            }
        }
        if is_ml_start {
            continue;
        }

        code += 1;
        line_hashes.push(uloc::hash_line(trimmed));
    }

    (code, comments, blanks, line_hashes)
}

fn parse_gitignore_rules(root: &Path) -> Vec<String> {
    let gitignore_path = root.join(".gitignore");
    let mut rules = vec![
        ".git".to_string(),
        "node_modules".to_string(),
        "target".to_string(),
        "build".to_string(),
        "dist".to_string(),
        ".svelte-kit".to_string(),
        ".next".to_string(),
        "out".to_string(),
        ".idea".to_string(),
        ".vscode".to_string(),
        ".gemini".to_string(),
        "Cargo.lock".to_string(),
        "package-lock.json".to_string(),
        "pnpm-lock.yaml".to_string(),
        "yarn.lock".to_string(),
        "poetry.lock".to_string(),
        "mix.lock".to_string(),
        "Gemfile.lock".to_string(),
        "composer.lock".to_string(),
        "pubspec.lock".to_string(),
    ];

    if gitignore_path.exists() {
        if let Ok(content) = fs::read_to_string(gitignore_path) {
            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.is_empty() || trimmed.starts_with('#') {
                    continue;
                }
                let cleaned = trimmed.trim_start_matches('/').trim_end_matches('/');
                if !cleaned.is_empty() {
                    rules.push(cleaned.to_string());
                }
            }
        }
    }

    let locignore_path = root.join(".locignore");
    if locignore_path.exists() {
        if let Ok(content) = fs::read_to_string(locignore_path) {
            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.is_empty() || trimmed.starts_with('#') {
                    continue;
                }
                let cleaned = trimmed.trim_start_matches('/').trim_end_matches('/');
                if !cleaned.is_empty() {
                    rules.push(cleaned.to_string());
                }
            }
        }
    }

    rules
}

struct IgnoreMatcher {
    ignore_set: GlobSet,
    allow_set: GlobSet,
}

impl IgnoreMatcher {
    fn new(rules: &[String]) -> Self {
        let mut ignore_builder = GlobSetBuilder::new();
        let mut allow_builder = GlobSetBuilder::new();
        
        for rule in rules {
            let mut r = rule.trim().replace('\\', "/");
            if r.is_empty() || r.starts_with('#') {
                continue;
            }
            
            let is_negated = r.starts_with('!');
            if is_negated {
                r = r[1..].to_string();
            }
            
            let has_slash = r.contains('/');
            let r_clean = r.trim_start_matches('/').trim_end_matches('/');
            
            let builder = if is_negated { &mut allow_builder } else { &mut ignore_builder };
            
            if !has_slash {
                if let Ok(glob) = Glob::new(r_clean) {
                    builder.add(glob);
                }
                if let Ok(glob) = Glob::new(&format!("**/{}", r_clean)) {
                    builder.add(glob);
                }
                if let Ok(glob) = Glob::new(&format!("{}/**", r_clean)) {
                    builder.add(glob);
                }
                if let Ok(glob) = Glob::new(&format!("**/{}/**", r_clean)) {
                    builder.add(glob);
                }
            } else {
                if let Ok(glob) = Glob::new(r_clean) {
                    builder.add(glob);
                }
                if let Ok(glob) = Glob::new(&format!("{}/**", r_clean)) {
                    builder.add(glob);
                }
            }
        }
        
        Self {
            ignore_set: ignore_builder.build().unwrap_or_else(|_| GlobSetBuilder::new().build().unwrap()),
            allow_set: allow_builder.build().unwrap_or_else(|_| GlobSetBuilder::new().build().unwrap()),
        }
    }
    
    fn is_ignored(&self, path_str: &str) -> bool {
        if self.allow_set.is_match(path_str) {
            return false;
        }
        self.ignore_set.is_match(path_str)
    }
}

fn should_ignore(path: &Path, root: &Path, matcher: &IgnoreMatcher) -> bool {
    let relative_path = match path.strip_prefix(root) {
        Ok(p) => p,
        Err(_) => path,
    };

    let path_str = relative_path.to_string_lossy().replace('\\', "/");
    matcher.is_ignored(&path_str)
}

pub fn scan_project_directory(root_path: &str) -> Result<ProjectSummary, String> {
    let start_time = Instant::now();
    let root = Path::new(root_path);
    if !root.exists() || !root.is_dir() {
        return Err("Target path does not exist or is not a directory".to_string());
    }

    let custom_cfg = config::load_custom_config(root);

    let mut ignore_rules = parse_gitignore_rules(root);
    if let Some(ref custom_excludes) = custom_cfg.exclude_patterns {
        for rule in custom_excludes {
            ignore_rules.push(rule.clone());
        }
    }
    
    let matcher = IgnoreMatcher::new(&ignore_rules);

    let mut files_to_scan = Vec::new();
    let mut assets_to_scan = Vec::new();

    for entry in WalkDir::new(root).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.is_file() {
            if !should_ignore(path, root, &matcher) {
                if get_file_language_config(path, &custom_cfg).is_some() {
                    files_to_scan.push(path.to_path_buf());
                } else if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                    if assets::get_asset_config(ext).is_some() {
                        assets_to_scan.push(path.to_path_buf());
                    }
                }
            }
        }
    }

    let target_stems: Vec<(String, String)> = files_to_scan
        .iter()
        .filter_map(|p| {
            let stem = p.file_stem()?.to_string_lossy().to_string();
            let relative = p.strip_prefix(root).ok()?.to_string_lossy().to_string();
            Some((stem, relative))
        })
        .collect();

    // Parallel scan using rayon
    let results: Vec<(FileInfo, Vec<(String, String)>, Vec<u64>, Vec<Annotation>, Vec<SecretFinding>)> = files_to_scan
        .par_iter()
        .filter_map(|path| {
            let relative_path = path.strip_prefix(root).ok()?.to_string_lossy().to_string();
            let name = path.file_name()?.to_string_lossy().to_string();
            let (config, extension) = get_file_language_config(path, &custom_cfg)?;

            let content = match fs::read_to_string(path) {
                Ok(c) => c,
                Err(_) => {
                    let bytes = fs::read(path).ok()?;
                    String::from_utf8_lossy(&bytes).into_owned()
                }
            };

            let size_bytes = fs::metadata(path).ok()?.len();
            
            // Core line counting logic
            let (code, comments, blanks, line_hashes) = count_lines(&content, &config);

            let complexity = analyze_complexity(&content, &extension);

            let mut file_edges = Vec::new();
            for (stem, rel_target) in &target_stems {
                if rel_target != &relative_path && stem.len() > 3 {
                    if content.contains(stem) {
                        file_edges.push((relative_path.clone(), rel_target.clone()));
                    }
                }
            }

            let file_annotations = annotations::scan_annotations(&content, &relative_path);
            let file_secrets = secrets::scan_secrets(&content, &relative_path);

            Some((
                FileInfo {
                    name,
                    path: relative_path,
                    lang: config.name.to_string(),
                    loc: code + comments + blanks,
                    code,
                    comments,
                    blanks,
                    size_bytes,
                    complexity,
                },
                file_edges,
                line_hashes,
                file_annotations,
                file_secrets,
            ))
        })
        .collect();

    let mut file_infos = Vec::new();
    let mut edges = Vec::new();
    let mut all_line_hashes = HashSet::new();
    let mut annotations = Vec::new();
    let mut secrets = Vec::new();

    for (info, mut fedges, line_hashes, file_annotations, file_secrets) in results {
        for h in line_hashes {
            all_line_hashes.insert(h);
        }
        annotations.extend(file_annotations);
        secrets.extend(file_secrets);
        file_infos.push(info);
        edges.append(&mut fedges);
    }

    // Aggregate statistics
    let mut total_code = 0;
    let mut total_comments = 0;
    let mut total_blanks = 0;
    let mut lang_groups: HashMap<String, (u32, u64, u64, u64)> = HashMap::new();
    let mut file_paths_list = Vec::new();
    
    let mut total_complexity = 0.0;
    let mut complexity_dist = vec![0u32; 10]; // 10 bins

    for f in &file_infos {
        total_code += f.code;
        total_comments += f.comments;
        total_blanks += f.blanks;
        
        let entry = lang_groups
            .entry(f.lang.clone())
            .or_insert((0, 0, 0, 0));
        entry.0 += 1; // files
        entry.1 += f.code;
        entry.2 += f.comments;
        entry.3 += f.blanks;

        file_paths_list.push(root.join(&f.path).to_string_lossy().to_string());
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

    let total_loc = total_code + total_comments + total_blanks;
    let mut languages: Vec<LanguageStats> = lang_groups
        .into_iter()
        .map(|(name, (files, code, comments, blanks))| {
            let pct = if total_loc > 0 {
                ((code + comments + blanks) as f64 / total_loc as f64) * 100.0
            } else {
                0.0
            };
            LanguageStats { name, files, code, comments, blanks, pct }
        })
        .collect();

    languages.sort_by(|a, b| (b.code + b.comments + b.blanks).cmp(&(a.code + a.comments + a.blanks)));

    // Duplicate detection
    let (duplicates, duplicate_groups) = find_duplicates(&file_paths_list);

    let relative_duplicate_groups = duplicate_groups
        .into_iter()
        .map(|group| {
            group
                .into_iter()
                .filter_map(|abs_path| {
                    Path::new(&abs_path)
                        .strip_prefix(root)
                        .ok()
                        .map(|p| p.to_string_lossy().to_string())
                })
                .collect()
        })
        .collect();

    let average_complexity = if !file_infos.is_empty() {
        total_complexity / file_infos.len() as f64
    } else {
        1.0
    };

    let uloc_count = all_line_hashes.len() as u64;
    let dryness = uloc::calculate_dryness(total_code, uloc_count);
    let role_distribution = roles::calculate_role_distribution(&file_infos);

    let git_stats = git::analyze_git(root);
    let git_available = git_stats.is_some();
    let (file_churn, top_contributors, change_coupling) = git_stats.unwrap_or_else(|| (Vec::new(), Vec::new(), Vec::new()));

    let tech_stack = techstack::detect_tech_stack(root);

    let asset_report = assets::scan_assets(&assets_to_scan, root, &files_to_scan);

    let file_paths: Vec<String> = file_infos.iter().map(|f| f.path.clone()).collect();
    let arch_report = architecture::analyze_architecture(&file_paths, &edges, root);

    let scan_duration_ms = start_time.elapsed().as_millis() as u64;

    Ok(ProjectSummary {
        path: root_path.to_string(),
        total_files: file_infos.len() as u32,
        total_languages: languages.len() as u32,
        total_code,
        total_comments,
        total_blanks,
        total_loc,
        languages,
        files: file_infos,
        duplicates,
        duplicate_groups: relative_duplicate_groups,
        average_complexity: (average_complexity * 10.0).round() / 10.0,
        complexity_dist,
        edges,
        scan_duration_ms,

        // New fields
        uloc: uloc_count,
        dryness,
        role_distribution,
        annotations,
        secrets,
        git_available,
        file_churn,
        top_contributors,
        tech_stack,
        asset_report: Some(asset_report),
        architecture_report: Some(arch_report),
        change_coupling,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_count_lines_rust() {
        let content = "
            // Rust program
            fn main() {
                /* multiline
                   comment */
                println!(\"Hello World!\");
            }
        ";
        let config = get_language_config("rs").unwrap();
        let (code, comments, blanks, _) = count_lines(content, &config);
        assert_eq!(code, 3);
        assert_eq!(comments, 3);
        assert_eq!(blanks, 2);
    }

    #[test]
    fn test_count_lines_python() {
        let content = "
            # Python script
            def add(a, b):
                \"\"\"Add two
                   numbers\"\"\"
                return a + b
        ";
        let config = get_language_config("py").unwrap();
        let (code, comments, blanks, _) = count_lines(content, &config);
        assert_eq!(code, 2);
        assert_eq!(comments, 3);
        assert_eq!(blanks, 2);
    }

    #[test]
    fn test_shebang_detection() {
        use std::io::Write;
        let dir = std::env::temp_dir();
        let py_path = dir.join("test_script_py");
        {
            let mut file = std::fs::File::create(&py_path).unwrap();
            writeln!(file, "#!/usr/bin/env python3").unwrap();
            writeln!(file, "print('Hello')").unwrap();
        }
        let (config, ext) = detect_shebang_with_ext(&py_path).unwrap();
        assert_eq!(config.name, "Python");
        assert_eq!(ext, "py");
        let _ = std::fs::remove_file(&py_path);

        let sh_path = dir.join("test_script_sh");
        {
            let mut file = std::fs::File::create(&sh_path).unwrap();
            writeln!(file, "#!/bin/sh").unwrap();
            writeln!(file, "echo Hello").unwrap();
        }
        let (config_sh, ext_sh) = detect_shebang_with_ext(&sh_path).unwrap();
        assert_eq!(config_sh.name, "Shell");
        assert_eq!(ext_sh, "sh");
        let _ = std::fs::remove_file(&sh_path);

        // Test Rscript shebang (v1.2.0 addition)
        let r_path = dir.join("test_script_r");
        {
            let mut file = std::fs::File::create(&r_path).unwrap();
            writeln!(file, "#!/usr/bin/env Rscript").unwrap();
            writeln!(file, "print('Hello')").unwrap();
        }
        let (config_r, ext_r) = detect_shebang_with_ext(&r_path).unwrap();
        assert_eq!(config_r.name, "R");
        assert_eq!(ext_r, "r");
        let _ = std::fs::remove_file(&r_path);
    }

    #[test]
    fn test_conflict_resolution_octave() {
        use std::io::Write;
        let dir = std::env::temp_dir();
        let m_path = dir.join("test_script.m");
        
        // 1. Objective-C
        {
            let mut file = std::fs::File::create(&m_path).unwrap();
            writeln!(file, "#import <Foundation/Foundation.h>").unwrap();
        }
        let ext = resolve_conflicts(&m_path, "m");
        assert_eq!(ext, "m"); // "m" means Objective-C

        // 2. Octave
        {
            let mut file = std::fs::File::create(&m_path).unwrap();
            writeln!(file, "pkg load statistics").unwrap();
        }
        let ext = resolve_conflicts(&m_path, "m");
        assert_eq!(ext, "octave");

        // 3. MATLAB
        {
            let mut file = std::fs::File::create(&m_path).unwrap();
            writeln!(file, "function y = f(x)\n  y = x + 1;\nend").unwrap();
        }
        let ext = resolve_conflicts(&m_path, "m");
        assert_eq!(ext, "matlab");
        
        let _ = std::fs::remove_file(&m_path);
    }
}


