use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::Path;
use std::time::Instant;
use rayon::prelude::*;
use walkdir::WalkDir;
use globset::{Glob, GlobSet, GlobSetBuilder};

use crate::models::{FileInfo, LanguageStats, ProjectSummary};
use super::complexity::analyze_complexity;
use super::duplicate::find_duplicates;
use super::uloc;
use super::roles;
use super::annotations::{self, Annotation};
use super::secrets::{self, SecretFinding};
use super::git;
use super::config;
use super::techstack;


#[derive(Clone, Copy)]
pub struct LanguageConfig {
    pub name: &'static str,
    pub single_line_comments: &'static [&'static str],
    pub multi_line_comments: &'static [(&'static str, &'static str)],
}

fn make_static_config(mapping: &config::CustomLanguageMapping) -> LanguageConfig {
    let name = Box::leak(mapping.name.clone().into_boxed_str());
    
    let single_lines: Vec<&'static str> = mapping.single_line_comments
        .iter()
        .map(|s| Box::leak(s.clone().into_boxed_str()) as &'static str)
        .collect();
    let single_line_comments = Box::leak(single_lines.into_boxed_slice());

    let multi_lines: Vec<(&'static str, &'static str)> = mapping.multi_line_comments
        .iter()
        .map(|(s, e)| {
            (
                Box::leak(s.clone().into_boxed_str()) as &'static str,
                Box::leak(e.clone().into_boxed_str()) as &'static str,
            )
        })
        .collect();
    let multi_line_comments = Box::leak(multi_lines.into_boxed_slice());

    LanguageConfig {
        name,
        single_line_comments,
        multi_line_comments,
    }
}

const LANGUAGE_CONFIGS: &[(&str, LanguageConfig)] = &[
    // Rust
    ("rs", LanguageConfig { name: "Rust", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    
    // JS & TS ecosystem
    ("js", LanguageConfig { name: "JavaScript", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("mjs", LanguageConfig { name: "JavaScript", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("cjs", LanguageConfig { name: "JavaScript", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("jsx", LanguageConfig { name: "JavaScript", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("ts", LanguageConfig { name: "TypeScript", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("mts", LanguageConfig { name: "TypeScript", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("cts", LanguageConfig { name: "TypeScript", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("tsx", LanguageConfig { name: "TypeScript", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    
    // Python
    ("py", LanguageConfig { name: "Python", single_line_comments: &["#"], multi_line_comments: &[("\"\"\"", "\"\"\""), ("'''", "'''")] }),
    ("pyw", LanguageConfig { name: "Python", single_line_comments: &["#"], multi_line_comments: &[("\"\"\"", "\"\"\""), ("'''", "'''")] }),
    ("pyi", LanguageConfig { name: "Python", single_line_comments: &["#"], multi_line_comments: &[("\"\"\"", "\"\"\""), ("'''", "'''")] }),
    
    // C / C++
    ("c", LanguageConfig { name: "C", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("h", LanguageConfig { name: "C Header", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("cpp", LanguageConfig { name: "C++", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("cc", LanguageConfig { name: "C++", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("cxx", LanguageConfig { name: "C++", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("c++", LanguageConfig { name: "C++", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("hpp", LanguageConfig { name: "C++ Header", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("hh", LanguageConfig { name: "C++ Header", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("hxx", LanguageConfig { name: "C++ Header", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    
    // Go
    ("go", LanguageConfig { name: "Go", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    
    // Java
    ("java", LanguageConfig { name: "Java", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    
    // C#
    ("cs", LanguageConfig { name: "C#", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("csx", LanguageConfig { name: "C#", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    
    // PHP
    ("php", LanguageConfig { name: "PHP", single_line_comments: &["//", "#"], multi_line_comments: &[("/*", "*/")] }),
    
    // Ruby
    ("rb", LanguageConfig { name: "Ruby", single_line_comments: &["#"], multi_line_comments: &[("=begin", "=end")] }),
    
    // Swift
    ("swift", LanguageConfig { name: "Swift", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    
    // Kotlin
    ("kt", LanguageConfig { name: "Kotlin", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("kts", LanguageConfig { name: "Kotlin", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    
    // Dart
    ("dart", LanguageConfig { name: "Dart", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    
    // Scala
    ("scala", LanguageConfig { name: "Scala", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("sc", LanguageConfig { name: "Scala", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    
    // Shell Scripting
    ("sh", LanguageConfig { name: "Shell", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("bash", LanguageConfig { name: "Shell", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("zsh", LanguageConfig { name: "Shell", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("fish", LanguageConfig { name: "Shell", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("csh", LanguageConfig { name: "Shell", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("tcsh", LanguageConfig { name: "Shell", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("ksh", LanguageConfig { name: "Shell", single_line_comments: &["#"], multi_line_comments: &[] }),
    
    // PowerShell
    ("ps1", LanguageConfig { name: "PowerShell", single_line_comments: &["#"], multi_line_comments: &[("<#", "#>")] }),
    ("psm1", LanguageConfig { name: "PowerShell", single_line_comments: &["#"], multi_line_comments: &[("<#", "#>")] }),
    ("psd1", LanguageConfig { name: "PowerShell", single_line_comments: &["#"], multi_line_comments: &[("<#", "#>")] }),
    
    // HTML / Web Markup
    ("html", LanguageConfig { name: "HTML", single_line_comments: &[], multi_line_comments: &[("<!--", "-->")] }),
    ("htm", LanguageConfig { name: "HTML", single_line_comments: &[], multi_line_comments: &[("<!--", "-->")] }),
    ("xhtml", LanguageConfig { name: "HTML", single_line_comments: &[], multi_line_comments: &[("<!--", "-->")] }),
    ("vue", LanguageConfig { name: "Vue", single_line_comments: &["//"], multi_line_comments: &[("<!--", "-->"), ("/*", "*/")] }),
    ("svelte", LanguageConfig { name: "Svelte", single_line_comments: &["//"], multi_line_comments: &[("<!--", "-->"), ("/*", "*/")] }),
    ("astro", LanguageConfig { name: "Astro", single_line_comments: &["//"], multi_line_comments: &[("<!--", "-->"), ("/*", "*/")] }),
    
    // CSS
    ("css", LanguageConfig { name: "CSS", single_line_comments: &[], multi_line_comments: &[("/*", "*/")] }),
    ("scss", LanguageConfig { name: "SCSS", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("sass", LanguageConfig { name: "Sass", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("less", LanguageConfig { name: "Less", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    
    // Config / Data
    ("toml", LanguageConfig { name: "TOML", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("yaml", LanguageConfig { name: "YAML", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("yml", LanguageConfig { name: "YAML", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("json", LanguageConfig { name: "JSON", single_line_comments: &[], multi_line_comments: &[] }),
    ("jsonc", LanguageConfig { name: "JSON with Comments", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("xml", LanguageConfig { name: "XML", single_line_comments: &[], multi_line_comments: &[("<!--", "-->")] }),
    ("ini", LanguageConfig { name: "INI", single_line_comments: &[";", "#"], multi_line_comments: &[] }),
    
    // SQL
    ("sql", LanguageConfig { name: "SQL", single_line_comments: &["--"], multi_line_comments: &[("/*", "*/")] }),
    
    // Rust / C / general ignore-like / Lockfiles
    ("lock", LanguageConfig { name: "Lockfile", single_line_comments: &["#"], multi_line_comments: &[] }),
    
    // Markdown / Docs
    ("md", LanguageConfig { name: "Markdown", single_line_comments: &[], multi_line_comments: &[("<!--", "-->")] }),
    ("markdown", LanguageConfig { name: "Markdown", single_line_comments: &[], multi_line_comments: &[("<!--", "-->")] }),
    ("txt", LanguageConfig { name: "Plain Text", single_line_comments: &[], multi_line_comments: &[] }),
    
    // Zig
    ("zig", LanguageConfig { name: "Zig", single_line_comments: &["//"], multi_line_comments: &[] }),
    
    // Lua
    ("lua", LanguageConfig { name: "Lua", single_line_comments: &["--"], multi_line_comments: &[("--[[", "]]")] }),
    
    // Haskell
    ("hs", LanguageConfig { name: "Haskell", single_line_comments: &["--"], multi_line_comments: &[("{-", "-}")] }),
    
    // Clojure / Lisp
    ("clj", LanguageConfig { name: "Clojure", single_line_comments: &[";"], multi_line_comments: &[] }),
    ("cljs", LanguageConfig { name: "Clojure", single_line_comments: &[";"], multi_line_comments: &[] }),
    ("cljc", LanguageConfig { name: "Clojure", single_line_comments: &[";"], multi_line_comments: &[] }),
    ("lisp", LanguageConfig { name: "Lisp", single_line_comments: &[";"], multi_line_comments: &[("#|", "|#")] }),
    ("lsp", LanguageConfig { name: "Lisp", single_line_comments: &[";"], multi_line_comments: &[("#|", "|#")] }),
    
    // Objective-C
    ("m", LanguageConfig { name: "Objective-C", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("mm", LanguageConfig { name: "Objective-C++", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    
    // Dockerfile / CI / Build
    ("dockerfile", LanguageConfig { name: "Dockerfile", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("makefile", LanguageConfig { name: "Makefile", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("cmake", LanguageConfig { name: "CMake", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("proto", LanguageConfig { name: "Protocol Buffers", single_line_comments: &["//"], multi_line_comments: &[] }),
    ("graphql", LanguageConfig { name: "GraphQL", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("gql", LanguageConfig { name: "GraphQL", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("tf", LanguageConfig { name: "HCL", single_line_comments: &["#", "//"], multi_line_comments: &[("/*", "*/")] }),
    ("hcl", LanguageConfig { name: "HCL", single_line_comments: &["#", "//"], multi_line_comments: &[("/*", "*/")] }),
    
    // F#
    ("fs", LanguageConfig { name: "F#", single_line_comments: &["//"], multi_line_comments: &[("(*", "*)")] }),
    ("fsx", LanguageConfig { name: "F#", single_line_comments: &["//"], multi_line_comments: &[("(*", "*)")] }),
    ("fsi", LanguageConfig { name: "F#", single_line_comments: &["//"], multi_line_comments: &[("(*", "*)")] }),
    
    // Perl
    ("pl", LanguageConfig { name: "Perl", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("pm", LanguageConfig { name: "Perl", single_line_comments: &["#"], multi_line_comments: &[] }),
    
    // R
    ("r", LanguageConfig { name: "R", single_line_comments: &["#"], multi_line_comments: &[] }),
    
    // Julia
    ("jl", LanguageConfig { name: "Julia", single_line_comments: &["#"], multi_line_comments: &[("#=", "=#")] }),
    
    // OCaml
    ("ml", LanguageConfig { name: "OCaml", single_line_comments: &[], multi_line_comments: &[("(*", "*)")] }),
    ("mli", LanguageConfig { name: "OCaml", single_line_comments: &[], multi_line_comments: &[("(*", "*)")] }),
    
    // Assembly
    ("asm", LanguageConfig { name: "Assembly", single_line_comments: &[";"], multi_line_comments: &[] }),
    ("s", LanguageConfig { name: "Assembly", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    
    // COBOL
    ("cob", LanguageConfig { name: "COBOL", single_line_comments: &["*"], multi_line_comments: &[] }),
    ("cbl", LanguageConfig { name: "COBOL", single_line_comments: &["*"], multi_line_comments: &[] }),
    
    // Fortran
    ("f90", LanguageConfig { name: "Fortran", single_line_comments: &["!"], multi_line_comments: &[] }),
    ("f95", LanguageConfig { name: "Fortran", single_line_comments: &["!"], multi_line_comments: &[] }),
    ("f03", LanguageConfig { name: "Fortran", single_line_comments: &["!"], multi_line_comments: &[] }),
    ("f", LanguageConfig { name: "Fortran Legacy", single_line_comments: &["c", "C", "*", "!"], multi_line_comments: &[] }),
    ("for", LanguageConfig { name: "Fortran Legacy", single_line_comments: &["c", "C", "*", "!"], multi_line_comments: &[] }),
    
    // Ada
    ("adb", LanguageConfig { name: "Ada", single_line_comments: &["--"], multi_line_comments: &[] }),
    ("ads", LanguageConfig { name: "Ada", single_line_comments: &["--"], multi_line_comments: &[] }),
    ("ada", LanguageConfig { name: "Ada", single_line_comments: &["--"], multi_line_comments: &[] }),
    
    // Pascal
    ("pas", LanguageConfig { name: "Pascal", single_line_comments: &["//"], multi_line_comments: &[("{", "}"), ("(*", "*)")] }),
    
    // VHDL / Verilog
    ("vhd", LanguageConfig { name: "VHDL", single_line_comments: &["--"], multi_line_comments: &[] }),
    ("vhdl", LanguageConfig { name: "VHDL", single_line_comments: &["--"], multi_line_comments: &[] }),
    ("v", LanguageConfig { name: "Verilog", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("sv", LanguageConfig { name: "SystemVerilog", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    
    // Game Dev / Shaders
    ("gd", LanguageConfig { name: "GDScript", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("glsl", LanguageConfig { name: "GLSL", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("hlsl", LanguageConfig { name: "HLSL", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("wgsl", LanguageConfig { name: "WGSL", single_line_comments: &["//"], multi_line_comments: &[] }),
    ("shader", LanguageConfig { name: "ShaderLab", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    
    // Solidity
    ("sol", LanguageConfig { name: "Solidity", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    
    // Typst
    ("typ", LanguageConfig { name: "Typst", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    
    // Nix
    ("nix", LanguageConfig { name: "Nix", single_line_comments: &["#"], multi_line_comments: &[("/*", "*/")] }),
    
    // Batch / Cmd
    ("bat", LanguageConfig { name: "Batch", single_line_comments: &["REM", "::"], multi_line_comments: &[] }),
    ("cmd", LanguageConfig { name: "Batch", single_line_comments: &["REM", "::"], multi_line_comments: &[] }),
    
    // Raku / Perl6
    ("raku", LanguageConfig { name: "Raku", single_line_comments: &["#"], multi_line_comments: &[] }),
    
    // Groovy
    ("groovy", LanguageConfig { name: "Groovy", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),

    // Functional
    ("ex", LanguageConfig { name: "Elixir", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("exs", LanguageConfig { name: "Elixir", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("erl", LanguageConfig { name: "Erlang", single_line_comments: &["%"], multi_line_comments: &[] }),
    ("hrl", LanguageConfig { name: "Erlang", single_line_comments: &["%"], multi_line_comments: &[] }),
    ("elm", LanguageConfig { name: "Elm", single_line_comments: &["--"], multi_line_comments: &[("{-", "-}")] }),
    ("purs", LanguageConfig { name: "PureScript", single_line_comments: &["--"], multi_line_comments: &[("{-", "-}")] }),

    // Systems
    ("d", LanguageConfig { name: "D", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("nim", LanguageConfig { name: "Nim", single_line_comments: &["#"], multi_line_comments: &[("#[", "]#")] }),
    ("nims", LanguageConfig { name: "Nim", single_line_comments: &["#"], multi_line_comments: &[("#[", "]#")] }),
    ("cr", LanguageConfig { name: "Crystal", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("mojo", LanguageConfig { name: "Mojo", single_line_comments: &["#"], multi_line_comments: &[] }),

    // LaTeX / Scientific
    ("tex", LanguageConfig { name: "LaTeX", single_line_comments: &["%"], multi_line_comments: &[] }),
    ("sty", LanguageConfig { name: "LaTeX", single_line_comments: &["%"], multi_line_comments: &[] }),
    ("mat", LanguageConfig { name: "MATLAB", single_line_comments: &["%"], multi_line_comments: &[("%{", "%}")] }),

    // Config / DevOps / Environment
    ("env", LanguageConfig { name: "Dotenv", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("properties", LanguageConfig { name: "Properties", single_line_comments: &["#", "!"], multi_line_comments: &[] }),
    ("cfg", LanguageConfig { name: "Config", single_line_comments: &["#", ";"], multi_line_comments: &[] }),
    ("conf", LanguageConfig { name: "Config", single_line_comments: &["#", ";"], multi_line_comments: &[] }),
    ("editorconfig", LanguageConfig { name: "EditorConfig", single_line_comments: &["#", ";"], multi_line_comments: &[] }),
    ("pp", LanguageConfig { name: "Puppet", single_line_comments: &["#"], multi_line_comments: &[("/*", "*/")] }),
    ("bicep", LanguageConfig { name: "Bicep", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("bzl", LanguageConfig { name: "Starlark", single_line_comments: &["#"], multi_line_comments: &[] }),

    // Template Engines
    ("ejs", LanguageConfig { name: "EJS", single_line_comments: &[], multi_line_comments: &[("<%#", "%>")] }),
    ("hbs", LanguageConfig { name: "Handlebars", single_line_comments: &[], multi_line_comments: &[("{{!", "}}"), ("{{!--", "--}}")] }),
    ("pug", LanguageConfig { name: "Pug", single_line_comments: &["//", "//-"], multi_line_comments: &[] }),
    ("jinja", LanguageConfig { name: "Jinja", single_line_comments: &[], multi_line_comments: &[("{#", "#}")] }),
    ("j2", LanguageConfig { name: "Jinja", single_line_comments: &[], multi_line_comments: &[("{#", "#}")] }),
    ("erb", LanguageConfig { name: "ERB", single_line_comments: &[], multi_line_comments: &[("<%#", "%>")] }),
    ("twig", LanguageConfig { name: "Twig", single_line_comments: &[], multi_line_comments: &[("{#", "#}")] }),
    ("liquid", LanguageConfig { name: "Liquid", single_line_comments: &[], multi_line_comments: &[("{% comment %}", "{% endcomment %}")] }),

    // GPU / Hardware / Shader
    ("metal", LanguageConfig { name: "Metal Shader", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("cu", LanguageConfig { name: "CUDA", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("cuh", LanguageConfig { name: "CUDA Header", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("cl", LanguageConfig { name: "OpenCL", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),

    // Mobile / Schema / API / WASM
    ("xaml", LanguageConfig { name: "XAML", single_line_comments: &[], multi_line_comments: &[("<!--", "-->")] }),
    ("prisma", LanguageConfig { name: "Prisma Schema", single_line_comments: &["//", "///"], multi_line_comments: &[] }),
    ("swagger", LanguageConfig { name: "OpenAPI", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("pkl", LanguageConfig { name: "Pkl", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("wat", LanguageConfig { name: "WebAssembly Text", single_line_comments: &[";;"], multi_line_comments: &[("(;", ";)")] }),
    ("wast", LanguageConfig { name: "WebAssembly Text", single_line_comments: &[";;"], multi_line_comments: &[("(;", ";)")] }),

    // Clojure / Lisp / Common Lisp / Scheme / Racket / Functional
    ("edn", LanguageConfig { name: "EDN", single_line_comments: &[";"], multi_line_comments: &[] }),
    ("commonlisp", LanguageConfig { name: "Common Lisp", single_line_comments: &[";"], multi_line_comments: &[("#|", "|#")] }),
    ("scm", LanguageConfig { name: "Scheme", single_line_comments: &[";"], multi_line_comments: &[] }),
    ("ss", LanguageConfig { name: "Scheme", single_line_comments: &[";"], multi_line_comments: &[] }),
    ("rkt", LanguageConfig { name: "Racket", single_line_comments: &[";"], multi_line_comments: &[] }),
    ("coq", LanguageConfig { name: "Coq", single_line_comments: &[], multi_line_comments: &[("(*", "*)")] }),
    ("vlang", LanguageConfig { name: "V", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("matlab", LanguageConfig { name: "MATLAB", single_line_comments: &["%"], multi_line_comments: &[("%{", "%}")] }),
    
    // Scripting / Legacy
    ("gvy", LanguageConfig { name: "Groovy", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("gy", LanguageConfig { name: "Groovy", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("gradle", LanguageConfig { name: "Gradle", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("vb", LanguageConfig { name: "VB.NET", single_line_comments: &["'"], multi_line_comments: &[] }),
    ("vbs", LanguageConfig { name: "VBScript", single_line_comments: &["'"], multi_line_comments: &[] }),
    ("bas", LanguageConfig { name: "VBA", single_line_comments: &["'"], multi_line_comments: &[] }),
    ("cls", LanguageConfig { name: "VBA", single_line_comments: &["'"], multi_line_comments: &[] }),
    ("frm", LanguageConfig { name: "VBA", single_line_comments: &["'"], multi_line_comments: &[] }),
    ("dpr", LanguageConfig { name: "Delphi", single_line_comments: &["//"], multi_line_comments: &[("(*", "*)"), ("{", "}")] }),
    ("dpk", LanguageConfig { name: "Delphi", single_line_comments: &["//"], multi_line_comments: &[("(*", "*)"), ("{", "}")] }),
    ("rpgle", LanguageConfig { name: "RPG", single_line_comments: &["//", "*"], multi_line_comments: &[] }),
    ("tcl", LanguageConfig { name: "Tcl", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("awk", LanguageConfig { name: "AWK", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("sed", LanguageConfig { name: "Sed", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("ahk", LanguageConfig { name: "AutoHotkey", single_line_comments: &[";"], multi_line_comments: &[] }),
    ("au3", LanguageConfig { name: "AutoIt", single_line_comments: &[";"], multi_line_comments: &[] }),
    ("applescript", LanguageConfig { name: "AppleScript", single_line_comments: &["--"], multi_line_comments: &[("(*", "*)")] }),

    // Functional / Logic / Proof / Systems
    ("sml", LanguageConfig { name: "Standard ML", single_line_comments: &[], multi_line_comments: &[("(*", "*)")] }),
    ("agda", LanguageConfig { name: "Agda", single_line_comments: &["--"], multi_line_comments: &[] }),
    ("idr", LanguageConfig { name: "Idris", single_line_comments: &["--"], multi_line_comments: &[] }),
    ("gleam", LanguageConfig { name: "Gleam", single_line_comments: &["//"], multi_line_comments: &[] }),
    ("fnl", LanguageConfig { name: "Fennel", single_line_comments: &[";"], multi_line_comments: &[] }),
    ("wren", LanguageConfig { name: "Wren", single_line_comments: &["//"], multi_line_comments: &[] }),
    ("nut", LanguageConfig { name: "Squirrel", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("pro", LanguageConfig { name: "Prolog", single_line_comments: &["%"], multi_line_comments: &[("/*", "*/")] }),
    
    // Web / Frontend / Templates
    ("mdx", LanguageConfig { name: "MDX", single_line_comments: &[], multi_line_comments: &[("<!--", "-->"), ("{/*", "*/}")] }),
    ("styl", LanguageConfig { name: "Stylus", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("pcss", LanguageConfig { name: "PostCSS", single_line_comments: &[], multi_line_comments: &[("/*", "*/")] }),
    ("postcss", LanguageConfig { name: "PostCSS", single_line_comments: &[], multi_line_comments: &[("/*", "*/")] }),
    ("coffee", LanguageConfig { name: "CoffeeScript", single_line_comments: &["#"], multi_line_comments: &[("###", "###")] }),
    ("litcoffee", LanguageConfig { name: "CoffeeScript", single_line_comments: &["#"], multi_line_comments: &[("###", "###")] }),
    ("slim", LanguageConfig { name: "Slim", single_line_comments: &["/"], multi_line_comments: &[] }),
    ("haml", LanguageConfig { name: "Haml", single_line_comments: &["-#"], multi_line_comments: &[] }),
    ("marko", LanguageConfig { name: "Marko", single_line_comments: &["//"], multi_line_comments: &[("<!--", "-->")] }),

    // Systems / Embedded
    ("ll", LanguageConfig { name: "LLVM IR", single_line_comments: &[";"], multi_line_comments: &[] }),
    ("l", LanguageConfig { name: "Lex", single_line_comments: &[], multi_line_comments: &[("/*", "*/")] }),
    ("y", LanguageConfig { name: "Yacc", single_line_comments: &[], multi_line_comments: &[("/*", "*/")] }),
    ("fth", LanguageConfig { name: "Forth", single_line_comments: &["\\ "], multi_line_comments: &[("(", ")")] }),
    ("4th", LanguageConfig { name: "Forth", single_line_comments: &["\\ "], multi_line_comments: &[("(", ")")] }),
    ("mips", LanguageConfig { name: "MIPS Assembly", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("odin", LanguageConfig { name: "Odin", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("bal", LanguageConfig { name: "Ballerina", single_line_comments: &["//"], multi_line_comments: &[] }),
    ("carbon", LanguageConfig { name: "Carbon", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("zon", LanguageConfig { name: "Zig Config", single_line_comments: &["//"], multi_line_comments: &[] }),
    ("beancount", LanguageConfig { name: "Beancount", single_line_comments: &[";"], multi_line_comments: &[] }),

    // Config / IaC / Metadata
    ("tfvars", LanguageConfig { name: "HCL", single_line_comments: &["#", "//"], multi_line_comments: &[("/*", "*/")] }),
    ("dhall", LanguageConfig { name: "Dhall", single_line_comments: &["--"], multi_line_comments: &[("{-", "-}")] }),
    ("cue", LanguageConfig { name: "CUE", single_line_comments: &["//"], multi_line_comments: &[] }),
    ("jsonnet", LanguageConfig { name: "Jsonnet", single_line_comments: &["//", "#"], multi_line_comments: &[("/*", "*/")] }),
    ("jsonld", LanguageConfig { name: "JSON-LD", single_line_comments: &[], multi_line_comments: &[] }),
    ("webmanifest", LanguageConfig { name: "JSON", single_line_comments: &[], multi_line_comments: &[] }),

    // Database / Query
    ("pks", LanguageConfig { name: "PL/SQL", single_line_comments: &["--"], multi_line_comments: &[("/*", "*/")] }),
    ("pkb", LanguageConfig { name: "PL/SQL", single_line_comments: &["--"], multi_line_comments: &[("/*", "*/")] }),
    ("tsql", LanguageConfig { name: "T-SQL", single_line_comments: &["--"], multi_line_comments: &[("/*", "*/")] }),
    ("cql", LanguageConfig { name: "CQL", single_line_comments: &["//"], multi_line_comments: &[] }),
    ("hql", LanguageConfig { name: "HiveQL", single_line_comments: &["--"], multi_line_comments: &[] }),
    ("prql", LanguageConfig { name: "PRQL", single_line_comments: &["#"], multi_line_comments: &[] }),

    // Markup / Docs
    ("rst", LanguageConfig { name: "reStructuredText", single_line_comments: &[".. "], multi_line_comments: &[] }),
    ("adoc", LanguageConfig { name: "AsciiDoc", single_line_comments: &["//"], multi_line_comments: &[] }),
    ("asciidoc", LanguageConfig { name: "AsciiDoc", single_line_comments: &["//"], multi_line_comments: &[] }),
    ("org", LanguageConfig { name: "Org-mode", single_line_comments: &["#"], multi_line_comments: &[] }),
    ("textile", LanguageConfig { name: "Textile", single_line_comments: &["### "], multi_line_comments: &[] }),

    // Apple / Game Dev
    ("uc", LanguageConfig { name: "UnrealScript", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("tres", LanguageConfig { name: "GDResource", single_line_comments: &[";"], multi_line_comments: &[] }),
    ("tscn", LanguageConfig { name: "GDResource", single_line_comments: &[";"], multi_line_comments: &[] }),
    ("gdshader", LanguageConfig { name: "GDShader", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("xcconfig", LanguageConfig { name: "Xcode Config", single_line_comments: &["//"], multi_line_comments: &[] }),
    ("pbxproj", LanguageConfig { name: "Xcode Project", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("storyboard", LanguageConfig { name: "XML", single_line_comments: &[], multi_line_comments: &[("<!--", "-->")] }),
    ("xib", LanguageConfig { name: "XML", single_line_comments: &[], multi_line_comments: &[("<!--", "-->")] }),
    ("plist", LanguageConfig { name: "XML", single_line_comments: &[], multi_line_comments: &[("<!--", "-->")] }),

    // Other / Scientific
    ("dats", LanguageConfig { name: "ATS", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("sats", LanguageConfig { name: "ATS", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
    ("kmp", LanguageConfig { name: "Kotlin", single_line_comments: &["//"], multi_line_comments: &[("/*", "*/")] }),
];

fn get_language_config(extension: &str) -> Option<LanguageConfig> {
    LANGUAGE_CONFIGS.iter().find(|&&(ext, _)| ext == extension).map(|&(_, config)| config)
}

fn detect_shebang_with_ext(path: &Path) -> Option<(LanguageConfig, String)> {
    use std::io::BufRead;
    let file = fs::File::open(path).ok()?;
    let mut reader = std::io::BufReader::new(file);
    let mut first_line = String::new();
    reader.read_line(&mut first_line).ok()?;
    let trimmed = first_line.trim();
    
    if trimmed.starts_with("#!") {
        let parts: Vec<&str> = trimmed[2..].split_whitespace().collect();
        if parts.is_empty() {
            return None;
        }
        
        let mut interpreter = Path::new(parts[0])
            .file_name()?
            .to_str()?;
            
        if interpreter == "env" {
            if let Some(actual_interp) = parts.iter().skip(1).find(|s| !s.starts_with('-')) {
                interpreter = actual_interp;
            }
        }
        
        let ext = match interpreter {
            "python" | "python3" | "python2" => "py",
            "node" | "nodejs" => "js",
            "bash" | "sh" | "zsh" | "ksh" | "csh" | "tcsh" | "fish" => "sh",
            "perl" => "pl",
            "ruby" => "rb",
            "awk" => "awk",
            "crystal" => "cr",
            "groovy" => "groovy",
            "php" => "php",
            "tcl" | "tclsh" => "tcl",
            "elixir" | "iex" => "ex",
            "julia" => "jl",
            "lua" => "lua",
            "dart" => "dart",
            "raku" => "raku",
            "swift" => "swift",
            _ => return None,
        };
        
        get_language_config(ext).map(|cfg| (cfg, ext.to_string()))
    } else {
        None
    }
}

fn resolve_conflicts(path: &Path, ext: &str) -> String {
    match ext {
        "m" => {
            if let Ok(content) = fs::read_to_string(path) {
                let limit = content.len().min(1000);
                let sample = &content[..limit];
                if sample.contains("#import") || sample.contains("@interface") || sample.contains("@implementation") || sample.contains("@protocol") || sample.contains("@end") || sample.contains("NSLog(") {
                    "m".to_string()
                } else if sample.contains("function") || sample.contains("%") {
                    "matlab".to_string()
                } else {
                    "m".to_string()
                }
            } else {
                "m".to_string()
            }
        }
        "v" => {
            if let Ok(content) = fs::read_to_string(path) {
                let limit = content.len().min(1000);
                let sample = &content[..limit];
                if sample.contains("Require Import") || sample.contains("Theorem") || sample.contains("Proof") || sample.contains("Qed.") || sample.contains("Lemma") {
                    "coq".to_string()
                } else if sample.contains("fn ") || sample.contains("struct ") || sample.contains("import ") {
                    "vlang".to_string()
                } else {
                    "v".to_string()
                }
            } else {
                "v".to_string()
            }
        }
        "cl" => {
            if let Ok(content) = fs::read_to_string(path) {
                let limit = content.len().min(1000);
                let sample = &content[..limit];
                if sample.contains(';') || sample.contains("(defun ") || sample.contains("(defparameter ") || sample.contains("(let ") {
                    "commonlisp".to_string()
                } else {
                    "cl".to_string()
                }
            } else {
                "cl".to_string()
            }
        }
        _ => ext.to_string(),
    }
}

fn get_file_language_config(path: &Path, custom_cfg: &config::CustomConfig) -> Option<(LanguageConfig, String)> {
    if let Some(filename) = path.file_name().and_then(|s| s.to_str()) {
        let filename_lower = filename.to_lowercase();
        let matched_ext = match filename_lower.as_str() {
            "dockerfile" => Some("dockerfile"),
            "makefile" => Some("makefile"),
            "rakefile" => Some("rb"),
            "gemfile" => Some("rb"),
            "vagrantfile" => Some("rb"),
            "jenkinsfile" => Some("groovy"),
            "cmakelists.txt" => Some("cmake"),
            ".eslintrc" | ".prettierrc" | ".babelrc" | ".nycrc" => Some("json"),
            _ => None,
        };
        if let Some(ext) = matched_ext {
            if let Some(cfg) = get_language_config(ext) {
                return Some((cfg, ext.to_string()));
            }
        }
    }

    if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
        let ext_lower = ext.to_lowercase();
        if let Some(ref custom_langs) = custom_cfg.custom_languages {
            if let Some(mapping) = custom_langs.iter().find(|m| m.extension.to_lowercase() == ext_lower) {
                return Some((make_static_config(mapping), ext_lower));
            }
        }
        let resolved_ext = resolve_conflicts(path, &ext_lower);
        get_language_config(&resolved_ext).map(|cfg| (cfg, resolved_ext))
    } else {
        detect_shebang_with_ext(path)
    }
}

fn count_lines(content: &str, config: &LanguageConfig) -> (u64, u64, u64, Vec<u64>) {
    let mut code = 0;
    let mut comments = 0;
    let mut blanks = 0;
    let mut in_multiline = false;
    let mut active_ml_end = "";
    let mut line_hashes = Vec::new();

    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            blanks += 1;
            continue;
        }

        if in_multiline {
            comments += 1;
            if !active_ml_end.is_empty() && trimmed.contains(active_ml_end) {
                in_multiline = false;
                active_ml_end = "";
            }
            continue;
        }

        let mut is_sl = false;
        for sl in config.single_line_comments {
            if !sl.is_empty() && trimmed.starts_with(sl) {
                comments += 1;
                is_sl = true;
                break;
            }
        }
        if is_sl {
            continue;
        }

        let mut is_ml_start = false;
        for &(start, end) in config.multi_line_comments {
            if !start.is_empty() && trimmed.starts_with(start) {
                comments += 1;
                is_ml_start = true;
                if !end.is_empty() && !trimmed.ends_with(end) {
                    in_multiline = true;
                    active_ml_end = end;
                }
                break;
            }
        }
        if is_ml_start {
            continue;
        }

        code += 1;
        line_hashes.push(uloc::hash_line(trimmed));
    }

    (code, comments, blanks, line_hashes)
}

fn parse_gitignore_rules(root: &Path) -> Vec<String> {
    let gitignore_path = root.join(".gitignore");
    let mut rules = vec![
        ".git".to_string(),
        "node_modules".to_string(),
        "target".to_string(),
        "build".to_string(),
        "dist".to_string(),
        ".svelte-kit".to_string(),
        ".next".to_string(),
        "out".to_string(),
        ".idea".to_string(),
        ".vscode".to_string(),
        ".gemini".to_string(),
        "Cargo.lock".to_string(),
        "package-lock.json".to_string(),
        "pnpm-lock.yaml".to_string(),
        "yarn.lock".to_string(),
        "poetry.lock".to_string(),
        "mix.lock".to_string(),
        "Gemfile.lock".to_string(),
        "composer.lock".to_string(),
        "pubspec.lock".to_string(),
    ];

    if gitignore_path.exists() {
        if let Ok(content) = fs::read_to_string(gitignore_path) {
            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.is_empty() || trimmed.starts_with('#') {
                    continue;
                }
                let cleaned = trimmed.trim_start_matches('/').trim_end_matches('/');
                if !cleaned.is_empty() {
                    rules.push(cleaned.to_string());
                }
            }
        }
    }

    let locignore_path = root.join(".locignore");
    if locignore_path.exists() {
        if let Ok(content) = fs::read_to_string(locignore_path) {
            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.is_empty() || trimmed.starts_with('#') {
                    continue;
                }
                let cleaned = trimmed.trim_start_matches('/').trim_end_matches('/');
                if !cleaned.is_empty() {
                    rules.push(cleaned.to_string());
                }
            }
        }
    }

    rules
}

struct IgnoreMatcher {
    ignore_set: GlobSet,
    allow_set: GlobSet,
}

impl IgnoreMatcher {
    fn new(rules: &[String]) -> Self {
        let mut ignore_builder = GlobSetBuilder::new();
        let mut allow_builder = GlobSetBuilder::new();
        
        for rule in rules {
            let mut r = rule.trim().replace('\\', "/");
            if r.is_empty() || r.starts_with('#') {
                continue;
            }
            
            let is_negated = r.starts_with('!');
            if is_negated {
                r = r[1..].to_string();
            }
            
            let has_slash = r.contains('/');
            let r_clean = r.trim_start_matches('/').trim_end_matches('/');
            
            let builder = if is_negated { &mut allow_builder } else { &mut ignore_builder };
            
            if !has_slash {
                if let Ok(glob) = Glob::new(r_clean) {
                    builder.add(glob);
                }
                if let Ok(glob) = Glob::new(&format!("**/{}", r_clean)) {
                    builder.add(glob);
                }
                if let Ok(glob) = Glob::new(&format!("{}/**", r_clean)) {
                    builder.add(glob);
                }
                if let Ok(glob) = Glob::new(&format!("**/{}/**", r_clean)) {
                    builder.add(glob);
                }
            } else {
                if let Ok(glob) = Glob::new(r_clean) {
                    builder.add(glob);
                }
                if let Ok(glob) = Glob::new(&format!("{}/**", r_clean)) {
                    builder.add(glob);
                }
            }
        }
        
        Self {
            ignore_set: ignore_builder.build().unwrap_or_else(|_| GlobSetBuilder::new().build().unwrap()),
            allow_set: allow_builder.build().unwrap_or_else(|_| GlobSetBuilder::new().build().unwrap()),
        }
    }
    
    fn is_ignored(&self, path_str: &str) -> bool {
        if self.allow_set.is_match(path_str) {
            return false;
        }
        self.ignore_set.is_match(path_str)
    }
}

fn should_ignore(path: &Path, root: &Path, matcher: &IgnoreMatcher) -> bool {
    let relative_path = match path.strip_prefix(root) {
        Ok(p) => p,
        Err(_) => path,
    };

    let path_str = relative_path.to_string_lossy().replace('\\', "/");
    matcher.is_ignored(&path_str)
}

pub fn scan_project_directory(root_path: &str) -> Result<ProjectSummary, String> {
    let start_time = Instant::now();
    let root = Path::new(root_path);
    if !root.exists() || !root.is_dir() {
        return Err("Target path does not exist or is not a directory".to_string());
    }

    let custom_cfg = config::load_custom_config(root);

    let mut ignore_rules = parse_gitignore_rules(root);
    if let Some(ref custom_excludes) = custom_cfg.exclude_patterns {
        for rule in custom_excludes {
            ignore_rules.push(rule.clone());
        }
    }
    
    let matcher = IgnoreMatcher::new(&ignore_rules);

    let mut files_to_scan = Vec::new();

    for entry in WalkDir::new(root).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.is_file() {
            if !should_ignore(path, root, &matcher) {
                if get_file_language_config(path, &custom_cfg).is_some() {
                    files_to_scan.push(path.to_path_buf());
                }
            }
        }
    }

    let target_stems: Vec<(String, String)> = files_to_scan
        .iter()
        .filter_map(|p| {
            let stem = p.file_stem()?.to_string_lossy().to_string();
            let relative = p.strip_prefix(root).ok()?.to_string_lossy().to_string();
            Some((stem, relative))
        })
        .collect();

    // Parallel scan using rayon
    let results: Vec<(FileInfo, Vec<(String, String)>, Vec<u64>, Vec<Annotation>, Vec<SecretFinding>)> = files_to_scan
        .par_iter()
        .filter_map(|path| {
            let relative_path = path.strip_prefix(root).ok()?.to_string_lossy().to_string();
            let name = path.file_name()?.to_string_lossy().to_string();
            let (config, extension) = get_file_language_config(path, &custom_cfg)?;

            let content = match fs::read_to_string(path) {
                Ok(c) => c,
                Err(_) => {
                    let bytes = fs::read(path).ok()?;
                    String::from_utf8_lossy(&bytes).into_owned()
                }
            };

            let size_bytes = fs::metadata(path).ok()?.len();
            
            // Core line counting logic
            let (code, comments, blanks, line_hashes) = count_lines(&content, &config);

            let complexity = analyze_complexity(&content, &extension);

            let mut file_edges = Vec::new();
            for (stem, rel_target) in &target_stems {
                if rel_target != &relative_path && stem.len() > 3 {
                    if content.contains(stem) {
                        file_edges.push((relative_path.clone(), rel_target.clone()));
                    }
                }
            }

            let file_annotations = annotations::scan_annotations(&content, &relative_path);
            let file_secrets = secrets::scan_secrets(&content, &relative_path);

            Some((
                FileInfo {
                    name,
                    path: relative_path,
                    lang: config.name.to_string(),
                    loc: code + comments + blanks,
                    code,
                    comments,
                    blanks,
                    size_bytes,
                    complexity,
                },
                file_edges,
                line_hashes,
                file_annotations,
                file_secrets,
            ))
        })
        .collect();

    let mut file_infos = Vec::new();
    let mut edges = Vec::new();
    let mut all_line_hashes = HashSet::new();
    let mut annotations = Vec::new();
    let mut secrets = Vec::new();

    for (info, mut fedges, line_hashes, file_annotations, file_secrets) in results {
        for h in line_hashes {
            all_line_hashes.insert(h);
        }
        annotations.extend(file_annotations);
        secrets.extend(file_secrets);
        file_infos.push(info);
        edges.append(&mut fedges);
    }

    // Aggregate statistics
    let mut total_code = 0;
    let mut total_comments = 0;
    let mut total_blanks = 0;
    let mut lang_groups: HashMap<String, (u32, u64, u64, u64)> = HashMap::new();
    let mut file_paths_list = Vec::new();
    
    let mut total_complexity = 0.0;
    let mut complexity_dist = vec![0u32; 10]; // 10 bins

    for f in &file_infos {
        total_code += f.code;
        total_comments += f.comments;
        total_blanks += f.blanks;
        
        let entry = lang_groups
            .entry(f.lang.clone())
            .or_insert((0, 0, 0, 0));
        entry.0 += 1; // files
        entry.1 += f.code;
        entry.2 += f.comments;
        entry.3 += f.blanks;

        file_paths_list.push(root.join(&f.path).to_string_lossy().to_string());
        total_complexity += f.complexity;

        let comp_idx = match f.complexity as u32 {
            0..=1 => 0,
            2..=3 => 1,
            4..=5 => 2,
            6..=7 => 3,
            8..=9 => 4,
            10..=12 => 5,
            13..=15 => 6,
            16..=18 => 7,
            19..=20 => 8,
            _ => 9,
        };
        complexity_dist[comp_idx] += 1;
    }

    let total_loc = total_code + total_comments + total_blanks;
    let mut languages: Vec<LanguageStats> = lang_groups
        .into_iter()
        .map(|(name, (files, code, comments, blanks))| {
            let pct = if total_loc > 0 {
                ((code + comments + blanks) as f64 / total_loc as f64) * 100.0
            } else {
                0.0
            };
            LanguageStats { name, files, code, comments, blanks, pct }
        })
        .collect();

    languages.sort_by(|a, b| (b.code + b.comments + b.blanks).cmp(&(a.code + a.comments + a.blanks)));

    // Duplicate detection
    let (duplicates, duplicate_groups) = find_duplicates(&file_paths_list);

    let relative_duplicate_groups = duplicate_groups
        .into_iter()
        .map(|group| {
            group
                .into_iter()
                .filter_map(|abs_path| {
                    Path::new(&abs_path)
                        .strip_prefix(root)
                        .ok()
                        .map(|p| p.to_string_lossy().to_string())
                })
                .collect()
        })
        .collect();

    let average_complexity = if !file_infos.is_empty() {
        total_complexity / file_infos.len() as f64
    } else {
        1.0
    };

    let uloc_count = all_line_hashes.len() as u64;
    let dryness = uloc::calculate_dryness(total_code, uloc_count);
    let role_distribution = roles::calculate_role_distribution(&file_infos);

    let git_stats = git::analyze_git(root);
    let git_available = git_stats.is_some();
    let (file_churn, top_contributors) = git_stats.unwrap_or_else(|| (Vec::new(), Vec::new()));

    let tech_stack = techstack::detect_tech_stack(root);

    let scan_duration_ms = start_time.elapsed().as_millis() as u64;

    Ok(ProjectSummary {
        path: root_path.to_string(),
        total_files: file_infos.len() as u32,
        total_languages: languages.len() as u32,
        total_code,
        total_comments,
        total_blanks,
        total_loc,
        languages,
        files: file_infos,
        duplicates,
        duplicate_groups: relative_duplicate_groups,
        average_complexity: (average_complexity * 10.0).round() / 10.0,
        complexity_dist,
        edges,
        scan_duration_ms,

        // New fields
        uloc: uloc_count,
        dryness,
        role_distribution,
        annotations,
        secrets,
        git_available,
        file_churn,
        top_contributors,
        tech_stack,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_count_lines_rust() {
        let content = "
            // Rust program
            fn main() {
                /* multiline
                   comment */
                println!(\"Hello World!\");
            }
        ";
        let config = get_language_config("rs").unwrap();
        let (code, comments, blanks, _) = count_lines(content, &config);
        assert_eq!(code, 3);
        assert_eq!(comments, 3);
        assert_eq!(blanks, 2);
    }

    #[test]
    fn test_count_lines_python() {
        let content = "
            # Python script
            def add(a, b):
                \"\"\"Add two
                   numbers\"\"\"
                return a + b
        ";
        let config = get_language_config("py").unwrap();
        let (code, comments, blanks, _) = count_lines(content, &config);
        assert_eq!(code, 2);
        assert_eq!(comments, 3);
        assert_eq!(blanks, 2);
    }

    #[test]
    fn test_shebang_detection() {
        use std::io::Write;
        let dir = std::env::temp_dir();
        let py_path = dir.join("test_script_py");
        {
            let mut file = std::fs::File::create(&py_path).unwrap();
            writeln!(file, "#!/usr/bin/env python3").unwrap();
            writeln!(file, "print('Hello')").unwrap();
        }
        let (config, ext) = detect_shebang_with_ext(&py_path).unwrap();
        assert_eq!(config.name, "Python");
        assert_eq!(ext, "py");
        let _ = std::fs::remove_file(&py_path);

        let sh_path = dir.join("test_script_sh");
        {
            let mut file = std::fs::File::create(&sh_path).unwrap();
            writeln!(file, "#!/bin/bash").unwrap();
            writeln!(file, "echo Hello").unwrap();
        }
        let (config_sh, ext_sh) = detect_shebang_with_ext(&sh_path).unwrap();
        assert_eq!(config_sh.name, "Shell");
        assert_eq!(ext_sh, "sh");
        let _ = std::fs::remove_file(&sh_path);
    }
}


