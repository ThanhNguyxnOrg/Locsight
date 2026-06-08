use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use super::file_info::FileInfo;
use super::language_stats::LanguageStats;
use crate::engine::roles::RoleStats;
use crate::engine::annotations::Annotation;
use crate::engine::secrets::SecretFinding;
use crate::engine::git::{FileChurn, Contributor};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSummary {
    pub path: String,
    pub total_files: u32,
    pub total_languages: u32,
    pub total_code: u64,
    pub total_comments: u64,
    pub total_blanks: u64,
    pub total_loc: u64,
    pub languages: Vec<LanguageStats>,
    pub files: Vec<FileInfo>,
    pub duplicates: u32,
    pub duplicate_groups: Vec<Vec<String>>,
    pub average_complexity: f64,
    pub complexity_dist: Vec<u32>,
    pub edges: Vec<(String, String)>,
    pub scan_duration_ms: u64,

    // Phase 2-6 additions
    pub uloc: u64,
    pub dryness: f64,
    pub role_distribution: HashMap<String, RoleStats>,
    pub annotations: Vec<Annotation>,
    pub secrets: Vec<SecretFinding>,
    pub git_available: bool,
    pub file_churn: Vec<FileChurn>,
    pub top_contributors: Vec<Contributor>,
}

