<div align="center">

# 🧠 Codebase Analyzer

### ⚡ Local Source Code Analyzer with Desktop UI & C++ OOP Core

<p>
  <img src="https://img.shields.io/badge/C%2B%2B-23-00599C?style=for-the-badge&logo=cplusplus&logoColor=white" />
  <img src="https://img.shields.io/badge/CMake-3.20+-064F8C?style=for-the-badge&logo=cmake&logoColor=white" />
  <img src="https://img.shields.io/badge/Electron-28+-47848F?style=for-the-badge&logo=electron&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
</p>

<p>
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=for-the-badge&logo=linux&logoColor=white" />
  <img src="https://img.shields.io/badge/OOP-Architecture-blueviolet?style=for-the-badge&logo=dependencytrack" />
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge" />
</p>

<p>
  <b>Scan local directories, analyze file scale, count code/comment/blank lines, and export clean Markdown reports.</b>
</p>

<p>
  <a href="https://github.com/ThanhNguyn/Codebase-Analyzer/releases/latest">📦 Download Latest Release</a>
  ·
  <a href="https://thanhnguyn.github.io/Codebase-Analyzer-docs/">📖 Web Documentation</a>
  ·
  <a href="https://github.com/ThanhNguyn/Codebase-Analyzer-docs">📂 Docs Repository</a>
</p>

</div>

---

## 🎬 Walkthrough Demo Video

Watch the official **Codebase Analyzer** demonstration showcasing the high-performance C++ Core and Electron UI in action:

<p align="center">
    <video src="https://github.com/user-attachments/assets/9c9d0b1c-b3ed-4902-a751-4bb9adde1cc2" width="800" autoplay loop muted playsinline></video>
</p>

---

## 📌 Overview

**Codebase Analyzer** is a modern course project built on top of Object-Oriented Programming (OOP) architectures to perform local static code analysis. It provides:
1. 🖥️ A **Desktop Dashboard UI** (Electron + React) for interactive folder selection, live parsing metrics, and visual distribution charts.
2. ⚙️ A **C++23 CLI Engine Core** optimized for fast directory traversal, strict `.gitignore` ignore rule parsing, and single/multi-line comment extraction.

---

## 📖 Detailed Project Documentation

The repository contents are modularly split into specific guides inside the [docs/](docs/) folder. Read them for in-depth insights:

* 📥 **[Installation & Setup Guide](docs/installation.md)**: Detailed compilation prerequisites and OS-specific setup (Windows, macOS, and Linux) for Desktop and CLI modes.
* 🧱 **[Architecture & OOP Design Patterns](docs/architecture.md)**: Flowcharts, detailed C++ UML class diagrams, composition details, and the mapping of OOP principles (Abstraction, Inheritance, Polymorphism, Encapsulation).
* 🌐 **[Supported Source File Types & Parsing Rules](docs/supported_languages.md)**: Breakdown of the 10 supported extensions and how code, comment, and blank lines are distinguished.
* 🚀 **[Getting Started for Development & Contribution](docs/development.md)**: Setting up the React dev server, packaging installer binaries, roadmap, and academic team structure.

---

## ⚡ Quick Start

### 🖥️ Option 1: Use Desktop UI App (Recommended)
1. **[Download the Latest Release Installer](https://github.com/ThanhNguyn/Codebase-Analyzer/releases/latest)** (`.exe`, `.dmg`, or `.AppImage`).
2. Install and launch the application.
3. Click **Choose Local Folder**, select a project directory, and explore the dashboard!

---

### ⚙️ Option 2: Use CLI Mode (Build from Source)
1. **Clone the repository:**
   ```bash
   git clone https://github.com/ThanhNguyn/Codebase-Analyzer.git
   cd Codebase-Analyzer
   ```
2. **Configure & Build the C++ Engine:**
   ```bash
   cmake -S . -B build
   cmake --build build --config Release
   ```
3. **Run the analyzer on a target folder:**
   * 🪟 **Windows (Powershell / CMD):**
     ```powershell
     .\build\Release\codebase_analyzer.exe .\your-project
     ```
   * 🐧🍎 **Linux / macOS (Terminal):**
     ```bash
     ./build/codebase_analyzer ./your-project
     ```

---

## 📁 Repository Structure

```txt
Codebase-Analyzer/
├── docs/                     # Detailed project documentation pages
│   ├── installation.md
│   ├── architecture.md
│   ├── supported_languages.md
│   └── development.md
│
├── include/                  # C++ header files
│   ├── FileAnalyzer.hpp
│   ├── DirectoryScanner.hpp
│   └── ReportGenerator.hpp
│
├── src/                      # C++ analyzer core
│   ├── main.cpp
│   ├── DirectoryScanner.cpp
│   ├── CppAnalyzer.cpp
│   └── ReportGenerator.cpp
│
├── ui_design/                # Desktop UI source
│   ├── electron/             # Electron main process
│   ├── src/                  # React + TypeScript frontend
│   └── package.json
│
├── CMakeLists.txt            # C++ build configuration
└── README.md                 # Landing documentation page
```

---

## 👨‍💻 Team — 404 Team Not Found

| Name | Student ID | Role |
|---|---|---|
| **Nguyễn Tuấn Thành** | `25112107` | 👑 Leader |
| **Đoàn Ngọc Bích** | `25112138` | Member |
| **Nguyễn Đăng Khoa** | `25112163` | Member |

---

## 🖥️ Cross-Platform & Virtual Machine (VM) Support

**Codebase Analyzer** is designed and compiled to be natively cross-platform and fully virtual-machine-aware. It runs seamlessly on:
* **🪟 Windows (10/11 & VMs):** Fully optimized for local drives as well as guest-host mount points. Support for both x64 and ARM64 Windows environments (including Windows on ARM in Parallels/VMware).
* **🍎 macOS (Intel & Apple Silicon):** Native binaries are compiled for both x64 (Intel Macs) and ARM64 (M1/M2/M3/M4 Apple Silicon Macs).
* **🐧 Linux (Ubuntu, Debian, Fedora & VMs):** Shipped as portable AppImage packages. Supports standard environments, VirtualBox, VMware, and WSL2. For nested VMs, the sandbox can be bypassed via the `--no-sandbox` command-line flag.

The core C++23 `<filesystem>` standard library is implemented to query file status safely without overhead on both local partitions and shared virtual filesystem mount folders.

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details. Created for university course submission and academic purposes.


<div align="center">

### ⭐ If this project is useful, consider giving it a star!
**Made with 💙 C++23, Electron, React, TypeScript, and OOP design.**

</div>