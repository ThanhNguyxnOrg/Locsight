use std::fs;
use std::path::Path;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use regex::Regex;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TechStackItem {
    pub name: String,
    pub version: String,
    pub category: String,
    pub icon: Option<String>,
}

include!(concat!(env!("OUT_DIR"), "/techstack_gen.rs"));

pub fn get_tech_stack_count() -> usize {
    GENERATED_TECH_MAP.len() + GENERATED_FILE_DETECTIONS.len()
}

fn get_tech_icon(name: &str) -> Option<String> {
    let name_lower = name.to_lowercase();
    let icon = GENERATED_ICON_MAP
        .iter()
        .find(|&&(k, _)| k == name_lower.as_str())
        .map(|&(_, v)| v)
        .unwrap_or("code");
    Some(icon.to_string())
}

fn new_item(name: String, version: String, category: String) -> TechStackItem {
    let icon = get_tech_icon(&name);
    TechStackItem { name, version, category, icon }
}

fn add_if_known(
    items: &mut Vec<TechStackItem>,
    known_tech: &HashMap<&'static str, (&'static str, &'static str)>,
    dep_name: &str,
    version: &str,
) -> bool {
    let dep_lower = dep_name.to_lowercase();
    if let Some(&(friendly, cat)) = known_tech.get(dep_lower.as_str()) {
        items.push(new_item(friendly.to_string(), version.to_string(), cat.to_string()));
        true
    } else {
        false
    }
}

fn check_dotnet_file(
    path: &Path,
    items: &mut Vec<TechStackItem>,
    known_tech: &HashMap<&'static str, (&'static str, &'static str)>,
    has_dotnet: &mut bool,
) {
    if let Ok(content) = fs::read_to_string(path) {
        if !*has_dotnet {
            items.push(new_item(".NET".to_string(), "".to_string(), "Environment".to_string()));
            *has_dotnet = true;
        }
        if content.contains("<UseMaui>true</UseMaui>") || content.contains("<UseMaui>True</UseMaui>") {
            items.push(new_item("MAUI".to_string(), "".to_string(), "Mobile".to_string()));
        }
        let pr_regex = Regex::new(r#"<PackageReference\s+Include="([^"]+)"(?:\s+Version="([^"]+)")?"#).unwrap();
        for cap in pr_regex.captures_iter(&content) {
            let dep_name = cap[1].split('.').last().unwrap_or(&cap[1]);
            let ver = cap.get(2).map(|m| m.as_str()).unwrap_or("");
            add_if_known(items, known_tech, dep_name, ver);
        }
    }
}

fn get_known_tech_map() -> HashMap<&'static str, (&'static str, &'static str)> {
    GENERATED_TECH_MAP.iter().cloned().collect()
}

