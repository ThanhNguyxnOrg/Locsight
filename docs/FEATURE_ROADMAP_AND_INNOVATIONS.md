# 🗺️ Locsight Feature Roadmap & Architectural Innovations

> **Mục tiêu:** Nâng tầm Locsight từ công cụ đếm dòng mã nguồn và phân tích tĩnh thành một **Hệ điều hành Quan sát Mã nguồn & Hỗ trợ Ra quyết định Tái cấu trúc (Codebase Observatory & Refactoring Decision System)** toàn diện, chạy siêu tốc trên nền tảng Rust + Tauri v2.

Tài liệu này tổng hợp các nghiên cứu chuyên sâu từ những repository và công cụ hàng đầu thế giới (**GitNexus, CodeScene, GitDiagram, Knip, GitTruck, Madge, CodeCharta, Repomix**) để lập danh mục tính năng theo 5 trụ cột chiến lược.

---

## 🏛️ Trụ cột 1: Đồ thị & Sơ đồ Kiến trúc (Graph & Visual Diagramming)
*Tham chiếu: [GitDiagram](https://gitdiagram.com), [Swark](https://github.com/swark-io/swark), [Madge](https://github.com/pahen/madge), [Sourcetrail](https://github.com/CoatiSoftware/Sourcetrail)*

| Tính năng | Mô tả chi tiết | Giá trị thực tế | Mức độ ưu tiên |
|---|---|---|---|
| **1.1. Export Mermaid.js / SVG / PNG** | Thêm nút xuất 1-click chuyển đổi cấu trúc đồ thị hiện tại thành mã **Mermaid.js** (`flowchart TD` / `classDiagram`) và file ảnh vector **SVG/PNG**. | Lập trình viên có thể copy ngay vào `README.md`, GitHub PR description, Notion, hoặc Obsidian để làm tài liệu kiến trúc sống. | **P0 (Quick Win)** |
| **1.2. Heatmap Overlay trên Graph** | Bổ sung thanh chọn chế độ màu cho Node: *Default*, *Complexity Heatmap* (Xanh $\rightarrow$ Đỏ), *Git Churn Heatmap*, hoặc *Hotspot Heatmap*. Node to nhỏ theo LOC. | Biến đồ thị tĩnh thành bản đồ nhiệt, giúp dev nhìn lướt qua là thấy ngay các "khối u" kiến trúc phức tạp trong mạng lưới. | **P0 (High Value)** |
| **1.3. Dependency Path Finder** | Cho phép chọn File A và File B $\rightarrow$ Tự động tìm và làm sáng duy nhất chuỗi phụ thuộc ngắn nhất nối giữa 2 file: `A ➔ Module X ➔ Module Y ➔ B`. | Giải quyết câu hỏi kinh điển: *"Tại sao file này lại kéo theo module kia?"* khi tách module hoặc debug dependency. | **P1** |
| **1.4. Interactive Cycle Isolator** | Bấm vào bất kỳ Circular Dependency nào trong danh sách $\rightarrow$ Graph tự động ẩn các node không liên quan, phóng to và phát sáng chu trình kín `A ➔ B ➔ C ➔ A` bằng màu đỏ động. | Giúp dev hình dung trực quan và gỡ rối vòng lặp phụ thuộc ngay lập tức thay vì phải tự dò code. | **P1** |

---

## 🌋 Trụ cột 2: Phân tích Hành vi & Nợ kỹ thuật (Behavioral Analysis & Hotspots)
*Tham chiếu: [CodeScene](https://codescene.com), [CodeCharta](https://github.com/MaibornWolff/codecharta)*

| Tính năng | Mô tả chi tiết | Giá trị thực tế | Mức độ ưu tiên |
|---|---|---|---|
| **2.1. Refactoring Hotspots Matrix** | Kết hợp `complexity` và `git_churn` thành chỉ số **Hotspot Score**: $$Score = Complexity \times \ln(Commits + 1)$$ Vẽ đồ thị 2D 4 góc phần tư (*Risk Quadrant*). | Chỉ điểm chính xác 5% file nguy hiểm nhất — nơi code vừa phức tạp vừa sửa đổi liên tục, gây ra 80% bug của dự án. | **P0 (Core Value)** |
| **2.2. Maintainability Index (MI) & Tech Debt Hours** | Tính chỉ số bảo trì chuẩn công nghiệp (thang 0-100) dựa trên Halstead Volume, McCabe Complexity và LOC. Ước tính số giờ/ngày công cần thiết để dọn nợ kỹ thuật. | Bổ sung cho COCOMO: COCOMO tính chi phí *viết mới*, còn MI tính chi phí *bảo trì & dọn dẹp*. | **P1** |
| **2.3. Temporal Coupling Matrix** | Tận dụng `change_coupling` có sẵn để hiển thị ma trận các cặp file "dính chùm" (thường xuyên phải sửa cùng nhau trong commit dù không trực tiếp import). | Cảnh báo vi phạm nguyên lý Single Responsibility và nguy cơ *Shotgun Surgery* khi sửa code. | **P1** |

---

## 🧹 Trụ cột 3: Vệ sinh Mã nguồn & File Rác (Code Hygiene & Dead Code Hunting)
*Tham chiếu: [Knip](https://github.com/webpro-nl/knip), [ts-prune](https://github.com/nadecode/ts-prune), [jscpd](https://github.com/kucherenko/jscpd)*

| Tính năng | Mô tả chi tiết | Giá trị thực tế | Mức độ ưu tiên |
|---|---|---|---|
| **3.1. Orphan Code Files Detection** | Dựa trên $C_a = 0$ (không có file nào import) và không phải file khởi đầu (`main`, `index`, `App`, config), gắn nhãn **Unused Code Candidate**. | Mở rộng tính năng phát hiện file mồ côi từ Assets sang Source Code, giúp dọn sạch file rác sau các đợt refactor lớn. | **P1** |
| **3.2. Code Duplication Diff Viewer** | Ở danh sách file duplicate, khi click vào một cặp file trùng lặp sẽ hiển thị bảng so sánh side-by-side hoặc highlight chính xác đoạn code giống nhau. | Giúp dev kiểm chứng ngay lập tức đoạn code bị copy-paste để gộp lại thành hàm chung. | **P2** |

---

## 👥 Trụ cột 4: Tri thức Đội ngũ & Lịch sử Dự án (Team & Git Knowledge)
*Tham chiếu: [GitTruck](https://github.com/git-truck/git-truck), [Hercules](https://github.com/src-d/hercules)*

| Tính năng | Mô tả chi tiết | Giá trị thực tế | Mức độ ưu tiên |
|---|---|---|---|
| **4.1. Bus Factor & Knowledge Island Warning** | Phân tích commit author trên từng thư mục/file. Cảnh báo những file cốt lõi có độ phức tạp cao nhưng 100% commit chỉ do **1 người duy nhất** thực hiện. | Cảnh báo rủi ro nhân sự (Key Person Dependency): nếu dev đó nghỉ việc, module đó sẽ trở thành "hộp đen" không ai dám sửa. | **P2** |
| **4.2. Code Age & Fossilization Tracker** | Phân loại mã nguồn theo độ tuổi (chỉnh sửa gần đây < 1 tháng, ổn định < 1 năm, hóa thạch > 2 năm) kèm biểu đồ phân bố. | Giúp dev mới vào dự án biết khu vực nào đang hoạt động sôi nổi và khu vực nào là code cũ ít động tới. | **P2** |

---

## 🤖 Trụ cột 5: Tương tác AI & Môi trường CI/CD (AI & Ecosystem Interop)
*Tham chiếu: [GitNexus](https://github.com/abhigyanpatwari/GitNexus), [Repomix](https://github.com/yamadashy/repomix)*

| Tính năng | Mô tả chi tiết | Giá trị thực tế | Mức độ ưu tiên |
|---|---|---|---|
| **5.1. Locsight Local MCP Server** | Tích hợp giao thức **Model Context Protocol (MCP)** vào binary Locsight (`locsight --mcp`). Cho phép Cursor, Claude Code, Antigravity truy vấn kiến trúc, hot spots, blast radius. | Cung cấp nhận thức kiến trúc thời gian thực cho AI coding assistants, ngăn chặn AI sửa code làm gãy vỡ hệ thống. | **P1 (Strategic)** |
| **5.2. Repo-to-Prompt & Token Estimator** | Cho phép chọn cây thư mục, tự động đếm token (tiktoken BPE), lọc bỏ comment/vendor, xuất ra 1 file prompt chuẩn hóa cho LLM với 1 cú click. | Trở thành trợ thủ đắc lực thay thế các tool dòng lệnh rời rạc như Repomix/Gitingest. | **P2** |
| **5.3. Headless CI/CD Gate (`locsight --ci`)** | Chạy Locsight dưới dạng CLI không giao diện trong GitHub Actions. Hỗ trợ exit code lỗi nếu phát sinh thêm Circular Dependency hoặc Health Score tụt dốc. | Giữ vững chất lượng code tự động cho team trước khi merge PR. | **P2** |

---

## 🗓️ Lộ trình Triển khai Đề xuất (Phased Execution)

```
[Phase 1: Visual & Hotspot Quick Wins]
  ├── 1.1 Export Mermaid.js / SVG / PNG (Graph)
  ├── 1.2 Heatmap Overlay (Complexity & Churn trên Graph)
  └── 2.1 Refactoring Hotspot Matrix (Churn × Complexity Dashboard)

[Phase 2: Deep Architecture & Hygiene]
  ├── 1.3 Dependency Path Finder
  ├── 1.4 Circular Dependency Isolator
  ├── 3.1 Orphan Code Files Detection
  └── 2.2 Maintainability Index (MI) & Tech Debt Hours

[Phase 3: AI & Team Intelligence]
  ├── 5.1 Locsight Local MCP Server
  ├── 4.1 Bus Factor & Knowledge Island Warning
  └── 5.3 Headless CI/CD Mode
```
