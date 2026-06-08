use std::hash::{Hash, Hasher};
use std::collections::hash_map::DefaultHasher;


pub fn hash_line(line: &str) -> u64 {
    let mut hasher = DefaultHasher::new();
    line.trim().hash(&mut hasher);
    hasher.finish()
}

pub fn calculate_dryness(total_code: u64, uloc: u64) -> f64 {
    if total_code == 0 {
        1.0
    } else {
        (uloc as f64) / (total_code as f64)
    }
}
