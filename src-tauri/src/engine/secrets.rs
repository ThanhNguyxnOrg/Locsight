use serde::{Serialize, Deserialize};
use regex::Regex;
use std::sync::OnceLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SecretFinding {
    pub kind: String,
    pub file_path: String,
    pub line_number: u32,
    pub snippet: String,
}

struct SecretPattern {
    kind: &'static str,
    regex: Regex,
}

static PATTERNS: OnceLock<Vec<SecretPattern>> = OnceLock::new();

fn get_patterns() -> &'static Vec<SecretPattern> {
    PATTERNS.get_or_init(|| {
        vec![
            SecretPattern {
                kind: "AWS Access Key ID",
                regex: Regex::new(r"AKIA[0-9A-Z]{16}").unwrap(),
            },
            SecretPattern {
                kind: "AWS Secret Access Key",
                regex: Regex::new(r#"(?i)aws_secret_access_key\s*[:=]\s*['"][A-Za-z0-9/+=]{40}['"]"#).unwrap(),
            },
            SecretPattern {
                kind: "GitHub PAT",
                regex: Regex::new(r"\b(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})\b").unwrap(),
            },
            SecretPattern {
                kind: "Google API Key",
                regex: Regex::new(r"AIza[0-9A-Za-z\-_]{35}").unwrap(),
            },
            SecretPattern {
                kind: "Private Key",
                regex: Regex::new(r"-----BEGIN [A-Z ]+ PRIVATE KEY-----").unwrap(),
            },
            SecretPattern {
                kind: "Slack Webhook URL",
                regex: Regex::new(r"https://hooks.slack.com/services/T[a-zA-Z0-9_]+/B[a-zA-Z0-9_]+/H[a-zA-Z0-9_]+").unwrap(),
            },
            SecretPattern {
                kind: "Generic High-Entropy Credential",
                regex: Regex::new(r#"(?i)(password|secret|token|api_key|apikey|private_key)\s*[:=]\s*['"]([A-Za-z0-9\-_\.\+=/]{16,80})['"]"#).unwrap(),
            },
        ]
    })
}

pub fn calculate_entropy(s: &str) -> f64 {
    let mut counts = [0_u32; 256];
    let mut total = 0.0;
    for &b in s.as_bytes() {
        counts[b as usize] += 1;
        total += 1.0;
    }
    let mut entropy = 0.0;
    for &count in &counts {
        if count > 0 {
            let p = (count as f64) / total;
            entropy -= p * p.log2();
        }
    }
    entropy
}

fn mask_secret(line: &str, secret: &str) -> String {
    if secret.len() <= 6 {
        return line.replace(secret, "******");
    }
    let prefix = &secret[..4];
    let suffix = &secret[secret.len() - 4..];
    let masked = format!("{}...{}", prefix, suffix);
    line.replace(secret, &masked)
}

pub fn scan_secrets(content: &str, relative_path: &str) -> Vec<SecretFinding> {
    let mut findings = Vec::new();
    let patterns = get_patterns();

    for (idx, line) in content.lines().enumerate() {
        let line_num = (idx + 1) as u32;
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        for pattern in patterns {
            if let Some(mat) = pattern.regex.find(trimmed) {
                let matched_str = mat.as_str();

                // If it is generic credential pattern, verify entropy
                if pattern.kind == "Generic High-Entropy Credential" {
                    // Extract the capture group (the actual secret) if possible
                    if let Some(caps) = pattern.regex.captures(trimmed) {
                        if let Some(val) = caps.get(2) {
                            let entropy = calculate_entropy(val.as_str());
                            if entropy < 3.8 {
                                // Skip low entropy strings like "password123"
                                continue;
                            }
                            let masked_line = mask_secret(trimmed, val.as_str());
                            findings.push(SecretFinding {
                                kind: pattern.kind.to_string(),
                                file_path: relative_path.to_string(),
                                line_number: line_num,
                                snippet: masked_line,
                            });
                            break;
                        }
                    }
                } else {
                    let masked_line = mask_secret(trimmed, matched_str);
                    findings.push(SecretFinding {
                        kind: pattern.kind.to_string(),
                        file_path: relative_path.to_string(),
                        line_number: line_num,
                        snippet: masked_line,
                    });
                    break;
                }
            }
        }
    }

    findings
}
