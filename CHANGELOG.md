# 📋 Changelog

All notable changes to **Locsight** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-06-08

### 🎉 Initial Release & Automated Build Pipeline

#### ✨ Added
- 📊 **Dashboard** — LOC metrics, language distribution, complexity histograms, COCOMO II estimation.
- 📁 **File Explorer** — Hierarchical file tree + interactive squarified treemap.
- 🕸️ **Dependency Graph** — Circular module coupling graph with search, filters, and zoom.
- 📄 **Export** — JSON, CSV, Markdown, HTML report generation via native save dialogs.
- 🫀 **Health Score** — DRYness, comment density, semantic role classification (A+ → F grading).
- 🔐 **Secrets Scanner** — Regex + entropy detection for AWS, GitHub, Google, JWT credentials (auto-masked).
- 📝 **Annotations Tracker** — Searchable TODO / FIXME / HACK / BUG / DEPRECATED browser with filters.
- 🔥 **Git Hotspots** — Complexity × Churn danger scoring + contributor breakdown.
- ⚙️ **Custom Config** — `.analyzer.json` custom ignore patterns and language mappings.
- 🖥️ **Cross-platform support** — Native desktop applications for Windows, macOS, and Linux via Tauri v2.
- 🚀 **GitHub Actions release workflow** (`release.yml`) — Automatically parses `CHANGELOG.md`, creates tags, builds binaries, and publishes draft releases on `release: v*` commits.
- 📦 **6-Target compilation matrix**:
  - 🪟 Windows (x64 & ARM64)
  - 🍎 macOS (Apple Silicon ARM64 & Intel x64)
  - 🐧 Linux (x64 & ARM64 native via `ubuntu-22.04-arm` runners)
