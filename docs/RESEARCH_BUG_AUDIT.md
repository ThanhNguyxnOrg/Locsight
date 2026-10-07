# Locsight Codebase Research & Bug Audit Report

**Date:** 2026-10-07  
**Repository:** [Locsight](https://github.com/ThanhNguyxnOrg/Locsight)  
**Authors:** Antigravity Pair Programming & Research Subagent  
**Scope:** Full-stack inspection of Tauri v2 backend engine, frontend analytics, release pipelines, and dependency trees.

---

## 1. Executive Summary

This research report documents the systematic audit and resolution of runtime bugs, performance bottlenecks, and edge cases discovered across the Locsight codebase. All identified vulnerabilities and flaws have been remediated, verified against unit tests, and validated in CI.

---

## 2. Detailed Findings & Primary Source Verification

### Finding 1: Tauri Ecosystem Dependency Mismatch (CI Build Blocker)
- **Primary Source:** [package.json](file:///d:/Code/Locsight/package.json), [src-tauri/Cargo.toml](file:///d:/Code/Locsight/src-tauri/Cargo.toml), GitHub Actions Run `37226858930`
- **Mechanism:** Dependabot upgraded `@tauri-apps/api` to `2.12.1`, but `src-tauri/Cargo.toml` remained on unpinned `tauri = "^2.0.0"`. Discrepancies between JavaScript bindings and Rust Tauri FFI interfaces caused compilation errors and breakage in CI builds.
- **Resolution:** Synchronized `@tauri-apps/api@~2.12.1`, `@tauri-apps/plugin-dialog@~2.8.1`, `@tauri-apps/plugin-opener@~2.7.0`, `@tauri-apps/cli@~2.12.1` in `package.json` with `tauri = "~2.12.1"`, `tauri-plugin-dialog = "~2.8.1"`, `tauri-plugin-opener = "~2.7.0"`, and `tauri-build = "2"` in `Cargo.toml`.

---

### Finding 2: Release Workflow Tag Drift
- **Primary Source:** [.github/workflows/release.yml](file:///d:/Code/Locsight/.github/workflows/release.yml#L55)
- **Mechanism:** The `build-tauri` job in `release.yml` used `actions/checkout@v7` without specifying a `ref`. As a result, the runner checked out `GITHUB_SHA` (the commit before release tagging) instead of the tagged commit created by `create-release`. Artifacts built and packaged contained stale versions.
- **Resolution:** Added `with: ref: ${{ needs.create-release.outputs.tag }}` and migrated `npm install` to `npm ci` for deterministic dependency resolution.

---

### Finding 3: Multi-line Comment Poisoning in LOC Counter
- **Primary Source:** [src-tauri/src/engine/scanner.rs](file:///d:/Code/Locsight/src-tauri/src/engine/scanner.rs#L330-L350)
- **Mechanism:** In `count_lines`, multi-line comment entry was checked via `if !end.is_empty() && !trimmed.ends_with(end)`. On single-line statements containing inline comments followed by code (e.g. `/* comment */ let x = 1;`), `!trimmed.ends_with("*/")` evaluated to `true`, setting `in_multiline = true` and permanently treating all subsequent lines of code in the file as comments.
- **Resolution:** Changed condition to `!end.is_empty() && !trimmed[start.len()..].contains(end)`, ensuring that inline comments terminating on the same line never set `in_multiline = true`. Added unit test `test_count_lines_multiline_inline`.

---

### Finding 4: Gitignore Trailing Slash & Subtree Traversal Inefficiency
- **Primary Source:** [src-tauri/src/engine/scanner.rs](file:///d:/Code/Locsight/src-tauri/src/engine/scanner.rs#L420-L470)
- **Mechanism:**
  1. Evaluating `r.contains('/')` before `trim_end_matches('/')` caused rules like `build/` or `dist/` to be treated as anchored root paths (`has_slash = true`), preventing glob generation of `**/build/**`.
  2. `WalkDir::new(root)` lacked `.filter_entry()`, descending into hundreds of thousands of files inside ignored folders (`node_modules`, `.git`, `target`) before discarding them individually.
- **Resolution:**
  1. Cleaned trailing slashes prior to computing `has_slash` and preserved unrooted globs (`builder.add(Glob::new(&format!("**/{}/**", r_clean)))`).
  2. Added `.filter_entry(|entry| !should_ignore(entry.path(), root, &matcher))` on `WalkDir` to prune ignored directories instantly at the root level. Added unit test `test_ignore_matcher_trailing_slash`.

---

### Finding 5: Heap Leak via Dynamic Static Leaking
- **Primary Source:** [src-tauri/src/engine/scanner.rs](file:///d:/Code/Locsight/src-tauri/src/engine/scanner.rs#L30-L55)
- **Mechanism:** `get_file_language_config` called `make_static_config` using `Box::leak` on every single file matching a custom language config. In projects with thousands of files, this leaked strings and slices continuously on the heap.
- **Resolution:** Precompiled custom language configurations into a `HashMap<String, LanguageConfig>` once per scan and passed references to file scanner workers.

---

### Finding 6: Unbounded Git Log Execution in Git Engine
- **Primary Source:** [src-tauri/src/engine/git.rs](file:///d:/Code/Locsight/src-tauri/src/engine/git.rs#L50-L105)
- **Mechanism:** Git churn, authorship, and change coupling commands ran `git log` with no history limits. In repositories with tens of thousands of commits, this blocked UI scans for tens of seconds and caused excessive memory allocation.
- **Resolution:** Added `"-n", "1000"` to churn, author, and change coupling commands to bound execution time to recent commits.

---

### Finding 7: Path Extension Parsing Vulnerability in Report Exporter
- **Primary Source:** [src-tauri/src/commands/export.rs](file:///d:/Code/Locsight/src-tauri/src/commands/export.rs#L50-L105)
- **Mechanism:** Files were checked using `f.path.split('.').last()`. For files without extensions (e.g. `Makefile`, `Dockerfile`, `LICENSE`), this returned the entire filename, causing false positive category exclusions.
- **Resolution:** Replaced with standard `Path::new(&f.path).extension().and_then(|s| s.to_str())`.

---

### Finding 8: False Positive Test Role Classification
- **Primary Source:** [src-tauri/src/engine/roles.rs](file:///d:/Code/Locsight/src-tauri/src/engine/roles.rs#L15-L26)
- **Mechanism:** `lower_path.contains("test")` flagged production files containing substrings such as `latest.ts`, `contest.rs`, or `attestation.go` as `test` role.
- **Resolution:** Replaced substring match with directory component check (`test`, `tests`, `__tests__`, `spec`, `specs`) and file prefix/suffix patterns. Added unit test `test_classify_role`.

---

### Finding 9: Technology Stack Parser Omissions
- **Primary Source:** [src-tauri/src/engine/techstack.rs](file:///d:/Code/Locsight/src-tauri/src/engine/techstack.rs#L165-L205)
- **Mechanism:**
  1. `go.mod` parser only checked lines starting with `"require"`, missing all multi-line `require (...)` blocks where almost all real Go dependencies reside.
  2. `requirements.txt` parser only checked lines matching version delimiters (`=`, `>`, `<`, `~`), missing unpinned dependencies like `flask`, `requests`, or `numpy`.
- **Resolution:** Implemented multi-line `require (...)` parsing in `go.mod` and fallback unpinned dependency extraction in `requirements.txt`.

---

### Finding 10: Circular Dependency Cycle Traversal Safeguard
- **Primary Source:** [src-tauri/src/engine/architecture.rs](file:///d:/Code/Locsight/src-tauri/src/engine/architecture.rs#L70-L105)
- **Mechanism:** Dense dependency graphs with complex circular cross-references could cause long DFS exploration times.
- **Resolution:** Added a defense-in-depth cycle count cap (`cycles.len() >= 100`) to guarantee deterministic scan completion times.

---

### Finding 11: Raw String Literal Delimiter Collisions in Tests
- **Primary Source:** [src-tauri/src/engine/config.rs](file:///d:/Code/Locsight/src-tauri/src/engine/config.rs#L50-L75)
- **Mechanism:** Unit tests used `r#"{ ... }"#` raw string literals containing single-line comment definition `["#"]`. The closing `"#` sequence inside JSON prematurely terminated Rust's raw string literal, resulting in compiler syntax errors.
- **Resolution:** Migrated test JSON blocks to double-hash raw string literals `r##"{ ... }"##`.

---

### Finding 12: Multi-byte UTF-8 Slicing Panic in Conflict Resolution & Annotations
- **Primary Source:** [src-tauri/src/engine/scanner.rs](file:///d:/Code/Locsight/src-tauri/src/engine/scanner.rs#L108-L270), [annotations.rs](file:///d:/Code/Locsight/src-tauri/src/engine/annotations.rs#L30-L40), [secrets.rs](file:///d:/Code/Locsight/src-tauri/src/engine/secrets.rs#L73-L85)
- **Mechanism:** Slicing arbitrary text by byte offset (`&content[..limit]`, `&message[..120]`, `&secret[..4]`) panics with `byte index is not a char boundary` if the cutoff index splits a multi-byte Unicode codepoint (Vietnamese, CJK characters, emojis, accented comments).
- **Resolution:** Introduced zero-allocation `safe_sample` and `is_char_boundary` verification routines to step backwards/forwards to valid Unicode scalar boundaries before slicing.

---

### Finding 13: 1000x Inflation in COCOMO Cost Estimation
- **Primary Source:** [src/hooks/useAnalysis.tsx](file:///d:/Code/Locsight/src/hooks/useAnalysis.tsx#L140-L165), [src/components/Dashboard.tsx](file:///d:/Code/Locsight/src/components/Dashboard.tsx#L155-L165)
- **Mechanism:** The COCOMO formula calculates effort in person-months, multiplied by monthly engineer salary in USD (defaulted to $2,400). However, frontend state calculations and FFI invocation multiplied `cocomoRate` by `1000.0`, resulting in a $2.4 Million/month baseline and an artificial 1,000x cost estimate.
- **Resolution:** Corrected calculation to `effort * cocomoRate` across both Tauri IPC and offline fallback paths, and updated UI unit labels to USD.

---

### Finding 14: Subdirectory `src-tauri/Cargo.toml` Detection in Tech Stack Analyzer
- **Primary Source:** [src-tauri/src/engine/techstack.rs](file:///d:/Code/Locsight/src-tauri/src/engine/techstack.rs#L115-L130)
- **Mechanism:** Scanning the root directory of Tauri applications failed to detect Rust or backend dependencies because `Cargo.toml` resides in `src-tauri/Cargo.toml` rather than the workspace root.
- **Resolution:** Extended tech stack engine to inspect `src-tauri/Cargo.toml` when root `Cargo.toml` is absent.

---

### Finding 15: Shifted Cycle De-duplication Failure in Architecture Engine
- **Primary Source:** [src-tauri/src/engine/architecture.rs](file:///d:/Code/Locsight/src-tauri/src/engine/architecture.rs#L115-L144)
- **Mechanism:** Closed cycle paths recorded in `detect_circular_dependencies` have the starting node appended at the end (e.g. `[A, B, C, A]`). De-duplication attempted rotation by calling `shifted.rotate_left(1)`, which produced `[B, C, A, A]` instead of the valid cyclic permutation `[B, C, A, B]`. As a result, cyclic shifts of the same underlying cycle never matched and were erroneously reported as separate duplicates.
- **Resolution:** Implemented canonical cycle rotation over `&cycle[..cycle.len() - 1]` to align the lexicographically minimum node at index 0, followed by closing with the first node and tracking in `HashSet`.

---

### Finding 16: Duplicate Group Size Filtering Inconsistency in Scanner
- **Primary Source:** [src-tauri/src/engine/scanner.rs](file:///d:/Code/Locsight/src-tauri/src/engine/scanner.rs#L750-L770)
- **Mechanism:** After relative path transformation via `filter_map`, groups could theoretically shrink below 2 elements, and `duplicates` count retained the raw count rather than the actual number of relative duplicate files.
- **Resolution:** Added `.filter(|g| g.len() > 1)` to `relative_duplicate_groups` and re-summed `duplicates` dynamically from filtered groups.
