# 🚀 Installation Guide

This guide covers installing and running **Locsight** on different operating systems, handling security filters for unsigned packages, and troubleshooting environments like Virtual Machines.

---

## ⚡ The Quick Way (Recommended)

Locsight is a pre-compiled, self-contained desktop application. **You do NOT need to clone this repository, install Node.js, or install Rust to use the application.** 

1. Go to the [Locsight Releases](https://github.com/ThanhNguyxnOrg/Locsight/releases) page on GitHub.
2. Download the version corresponding to your Operating System (detailed below).
3. Open and run the installer.

---

## 🪟 Windows (10 / 11)

### 1. Download Options
- **`Locsight_x64-setup.msi`** (or `.exe`): For standard Intel/AMD 64-bit PCs.
- **`Locsight_arm64-setup.msi`** (or `.exe`): For Windows on ARM laptops (e.g., Snapdragon X Elite).

### 2. Bypassing Windows SmartScreen
Because Locsight is an open-source tool and is not signed with a commercial Microsoft developer certificate, Windows SmartScreen will display a blue warning screen saying *"Windows protected your PC"*.

To run the app:
1. Click **"More info"** on the warning dialog.
2. Click **"Run anyway"** at the bottom right.

### 3. Prerequisites
- **WebView2 Runtime**: Locsight uses the native Microsoft Edge WebView2 control. It is pre-installed on Windows 11 and updated Windows 10 systems. If the app fails to open or prompts you, download it from [Microsoft's WebView2 page](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).

> [!NOTE]
> **Running inside Virtual Machines (VMware, VirtualBox, UTM, WSL2):**
> Virtualized graphics drivers in hypervisors often fail to support full WebGL / hardware acceleration in the guest OS Webview, causing a **blank white or black screen**.
>
> **The Fix:** Start the app with GPU acceleration disabled. Open Command Prompt (`cmd`) or PowerShell, navigate to the folder containing the executable, and run:
> ```cmd
> Locsight.exe --disable-gpu
> ```

---

## 🍎 macOS (Intel & Apple Silicon)

### 1. Download Options
- **`Locsight_aarch64.dmg`**: For Apple Silicon Macs (M1/M2/M3/M4).
- **`Locsight_x64.dmg`**: For older Intel-based Macs.

### 2. Bypassing Gatekeeper Quarantine
Since the application is not codesigned through Apple's paid developer program, macOS will block execution on first launch, stating *"Locsight is damaged and cannot be opened"* or *"unidentified developer"*.

To authorize and run Locsight:
1. Drag **Locsight.app** to your `/Applications` directory.
2. Open your terminal (`Terminal.app`) and execute the quarantine removal command:
   ```bash
   xattr -cr /Applications/Locsight.app
   ```
3. Double-click the application icon to open normally.

> [!NOTE]
> **Running inside macOS Virtual Machines (UTM / Parallels):**
> If you encounter rendering issues or a blank white window due to hypervisor GPU limitations, launch the app from Terminal with:
> ```bash
> /Applications/Locsight.app/Contents/MacOS/Locsight --disable-gpu
> ```

---

## 🐧 Linux (Debian, Ubuntu, Fedora, Arch)

### 1. Download Options
- **`.deb`**: Recommended for Debian-based systems (Ubuntu, Mint) - compiled for both `amd64` (Intel/AMD) and `arm64` (ARM devices like Raspberry Pi).
- **`.AppImage`**: Portable executable compatible with most distributions.

### 2. Installing System Webview Dependencies
Linux versions require WebKit2GTK for rendering the user interface.
Run the commands below depending on your package manager:

#### Debian / Ubuntu / Mint
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-0 libgtk-3-0 libsoup-3.0-0
```

#### Fedora / RedHat
```bash
sudo dnf install webkit2gtk4.1 gtk3 libsoup3
```

#### Arch Linux / Manjaro
```bash
sudo pacman -S webkit2gtk-4.1 gtk3 libsoup3
```

### 3. Running AppImage
If using the AppImage, grant execution permissions before launching:
```bash
chmod +x Locsight_1.0.0_amd64.AppImage
./Locsight_1.0.0_amd64.AppImage
```

> [!NOTE]
> **Running inside Linux VMs or WSL2 (with WSLg):**
> To avoid blank rendering window issues caused by hypervisor virtual graphics drivers, run the app using either parameter flags or the Tauri GPU disable environment variable:
> ```bash
> TAURI_DISABLE_GPU=1 ./Locsight
> # OR
> ./Locsight --disable-gpu
> ```

---

## 🛠️ Developer Setup (Building from Source)

If you want to modify or compile Locsight yourself:

### 1. Prerequisites
- **Node.js** (v18+)
- **Rust** (v1.75+ / `cargo`)

### 2. Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/ThanhNguyxnOrg/Locsight.git
   cd Locsight
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run tauri dev
   ```
4. Build release packages:
   ```bash
   npm run tauri build
   ```
   Compiled binaries will be generated inside the `src-tauri/target/release/bundle/` directory.
