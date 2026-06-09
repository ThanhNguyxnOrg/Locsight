# 📋 Changelog

All notable changes to **Locsight** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] — 2026-06-09

### 🚀 Comprehensive Upgrades & Enhancements: v1.1.0

This release introduces powerful new features for tech stack detection, directory scanning exclusion configurations, pre-scan ignore rule editors, and automated deployment pipeline improvements.

#### 📁 Ignore Rules & Folder Picker (Pre-scan configuration)
- **Pre-scan ignore configuration**: When selecting a new folder or clicking recent projects, users are prompted with a scan configuration screen to configure ignore rules rather than scanning immediately.
- **Import from `.gitignore`**: Added a one-click button to import and append rules from the directory's `.gitignore` file into the editor.
- **Exclusion Glob Matching**: Replaced substring checking in directory walker with proper Rust `globset` matching supporting recursive wildcards (`**`), single wildcards (`*`), and negation patterns (`!`).
- **Enhanced Gutter Editor**: Added a scroll-synced line-number gutter and quick presets (`node_modules/`, `dist/`, `build/`, `*.log`, `.env*`, `coverage/`) in the Settings tab.

#### ⚙️ Language Engine & Tech Stack Detection
- **Over 180 Technologies**: Expands scanning capabilities to detect backend libraries, state management, validation libraries, databases, ORMs, CMS, etc.
- **8 New Ecosystem Package Parsers**: Built new parsers for Java Maven (`pom.xml`), Java Gradle (`build.gradle`), Ruby (`Gemfile`), .NET (`*.csproj`), Swift Package (`Package.swift`), Dart/Flutter (`pubspec.yaml`), Elixir (`mix.exs`), and Python Poetry (`pyproject.toml`).
- **CI/CD & DevOps detection**: Added automatic discovery for GitLab CI, Jenkins, CircleCI, Azure Pipelines, Terraform, Kubernetes, Nginx, Turborepo, Nx, Lerna, and pnpm workspaces.
- **Language config expansion**: Added support for functional, legacy, game development, scripting, and configuration markup languages, supporting over 130+ languages.
- **Conflict Heuristics**: Added heuristics to intelligently resolve extension conflicts for `.m` (Objective-C vs MATLAB), `.v` (Verilog vs V vs Coq) and `.cl` (Common Lisp vs OpenCL).

#### 🎨 User Experience (UX Polish)
- **Dynamic Tooltips**: Keybinding tooltips dynamically adapt to the client Operating System (displaying `⌘` for macOS and `Ctrl+` for Windows/Linux).
- **Global Keybindings**: Added handlers for screen switching tabs (`Ctrl/Cmd + 1` through `8`) and folder picking (`Ctrl/Cmd + Shift + O`).
- **Folder Confirmation dialog**: Guard rail alert added to prevent accidental data loss when switching active folders.
- **Welcome App Logo**: Replaced the square CSS-simulated shape with the actual `/logo.png` image on the welcome screen.

#### 📦 Artifact Packaging & Tauri Build
- **Clean Output Filenames (Version-Free Installer)**: Automatically strips version strings from build output installers (e.g. `Locsight_x64-setup.exe` instead of `Locsight_1.1.0_x64-setup.exe`), enabling persistent download paths.
- **Tauri Wrapper Proxy**: Implemented a Node-based wrapper script for `tauri build` that intercept and executes renaming processes both locally and on CI/CD GitHub Actions workflow.

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
