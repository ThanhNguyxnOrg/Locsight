use std::collections::{HashMap, HashSet};
use std::path::Path;
use std::fs;
use serde::{Deserialize, Serialize};
use regex::Regex;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ComponentCoupling {
    pub afferent: usize,   // Ca (incoming dependencies)
    pub efferent: usize,   // Ce (outgoing dependencies)
    pub instability: f64,  // I = Ce / (Ca + Ce)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuleViolation {
    pub source: String,
    pub target: String,
    pub rule_name: String,
    pub description: String,
    pub severity: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArchitectureRule {
    pub name: String,
    pub source_pattern: String,
    pub target_pattern: String,
    pub allow: bool,
    pub severity: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArchitectureRulesConfig {
    pub rules: Vec<ArchitectureRule>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArchitectureAnalysisReport {
    pub ca_ce_metrics: HashMap<String, ComponentCoupling>,
    pub circular_dependencies: Vec<Vec<String>>,
    pub rule_violations: Vec<RuleViolation>,
    pub clusters: HashMap<String, String>, // file_path -> cluster_name
}

/// Detect circular dependencies using DFS-based cycle detection (Tarjan-like / DFS)
pub fn detect_circular_dependencies(
    files: &[String],
    edges: &[(String, String)],
) -> Vec<Vec<String>> {
    let mut adjacency: HashMap<&str, Vec<&str>> = HashMap::new();
    for file in files {
        adjacency.insert(file.as_str(), Vec::new());
    }
    for (from, to) in edges {
        if adjacency.contains_key(from.as_str()) && adjacency.contains_key(to.as_str()) {
            adjacency.get_mut(from.as_str()).unwrap().push(to.as_str());
        }
    }

    let mut cycles = Vec::new();
    let mut visited = HashSet::new();
    let mut recursion_stack = HashSet::new();
    let mut path = Vec::new();

    fn dfs<'a>(
        node: &'a str,
        adjacency: &HashMap<&'a str, Vec<&'a str>>,
        visited: &mut HashSet<&'a str>,
        recursion_stack: &mut HashSet<&'a str>,
        path: &mut Vec<&'a str>,
        cycles: &mut Vec<Vec<String>>,
    ) {
        visited.insert(node);
        recursion_stack.insert(node);
        path.push(node);

        if let Some(neighbors) = adjacency.get(node) {
            for &neighbor in neighbors {
                if !visited.contains(neighbor) {
                    dfs(neighbor, adjacency, visited, recursion_stack, path, cycles);
                } else if recursion_stack.contains(neighbor) {
                    // Cycle detected
                    if let Some(pos) = path.iter().position(|&x| x == neighbor) {
                        let mut cycle: Vec<String> = path[pos..].iter().map(|&s| s.to_string()).collect();
                        cycle.push(neighbor.to_string());
                        cycles.push(cycle);
                    }
                }
            }
        }

        path.pop();
        recursion_stack.remove(node);
    }

    for file in files {
        if !visited.contains(file.as_str()) {
            dfs(file.as_str(), &adjacency, &mut visited, &mut recursion_stack, &mut path, &mut cycles);
        }
    }

    // De-duplicate cycles that are identical (just shifted starts)
    let mut unique_cycles: Vec<Vec<String>> = Vec::new();
    for cycle in cycles {
        let mut is_dup = false;
        for existing in &unique_cycles {
            if existing.len() == cycle.len() {
                // Check if they are cyclic shifts of each other
                let mut shifted = existing.clone();
                for _ in 0..existing.len() {
                    // Rotate
                    shifted.rotate_left(1);
                    if shifted == cycle {
                        is_dup = true;
                        break;
                    }
                }
            }
            if is_dup {
                break;
            }
        }
        if !is_dup {
            unique_cycles.push(cycle);
        }
    }

    unique_cycles
}

/// Calculate Afferent (Ca) and Efferent (Ce) coupling and Instability
pub fn calculate_coupling_metrics(
    files: &[String],
    edges: &[(String, String)],
) -> HashMap<String, ComponentCoupling> {
    let mut ca_ce = HashMap::new();
    for file in files {
        ca_ce.insert(file.clone(), ComponentCoupling { afferent: 0, efferent: 0, instability: 0.0 });
    }

    for (from, to) in edges {
        if let Some(metrics) = ca_ce.get_mut(from) {
            metrics.efferent += 1;
        }
        if let Some(metrics) = ca_ce.get_mut(to) {
            metrics.afferent += 1;
        }
    }

    for metrics in ca_ce.values_mut() {
        let total = metrics.afferent + metrics.efferent;
        if total > 0 {
            metrics.instability = (metrics.efferent as f64) / (total as f64);
        } else {
            metrics.instability = 0.0;
        }
    }

    ca_ce
}

/// Validate dependency rules defined in `.locsight.rules.json`
pub fn validate_rules(
    edges: &[(String, String)],
    project_root: &Path,
) -> Vec<RuleViolation> {
    let rules_path = project_root.join(".locsight.rules.json");
    if !rules_path.exists() {
        return Vec::new();
    }

    let config_content = match fs::read_to_string(rules_path) {
        Ok(c) => c,
        Err(_) => return Vec::new(),
    };

    let rules_config: ArchitectureRulesConfig = match serde_json::from_str(&config_content) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Failed to parse .locsight.rules.json: {}", e);
            return Vec::new();
        }
    };

    let mut violations = Vec::new();
    let mut compiled_rules = Vec::new();

    for rule in &rules_config.rules {
        let src_re = match Regex::new(&rule.source_pattern) {
            Ok(r) => r,
            Err(_) => continue,
        };
        let tgt_re = match Regex::new(&rule.target_pattern) {
            Ok(r) => r,
            Err(_) => continue,
        };
        compiled_rules.push((rule, src_re, tgt_re));
    }

    for (from, to) in edges {
        for (rule, src_re, tgt_re) in &compiled_rules {
            let from_normalized = from.replace('\\', "/");
            let to_normalized = to.replace('\\', "/");
            if src_re.is_match(&from_normalized) && tgt_re.is_match(&to_normalized) {
                if !rule.allow {
                    violations.push(RuleViolation {
                        source: from.clone(),
                        target: to.clone(),
                        rule_name: rule.name.clone(),
                        description: rule.description.clone(),
                        severity: rule.severity.clone(),
                    });
                }
            }
        }
    }

    violations
}

