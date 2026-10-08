# ✨ Features

> Complete feature guide for **Locsight** — every capability explained.

---

## 📊 Dashboard

The main overview screen renders the moment you open a folder.

| Metric | Description |
|:---|:---|
| 📏 **Total LOC** | Sum of all code, comments, and blank lines |
| 📁 **Files** | Total recognized source files |
| 🌐 **Languages** | Number of distinct languages detected |
| 💰 **Est. Cost** | COCOMO II estimated project cost |
| 📊 **Language Bar** | Hoverable stacked bar showing % distribution |
| 📋 **Detail Table** | Per-language breakdown: files, code, comments, blanks, % |
| 🧮 **Complexity** | Average cyclomatic complexity + distribution histogram |
| 💵 **COCOMO Card** | Effort (person-months), time, cost, team size with adjustable $/month rate |
| 🔁 **Duplicates** | Count + expandable duplicate file groups |

---

## 🫀 Health Score

An automatic quality grade from **A+** to **F** based on:

- 🧬 **DRYness Ratio** — `Unique Lines / Total Code Lines`. Higher = less copy-paste.
- 📝 **Comment Density** — Ideal range: 10-30%. Too low = underdocumented, too high = noise.
- 🧮 **Complexity** — Penalty applied when average cyclomatic complexity > 15.

### 🏷️ Semantic Role Distribution

Files are automatically classified into 6 layers:

| Role | 🎨 Color | Pattern Examples |
|:---|:---|:---|
| 🟢 **Core** | Lime | Application logic, library source |
| 🔵 **Test** | Sky | `__tests__/`, `*.test.ts`, `*_test.go` |
| 🩷 **Docs** | Pink | `README.md`, `docs/`, `*.rst` |
| 🟣 **Infra** | Purple | `Dockerfile`, `.github/`, `terraform/` |
| ⚪ **Config** | Slate | `*.json`, `*.toml`, `*.yaml` at root |
| 🟡 **Scripts** | Amber | `scripts/`, `Makefile`, `*.sh` |

---

## 🔐 Security: Secrets Scanner

Scans every source file for accidentally exposed credentials:

| Pattern | Examples |
|:---|:---|
| 🔑 **AWS** | `AKIA...` access key IDs |
| 🐙 **GitHub** | `ghp_`, `gho_`, `github_pat_` tokens |
| 🔍 **Google** | `AIza...` API keys |
| 🔒 **Private Keys** | `-----BEGIN RSA PRIVATE KEY-----` |
| 🧮 **High Entropy** | Long strings with Shannon entropy > 4.5 |

> ⚠️ All detected credentials are **auto-masked** before display. Only a truncated prefix/suffix is shown.

---

## 📝 Code Annotations Tracker

Scans comment lines for developer tags:

| Tag | 🎨 Color | Meaning |
|:---|:---|:---|
| ✅ `TODO` | Green | Planned work |
| 🔴 `FIXME` | Red | Known bugs |
| 🟡 `HACK` | Amber | Temporary workarounds |
| 🔴 `BUG` | Red | Documented bugs |
| ⚪ `DEPRECATED` | Gray | Obsolete code |
| 🟡 `XXX` | Amber | Danger zones |

Features:
- 🔍 **Search** by file path or message content
- 🏷️ **Filter** by tag type (dropdown)
- 📊 **Count** display: `filtered / total`

---

## 🔥 Refactoring Hotspots (Hotspots Tab)

Dedicated interactive observatory correlating file complexity with git commit churn:

- 📊 **2D Risk Scatter Matrix** — Interactive Recharts scatter plot plotting McCabe Complexity against Git Churn, with reference median dividing lines.
- 🎯 **Four Risk Quadrants**:
  - `Hotspot - Refactor Priority #1` (Critical red): High complexity, high churn — primary sources of regressions.
  - `Complex Legacy - Monitor` (Orange): High complexity, low churn — handle with care.
  - `Active & Clean` (Green): Low complexity, high churn — active and healthy components.
  - `Stable & Simple` (Gray): Low complexity, low churn — solid foundations.
- 🏷️ **Quadrant Filters** — Instant toggle chips to focus on specific risk categories.
- 📋 **Top 25 Action Targets** — Ranked table with exact hotspot score ($Complexity \times \ln(Commits + 1)$) and quadrant badges.

---

## 📈 Git Churn & Author Analytics

When a `.git` repository is detected, Locsight queries commit history to identify:

### 🔥 Refactoring Hotspots

Files where `Complexity × Churn` is highest — these are the **most dangerous** files in your codebase:
- High churn = frequently changed
- High complexity = hard to understand
- Combined = high risk of introducing bugs

### 👥 Top Contributors

Ranked list of authors by commit count with percentage bars.

### 📈 Summary Cards

