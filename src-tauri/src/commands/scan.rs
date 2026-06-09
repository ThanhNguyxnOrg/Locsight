use crate::models::{ProjectSummary, CocomoResult};
use crate::engine::scanner::scan_project_directory;
use crate::engine::cocomo::calculate_cocomo;
use std::fs;
use std::path::Path;

#[tauri::command]
pub async fn scan_directory(path: String) -> Result<ProjectSummary, String> {
    scan_project_directory(&path)
}

#[tauri::command]
pub fn get_cocomo_estimate(loc: u64, monthly_rate_usd: f64) -> Result<CocomoResult, String> {
    Ok(calculate_cocomo(loc, monthly_rate_usd))
}

#[tauri::command]
pub fn read_locignore(root_path: String) -> Result<String, String> {
    let path = Path::new(&root_path).join(".locignore");
    if path.exists() {
        fs::read_to_string(path).map_err(|e| e.to_string())
    } else {
        Ok("".to_string())
    }
}

#[tauri::command]
pub fn write_locignore(root_path: String, content: String) -> Result<(), String> {
    let path = Path::new(&root_path).join(".locignore");
    fs::write(path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn read_gitignore(root_path: String) -> Result<String, String> {
    let path = Path::new(&root_path).join(".gitignore");
    if path.exists() {
        fs::read_to_string(path).map_err(|e| e.to_string())
    } else {
        Err("No .gitignore file found in the project root".to_string())
    }
}