/// Map each file path to a parent folder path representing its architectural component
pub fn detect_clusters(files: &[String]) -> HashMap<String, String> {
    let mut clusters = HashMap::new();
    for file in files {
        let normalized = file.replace('\\', "/");
        let parts: Vec<&str> = normalized.split('/').collect();
        if parts.len() > 1 {
            let cluster_name = parts[..parts.len() - 1].join("/");
            clusters.insert(file.clone(), cluster_name);
        } else {
            clusters.insert(file.clone(), "root".to_string());
        }
    }
    clusters
}

/// Run full architectural analysis
pub fn analyze_architecture(
    files: &[String],
    edges: &[(String, String)],
    project_root: &Path,
) -> ArchitectureAnalysisReport {
    let ca_ce_metrics = calculate_coupling_metrics(files, edges);
    let circular_dependencies = detect_circular_dependencies(files, edges);
    let rule_violations = validate_rules(edges, project_root);
    let clusters = detect_clusters(files);

    ArchitectureAnalysisReport {
        ca_ce_metrics,
        circular_dependencies,
        rule_violations,
        clusters,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_coupling_metrics() {
        let files = vec![
            "src/ui/Button.tsx".to_string(),
            "src/utils/math.ts".to_string(),
            "src/db/connection.ts".to_string(),
        ];
        // Button -> math, Button -> connection
        let edges = vec![
            ("src/ui/Button.tsx".to_string(), "src/utils/math.ts".to_string()),
            ("src/ui/Button.tsx".to_string(), "src/db/connection.ts".to_string()),
        ];

        let metrics = calculate_coupling_metrics(&files, &edges);
        
        let ui = metrics.get("src/ui/Button.tsx").unwrap();
        assert_eq!(ui.efferent, 2);
        assert_eq!(ui.afferent, 0);
        assert_eq!(ui.instability, 1.0); // fully unstable

        let db = metrics.get("src/db/connection.ts").unwrap();
        assert_eq!(db.efferent, 0);
        assert_eq!(db.afferent, 1);
        assert_eq!(db.instability, 0.0); // stable
    }

    #[test]
    fn test_circular_dependencies() {
        let files = vec![
            "a.ts".to_string(),
            "b.ts".to_string(),
            "c.ts".to_string(),
        ];
        // a -> b -> c -> a
        let edges = vec![
            ("a.ts".to_string(), "b.ts".to_string()),
            ("b.ts".to_string(), "c.ts".to_string()),
            ("c.ts".to_string(), "a.ts".to_string()),
        ];

        let cycles = detect_circular_dependencies(&files, &edges);
        assert_eq!(cycles.len(), 1);
        assert_eq!(cycles[0], vec!["a.ts", "b.ts", "c.ts", "a.ts"]);
    }

    #[test]
    fn test_rule_violations() {
        use std::io::Write;
        let dir = std::env::temp_dir();
        let rules_path = dir.join(".locsight.rules.json");
        
        // Write mock rules configuration
        let mut file = fs::File::create(&rules_path).unwrap();
        writeln!(
            file,
            r#"{{
                "rules": [
                    {{
                        "name": "No UI to DB",
                        "sourcePattern": "src/ui/.*",
                        "targetPattern": "src/db/.*",
                        "allow": false,
                        "severity": "error",
                        "description": "UI must not import DB directly"
                    }}
                ]
            }}"#
        ).unwrap();

        // ui depends on db (violates rule)
        let edges = vec![
            ("src/ui/Button.tsx".to_string(), "src/db/connection.ts".to_string()),
            ("src/ui/Button.tsx".to_string(), "src/utils/math.ts".to_string()),
        ];

        let violations = validate_rules(&edges, &dir);
        assert_eq!(violations.len(), 1);
        assert_eq!(violations[0].rule_name, "No UI to DB");
        assert_eq!(violations[0].source, "src/ui/Button.tsx");
        assert_eq!(violations[0].target, "src/db/connection.ts");

        let _ = fs::remove_file(&rules_path);
    }
}
