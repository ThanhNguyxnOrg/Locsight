# Ecosystem Research & Benchmark: GitNexus, CodeScene & Next-Gen Code Intelligence

*Date: October 2026*  
*Target: Locsight Architecture & Feature Roadmap*

---

## 1. Executive Summary & Research Goal

Locsight is a high-performance, desktop-native (Tauri v2 + Rust) codebase health, metrics, and architecture analyzer. To determine high-impact features that strictly align with Locsight's identity as a **codebase observatory and refactoring diagnostic tool**, we analyzed market-leading tools in this problem space:
- **[GitNexus](https://github.com/abhigyanpatwari/GitNexus)** (47k+ stars): Zero-server code intelligence engine, knowledge graph, blast radius impact analysis, and Model Context Protocol (MCP) provider.
- **[CodeScene](https://codescene.com/)**: Industry-standard behavioral code analysis pioneer (Churn × Complexity Hotspots, Temporal Coupling, Code Health).
- **[GitTruck](https://github.com/git-truck/git-truck)**: Repository developer knowledge visualization, Bus Factor, and ownership decay.
- **[Sourcetrail](https://github.com/CoatiSoftware/Sourcetrail)** / **[Dependency-Cruiser](https://github.com/sverweij/dependency-cruiser)**: Interactive architecture dependency navigation.

---

## 2. Key Tool Benchmarks & Core Value Analysis

| Tool | Core Philosophy | Killer Feature | Data Inputs |
|---|---|---|---|
| **GitNexus** | "Zero-server code intelligence for developers & AI agents" | **1. Blast Radius / Impact Analysis**<br>**2. Built-in MCP Server** for AI code awareness | Code AST / Import graph |
| **CodeScene** | "Behavioral code analysis: code meets version control" | **1. Hotspots Matrix** (Churn × Complexity)<br>**2. Temporal Coupling** | Git history + Cyclomatic Complexity |
| **GitTruck** | "Understand who built what and identify knowledge risks" | **Bus Factor / Knowledge Island Detection** per file & folder | Git blame + commit log |
| **Locsight (Current)** | "Fast desktop codebase health & architecture analyzer" | 546 languages LOC, DRYness (ULOC), Tarjan cycles, Asset orphans, Secrets, COCOMO | Static filesystem + shallow git log |

---

## 3. Top High-Value Capabilities to Incorporate into Locsight

Dựa trên nghiên cứu các công cụ trên, dưới đây là 3 năng lực cốt lõi có giá trị thực tế cao nhất, hoàn toàn ăn khớp và nâng tầm bản sắc của Locsight:

### 🌟 Tính năng 1: Blast Radius & Impact Inspector *(Học từ GitNexus)*
- **Bản chất**: Khi lập trình viên hoặc AI muốn sửa một file (ví dụ: `scanner.rs` hay `types/index.ts`), câu hỏi lớn nhất là: **"Nếu tôi sửa file này, những file nào sẽ bị ảnh hưởng (Break downstream)?"**
- **Cơ chế triển khai trong Locsight**:
  - Locsight đã có sẵn đồ thị liên kết `edges` trong `architecture.rs` ($C_a, C_e$).
  - Khi người dùng click chọn bất kỳ file nào trong Files, Graph hay Dashboard, giao diện mở ra một drawer/panel **"Impact & Blast Radius Inspector"**:
    - **Upstream Dependents (Ai phụ thuộc vào file này?)**: Danh sách các file trực tiếp và gián tiếp import file này kèm cấp độ rủi ro (Low / Medium / Critical).
    - **Temporal Co-Changes**: Các file thường xuyên phải sửa cùng nhau trong lịch sử Git (từ `change_coupling`).
    - **Visual Subgraph**: Trích xuất riêng cụm đồ thị liên quan đến file đó thay vì bắt người dùng nhìn toàn bộ mạng lưới hàng ngàn file.

### 🌟 Tính năng 2: Refactoring Hotspot Matrix (Churn × Complexity) *(Học từ CodeScene)*
- **Bản chất**: CodeScene trở thành công ty phân tích code hàng đầu thế giới nhờ luận điểm: *"Hầu hết technical debt không quan trọng — chỉ những file vừa phức tạp vừa bị sửa đổi liên tục mới là ổ phát sinh lỗi (Hotspot)."*
- **Cơ chế triển khai trong Locsight**:
  - Locsight hiện đã tính `complexity` trong `complexity.rs` và `file_churn` trong `git.rs`. Nhưng hai chỉ số này đang đứng riêng lẻ!
  - Kết hợp hai chỉ số thành **Hotspot Score**:  
    $$\text{Hotspot Score} = \text{Complexity} \times \ln(\text{Commits} + 1)$$
  - Trực quan hóa thành **Ma trận 2D (Risk Quadrant)** trong tab Health hoặc tab Architecture:
    - 🔴 **Hotspots**: Churn cao, Complexity cao $\rightarrow$ Ưu tiên tái cấu trúc số 1.
    - 🟡 **Complex Legacy**: Complexity cao, Churn thấp $\rightarrow$ Để yên, không đụng vào.
    - 🟢 **Active Clean**: Churn cao, Complexity thấp $\rightarrow$ Khu vực phát triển lành mạnh.

### 🌟 Tính năng 3: Locsight Native MCP Server *(Học từ GitNexus)*
- **Bản chất**: GitNexus thu hút hàng chục ngàn lập trình viên vì hỗ trợ **Model Context Protocol (MCP)**. Các AI Agent (Cursor, Claude Code, Antigravity) có thể gọi trực tiếp vào công cụ để hỏi thông tin kiến trúc trước khi sinh code.
- **Cơ chế triển khai trong Locsight**:
  - Vì Locsight viết bằng Rust/Tauri, Locsight có thể cung cấp cờ CLI `--mcp` hoặc khởi chạy một Local stdio/SSE MCP server.
  - Cung cấp các tool cho AI:
    - `get_project_summary`: Lấy thông tin tổng quan LOC, công nghệ, health score.
    - `get_file_impact(path)`: Trả về Blast Radius để AI biết sửa file này thì cần cẩn thận file nào.
    - `get_hotspots`: Trả về danh sách các file nợ kỹ thuật nghiêm trọng nhất.

---

## 4. Kết luận & Đề xuất hành động

Locsight sở hữu lợi thế áp đảo về tốc độ native (Rust + Tauri) và tính riêng tư 100% offline. Bằng cách bổ sung **Blast Radius (Impact Analysis)** và **Hotspot Matrix (Churn × Complexity)**, Locsight sẽ biến từ một công cụ "đo đếm dòng code thuần túy" thành một **Đài quan sát kiến trúc & hỗ trợ ra quyết định tái cấu trúc mã nguồn (Code Intelligence & Refactoring Decision System)** thực thụ.
