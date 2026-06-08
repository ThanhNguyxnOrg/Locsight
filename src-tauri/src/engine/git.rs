use std::process::Command;
use std::path::Path;
use std::collections::HashMap;
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

#[cfg(target_os = "windows")]
fn configure_command(cmd: &mut Command) {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    cmd.creation_flags(CREATE_NO_WINDOW);
}

#[cfg(not(target_os = "windows"))]
fn configure_command(_cmd: &mut Command) {}

pub fn analyze_git(root: &Path) -> Option<(Vec<FileChurn>, Vec<Contributor>)> {
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
            // Normalize path separator to forward slash
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

    Some((file_churn, contributors))
}
