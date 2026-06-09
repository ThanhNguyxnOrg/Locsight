# 📋 Changelog

All notable changes to **Locsight** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] — 2026-06-09

### 🚀 500+ Languages, 1000+ Tech Stack & Data-Driven Architecture: v1.2.0

This release brings a complete backend architecture overhaul, shifting from hardcoded compile-time structures to a modern data-driven registry driven by TOML configurations and compile-time code generation. In addition, we expanded language support to over 500 languages, integrated recognition for over 1000 tech stack elements, and introduced a professional test suite with automated validation scripts.

#### ⚙️ Data-Driven Architecture & Codegen
- **TOML Registry**: Migrated language and tech stack mappings to `languages.toml` and `techstack.toml` inside the Rust backend, making definitions fully declarative and easy to extend.
- **Compile-Time Codegen**: Implemented a Rust `build.rs` script that parses TOML data at compile time and generates static structures in `$OUT_DIR/languages_gen.rs` and `$OUT_DIR/techstack_gen.rs`, achieving zero runtime overhead.

#### 📁 500+ Languages & Conflict Resolutions
- **500+ Language Definitions**: Expanded language database using Tokei and scc as references, supporting over 500 programming languages, markup languages, smart contracts, data configurations, and esoteric systems.
- **Enhanced Heuristics**: Added content-based conflict resolution and shebang detection for additional file extensions (including `.pro`, `.fs`, `.mod`, `.pp`, `.inc`, `.r`, etc.).

#### 🔍 1000+ Tech Stack recognition
- **1000+ Ecosystem Mappings**: Expanded dependencies and file-based detectors to support over 1000 libraries, frameworks, tools, and platforms across JavaScript/TypeScript, Python, Rust, Go, Java/Kotlin/Scala, PHP, Ruby, .NET, Swift/iOS, Dart/Flutter, Elixir, and new systems like Zig, Nim, OCaml, and Clojure.
- **File-based Detectors**: Extends detection rules to popular DevOps tools, environment configs, package lockfiles, and testing frameworks.

#### 🧪 Professional Test Suite & CI Validation
- **Integration Tests**: Added a complete Rust integration test suite in `tests/scanner_tests.rs` asserting minimum counts, duplicate extensions verification, shebang matching, conflict resolutions, and tech stack detection.
- **Registry Validator**: Developed a Node-based CLI validation script `scripts/validate-languages.cjs` to automatically verify schema syntax and registry constraints in CI/CD pipelines.

---

## [1.1.0] — 2026-06-09

### 🚀 Issue Reporter, 160+ Languages, 220+ Tech Stack Detections & Ignore Configurations: v1.1.0

This release marks a massive upgrade to **Locsight**, bringing a dedicated GitHub Issue Reporter, expanding scanner capabilities with support for over 160 languages (including smart contracts, scientific computation, and functional languages), integrating over 220 tech stack libraries/frameworks, enabling pre-scan ignore rule configurations with glob matching, and resolving CI/CD release pipeline artifacts.

#### 🐛 Issue Reporter (UI)
- **Sidebar Integration**: Added a prominent, style-curated `Bug` icon button in the sidebar above the version tag, featuring custom micro-animation hover scales and subtle orange highlights.
- **One-click URL Launcher**: Clicking the reporter uses the Tauri v2 `opener` plugin to open a pre-filled GitHub issue window (`https://github.com/ThanhNguyxnOrg/Locsight/issues/new`) in the user's default browser.

#### 📁 Ignore Rules & Folder Picker (Pre-scan configuration)
- **Pre-scan Ignore Configuration**: When selecting a new folder or clicking recent projects, users are prompted with a scan configuration screen to configure ignore rules rather than scanning immediately.
- **Import from `.gitignore`**: Added a one-click button to import and append rules from the directory's `.gitignore` file into the editor.
- **Exclusion Glob Matching**: Replaced substring checking in directory walker with proper Rust `globset` matching supporting recursive wildcards (`**`), single wildcards (`*`), and negation patterns (`!`).
- **Enhanced Gutter Editor**: Added a scroll-synced line-number gutter and quick presets (`node_modules/`, `dist/`, `build/`, `*.log`, `.env*`, `coverage/`) in the Settings tab.

