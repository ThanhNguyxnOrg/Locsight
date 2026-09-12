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

        // Strip simple string literals to avoid matching keywords inside messages/strings
        let mut clean_line = String::with_capacity(trimmed.len());
        let mut in_quote = false;
        let mut quote_char = '"';
        let mut prev_char = ' ';

        for ch in trimmed.chars() {
            if (ch == '"' || ch == '\'') && prev_char != '\\' {
                if in_quote && ch == quote_char {
                    in_quote = false;
                } else if !in_quote {
                    in_quote = true;
                    quote_char = ch;
                }
            } else if !in_quote {
                clean_line.push(ch);
            }
            prev_char = ch;
        }

        let line_to_check = if in_quote { trimmed } else { &clean_line };

        // Handle "else if" and "elsif" first by replacing them with a single marker
        // so "if " won't double-count the same statement
        let normalized = line_to_check
            .replace("else if", "__locsight_branch__")
            .replace("elsif", "__locsight_branch__");

        let branch_keywords = [
            "__locsight_branch__", "if ", "while ", "for ", "catch ", "except ", "match ", 
            "case ", "&&", "||", " and ", " or ", "unless", "when", "guard", "switch"
        ];

        for kw in &branch_keywords {
            if normalized.contains(kw) {
                complexity += 1.0;
            }
        }
    }

    complexity
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_analyze_complexity_basic() {
        let code = r#"
            fn calculate(x: i32) -> i32 {
                if x > 0 {
                    x * 2
                } else if x == 0 {
                    0
                } else {
                    -x
                }
            }
        "#;
        let c = analyze_complexity(code, "rs");
        assert_eq!(c, 3.0);
    }

    #[test]
    fn test_ignore_string_literals() {
        let code = r#"
            fn log() {
                println!("if you see this, and or while do not count");
            }
        "#;
        let c = analyze_complexity(code, "rs");
        assert_eq!(c, 1.0);
    }
}
