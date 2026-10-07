# 🗺️ Locsight Feature Roadmap & Architectural Innovations

> **Mission:** Elevate Locsight from a blazing-fast static metrics counter into a comprehensive **Codebase Observatory & Refactoring Decision System**, engineered natively on Rust and Tauri v2.

This document synthesizes deep research into world-class developer tools and repositories (**GitNexus, CodeScene, GitDiagram, Knip, GitTruck, Madge, CodeCharta, Repomix**) to establish a high-impact feature roadmap across five strategic pillars.

---

## 🏛️ Pillar 1: Graph & Visual Architecture (Diagram-as-Code & Graph Intelligence)
*References: [GitDiagram](https://gitdiagram.com), [Swark](https://github.com/swark-io/swark), [Madge](https://github.com/pahen/madge), [Sourcetrail](https://github.com/CoatiSoftware/Sourcetrail)*

| Feature | Detailed Description | Practical Value | Priority |
|---|---|---|---|
| **1.1. Export Mermaid.js / SVG / PNG** | One-click button to export the current dependency/architecture graph into **Mermaid.js** code (`flowchart TD` / `classDiagram`) as well as high-res **SVG / PNG** images. | Developers can immediately paste live diagrams into `README.md`, GitHub PR descriptions, Notion, or Obsidian as living architecture documentation. | **P0 (Quick Win)** |
| **1.2. Graph Heatmap Overlay** | Add a color-mode toggle on the graph canvas: *Default*, *Complexity Heatmap* (Green $\rightarrow$ Red), *Git Churn Heatmap*, or *Hotspot Heatmap*. Node radii dynamically scale with LOC. | Turns a static node graph into a live thermal map, immediately spotlighting architectural anomalies and high-complexity clusters. | **P0 (High Value)** |
| **1.3. Dependency Path Finder** | Select File A and File B $\rightarrow$ Locsight dims unrelated nodes and illuminates the shortest dependency path: `A ➔ Module X ➔ Module Y ➔ B`. | Answers the classic refactoring question: *"Why does module A pull in module B?"* when breaking apart monoliths or decoupling packages. | **P1** |
| **1.4. Interactive Cycle Isolator** | Clicking any circular dependency from the Health list automatically isolates and zooms into the cycle, glowing the closed loop `A ➔ B ➔ C ➔ A` in animated red. | Eliminates manual hunting; allows engineers to visualize and untangle architectural circularity instantly. | **P1** |

---

## 🌋 Pillar 2: Behavioral Analysis & Technical Debt (Hotspots of Doom)
*References: [CodeScene](https://codescene.com), [CodeCharta](https://github.com/MaibornWolff/codecharta)*

| Feature | Detailed Description | Practical Value | Priority |
|---|---|---|---|
| **2.1. Refactoring Hotspots Matrix** | Correlate `complexity` with `git_churn` into a **Hotspot Score**: $$\text{Score} = \text{Complexity} \times \ln(\text{Commits} + 1)$$ Rendered as an interactive 2D 4-quadrant *Risk Scatter Plot*. | Pinpoints the top 5% most hazardous files — code that is both highly complex and constantly modified, which historically accounts for 80% of project bugs. | **P0 (Core Value)** |
| **2.2. Maintainability Index (MI) & Tech Debt Hours** | Industry-standard Maintainability Index (0–100 scale based on Halstead Volume, McCabe Complexity, and LOC) + estimated remediation hours/days. | Complements COCOMO: COCOMO estimates *cost to build from scratch*, whereas MI estimates *effort required to clean existing technical debt*. | **P1** |
| **2.3. Temporal Coupling Matrix** | Leverages `change_coupling` to expose co-change clusters (files that frequently mutate together in commits despite lacking direct imports). | Detects violations of the Single Responsibility Principle and highlights high-risk *Shotgun Surgery* hazards. | **P1** |

---

## 🧹 Pillar 3: Code Hygiene & Dead Code Hunting
*References: [Knip](https://github.com/webpro-nl/knip), [ts-prune](https://github.com/nadecode/ts-prune), [jscpd](https://github.com/kucherenko/jscpd)*

| Feature | Detailed Description | Practical Value | Priority |
|---|---|---|---|
| **3.1. Orphan Source Code Detection** | Identifies source files with $C_a = 0$ (no incoming imports) that are not entry points (`main`, `index`, `App`, configs), flagging them as **Unused Code Candidates**. | Extends orphan asset detection to source code, assisting engineers in cleaning dead legacy files post-refactor. | **P1** |
| **3.2. Code Duplication Diff Viewer** | In the duplicates list, clicking any duplicate group opens a side-by-side snippet comparison showing the shared lines. | Gives developers immediate visual verification of copy-pasted logic for swift extraction into shared utilities. | **P2** |

---

## 👥 Pillar 4: Team Knowledge & Repository History
*References: [GitTruck](https://github.com/git-truck/git-truck), [Hercules](https://github.com/src-d/hercules)*

| Feature | Detailed Description | Practical Value | Priority |
|---|---|---|---|
| **4.1. Bus Factor & Knowledge Island Warning** | Evaluates commit author distribution per folder/file. Flags high-complexity core modules where 100% of modifications were authored by **a single contributor**. | Identifies critical single-point-of-failure human risks before key team members depart or transition. | **P2** |
| **4.2. Code Age & Fossilization Tracker** | Categorizes repository code by freshness (Recently Modified < 1 mo, Stable < 1 yr, Fossilized > 2 yrs) with distribution histograms. | Onboards new engineers by clarifying which modules are actively evolving vs. stable frozen core foundations. | **P2** |

---

## 🤖 Pillar 5: AI & CI/CD Interoperability
*References: [GitNexus](https://github.com/abhigyanpatwari/GitNexus), [Repomix](https://github.com/yamadashy/repomix)*

| Feature | Detailed Description | Practical Value | Priority |
|---|---|---|---|
| **5.1. Locsight Native MCP Server** | Exposes a **Model Context Protocol (MCP)** server via CLI (`locsight --mcp`). Allows AI assistants (Cursor, Claude Code, Antigravity) to query architecture, hotspots, and blast radius locally. | Equips AI coding agents with real-time architectural awareness, preventing agents from introducing breaking changes across modules. | **P1 (Strategic)** |
| **5.2. Repo-to-Prompt & Token Estimator** | Custom directory/file selector with BPE token estimation (tiktoken) that strips comments/vendor boilerplate and copies an LLM-optimized context prompt in 1 click. | Replaces standalone CLI scripts with a native desktop workflow for AI prompt preparation. | **P2** |
| **5.3. Headless CI/CD Gate (`locsight --ci`)** | Headless CLI mode for GitHub Actions that fails CI builds if circular dependencies increase or the codebase Health Score drops below a configured threshold. | Automatically enforces architecture standards and halts tech debt regression on pull requests. | **P2** |

---

## 🗓️ Phased Execution Roadmap

```
[Phase 1: Visual & Hotspot Quick Wins]
  ├── 1.1 Export Mermaid.js / SVG / PNG (Graph Canvas)
  ├── 1.2 Heatmap Overlay (Complexity & Churn on Graph)
  └── 2.1 Refactoring Hotspots Matrix (Churn × Complexity Dashboard)

[Phase 2: Deep Architecture & Hygiene]
  ├── 1.3 Dependency Path Finder
  ├── 1.4 Circular Dependency Cycle Isolator
  ├── 3.1 Orphan Code Files Detection
  └── 2.2 Maintainability Index (MI) & Tech Debt Hours

[Phase 3: AI & Team Intelligence]
  ├── 5.1 Locsight Local MCP Server
  ├── 4.1 Bus Factor & Knowledge Island Warning
  └── 5.3 Headless CI/CD Mode
```