#### ⚙️ Language Engine Expansion (160+ Languages)
- **28+ New Configurations**: Extends scanner's language support to data/scientific (R, SAS, Stata, SPSS, Fortran 2008), smart contracts (Vyper, Cairo, Move), functional/proofs (F*, Lean, Isabelle), templates/markup (Mustache, Mermaid), query/config (SPARQL, Cypher, HOCON, CSV), and more (Pike, Pawn, Expect, Godot GDShaderinc) – total of 160+ supported languages.
- **Intelligent Octave Heuristics**: Added deep conflict heuristics resolving `.m` files, distinguishing between Objective-C, MATLAB, and GNU Octave based on specific keywords (e.g. `pkg load`, `#{`).
- **Conflict Heuristics for Extension Clashes**: Added heuristics to intelligently resolve extension conflicts for `.m` (Objective-C vs MATLAB vs Octave), `.v` (Verilog vs V vs Coq), and `.cl` (Common Lisp vs OpenCL).
- **Additional Shebang Resolvers**: Support for shebang interpreters for `Rscript`, `expect`, and `pike`.

#### 🔍 Extended Tech Stack Detection (220+ Mappings)
- **AI/ML Ecosystem**: Integrated detection for HuggingFace Transformers, OpenAI, LangChain, LlamaIndex, Anthropic, Keras, XGBoost, LightGBM, MLflow, and Weights & Biases.
- **Frontend & Backend Mappings**: Detects Qwik, Remix, Gatsby, Eleventy, htmx, Alpine.js, Lit, Stencil, Hono, Elysia, AdonisJS, Sails, and LoopBack.
- **Database & Testing**: Detects Drizzle ORM, Knex, MikroORM, Objection.js, Bookshelf.js, pg, mysql2, mongodb, Mocha, Chai, Ava, Tap, Supertest, MSW, Storybook, and Testing Library.
- **Mobile & Monorepo**: Detects NativeScript, Microsoft MAUI (parsing `.csproj`), Kotlin Multiplatform (parsing `.gradle`), and Monorepo frameworks (Rush, Bazel, Pants, Moon).
- **Environment & Infra**: Added file-based detectors for Bun (`bun.lockb`), Deno (`deno.json`), Heroku (`Procfile`), Vercel (`vercel.json`), Netlify (`netlify.toml`), Fly.io (`fly.toml`), Render (`render.yaml`), Railway (`railway.json`), Taskfile (`Taskfile.yml`), Justfile (`justfile`), Make (`Makefile`), EditorConfig (`.editorconfig`), Pre-commit (`.pre-commit-config.yaml`), Husky (`.husky`), Caddy (`Caddyfile`), Traefik (`traefik.yml`), Envoy (`envoy.yaml`), and HAProxy (`haproxy.cfg`).
- **8 New Ecosystem Package Parsers**: Built new parsers for Java Maven (`pom.xml`), Java Gradle (`build.gradle`), Ruby (`Gemfile`), .NET (`*.csproj`), Swift Package (`Package.swift`), Dart/Flutter (`pubspec.yaml`), Elixir (`mix.exs`), and Python Poetry (`pyproject.toml`).
- **CI/CD & DevOps Detection**: Added automatic discovery for GitLab CI, Jenkins, CircleCI, Azure Pipelines, Terraform, Kubernetes, Nginx, Turborepo, Nx, Lerna, and pnpm workspaces.

#### 🎨 User Experience (UX Polish)
- **Dynamic Tooltips**: Keybinding tooltips dynamically adapt to the client Operating System (displaying `⌘` for macOS and `Ctrl+` for Windows/Linux).
- **Global Keybindings**: Added handlers for screen switching tabs (`Ctrl/Cmd + 1` through `8`) and folder picking (`Ctrl/Cmd + Shift + O`).
- **Folder Confirmation Dialog**: Guard rail alert added to prevent accidental data loss when switching active folders.
- **Welcome App Logo**: Replaced the square CSS-simulated shape with the actual `/logo.png` image on the welcome screen.

