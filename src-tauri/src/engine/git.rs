use std::process::Command;
use std::path::Path;
use std::collections::{HashMap, HashSet};
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileChurn {
    pub path: String,
    pub commits: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Contributor {
    pub name: String,
    pub commits: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangeCoupling {
    pub file_a: String,
    pub file_b: String,
    pub coupling_degree: f64,
    pub shared_commits: u32,
}

#[cfg(target_os = "windows")]
fn configure_command(cmd: &mut Command) {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    cmd.creation_flags(CREATE_NO_WINDOW);
}

#[cfg(not(target_os = "windows"))]
fn configure_command(_cmd: &mut Command) {}

pub fn analyze_git(root: &Path) -> Option<(Vec<FileChurn>, Vec<Contributor>, Vec<ChangeCoupling>)> {
    // Check if git is available and if it is a git repo
    let mut check_cmd = Command::new("git");
    check_cmd.arg("status").current_dir(root);
    configure_command(&mut check_cmd);
    
    let check_status = check_cmd.status().ok()?;
    if !check_status.success() {
        return None;
    }

    // 1. Get file churn: count commit frequencies per file path
    let mut churn_cmd = Command::new("git");
    churn_cmd.args(&["log", "--name-only", "--pretty=format:"]).current_dir(root);
    configure_command(&mut churn_cmd);
    
    let churn_output = churn_cmd.output().ok()?;
    let churn_str = String::from_utf8_lossy(&churn_output.stdout);
    
    let mut file_commit_counts = HashMap::new();
    for line in churn_str.lines() {
        let trimmed = line.trim();
        if !trimmed.is_empty() {
            let normalized = trimmed.replace('\\', "/");
            *file_commit_counts.entry(normalized).or_insert(0) += 1;
        }
    }

    let mut file_churn: Vec<FileChurn> = file_commit_counts
        .into_iter()
        .map(|(path, commits)| FileChurn { path, commits })
        .collect();
    file_churn.sort_by(|a, b| b.commits.cmp(&a.commits));

    // 2. Get top contributors
    let mut author_cmd = Command::new("git");
    author_cmd.args(&["log", "--format=%aN", "--no-merges"]).current_dir(root);
    configure_command(&mut author_cmd);
    
    let author_output = author_cmd.output().ok()?;
    let author_str = String::from_utf8_lossy(&author_output.stdout);
    
    let mut author_counts = HashMap::new();
    for line in author_str.lines() {
        let trimmed = line.trim().to_string();
        if !trimmed.is_empty() {
            *author_counts.entry(trimmed).or_insert(0) += 1;
        }
    }

    let mut contributors: Vec<Contributor> = author_counts
        .into_iter()
        .map(|(name, commits)| Contributor { name, commits })
        .collect();
    contributors.sort_by(|a, b| b.commits.cmp(&a.commits));

    // 3. Get change coupling (files modified together in commits)
    let mut change_coupling = Vec::new();
    let mut co_cmd = Command::new("git");
    co_cmd.args(&["log", "--name-only", "--pretty=format:C:%H"]).current_dir(root);
    configure_command(&mut co_cmd);
    
    if let Ok(co_output) = co_cmd.output() {
        let co_str = String::from_utf8_lossy(&co_output.stdout);
        let mut commits: Vec<HashSet<String>> = Vec::new();
        let mut current_commit = HashSet::new();
        
        for line in co_str.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("C:") {
                if !current_commit.is_empty() {
                    commits.push(current_commit);
                    current_commit = HashSet::new();
                }
            } else if !trimmed.is_empty() {
                current_commit.insert(trimmed.replace('\\', "/"));
            }
        }
        if !current_commit.is_empty() {
            commits.push(current_commit);
        }
        
        let mut file_commit_counts: HashMap<String, u32> = HashMap::new();
        let mut co_occurrence: HashMap<(String, String), u32> = HashMap::new();
        
        for commit_files in &commits {
            // Ignore large commits (over 10 files) as they represent noise/reformatting/mass merges
            if commit_files.len() > 10 || commit_files.is_empty() {
                continue;
            }
            
            let files_list: Vec<&String> = commit_files.iter().collect();
            for &f in &files_list {
                *file_commit_counts.entry(f.clone()).or_insert(0) += 1;
            }
            
            for i in 0..files_list.len() {
                for j in i+1..files_list.len() {
                    let mut pair = (files_list[i].clone(), files_list[j].clone());
                    if pair.0 > pair.1 {
                        std::mem::swap(&mut pair.0, &mut pair.1);
                    }
                    *co_occurrence.entry(pair).or_insert(0) += 1;
                }
            }
        }
        
        for ((fa, fb), shared) in co_occurrence {
            if shared >= 2 { // at least 2 shared commits
                let count_a = *file_commit_counts.get(&fa).unwrap_or(&0);
                let count_b = *file_commit_counts.get(&fb).unwrap_or(&0);
                let union_count = count_a + count_b - shared;
                if union_count > 0 {
                    let degree = (shared as f64) / (union_count as f64);
                    if degree >= 0.25 { // at least 25% coupling
                        change_coupling.push(ChangeCoupling {
                            file_a: fa,
                            file_b: fb,
                            coupling_degree: (degree * 100.0).round() / 100.0,
                            shared_commits: shared,
                        });
                    }
                }
            }
        }
        
        change_coupling.sort_by(|a, b| b.coupling_degree.partial_cmp(&a.coupling_degree).unwrap_or(std::cmp::Ordering::Equal));
        change_coupling.truncate(15);
    }

    Some((file_churn, contributors, change_coupling))
}
