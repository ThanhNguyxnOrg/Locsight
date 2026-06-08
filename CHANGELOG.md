# 📋 Changelog

All notable changes to **Locsight** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-06-08

### 🎉 Initial Release

#### ✨ Added
- 📊 **Dashboard** — LOC metrics, language distribution, complexity histograms, COCOMO II estimation
- 📁 **File Explorer** — Hierarchical file tree + interactive squarified treemap
- 🕸️ **Dependency Graph** — Circular module coupling graph with search, filters, and zoom
- 📄 **Export** — JSON, CSV, Markdown, HTML report generation via native save dialogs
- 🫀 **Health Score** — DRYness, comment density, semantic role classification (A+ → F grading)
- 🔐 **Secrets Scanner** — Regex + entropy detection for AWS, GitHub, Google, JWT credentials (auto-masked)
- 📝 **Annotations Tracker** — Searchable TODO / FIXME / HACK / BUG / DEPRECATED browser with filters
- 🔥 **Git Hotspots** — Complexity × Churn danger scoring + contributor breakdown
- ⚙️ **Custom Config** — `.analyzer.json` custom ignore patterns and language mappings
- 🌐 **250+ Languages** — From Rust to COBOL with shebang detection for extension-less scripts
- 🖥️ **Cross-platform** — Windows, macOS, and Linux support via Tauri v2
- 🤖 **CI/CD** — Dependabot automation with auto-merge and auto-rebase workflows

#### 🏗️ Architecture
- 🦀 Rust backend with Rayon multi-threaded parallelism
- ⚛️ React 19 + TypeScript + Vite frontend
- 🎨 Custom frameless window with OS-native controls
- 📦 Tauri v2 IPC bridge

---

## [0.4.2] — 2026-06-07 _(Legacy)_

### 🔄 Changed
- Initial C++ → Rust/Tauri migration
- Basic 22-language scanner
- Simple LOC counting + COCOMO

---

<p align="center">
  <sub>🔖 See <a href="https://github.com/ThanhNguyxnOrg/Locsight/releases">GitHub Releases</a> for downloadable binaries.</sub>
</p>
