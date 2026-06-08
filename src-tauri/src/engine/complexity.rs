pub fn analyze_complexity(content: &str, extension: &str) -> f64 {
    let mut complexity = 1.0;

    // Simple language-specific / general token scanning for control flow
    let is_markup = matches!(
        extension,
        "html" | "xml" | "svg" | "json" | "toml" | "yaml" | "yml" | "md" | "txt" | "csv" | "ini" | "graphql" | "gql" | "hcl" | "tf" | "proto" | "lock"
    );
    if is_markup {
        return 1.0;
    }

    for line in content.lines() {
        let trimmed = line.trim();
        // Skip comment lines entirely to avoid counting control flow inside comments
        if trimmed.starts_with("//")
            || trimmed.starts_with("#")
            || trimmed.starts_with("/*")
            || trimmed.starts_with("*")
            || trimmed.starts_with(";")
            || trimmed.starts_with("--")
        {
            continue;
        }

        // Common branching structures across many languages
        let branch_keywords = [
            "if ", "else if", "while ", "for ", "catch ", "except ", "match ", 
            "case ", "&&", "||", " and ", " or ", "unless", "elsif", "when", "guard", "switch"
        ];

        for kw in &branch_keywords {
            if trimmed.contains(kw) {
                complexity += 1.0;
            }
        }
    }

    complexity
}