pub fn detect_tech_stack(root: &Path) -> Vec<TechStackItem> {
    let mut items = Vec::new();
    let known_tech = get_known_tech_map();

    // 1. Node.js (package.json)
    let pkg_json_path = root.join("package.json");
    if pkg_json_path.exists() {
        if let Ok(content) = fs::read_to_string(&pkg_json_path) {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&content) {
                items.push(new_item("Node.js".to_string(), "".to_string(), "Environment".to_string()));
                
                let check_deps = |deps_val: &serde_json::Value| {
                    let mut found = Vec::new();
                    if let Some(obj) = deps_val.as_object() {
                        for (k, v) in obj {
                            let k_lower = k.to_lowercase();
                            if let Some(version_str) = v.as_str() {
                                if let Some(&(friendly, cat)) = known_tech.get(k_lower.as_str()) {
                                    found.push(new_item(friendly.to_string(), version_str.to_string(), cat.to_string()));
                                } else if k_lower.contains("react") || k_lower.contains("vue") || k_lower.contains("svelte") || k_lower.contains("tauri") {
                                    found.push(new_item(k.clone(), version_str.to_string(), "Library".to_string()));
                                }
                            }
                        }
                    }
                    found
                };
                
                if let Some(deps) = val.get("dependencies") {
                    items.extend(check_deps(deps));
                }
                if let Some(dev_deps) = val.get("devDependencies") {
                    items.extend(check_deps(dev_deps));
                }
            }
        }
    }
    
    // 2. Rust (Cargo.toml)
    let cargo_toml_path = root.join("Cargo.toml");
    if cargo_toml_path.exists() {
        if let Ok(content) = fs::read_to_string(&cargo_toml_path) {
            items.push(new_item("Rust".to_string(), "".to_string(), "Environment".to_string()));
            
            let mut in_deps = false;
            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with('[') {
                    in_deps = trimmed.contains("dependencies");
                    continue;
                }
                
                if in_deps && trimmed.contains('=') {
                    let parts: Vec<&str> = trimmed.split('=').collect();
                    if parts.len() >= 2 {
                        let dep_name = parts[0].trim().trim_matches('"').trim_matches('\'');
                        let dep_val = parts[1].trim();
                        let version = if dep_val.starts_with('{') {
                            if let Some(idx) = dep_val.find("version") {
                                let after_ver = &dep_val[idx..];
                                if let Some(v_start) = after_ver.find('"') {
                                    let v_after = &after_ver[v_start+1..];
                                    if let Some(v_end) = v_after.find('"') {
                                        v_after[..v_end].to_string()
                                    } else {
                                        "".to_string()
                                    }
                                } else {
                                    "".to_string()
                                }
                            } else {
                                "workspace".to_string()
                            }
                        } else {
                            dep_val.trim_matches('"').trim_matches('\'').to_string()
                        };
                        
                        add_if_known(&mut items, &known_tech, dep_name, &version);
                    }
                }
            }
        }
    }
    
    // 3. Go (go.mod)
    let go_mod_path = root.join("go.mod");
    if go_mod_path.exists() {
        if let Ok(content) = fs::read_to_string(&go_mod_path) {
            items.push(new_item("Go".to_string(), "".to_string(), "Environment".to_string()));
            
            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("require") {
                    let parts: Vec<&str> = trimmed.split_whitespace().collect();
                    if parts.len() >= 3 {
                        let full_path = parts[1];
                        let version = parts[2];
                        let dep_name = full_path.split('/').last().unwrap_or(full_path);
                        add_if_known(&mut items, &known_tech, dep_name, version);
                    }
                }
            }
        }
    }
    
    // 4. Python (requirements.txt / pyproject.toml)
    let reqs_path = root.join("requirements.txt");
    let mut has_python = false;
    if reqs_path.exists() {
        if let Ok(content) = fs::read_to_string(&reqs_path) {
            items.push(new_item("Python".to_string(), "".to_string(), "Environment".to_string()));
            has_python = true;
            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.is_empty() || trimmed.starts_with('#') {
                    continue;
                }
                
                let split_chars = &['=', '>', '<', '~'][..];
                if let Some(idx) = trimmed.find(split_chars) {
                    let dep_name = trimmed[..idx].trim();
                    let version = trimmed[idx..].trim_start_matches(split_chars).trim();
                    add_if_known(&mut items, &known_tech, dep_name, version);
                }
            }
        }
    }

    let pyproject_path = root.join("pyproject.toml");
    if pyproject_path.exists() {
        if !has_python {
            items.push(new_item("Python".to_string(), "".to_string(), "Environment".to_string()));
        }
        if let Ok(content) = fs::read_to_string(&pyproject_path) {
            if content.contains("[tool.poetry.dependencies]") {
                items.push(new_item("Poetry".to_string(), "".to_string(), "Build Tool".to_string()));
            }
            let dep_regex = Regex::new(r#"([a-zA-Z0-9_\-]+)\s*=\s*['"]([^'"]+)['"]"#).unwrap();
            for cap in dep_regex.captures_iter(&content) {
                let dep_name = &cap[1];
                let version = &cap[2];
                add_if_known(&mut items, &known_tech, dep_name, version);
            }
        }
    }
    
    // 5. PHP (composer.json)
    let composer_path = root.join("composer.json");
    if composer_path.exists() {
        if let Ok(content) = fs::read_to_string(&composer_path) {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&content) {
                items.push(new_item("PHP".to_string(), "".to_string(), "Environment".to_string()));
                
                let check_composer_deps = |deps_val: &serde_json::Value| {
                    let mut found = Vec::new();
                    if let Some(obj) = deps_val.as_object() {
                        for (k, v) in obj {
                            let name_only = k.split('/').last().unwrap_or(k);
                            let k_lower = name_only.to_lowercase();
                            if let Some(version_str) = v.as_str() {
                                if let Some(&(friendly, cat)) = known_tech.get(k_lower.as_str()) {
                                    found.push(new_item(friendly.to_string(), version_str.to_string(), cat.to_string()));
                                }
                            }
                        }
                    }
                    found
                };
                
                if let Some(require) = val.get("require") {
                    items.extend(check_composer_deps(require));
                }
                if let Some(require_dev) = val.get("require-dev") {
                    items.extend(check_composer_deps(require_dev));
                }
            }
        }
    }

    // 8. Java/Maven (pom.xml)
    let pom_path = root.join("pom.xml");
    if pom_path.exists() {
        items.push(new_item("Java".to_string(), "".to_string(), "Environment".to_string()));
        items.push(new_item("Maven".to_string(), "".to_string(), "Build Tool".to_string()));
        if let Ok(content) = fs::read_to_string(&pom_path) {
            let art_regex = Regex::new(r"<artifactId>([^<]+)</artifactId>").unwrap();
            for cap in art_regex.captures_iter(&content) {
                let dep_name = &cap[1];
                add_if_known(&mut items, &known_tech, dep_name, "");
            }
        }
    }

    // 9. Java/Gradle (build.gradle, build.gradle.kts)
    let build_gradle = root.join("build.gradle");
    let build_gradle_kts = root.join("build.gradle.kts");
    if build_gradle.exists() || build_gradle_kts.exists() {
        items.push(new_item("Java".to_string(), "".to_string(), "Environment".to_string()));
        items.push(new_item("Gradle".to_string(), "".to_string(), "Build Tool".to_string()));
        let content_path = if build_gradle.exists() { build_gradle } else { build_gradle_kts };
        if let Ok(content) = fs::read_to_string(content_path) {
            if content.contains("multiplatform") || content.contains("org.jetbrains.kotlin.multiplatform") {
                items.push(new_item("Kotlin Multiplatform".to_string(), "".to_string(), "Mobile".to_string()));
            }
            let gradle_regex = Regex::new(r#"(?:implementation|compile|testImplementation|api)\s+['"](?:group:\s*)?([^'"]+)['"]"#).unwrap();
            for cap in gradle_regex.captures_iter(&content) {
                let dep_name = cap[1].split(':').last().unwrap_or(cap[1].split(',').last().unwrap_or(&cap[1])).trim();
                add_if_known(&mut items, &known_tech, dep_name, "");
            }
        }
    }

    // 10. Ruby (Gemfile)
    let gemfile_path = root.join("Gemfile");
    if gemfile_path.exists() {
        items.push(new_item("Ruby".to_string(), "".to_string(), "Environment".to_string()));
        if let Ok(content) = fs::read_to_string(&gemfile_path) {
            let gem_regex = Regex::new(r#"gem\s+['"]([^'"]+)['"]"#).unwrap();
            for cap in gem_regex.captures_iter(&content) {
                let dep_name = &cap[1];
                add_if_known(&mut items, &known_tech, dep_name, "");
            }
        }
    }

    // 11. .NET (csproj, Directory.Packages.props)
    let mut has_dotnet = false;
    if let Ok(entries) = fs::read_dir(root) {
        for entry in entries.flatten() {
            let path = entry.path();
            if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
                if ext == "csproj" {
                    check_dotnet_file(&path, &mut items, &known_tech, &mut has_dotnet);
                }
            }
        }
    }
    let dpp_path = root.join("Directory.Packages.props");
    if dpp_path.exists() {
        check_dotnet_file(&dpp_path, &mut items, &known_tech, &mut has_dotnet);
    }

    // 12. Swift (Package.swift)
    let pkg_swift = root.join("Package.swift");
    if pkg_swift.exists() {
        items.push(new_item("Swift".to_string(), "".to_string(), "Environment".to_string()));
        if let Ok(content) = fs::read_to_string(&pkg_swift) {
            let swift_regex = Regex::new(r#"\.package\(\s*(?:url:\s*|name:\s*)['"]([^'"]+)['"]"#).unwrap();
            for cap in swift_regex.captures_iter(&content) {
                let dep_name = cap[1].split('/').last().unwrap_or(&cap[1]).trim_end_matches(".git");
                add_if_known(&mut items, &known_tech, dep_name, "");
            }
        }
    }

    // 13. Dart / Flutter (pubspec.yaml)
    let pubspec_path = root.join("pubspec.yaml");
    if pubspec_path.exists() {
        if let Ok(content) = fs::read_to_string(&pubspec_path) {
            let is_flutter = content.contains("sdk: flutter") || content.contains("flutter:");
            if is_flutter {
                items.push(new_item("Flutter".to_string(), "".to_string(), "Environment".to_string()));
            } else {
                items.push(new_item("Dart".to_string(), "".to_string(), "Environment".to_string()));
            }
            let pub_regex = Regex::new(r#"\n\s{2}([a-zA-Z0-9_\-]+):\s*['"]?([^'"\s]+)?['"]?"#).unwrap();
            for cap in pub_regex.captures_iter(&content) {
                let dep_name = &cap[1];
                if dep_name != "dependencies" && dep_name != "dev_dependencies" && dep_name != "flutter" {
                    let ver = cap.get(2).map(|m| m.as_str()).unwrap_or("");
                    add_if_known(&mut items, &known_tech, dep_name, ver);
                }
            }
        }
    }

    // 14. Elixir (mix.exs)
    let mix_path = root.join("mix.exs");
    if mix_path.exists() {
        items.push(new_item("Elixir".to_string(), "".to_string(), "Environment".to_string()));
        if let Ok(content) = fs::read_to_string(&mix_path) {
            let mix_regex = Regex::new(r#"\{:([a-zA-Z0-9_]+),\s*['"]?([^'"\s]+)['"]?\}"#).unwrap();
            for cap in mix_regex.captures_iter(&content) {
                let dep_name = &cap[1];
                let ver = &cap[2];
                add_if_known(&mut items, &known_tech, dep_name, ver);
            }
        }
    }
    
    // File-based detections from generated config
    for &(filename, (name, cat)) in GENERATED_FILE_DETECTIONS {
        let path = root.join(filename);
        if path.exists() {
            items.push(new_item(name.to_string(), "".to_string(), cat.to_string()));
        }
    }

    // Terraform custom check
    let mut has_tf = false;
    if let Ok(entries) = fs::read_dir(root) {
        for entry in entries.flatten() {
            if entry.path().extension().and_then(|s| s.to_str()) == Some("tf") {
                has_tf = true;
                break;
            }
        }
    }
    if has_tf {
        items.push(new_item("Terraform".to_string(), "".to_string(), "DevOps".to_string()));
    }

    // De-duplicate items by name
    let mut unique_items: Vec<TechStackItem> = Vec::new();
    for item in items {
        if !unique_items.iter().any(|x| x.name == item.name) {
            unique_items.push(item);
        }
    }
    
    unique_items
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;

    #[test]
    fn test_detect_tech_stack_files() {
        let dir = std::env::temp_dir().join("locsight_techstack_test");
        let _ = std::fs::create_dir_all(&dir);

        // Create test files
        File::create(dir.join("bun.lockb")).unwrap();
        File::create(dir.join("deno.json")).unwrap();
        File::create(dir.join("Procfile")).unwrap();
        File::create(dir.join("Caddyfile")).unwrap();

        let detected = detect_tech_stack(&dir);
        let names: Vec<String> = detected.iter().map(|item| item.name.clone()).collect();

        assert!(names.contains(&"Bun".to_string()));
        assert!(names.contains(&"Deno".to_string()));
        assert!(names.contains(&"Heroku".to_string()));
        assert!(names.contains(&"Caddy".to_string()));

        let _ = std::fs::remove_dir_all(&dir);
    }
}
