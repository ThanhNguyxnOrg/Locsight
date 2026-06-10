# 📋 Changelog

All notable changes to **Locsight** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] — 2026-06-09

### 🚀 Living Architecture & C4 Model Visualization: v2.1.0

This release introduces the **Living Architecture Engine (v2.1.0)**, porting advanced modular dependency metrics, structure validation, and C4 Model analysis capabilities from ArchPulse. It also features a fully interactive Graph layout toggle, collapsible metadata sidepanels, full-width circular dependency logs, and normalized Windows-to-Unix paths in all exports.

#### 🕸️ Living Architecture Engine & C4 Model (Graph Tab)
- **C4 Model Architecture Levels**: Added a premium-styled view mode selector for C4 hierarchy levels:
  - `System`: View the codebase as a single monolithic block.
  - `Container`: View grouped items at the root directory level.
  - `Component`: View grouped items at the immediate parent folder level.
  - `File`: View the detailed fine-grained structure at the file level.
- **Hierarchical Layout Algorithm**: Implemented a Bellman-Ford topological layout engine that calculates dependency levels and automatically stacks files vertically from parent callers to child helpers, centering rows and wrapping nodes dynamically when a layer has more than 5 nodes.
- **Card-Style Graph Nodes**: Replaced simple circles with rich rectangular Card nodes in Hierarchical mode. Cards feature dynamic directory-based HSL colored borders, SVG file/folder icons, and subtext detailing `Language` and `Lines of Code (LOC)`.
- **Cubic Bezier Connection Paths**: Configured smooth S-curve edges connecting the bottom of caller nodes directly to the top of dependency nodes.
- **Layout Style Toggle Control**: Added a segmented control toolbar to switch between `HIERARCHICAL` (top-down dependency hierarchy) and `CLUSTER` (force-directed radial view) layouts.
- **Interactive Blast Radius & Navigation**: Highlights transitive upstream and downstream dependencies recursively on node click with BFS, fading unrelated nodes, while calculating the Blast Radius project impact percentage. Includes direct clicking from side lists to jump and center focus onto target nodes.
- **Expanded Zoom & View Reset**: Nosedived minimum zoom levels to `0.05` for massive codebase overviews and raised maximum zoom levels to `5.0`. Added a new Reset View button (compass icon) to immediately reset scale and translation vectors to defaults.
- **Collapsible Detail Panel**: Equipped the selected file info card with Collapse/Expand (`Minimize2`/`Maximize2`) actions to shrink the panel into a compact bar, alongside a Close (`X`) action to clear selection.

#### 🫀 Codebase Health & Dependency Loops (Health Tab)
- **Full-Width Circular Dependency Log**: Redesigned the Circular Dependency Warning section in the Health tab from a split side-by-side format into a unified vertical stack (`flex-col`), giving cycle path logs 100% viewport width.
- **Refined Cycle Path View**: Set log monospace text size to `11px`, added borders between cycle lines, and split path elements cleanly using cross-platform slash regexes.

#### 📁 Normalized Exports & Asset Icons
- **Unix Path Normalization**: Normalized all exported paths to Unix slashes `/` during Mermaid, Draw.io, and Structurizr exports, resolving key lookup issues in Bellman-Ford layering and correcting overlapping boxes or infinite connector lines in Diagrams.net.
- **Config Asset Classification**: Mapped the `"config"` subcategory to the `Boxes` icon in the Assets tab, properly representing Unity `.prefab`, `.unity`, Godot `.tscn`, `.import`, and Unreal `.uproject` files.

---

## [2.0.0] — 2026-06-09

### 🚀 Asset Intelligence Engine & Customization: v2.0.0

This major release introduces the **Asset Intelligence Engine (v2.0.0)**, expanding Locsight's codebase analysis to non-code assets (multimedia, 3D/game engines, CAD drawing files, documents, fonts, archives, and databases). It also integrates Game Engines and CAD tools into the Locsight Tech Stack detection system, adds GDScript support, modularizes the unit test suite, and adds **Dashboard & Export View Toggles** to customize report visualization.

#### 🎨 Dashboard & Export Customization
- **Dashboard View Toggles**: Added a premium-styled Toolbar to turn on/off specific report sections (*Code Analysis*, *Multimedia*, *Game & 3D*, *CAD Drawings*, and *Documents*).
- **Global Settings Synchronization**: Embedded visibility settings inside the global application context, syncing switches between Dashboard View Toolbar and Export Dialog Checkboxes.
- **LocalStorage Persistence**: Auto-saves customize state to local storage, keeping user choices persistent across reloads.
- **Dedicated Asset Panels**: Renders clean, standalone statistic cards on the Dashboard representing file counts, size summaries, and hints for each enabled category.
- **Dynamic Stats Recalculation**: Recalculates all high-level dashboard metrics (`LINES OF CODE`, `FILES`, `LANGUAGES`), complexity indices, COCOMO estimation parameters, and code duplicates in real-time according to filter states.
- **Synchronized Report Export**: Recalculates metrics, filters asset reports, and filters duplicate groups dynamically at the backend when downloading HTML, MD, CSV, or JSON reports, ensuring a 100% match with the dashboard.

#### 📦 Asset Intelligence Engine
- **Non-code Asset Discovery**: Scans, lists, and classifies all non-code assets in parallel using Rayon.
- **Deep Metadata Parsing**: Automatically parses PNG and JPEG byte headers to extract image dimensions.
- **Dependency Relations & Graph**: Identifies references between assets (e.g. textures in Godot `.tscn` scenes or AutoCAD DXF Xrefs) to build an interactive relations tree.
- **Orphan Asset Scan**: Detects unused/unreferenced files in the codebase (excluding assets cross-referenced by other assets).
- **Optimization Suggestions**: Detects oversized images (>5MB) and uncompressed audio (>10MB WAV) and provides size savings estimations.

#### ⚙️ Game Engine & CAD Tech Stack Detections
- **Unity**: Detected via `ProjectSettings/ProjectVersion.txt` at the project root.
- **Godot**: Detected via `project.godot` at the project root.
- **Unreal Engine**: Detected via any `.uproject` file found at the project root.
- **CAD Drawings**: Detected via `.dwg`, `.dxf`, `.step`, `.stp`, `.iges`, or `.igs` files found at the project root.
- **Blender**: Detected via `.blend` files found at the project root.
- **Icon Mappings**: Configured dedicated icons for game engines and design tools on the dashboard.

#### 📁 GDScript Support
- **Godot Scripting**: Added support for `.gd` (GDScript) files in the language registry with line/comment counting.

#### 🧪 Test Separation & Automated README
- **Separated Test Suite**: Split the monolithic asset test into dedicated files: `asset_multimedia_tests.rs`, `asset_game_tests.rs`, `asset_cad_tests.rs`, `asset_other_tests.rs`, and `techstack_game_cad_tests.rs`.
- **Dynamic README stats**: Implemented automatic placeholders in `README.md` that are dynamically updated with the exact language count (currently 547) during compilation.
- **Export Test Cases**: Added automated unit tests `export_tests.rs` to verify dynamic calculations when exporting reports (full options, exclude code, and exclude multimedia scenarios).

#### 🔄 Update Checker
- **Check for Updates Settings**: Integrated a client-side update checker in Settings that queries the public GitHub Releases API for the latest version and redirects the user to download the update.

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
