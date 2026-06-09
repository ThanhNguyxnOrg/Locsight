# 📋 Changelog

All notable changes to **Locsight** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
