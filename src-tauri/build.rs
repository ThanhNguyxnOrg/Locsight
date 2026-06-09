use std::env;
use std::fs;
use std::path::Path;

fn main() {
    println!("cargo:rerun-if-changed=languages.toml");
    println!("cargo:rerun-if-changed=techstack.toml");

    // 1. Generate languages data
    let out_dir = env::var_os("OUT_DIR").unwrap();
    
    // Parse languages.toml
    let lang_toml_path = Path::new("languages.toml");
    let lang_content = fs::read_to_string(lang_toml_path)
        .expect("Failed to read languages.toml. Please ensure it exists in src-tauri/");
    let lang_value: toml::Value = toml::from_str(&lang_content)
        .expect("Failed to parse languages.toml");
    
    let mut lang_configs = Vec::new();
    let mut filename_mappings = Vec::new();
    let mut shebang_mappings = Vec::new();
    
    if let Some(table) = lang_value.as_table() {
        for (name, lang_val) in table {
            if let Some(lang) = lang_val.as_table() {
                let extensions = lang.get("extensions").and_then(|v| v.as_array());
                let single_line = lang.get("single_line").and_then(|v| v.as_array());
                let multi_line = lang.get("multi_line").and_then(|v| v.as_array());
                let shebangs = lang.get("shebangs").and_then(|v| v.as_array());
                let filenames = lang.get("filenames").and_then(|v| v.as_array());
                
                let mut sl_items = Vec::new();
                if let Some(arr) = single_line {
                    for val in arr {
                        if let Some(s) = val.as_str() {
                            sl_items.push(format!("{:?}", s));
                        }
                    }
                }
                
                let mut ml_items = Vec::new();
                if let Some(arr) = multi_line {
                    for pair_val in arr {
                        if let Some(pair) = pair_val.as_array() {
                            if pair.len() == 2 {
                                if let (Some(start), Some(end)) = (pair[0].as_str(), pair[1].as_str()) {
                                    ml_items.push(format!("({:?}, {:?})", start, end));
                                }
                            }
                        }
                    }
                }
                
                let sl_str = if sl_items.is_empty() {
                    "&[]".to_string()
                } else {
                    format!("&[{}]", sl_items.join(", "))
                };
                
                let ml_str = if ml_items.is_empty() {
                    "&[]".to_string()
                } else {
                    format!("&[{}]", ml_items.join(", "))
                };
                
                if let Some(exts) = extensions {
                    for ext_val in exts {
                        if let Some(ext) = ext_val.as_str() {
                            lang_configs.push(format!(
                                "    ({:?}, LanguageConfig {{ name: {:?}, single_line_comments: {}, multi_line_comments: {} }})",
                                ext.to_lowercase(),
                                name,
                                sl_str,
                                ml_str
                            ));
                        }
                    }
                }
                
                if let Some(fnames) = filenames {
                    for fn_val in fnames {
                        if let Some(fname) = fn_val.as_str() {
                            if let Some(exts) = extensions {
                                if let Some(first_ext) = exts.first().and_then(|v| v.as_str()) {
                                    filename_mappings.push(format!("    ({:?}, {:?})", fname.to_lowercase(), first_ext));
                                }
                            }
                        }
                    }
                }
                
                if let Some(sbs) = shebangs {
                    for sb_val in sbs {
                        if let Some(sb) = sb_val.as_str() {
                            let mut interpreter = sb.to_lowercase();
                            if sb.starts_with("#!") {
                                let parts: Vec<&str> = sb[2..].split_whitespace().collect();
                                if !parts.is_empty() {
                                    let mut interp = std::path::Path::new(parts[0])
                                        .file_name()
                                        .and_then(|s| s.to_str())
                                        .unwrap_or(parts[0])
                                        .to_string();
                                    if interp == "env" && parts.len() > 1 {
                                        interp = parts[1].to_string();
                                    }
                                    interpreter = interp.to_lowercase();
                                }
                            }
                            if let Some(exts) = extensions {
                                if let Some(first_ext) = exts.first().and_then(|v| v.as_str()) {
                                    shebang_mappings.push(format!("    ({:?}, {:?})", interpreter, first_ext));
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Write out languages_gen.rs
    let lang_gen_path = Path::new(&out_dir).join("languages_gen.rs");
    let lang_gen_content = format!(
        "const GENERATED_LANGUAGE_CONFIGS: &[(&str, LanguageConfig)] = &[\n{},\n];\n\n\
         const GENERATED_FILENAME_MAPPINGS: &[(&str, &str)] = &[\n{},\n];\n\n\
         const GENERATED_SHEBANG_MAPPINGS: &[(&str, &str)] = &[\n{},\n];\n",
        lang_configs.join(",\n"),
        filename_mappings.join(",\n"),
        shebang_mappings.join(",\n")
    );
    fs::write(&lang_gen_path, lang_gen_content).expect("Failed to write languages_gen.rs");
    
    // 2. Generate techstack data
    let tech_toml_path = Path::new("techstack.toml");
    let tech_content = fs::read_to_string(tech_toml_path)
        .expect("Failed to read techstack.toml. Please ensure it exists in src-tauri/");
    let tech_value: toml::Value = toml::from_str(&tech_content)
        .expect("Failed to parse techstack.toml");
    
    let mut tech_map = Vec::new();
    let mut file_detections = Vec::new();
    let mut icon_map = Vec::new();
    
    if let Some(table) = tech_value.as_table() {
        if let Some(deps_val) = table.get("dependencies").and_then(|v| v.as_table()) {
            for (key, val) in deps_val {
                if let Some(val_table) = val.as_table() {
                    let name = val_table.get("name").and_then(|v| v.as_str()).unwrap_or("");
                    let category = val_table.get("category").and_then(|v| v.as_str()).unwrap_or("");
                    tech_map.push(format!("    ({:?}, ({:?}, {:?}))", key.to_lowercase(), name, category));
                }
            }
        }
        
        if let Some(files_val) = table.get("file_detections").and_then(|v| v.as_table()) {
            for (key, val) in files_val {
                if let Some(val_table) = val.as_table() {
                    let name = val_table.get("name").and_then(|v| v.as_str()).unwrap_or("");
                    let category = val_table.get("category").and_then(|v| v.as_str()).unwrap_or("");
                    file_detections.push(format!("    ({:?}, ({:?}, {:?}))", key, name, category));
                }
            }
        }
        
        if let Some(icons_val) = table.get("icons").and_then(|v| v.as_table()) {
            for (key, val) in icons_val {
                if let Some(icon) = val.as_str() {
                    icon_map.push(format!("    ({:?}, {:?})", key.to_lowercase(), icon));
                }
            }
        }
    }
    
    // Write out techstack_gen.rs
    let tech_gen_path = Path::new(&out_dir).join("techstack_gen.rs");
    let tech_gen_content = format!(
        "const GENERATED_TECH_MAP: &[(&str, (&str, &str))] = &[\n{},\n];\n\n\
         const GENERATED_FILE_DETECTIONS: &[(&str, (&str, &str))] = &[\n{},\n];\n\n\
         const GENERATED_ICON_MAP: &[(&str, &str)] = &[\n{},\n];\n",
        tech_map.join(",\n"),
        file_detections.join(",\n"),
        icon_map.join(",\n")
    );
    fs::write(&tech_gen_path, tech_gen_content).expect("Failed to write techstack_gen.rs");
    
    // 3. Trigger tauri_build
    tauri_build::build();
}