| Card | Value |
|:---|:---|
| 📊 Total Commits | Across all contributors |
| 📁 Churned Files | Files with at least 1 commit |
| 👥 Contributors | Unique authors |

---

## 📁 File Explorer

### 🌳 Tree View
Reconstructed hierarchical file tree from flat path lists. Click any file to see its individual stats.

### 🗺️ Squarified Treemap
Interactive visualization where each rectangle's area represents Lines of Code. Colored by language.

---

## 🕸️ Dependency Graph

Circular and hierarchical C4 architecture graph showing `import`/`require`/`use` coupling between files:

- 🔍 **Search** — Find files in the graph
- 🏷️ **Filter** — Show only specific languages
- 🔎 **Zoom & Reset** — Mouse wheel zoom (0.05x - 5.0x), drag pan, and instant compass reset
- 🌡️ **Heatmap Overlays** — Toggle between Default, Complexity, Churn, and Hotspot thermal modes
- 📸 **Visual Export** — One-click high-res SVG and 2x Retina PNG download directly from canvas
- 📋 **Mermaid Diagram Copy** — Copy full `flowchart TD` architecture syntax to clipboard in 1 click
- 📋 **Detail Card** — Click a node to inspect incoming imports, outgoing dependents, and blast radius %

---

## 📦 Asset Intelligence

Extends scan analysis beyond traditional source files to recognize multimedia, 3D, and CAD files.

### 🔍 Categorization & Discovery

Locsight detects and maps non-code assets into three core areas:
- **Multimedia** — Images (`.png`, `.jpg`, `.webp`, `.gif`, `.svg`), Videos (`.mp4`, `.webm`, `.avi`), and Audio (`.mp3`, `.wav`, `.ogg`, `.flac`).
- **3D & Game Dev** — Models (`.fbx`, `.obj`, `.gltf`, `.glb`), Textures (`.tga`, `.dds`), and Configs (`.meta` for Unity, `.tscn`/`.tres` for Godot, `.uasset`/`.umap` for Unreal).
- **CAD & Drawings** — Technical files (`.dwg`, `.dxf`) and CAD Models (`.step`, `.iges`).

### ⚙️ Deep Features

- **Metadata Extraction** — Safe header parsing on image formats (PNG/JPEG) to resolve dimensions (`1920x1080`) and sizes without external CLI tools.
- **Orphan Asset Scanner** — Scans the source code files and game configs in parallel to verify if each asset's filename is referenced. Identifies unreferenced files as **Orphans** to safely purge and reclaim storage.
- **Dependency Graphs** — Extracts and displays connections between scene configs (e.g. Godot scene referencing `.png`/`.fbx` files) and CAD xref files.
- **Optimization Advisor** — Generates warning/info recommendations for oversized pictures (PNG/JPG > 5MB) with potential WebP conversion estimates, and uncompressed sound clips (WAV > 10MB) with potential MP3 compression estimates.

---

## 📄 Export

Generate standalone reports:

| Format | Extension | Use Case |
|:---|:---|:---|
| 📋 **JSON** | `.json` | Machine-readable, full data |
| 📊 **CSV** | `.csv` | Spreadsheet-compatible per-file rows |
| 📝 **Markdown** | `.md` | README-friendly summary tables |
| 🌐 **HTML** | `.html` | Interactive standalone report |

---

## ⚙️ Custom Configuration

Create a `.analyzer.json` file at your project root:

```json
{
  "ignore_patterns": ["vendor/", "*.generated.*"],
  "custom_languages": [
    {
      "name": "MyDSL",
      "extensions": [".mydsl"],
      "line_comment": "//",
      "block_comment_start": "/*",
      "block_comment_end": "*/"
    }
  ]
}
```

---

## 🌐 Language Support

Locsight recognizes **500+ languages** including:

| Category | Languages |
|:---|:---|
| 🦀 **Systems** | Rust, C, C++, Go, Swift, Kotlin, Zig, Nim, Odin, V |
| 🐍 **Scripting** | Python, Ruby, Perl, Lua, R, Julia, PHP, PowerShell |
| 🌐 **Web** | TypeScript, JavaScript, HTML, CSS, Vue, Svelte, Astro |
| ⚙️ **Config** | JSON, YAML, TOML, XML, INI, Dockerfile, Makefile |
| 📱 **Mobile** | Dart, Kotlin, Swift, Objective-C, Groovy |
| λ **Functional** | Haskell, OCaml, F#, Clojure, Elixir, Erlang, Elm |
| 🎮 **Game Dev** | GDScript, GLSL, HLSL, WGSL, ShaderLab |
| 🏢 **Enterprise** | COBOL, FORTRAN, Ada, Pascal, VHDL, Verilog |
| 🔗 **Blockchain** | Solidity, Cairo, Mojo |

Plus automatic **shebang detection** for extension-less scripts (`#!/bin/bash`, `#!/usr/bin/env python3`, etc.)
