use std::fs;
use std::path::Path;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomLanguageMapping {
    pub extension: String,
    pub name: String,
    #[serde(default, alias = "single_line_comments")]
    pub single_line_comments: Vec<String>,
    #[serde(default, alias = "multi_line_comments")]
    pub multi_line_comments: Vec<(String, String)>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CustomConfig {
    #[serde(default, alias = "exclude_patterns")]
    pub exclude_patterns: Option<Vec<String>>,
    #[serde(default, alias = "custom_languages")]
    pub custom_languages: Option<Vec<CustomLanguageMapping>>,
}

pub fn load_custom_config(root: &Path) -> CustomConfig {
    let locsight_path = root.join(".locsight.json");
    let analyzer_path = root.join(".analyzer.json");
    let config_path = if locsight_path.exists() {
        locsight_path
    } else {
        analyzer_path
    };

    if config_path.exists() {
        if let Ok(content) = fs::read_to_string(config_path) {
            if let Ok(config) = serde_json::from_str::<CustomConfig>(&content) {
                return config;
            }
        }
    }
    CustomConfig::default()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_custom_config_camel_and_snake_case() {
        let json_camel = r#"{
            "excludePatterns": ["foo/*"],
            "customLanguages": [{
                "extension": "myext",
                "name": "MyLang",
                "singleLineComments": ["//"]
            }]
        }"#;
        let cfg1: CustomConfig = serde_json::from_str(json_camel).unwrap();
        assert_eq!(cfg1.exclude_patterns.unwrap(), vec!["foo/*"]);
        let lang1 = &cfg1.custom_languages.unwrap()[0];
        assert_eq!(lang1.extension, "myext");
        assert_eq!(lang1.single_line_comments, vec!["//"]);
        assert!(lang1.multi_line_comments.is_empty());

        let json_snake = r#"{
            "exclude_patterns": ["bar/*"],
            "custom_languages": [{
                "extension": "xyz",
                "name": "XyzLang",
                "single_line_comments": ["#"],
                "multi_line_comments": [["/*", "*/"]]
            }]
        }"#;
        let cfg2: CustomConfig = serde_json::from_str(json_snake).unwrap();
        assert_eq!(cfg2.exclude_patterns.unwrap(), vec!["bar/*"]);
        let lang2 = &cfg2.custom_languages.unwrap()[0];
        assert_eq!(lang2.extension, "xyz");
        assert_eq!(lang2.multi_line_comments, vec![("/*".to_string(), "*/".to_string())]);
    }
}
