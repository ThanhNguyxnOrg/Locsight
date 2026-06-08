use serde::{Serialize, Deserialize};
use regex::Regex;
use std::sync::OnceLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Annotation {
    pub kind: String,
    pub message: String,
    pub file_path: String,
    pub line_number: u32,
}

static ANNOTATION_REGEX: OnceLock<Regex> = OnceLock::new();

fn get_regex() -> &'static Regex {
    ANNOTATION_REGEX.get_or_init(|| {
        Regex::new(r"(?i)\b(TODO|FIXME|HACK|BUG|DEPRECATED|XXX)\b\s*:?\s*(.*)").unwrap()
    })
}

pub fn scan_annotations(content: &str, relative_path: &str) -> Vec<Annotation> {
    let re = get_regex();
    let mut results = Vec::new();
    
    for (idx, line) in content.lines().enumerate() {
        let line_num = (idx + 1) as u32;
        if let Some(caps) = re.captures(line) {
            let kind = caps.get(1).unwrap().as_str().to_uppercase();
            let message = caps.get(2).unwrap().as_str().trim().to_string();
            
            let message_truncated = if message.len() > 120 {
                format!("{}...", &message[..120])
            } else {
                message
            };

            results.push(Annotation {
                kind,
                message: message_truncated,
                file_path: relative_path.to_string(),
                line_number: line_num,
            });
        }
    }
    results
}
