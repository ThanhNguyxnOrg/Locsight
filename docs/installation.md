# 📥 Installation & Setup Guide

This guide details how to install and run the **Codebase Analyzer** in both **Desktop UI** and **CLI Core** modes across different operating systems (Windows, macOS, and Linux).

---

## 🖥️ Mode 1: Desktop UI App (Recommended)

Perfect for normal users, presentations, and interactive folder traversal with visual charts and dashboards.

### ⬇️ Download Latest Release
* 📦 **[Download Latest Desktop Release](https://github.com/ThanhNguyn/Codebase-Analyzer/releases/latest)**
* 📂 **[All Published Releases](https://github.com/ThanhNguyn/Codebase-Analyzer/releases)**

---

### 🪟 1. Windows Installation & Setup
* **Selecting the Right Binary:**
  * **Intel/AMD PC or x64 VM:** Download `codebase-analyzer-win-x64.exe` (Standard & Most Common).
  * **Snapdragon laptops or ARM64 Windows VM:** Download `codebase-analyzer-win-arm64.exe`.
* **Characteristics:**
  * This is a **Portable** package (no installation needed). Double-click to run directly!
* **Troubleshooting (Windows SmartScreen Warning):**
  * *Issue:* Windows Defender might show a blue screen saying *"Windows protected your PC"*.
  * *Solution:* Click **"More info"** -> Choose **"Run anyway"**.

---

### 🍎 2. macOS Installation & Setup
* **Selecting the Right Binary:**
  * **Intel Mac or VMware/VirtualBox (Intel/AMD Host) VM:** Download `codebase-analyzer-mac-x64.dmg`.
  * **Apple Silicon Mac (M1/M2/M3/M4) or ARM64 macOS VM:** Download `codebase-analyzer-mac-arm64.dmg`.
* **Standard Installation:**
  1. Open the `.dmg` file and drag **Codebase Analyzer** to your `Applications` folder.
* **Troubleshooting (Gatekeeper Security Block):**
  * *Issue:* macOS shows an error stating *"Apple could not verify the developer..."* or refuses to open.
  * *Solution:*
    1. Make sure the app is dragged into your `/Applications` directory.
    2. Open **System Settings > Privacy & Security**, scroll down, and click **"Open Anyway"**.
    3. Go back to Applications, right-click (or Control-click) the app icon and select **"Open"**.

---

### 🐧 3. Linux Installation & Setup
* **Selecting the Right Binary:**
  * **VMware VM / Intel PC:** Download `codebase-analyzer-linux-x64.AppImage`.
  * **ARM64 Linux VM (e.g. running on Apple Silicon Host):** Download `codebase-analyzer-linux-arm64.AppImage`.
* **Troubleshooting Steps:**
  * **1. Missing Executable Permission:**
    * *Issue:* Double-clicking the `.AppImage` does not launch it.
    * *Solution:* Open your terminal in the directory where the file is downloaded and run:
      ```bash
      chmod +x codebase-analyzer-linux-x64.AppImage
      # or for arm64:
      chmod +x codebase-analyzer-linux-arm64.AppImage
      ```
  * **2. FUSE Dependency Error (`libfuse.so.2`):**
    * *Issue:* AppImage fails to load on newer Ubuntu/Debian versions due to missing FUSE 2 library.
    * *Solution:* Install the required dependency using your package manager:
      ```bash
      sudo apt update && sudo apt install libfuse2 -y
      ```
  * **3. Virtualization Sandbox Crash (`FATAL:sandbox_linux...`):**
    * *Issue:* The app crashes instantly when launched within nested virtualized machines due to standard Chromium sandbox conflicts.
    * *Solution:* Launch the app from the terminal with the `--no-sandbox` flag:
      ```bash
      ./codebase-analyzer-linux-x64.AppImage --no-sandbox
      # or for arm64:
      ./codebase-analyzer-linux-arm64.AppImage --no-sandbox
      ```

---

### 💡 4. General Usage Highlights
* **100% Offline & Private:** Operates entirely locally. None of your source files are sent to the cloud, guaranteeing maximum enterprise security.
* **Polymorphic Language Parser:** Supports syntax counting for C/C++, Python, Java, C#, JavaScript, TypeScript, HTML, and CSS.
* **Smart Noise Filtering:** The scanning engine automatically ignores bulky system folders (like `node_modules`, `.git`, and build outputs) and strictly obeys local `.gitignore` rules for ultra-high-speed scans.

---

## ⚙️ Mode 2: C++ CLI Core (Build from Source)

Ideal for developer testing, automated pipeline runs, or inspecting standard C++ OOP behavior without loading the Electron UI.

### 🧱 Prerequisites

Ensure your system has the following toolchains installed:

| Operating System | Compiler Required | Build Tools |
|:---|:---|:---|
| **🪟 Windows** | MSVC (Visual Studio 2022) or MinGW-w64 | CMake 3.20+ |
| **🍎 macOS** | Apple Clang (Xcode CLI tools) | CMake 3.20+ (`brew install cmake`) |
| **🐧 Linux** | GCC 13+ or Clang 16+ | CMake 3.20+ (`sudo apt install build-essential cmake`) |

### 📥 Clone & Setup

```bash
git clone https://github.com/ThanhNguyn/Codebase-Analyzer.git
cd Codebase-Analyzer
```

### 🔨 Build & Run Instructions by OS

#### 🪟 Windows (Powershell / Command Prompt)
```powershell
# 1. Configure the build directory
cmake -S . -B build

# 2. Build the C++ executable (Release mode)
cmake --build build --config Release

# 3. Run the analyzer on your project directory
.\build\Release\codebase_analyzer.exe .\your-project
```

#### 🍎 macOS (Terminal)
```bash
# 1. Configure the build directory
cmake -S . -B build

# 2. Build the C++ executable
cmake --build build --config Release

# 3. Run the analyzer on your project directory
./build/codebase_analyzer ./your-project
```

#### 🐧 Linux (Terminal)
```bash
# 1. Configure the build directory
cmake -S . -B build

# 2. Build the C++ executable
cmake --build build --config Release

# 3. Run the analyzer on your project directory
./build/codebase_analyzer ./your-project
```

---

## 📝 Generated Output

After running the C++ CLI analyzer, it automatically generates a high-quality Markdown report in the root directory named:
```txt
codebase_report.md
```

The report includes:
* 📁 Total source folders & scanned files
* 🧾 Line metrics: Code, Comments, and Blank lines
* 📊 Interactive language distribution breakdown
