<p align="center">
  <img src="assets/logo.png" width="120" alt="Locsight Logo" />
</p>

<h1 align="center">Locsight</h1>

<p align="center">
  <strong>See through your source code.</strong>
</p>

<p align="center">
  <a href="https://github.com/ThanhNguyxnOrg/Locsight/releases"><img src="https://img.shields.io/github/v/release/ThanhNguyxnOrg/Locsight?style=flat-square&color=f59e0b&label=release" alt="Release" /></a>
  <a href="https://github.com/ThanhNguyxnOrg/Locsight/actions"><img src="https://img.shields.io/github/actions/workflow/status/ThanhNguyxnOrg/Locsight/auto-merge-dependabot.yml?style=flat-square&label=CI" alt="CI" /></a>
  <a href="https://github.com/ThanhNguyxnOrg/Locsight/blob/main/LICENSE"><img src="https://img.shields.io/github/license/ThanhNguyxnOrg/Locsight?style=flat-square&color=blue" alt="License" /></a>
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-grey?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/languages-250%2B-brightgreen?style=flat-square" alt="Languages" />
  <img src="https://img.shields.io/badge/built_with-Rust%20%2B%20Tauri%20v2-dea584?style=flat-square" alt="Built With" />
</p>

---

A blazing-fast ⚡ desktop app that scans, visualizes, and grades your codebase in seconds. Built with **Rust** and **Tauri v2** for native speed. Supports **250+ programming languages**.

## ✨ Highlights

| 🔍 Feature | Description |
|:---|:---|
| 📊 **Dashboard** | LOC, language distribution, complexity histograms, COCOMO cost estimation |
| 🫀 **Health Score** | DRYness, comment density, semantic role breakdown with letter grading (A+ → F) |
| 🔐 **Secrets Scanner** | Detects exposed AWS keys, GitHub tokens, JWT, private keys — auto-masked |
| 📝 **Annotations** | Searchable TODO / FIXME / HACK / BUG tracker with filters |
| 🔥 **Git Hotspots** | Finds high-risk files where complexity × churn is dangerous |
| 🌳 **Treemap** | Interactive squarified treemap sized by LOC |
| 🕸️ **Dep Graph** | Circular module coupling graph with zoom, search, and filters |
| 📁 **250+ Languages** | From Rust to COBOL, Solidity to GDScript — with shebang detection |
| 📄 **Export** | JSON · CSV · Markdown · HTML reports |

## 🚀 Quick Start

Locsight is a pre-compiled desktop app. **You do not need to clone the code or install Node.js/Rust to use it.**

1. Download the installer for your operating system from [Releases](https://github.com/ThanhNguyxnOrg/Locsight/releases).
2. Install and launch:
   - **Windows**: Run the `.msi` or `.exe` installer.
   - **macOS**: Drag the `.dmg` application to your `/Applications` directory.
   - **Linux**: Install the `.deb` package or execute the `.AppImage`.

> 💡 For detailed setup guides, security bypass instructions (SmartScreen/Gatekeeper), system dependency packages, and graphics hardware troubleshooting for **Virtual Machines (blank screen fix)**, please consult the [Full Installation Guide](docs/INSTALLATION.md).

## 🛠️ Development Setup

If you want to compile Locsight from source:

```bash
# 1. Clone repository
git clone https://github.com/ThanhNguyxnOrg/Locsight.git
cd Locsight

# 2. Install dependencies
npm install

# 3. Launch dev environment
npm run tauri dev
```

> 📋 **Prerequisites**: [Node.js](https://nodejs.org/) (v18+), [Rust](https://rustup.rs/) (v1.75+), and [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/) for compilation.

## ⚙️ Tech Stack

```
Backend   →  Rust · Tauri v2 · Rayon · WalkDir · SHA-256 · Regex
Frontend  →  React 19 · TypeScript · Vite · Tailwind CSS · Recharts
CI/CD     →  GitHub Actions · Dependabot · Auto-merge
```

## 📖 Documentation

| 📄 Document | Description |
|:---|:---|
| [🚀 Installation](docs/INSTALLATION.md) | Cross-platform setup, security bypass, and VM troubleshooting |
| [📐 Architecture](docs/ARCHITECTURE.md) | System design, module breakdown, data flow |
| [✨ Features](docs/FEATURES.md) | Detailed feature guide with examples |
| [💻 Development](docs/DEVELOPMENT.md) | Local setup, project structure, debugging |
| [🤝 Contributing](CONTRIBUTING.md) | How to contribute, code style, PR guidelines |
| [📋 Changelog](CHANGELOG.md) | Version history and release notes |
| [🔒 Security](SECURITY.md) | Vulnerability reporting policy |
| [📜 Code of Conduct](CODE_OF_CONDUCT.md) | Community standards |
| [⚖️ License](LICENSE) | MIT License |

## 📸 Screenshots

> _Coming soon — build the app and explore!_

---

<p align="center">
  <sub>Made with 🦀 Rust + ⚛️ React by <a href="https://github.com/ThanhNguyxnOrg">ThanhNguyxn</a></sub>
</p>
