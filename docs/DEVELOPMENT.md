# 💻 Development Guide

> Local setup, project structure, and debugging tips for **Locsight**.

---

## 📋 Prerequisites

| Tool | Version | Purpose |
|:---|:---|:---|
| 🦀 [Rust](https://rustup.rs/) | stable | Backend compilation |
| 📦 [Node.js](https://nodejs.org/) | 18+ | Frontend tooling |
| 🔧 [Tauri CLI](https://v2.tauri.app/start/prerequisites/) | v2 | Desktop app bundling |
| 🖥️ MSVC Build Tools | 2022 | Windows compilation (Windows only) |
| 🌐 WebView2 | Latest | WebView runtime (Windows only) |

---

## 🚀 Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/ThanhNguyxnOrg/Locsight.git
cd Locsight

# 2. Install frontend dependencies
npm install

# 3. Start development mode (hot-reload)
npm run tauri dev

# 4. Build for production
npm run tauri build
```

---

## 📂 Project Structure

```
Locsight/
├── 📄 README.md                    # Quick overview
├── 📄 CONTRIBUTING.md              # Contribution guide
├── 📄 CHANGELOG.md                 # Version history
├── 📄 SECURITY.md                  # Security policy
├── 📄 CODE_OF_CONDUCT.md           # Community standards
├── 📄 LICENSE                      # MIT
├── 📂 assets/                      # Logo & brand assets
│   └── 🎨 logo.png
├── 📂 docs/                        # Detailed documentation
│   ├── 📐 ARCHITECTURE.md
│   ├── ✨ FEATURES.md
│   └── 💻 DEVELOPMENT.md (this file)
├── 📂 .github/                     # GitHub automation
│   ├── 📂 ISSUE_TEMPLATE/
│   ├── 📂 workflows/
│   ├── 📄 PULL_REQUEST_TEMPLATE.md
│   └── 📄 dependabot.yml
├── 📂 src/                         # ⚛️ React Frontend
│   ├── 📂 components/              # UI screens
│   │   ├── Shell.tsx               # App shell + navigation
│   │   ├── Welcome.tsx             # Landing page
│   │   ├── Dashboard.tsx           # Main metrics
│   │   ├── Health.tsx              # Quality score
│   │   ├── Insights.tsx            # Secrets + TODOs
│   │   ├── Git.tsx                 # Churn analysis
│   │   ├── Files.tsx               # File tree + treemap
│   │   ├── Graph.tsx               # Dependency graph
│   │   ├── Export.tsx              # Report generation
│   │   ├── Card.tsx                # Reusable card
│   │   └── tokens.ts              # Design tokens
│   ├── 📂 hooks/
│   │   └── useAnalysis.tsx         # State management context
│   ├── 📂 types/
│   │   └── index.ts                # TypeScript interfaces
│   └── App.tsx                     # Root component
├── 📂 src-tauri/                   # 🦀 Rust Backend
│   ├── 📂 src/
│   │   ├── lib.rs                  # Tauri plugin setup
│   │   ├── main.rs                 # Entry point
│   │   ├── 📂 commands/            # IPC command handlers
│   │   ├── 📂 engine/              # Core analysis engines
│   │   │   ├── scanner.rs          # 250+ lang file walker
│   │   │   ├── complexity.rs       # Cyclomatic analysis
│   │   │   ├── cocomo.rs           # Cost estimation
│   │   │   ├── duplicate.rs        # SHA-256 dedup
│   │   │   ├── uloc.rs             # Unique LOC
│   │   │   ├── roles.rs            # Semantic classifier
│   │   │   ├── annotations.rs      # TODO/FIXME tracker
│   │   │   ├── secrets.rs          # Credential scanner
│   │   │   ├── git.rs              # Git history analysis
│   │   │   └── config.rs           # Custom rules parser
│   │   └── 📂 models/              # Data structures
│   └── Cargo.toml
└── 📄 package.json
```

---

## 🧪 Testing

### 🦀 Rust Backend Tests

```bash
cd src-tauri
cargo test
```

Expected output:
```
test engine::scanner::tests::test_count_lines_python ... ok
test engine::scanner::tests::test_count_lines_rust ... ok
test engine::scanner::tests::test_shebang_detection ... ok
test result: ok. 3 passed; 0 failed
```

### ⚛️ Frontend Type Check

```bash
npm run build    # runs tsc && vite build
```

---

## 🐛 Debugging Tips

### 🖥️ VMware / Virtual Machine
If running inside VMware, the app may render a blank white window. Fix:
```bash
npm run tauri dev -- -- --vm
# or
npm run tauri dev -- -- --disable-gpu
```

### 🔧 Rust Analyzer
Make sure your IDE's Rust Analyzer is pointed at `src-tauri/` as the workspace root for proper IntelliSense.

### 🌐 DevTools
Press `F12` or `Ctrl+Shift+I` inside the app window to open WebView2 DevTools for frontend debugging.

---

## 📦 Build Outputs

After `npm run tauri build`, compiled binaries are located at:

| Platform | Path |
|:---|:---|
| 🪟 Windows | `src-tauri/target/release/bundle/nsis/` |
| 🍎 macOS | `src-tauri/target/release/bundle/dmg/` |
| 🐧 Linux | `src-tauri/target/release/bundle/deb/` |
