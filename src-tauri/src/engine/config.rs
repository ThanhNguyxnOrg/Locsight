use std::fs;
use std::path::Path;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomLanguageMapping {
    pub extension: String,
    pub name: String,
    pub single_line_comments: Vec<String>,
    pub multi_line_comments: Vec<(String, String)>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CustomConfig {
    pub exclude_patterns: Option<Vec<String>>,
    pub custom_languages: Option<Vec<CustomLanguageMapping>>,
}

pub fn load_custom_config(root: &Path) -> CustomConfig {
    let config_path = root.join(".analyzer.json");
    if config_path.exists() {
        if let Ok(content) = fs::read_to_string(config_path) {
            if let Ok(config) = serde_json::from_str::<CustomConfig>(&content) {
                return config;
            }
        }
    }
    CustomConfig::default()
}
