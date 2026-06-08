# Codebase Analyzer (Rust + Tauri v2)

A premium, high-performance desktop application designed to analyze, visualize, and report codebase metrics, cyclomatic complexity, coupling, and duplication. Rebuilt from the ground up in Rust and Tauri v2 to replace the legacy C++ implementation with modern, glassmorphic aesthetics.

---

## ✨ Features

- **🚀 Multi-threaded Directory Scanner**: Recursively scans directories using a parallelized `Rayon` thread pool, automatically recognizing programming languages and stripping comments to calculate raw Lines of Code (LOC).
- **📊 Interactive Dashboard**: Detailed statistics including comment-to-code ratios, cyclomatic complexity distributions, and file size breakdowns.
- **💰 COCOMO II Estimation**: Real-time project cost, schedule, and team size estimation based on actual lines of code and adjustable average rates.
- **🔍 Duplicate Finder**: Identifies duplicate files using secure SHA-256 content hashes.
- **🌳 Squarified Treemap & File Tree**: Dynamic treemap visualizations to quickly pinpoint massive source files, paired with a clean sidebar file navigator.
- **🕸️ Coupling & Dependency Graph**: Renders import coupling between project files on an interactive, circular graph showing incoming/outgoing edges.
- **📄 Multi-format Export**: Export reports directly to JSON, CSV, Markdown, or HTML formats using native Tauri save dialogs.
- **🤖 Dependabot Automation**: Grouped PR updates with automated merge and rebase workflows configured.

---

## 🛠️ Tech Stack

- **Backend**: Rust, Tauri v2, Rayon (Parallelism), Walkdir
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Custom Glassmorphic CSS

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
1. [Rust (cargo & rustc)](https://www.rust-lang.org/)
2. [Node.js (npm)](https://nodejs.org/)
3. [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/) for your operating system.

### Installation & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/ThanhNguyxnOrg/Codebase-Analyzer.git
   cd Codebase-Analyzer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development environment:
   ```bash
   npm run tauri dev
   ```

### Building for Production

To compile the production-ready native desktop app package:
```bash
npm run tauri build
```
The compiled installers will be located under `src-tauri/target/release/bundle/`.
