# Codebase Analyzer
> Local codebase analysis tool with a real browser UI and a native C++ core.

[![C++](https://img.shields.io/badge/C++-23-blue.svg?logo=c%2B%2B)](https://isocpp.org/)
[![CMake](https://img.shields.io/badge/CMake-3.20+-green.svg?logo=cmake)](https://cmake.org/)
[![OOP](https://img.shields.io/badge/Architecture-OOP-orange.svg)]()
[![Team](https://img.shields.io/badge/Team-404_Not_Found-ff69b4.svg)]()

---

## 👥 Về Dự Án & Đội Ngũ
- **Nhóm thực hiện:** 404 Team Not Found 🕵️‍♂️
- **Thành viên:** Nguyễn Tuấn Thành (Mã SV: 25112107) 👨‍💻
- **Ngôn ngữ triển khai:** C++ (Tiêu chuẩn C++23) ⚙️

---

## 🎯 Mục Tiêu & Đối Tượng Người Dùng

👨‍🎓 **Đối tượng người dùng chính:**
Sinh viên ngành Công nghệ thông tin, kỹ sư phần mềm, quản lý dự án hoặc bất kỳ ai có nhu cầu đánh giá, kiểm tra cấu trúc và quy mô của một kho lưu trữ mã nguồn cục bộ (Local Codebase).

🏁 **Mục tiêu của dự án:**
Xây dựng một công cụ dòng lệnh (CLI) hiệu năng cao mang tên **Codebase Analyzer**. Ứng dụng giúp tự động hóa quy trình phân tích cấu trúc mã nguồn thông qua việc quét đệ quy các thư mục, nhận diện chính xác các loại tệp tin lập trình phổ biến (như C++, Python, HTML/CSS/JS, Java, C#). 

## 🌍 Ngôn Ngữ Hỗ Trợ (Supported Languages)

Hệ thống được thiết kế linh hoạt, nhận diện và bóc tách cấu trúc của các ngôn ngữ sau:

| Ngôn Ngữ / Nền tảng | Đuôi file (Extensions) | Loại Comment Hỗ Trợ |
| :--- | :--- | :--- |
| **C / C++** | `.c`, `.cpp`, `.h`, `.hpp` | `//` (Dòng đơn) và `/* ... */` (Khối) |
| **Java** | `.java` | `//` (Dòng đơn) và `/* ... */` (Khối) |
| **C#** | `.cs` | `//` (Dòng đơn) và `/* ... */` (Khối) |
| **Python** | `.py` | `#` (Dòng đơn) và `""" ... """`, `''' ... '''` (Khối / Docstring) |
| **Web (Frontend)** | `.html`, `.css`, `.js`, `.ts` | `<!-- ... -->`, `/* ... */`, `//` |

---

## ✨ Tính Năng Nổi Bật

- **Phân tích siêu tốc đa ngôn ngữ:** Xử lý hàng loạt các file mã nguồn ở trên chỉ trong nháy mắt.
- **Phân loại chính xác:** Tách bạch rõ ràng số lượng dòng code thực thi, dòng comment và dòng trống.
- **Web app thật:** UI có thể quét snapshot của chính repo này hoặc một folder local được chọn trong trình duyệt.

---

## ⚙️ Core Logic & Workflow (Luồng Xử Lý Lõi)

Chương trình hoạt động dựa trên một chu trình khép kín, tối ưu hóa I/O để đạt hiệu suất quét cực nhanh:

1. **Khởi tạo (Initialization):** Hàm `main()` tiếp nhận đường dẫn thư mục nguồn. Lớp `DirectoryScanner` được khởi tạo với đường dẫn này.
2. **Quét thư mục (Directory Scanning):** Sử dụng `std::filesystem::recursive_directory_iterator`, hệ thống quét toàn bộ cây thư mục. 
   - 🗑️ **Bộ lọc:** Tự động loại bỏ các thư mục rác (ví dụ: `.git`, `node_modules`, `build`, `venv`).
   - 🔍 **Nhận diện tệp:** Nếu là tệp tin hợp lệ (`.cpp`, `.py`, `.html`...), một đối tượng đa hình (polymorphic object) tương ứng của `FileAnalyzer` sẽ được tạo và đẩy vào vector lưu trữ.
3. **Phân tích (Analysis & Parsing):** Hệ thống duyệt qua danh sách các tệp tin đã nạp, gọi phương thức ảo `analyze()`. Mỗi Analyzer (`CppAnalyzer`, `PythonAnalyzer`, `WebAnalyzer`) sẽ chạy thuật toán Parser dòng-theo-dòng (line-by-line) riêng biệt để bóc tách:
   - Các dòng trống.
   - Các dòng Comment (dòng đơn hoặc block/multi-line comment).
   - Code logic thực sự.
4. **Tổng hợp & Báo cáo (Report Generation):** Cuối cùng, `ReportGenerator` tính toán số liệu tổng (Total LOC, Comment, Blank) và phân bổ phần trăm % cho từng ngôn ngữ, sau đó kết xuất ra Console và file `codebase_report.md`.

---

## 🧩 Sơ Đồ Thiết Kế UML (UML Diagrams)

Dưới đây là các sơ đồ thiết kế hệ thống được dựng bằng **PlantUML** bám sát theo Proposal của nhóm.

### 1. Use Case Diagram

![Use Case Diagram](assets/image_01.png)

### 2. Class Diagram (OOP Architecture)

Hệ thống được thiết kế theo đúng triết lý Lập trình Hướng Đối Tượng (OOP) đảm bảo khả năng mở rộng (Tính kế thừa, đa hình, và tính đóng gói thành phần).

![Class Diagram](assets/image_02.png)

---

## 💻 Stack Công Nghệ & Thư Viện

Dự án sử dụng sức mạnh tối đa của **C++23** nhằm tối ưu hóa triệt để tốc độ xử lý I/O luồng dữ liệu file:

- 📂 `<filesystem>`: Duyệt đệ quy qua toàn bộ cây thư mục an toàn, đa nền tảng.
- 🛡️ **Smart Pointers** (`<memory>`): Sử dụng `std::unique_ptr` để quản lý vòng đời của các đối tượng đa hình, ngăn ngừa 100% lỗi rò rỉ bộ nhớ (Memory Leak).
- 🧹 `<algorithm>` & `<string>`: Áp dụng thuật toán tiêu chuẩn để tối ưu hóa quá trình khớp mẫu.

---

## 🗺️ Lộ Trình Triển Khai (Roadmap)

✅ **Tuần 1:**
- Hoàn thiện tài liệu Proposal & Bản vẽ sơ đồ UML (Use Case, Class Diagram).
- Xây dựng Codebase nền tảng có khả năng quét thư mục đệ quy với `<filesystem>`.
- Phát triển thành công module `DirectoryScanner`.

✅ **Tuần 2:**
- Hiện thực hóa chi tiết phương thức ảo `analyze()` tại `CppAnalyzer`, `PythonAnalyzer`, `WebAnalyzer`.
- Xử lý thuật toán loại bỏ comment khối, comment dòng đơn chuẩn xác.
- Xây dựng module kết xuất dữ liệu thống kê ra Console và File Markdown.
- Hoàn thiện mã nguồn (100% sạch bug) và sẵn sàng báo cáo nghiệm thu.

---

## 🛠️ Hướng Dẫn Cài Đặt & Sử Dụng

### 1. Build Dự Án 🏗️

Yêu cầu máy tính có cài đặt trình biên dịch hỗ trợ **C++23** và **CMake (v3.20+)**.

```bash
# Clone dự án về máy
git clone https://github.com/ThanhNguyn/Codebase-Analyzer.git
cd Codebase-Analyzer

# Khởi tạo thư mục build & Cấu hình CMake
cmake -B build

# Biên dịch mã nguồn thành file thực thi
cmake --build build
```

### 2. Chạy UI web

```bash
cd ui_design
npm install
npm run dev
```

### 3. Khởi Chạy Công Cụ 🚀

Bạn có thể phân tích **bất kỳ thư mục nào** bằng cách truyền đường dẫn vào phần mềm. Nếu không truyền đường dẫn, ứng dụng sẽ phân tích luôn chính thư mục hiện tại.

```bash
# Windows
.\build\Release\codebase_analyzer.exe

# macOS / Linux
./build/Release/codebase_analyzer

# Phân tích một thư mục được chỉ định
.\build\Release\codebase_analyzer.exe "C:\Users\Name\MyProject"
```

🎉 **Kết Quả:** Sau vài mili-giây, bạn sẽ thấy bảng báo cáo siêu chi tiết in ngay trên Terminal/Console, và một file `codebase_report.md` được sinh tự động lưu trữ kết quả phân tích!

### 4. GitHub Actions

Workflow tại `.github/workflows/ci.yml` sẽ build CLI trên Windows, macOS, và Linux, rồi upload artifact riêng cho `codebase-analyzer-windows`, `codebase-analyzer-macos`, và `codebase-analyzer-linux`.
Mỗi artifact là đúng một binary riêng theo OS, không còn lớp zip lồng thêm bên ngoài, nên tải xuống là có thể chạy trực tiếp.
