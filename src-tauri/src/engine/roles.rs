use std::collections::HashMap;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RoleStats {
    pub files: u32,
    pub loc: u64,
    pub percentage: f64,
}

pub fn classify_role(relative_path: &str) -> &'static str {
    let lower_path = relative_path.to_lowercase().replace('\\', "/");
    let parts: Vec<&str> = lower_path.split('/').collect();
    let file_name = parts.last().copied().unwrap_or("");
    let is_test_dir = parts[..parts.len().saturating_sub(1)]
        .iter()
        .any(|&p| p == "test" || p == "tests" || p == "__tests__" || p == "spec" || p == "specs");
    
    // Test
    if is_test_dir
        || file_name.starts_with("test_")
        || file_name.starts_with("test.")
        || file_name.ends_with("_test.go")
        || file_name.ends_with("_test.rs")
        || file_name.ends_with("_test.py")
        || file_name.ends_with(".test.ts")
        || file_name.ends_with(".spec.ts")
        || file_name.ends_with(".test.tsx")
        || file_name.ends_with(".spec.tsx")
        || file_name.ends_with(".test.js")
        || file_name.ends_with(".spec.js")
        || file_name.ends_with(".test.jsx")
        || file_name.ends_with(".spec.jsx")
        || file_name.ends_with("test.java")
        || file_name.ends_with("tests.java")
    {
        return "test";
    }

    // Docs
    if lower_path.ends_with(".md")
        || lower_path.ends_with(".rst")
        || lower_path.ends_with(".txt")
        || lower_path.contains("docs/")
        || lower_path.contains("/docs/")
        || lower_path.starts_with("docs/")
        || lower_path.contains("readme")
    {
        return "docs";
    }

    // Infra
    if lower_path.contains("dockerfile")
        || lower_path.contains(".github/")
        || lower_path.contains("terraform/")
        || lower_path.ends_with(".tf")
        || lower_path.contains(".gitlab-ci")
        || lower_path.contains("kubernetes/")
        || lower_path.ends_with("docker-compose.yml")
        || lower_path.ends_with("docker-compose.yaml")
    {
        return "infra";
    }

    // Scripts
    if lower_path.contains("scripts/")
        || lower_path.contains("bin/")
        || lower_path.ends_with(".sh")
        || lower_path.ends_with("makefile")
        || lower_path.ends_with("setup.py")
        || lower_path.ends_with("manage.py")
    {
        return "scripts";
    }

    // Config
    if lower_path.ends_with(".json")
        || lower_path.ends_with(".yaml")
        || lower_path.ends_with(".yml")
        || lower_path.ends_with(".toml")
        || lower_path.ends_with(".ini")
        || lower_path.ends_with(".env")
        || lower_path.contains("config/")
    {
        return "config";
    }

    "core"
}

pub fn calculate_role_distribution(files: &[crate::models::FileInfo]) -> HashMap<String, RoleStats> {
    let mut distribution = HashMap::new();
    
    // Initialize roles
    let roles = ["core", "test", "docs", "infra", "config", "scripts"];
    for role in &roles {
        distribution.insert(role.to_string(), RoleStats { files: 0, loc: 0, percentage: 0.0 });
    }

    for file in files {
        let role = classify_role(&file.path);
        let stats = distribution.entry(role.to_string()).or_insert(RoleStats { files: 0, loc: 0, percentage: 0.0 });
        stats.files += 1;
        stats.loc += file.loc;
    }

    let total_loc: u64 = files.iter().map(|f| f.loc).sum();

    for stats in distribution.values_mut() {
        if total_loc > 0 {
            stats.percentage = (stats.loc as f64 / total_loc as f64 * 100.0).round();
        }
    }

    distribution
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_classify_role() {
        assert_eq!(classify_role("src/components/latest.tsx"), "core");
        assert_eq!(classify_role("src/contest/math.rs"), "core");
        assert_eq!(classify_role("tests/unit_test.rs"), "test");
        assert_eq!(classify_role("src/__tests__/app.test.tsx"), "test");
        assert_eq!(classify_role("src/engine/scanner_test.go"), "test");
        assert_eq!(classify_role("README.md"), "docs");
        assert_eq!(classify_role(".github/workflows/ci.yml"), "infra");
        assert_eq!(classify_role("scripts/build.sh"), "scripts");
        assert_eq!(classify_role("config/settings.json"), "config");
    }
}