#### 📦 Artifact Packaging & Tauri Build
- **Clean Output Filenames (Version-Free Installer)**: Automatically strips version strings from build output installers (e.g. `Locsight_x64-setup.exe` instead of `Locsight_1.1.0_x64-setup.exe`), enabling persistent download paths.
- **Tauri Wrapper Proxy**: Implemented a Node-based wrapper script for `tauri build` that intercept and executes renaming processes both locally and on CI/CD GitHub Actions workflow.
- **CI Environment Resiliency**: Optimized `tauri-wrapper.cjs` to detect CI environments (`process.env.CI`) and skip renaming during automated workflows, ensuring GitHub Actions Release runner (`tauri-action`) successfully publishes Linux/Windows/macOS artifacts.

---

## [1.0.0] — 2026-06-08

### 🎉 Initial Production Release: v1.0.0

This release marks the initial stable launch of **Locsight** (formerly Codebase Analyzer), a next-generation local code visualization, metrics calculation, and structural discovery application built on a highly optimized Rust engine and modern React frontend.

#### ⚙️ Core Architecture & Engine
- **High-Performance Rust Scanner**: Fully parallelized directory walker utilizing `rayon` for work-stealing thread scheduling and `ignore` for glob-pattern `.gitignore` matching. Scans over 10,000 source files per second under local environments.
- **Tauri v2 Security Sandbox**: Designed around the least-privilege security architecture of Tauri v2, explicitly configuring scoping mechanisms for directory operations and native system dialog accesses.
- **Dynamic Platform Titlebars**: Custom user-interface window frame elements detecting platform type on startup:
  - **macOS**: Left-aligned traffic lights (Red/Yellow/Green) with reactive micro-icon visibility.
  - **Windows**: Right-aligned, edge-to-edge sharp controls mapping Windows 11 Fluent design behaviors (red-out hover states).
  - **Linux**: Clean, circular GTK-inspired title controls matching Gnome desktop metrics.

#### ✨ Features
- 📊 **Metric Dashboard**:
  - Raw Lines of Code (LOC) counter separating comments, code, and blanks.
  - Interactive file percentage distribution charts.
  - COCOMO II effort and cost estimation models based on project type parameters.
- 📁 **File Explorer & Treemap**:
  - Responsive directory hierarchy renderer displaying metrics at each node level.
  - Custom React squarified Treemap visualization using D3-hierarchy layout algorithm.
- 🕸️ **Dependency Graph**:
  - High-performance Canvas-rendered force-directed graph modeling file imports and modular coupling.
  - Implements real-time canvas pan, zoom, custom node searching, and isolation filters.
- 🫀 **Health Inspector & Secrets Scan**:
  - Structural analysis assessing code comment ratios, complexity grading, and documentation metrics.
  - Active regex-pattern and entropy-based Secrets Scanner detecting API Keys, private keys, database connections, and credentials, automatically masking sensitive contents.
  - Built-in annotations parser capturing `TODO`, `FIXME`, `HACK`, `BUG`, and `DEPRECATED` tags.
- 🔥 **Git Hotspots**:
  - Churn and complexity coordinate maps identifying high-churn risk areas.
  - Local commit and contributor metadata parsed directly from git histories.
- 📄 **Export Center**:
  - HTML, Markdown, JSON, and CSV report generator for standard compliance and audits.

#### 🚀 Release & Action Pipeline
- **Auto-build Matrix**: Structured Github Actions workflow building binaries across 6 compiler targets:
  - `x86_64-pc-windows-msvc` (Windows x64)
  - `aarch64-pc-windows-msvc` (Windows ARM64)
  - `x86_64-apple-darwin` (macOS Intel)
  - `aarch64-apple-darwin` (macOS Apple Silicon)
  - `x86_64-unknown-linux-gnu` (Linux DEB/AppImage x64)
  - `aarch64-unknown-linux-gnu` (Linux DEB/AppImage ARM64)
- **Automatic Changelog Extraction**: Automatically compiles release notes from `CHANGELOG.md` upon pushing `release: v*` tags.
