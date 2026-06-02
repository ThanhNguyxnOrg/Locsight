# 🚀 Getting Started for Development & Contribution

This document details how to set up the development environment, compile releases, automate builds, and understand the academic context.

---

## 🖥️ Local Desktop UI Development

The Desktop interface is built using Electron, React, TypeScript, and Vite.

### 🧱 Dev Environment Setup
Ensure you have **Node.js (LTS)** installed, then run:

```bash
# Navigate to the Desktop UI project
cd ui_design

# Install development dependencies
npm install

# Run the local Vite dev server
npm run dev
```

### 📦 Compile Desktop Release Binaries

To package the application into platform-native desktop installers (built with `electron-builder` under the hood):

```bash
cd ui_design
npm run build
npm run dist
```

Native platform binaries will be generated inside the directory:
```txt
ui_design/release/
```
> ⚠️ **Note**: Do not commit the `release/` folder to GitHub. Binaries are compiled and published directly as release assets.

---

## 🤖 Continuous Integration (GitHub Actions)

We utilize automated GitHub Actions pipelines to compile, test, and package our application for three major platforms (Windows, macOS, and Linux):
1. 🖥️ **Desktop GUI App**: Platform-native installers/executables (`.exe`, `.dmg`, `.AppImage`) for use on personal machines ("máy chính").
2. ⚙️ **C++ CLI Binaries**: Pre-compiled static command-line interface executables (`codebase-analyzer-cli-win.exe`, `codebase-analyzer-cli-mac`, `codebase-analyzer-cli-linux`) for direct command-line use on virtual machines ("máy ảo"), Docker containers, or headless servers.

* 🚀 **CI Pipelines**: [GitHub Actions Dashboard](https://github.com/ThanhNguyn/Codebase-Analyzer/actions)
* 📦 **Release Builds**: [Latest Release Packages](https://github.com/ThanhNguyn/Codebase-Analyzer/releases/latest)

---

## 🧪 Automated Unit Testing

We implement a platform-independent unit testing suite located in `tests/unit_tests.cpp` to ensure core parser helper methods behave correctly. It runs out-of-the-box on Windows, macOS, and Linux without any external testing frameworks.

To configure and run the tests:

```bash
# 1. Generate build files in Debug mode
cmake -S . -B build
cmake --build build --config Debug

# 2. Run test suite using CMake standard CTest runner
cd build
ctest --output-on-failure
```

You can also directly run the compiled binary:
* **Windows**: `.\build\Debug\unit_tests.exe`
* **macOS / Linux**: `./build/Debug/unit_tests`

---

## 🗺️ Roadmap & Current Goals

- [x] **C++ CLI Analyzer Core** (abstraction, scanner, OOP classes)
- [x] **Recursive Directory Scanner** (skip node_modules, build, ignore rules)
- [x] **Markdown Report Generation** (`codebase_report.md` output)
- [x] **Desktop UI Core Prototype** (Electron + React, directory pick flow)
- [x] **Windows Desktop Installer Build**
- [x] **GitHub Releases & Walkthrough video integration**
- [ ] 🔜 Connect Electron UI directly to C++ executable
- [ ] 🔜 Add PDF & HTML report export functions
- [ ] 🔜 Add interactive visual charts for language distributions
- [ ] 🔜 Add more custom programming language analyzers

---

## 🎓 Academic Project Context

This application was developed as a term project for the **Object-Oriented Programming (OOP)** university course.

### 👨‍💻 Team — 404 Team Not Found

| Name | Student ID | Academic Role |
|:---|:---|:---|
| **Nguyễn Tuấn Thành** | `25112107` | 👑 Team Leader / Lead Backend Engineer |
| **Đoàn Ngọc Bích** | `25112138` | Frontend Engineer / UX Designer |
| **Nguyễn Đăng Khoa** | `25112163` | QA Engineer / Test Writer |

---

## 📜 License & Usage

This project is licensed under the academic and educational usage guidelines. All rights reserved for school submission.
