# 📐 Architecture

> System design overview for **Locsight** — a Rust + Tauri v2 codebase analyzer.

---

## 🏗️ High-Level Architecture

```mermaid
graph TB
    subgraph shell["🖥️ Tauri v2 Shell"]
        subgraph frontend["⚛️ React Frontend"]
            W["🏠 Welcome"]
            D["📊 Dashboard"]
            H["🫀 Health"]
            I["🔐 Insights"]
            G["🔥 Git"]
            F["📁 Files"]
            GR["🕸️ Graph"]
            E["📄 Export"]
        end

        subgraph backend["🦀 Rust Backend"]
            SC["🔍 Scanner Engine"]
            CX["🧮 Complexity"]
            UL["📏 ULOC / DRYness"]
            RL["🏷️ Roles Classifier"]
            AN["📝 Annotations"]
            SE["🔐 Secrets Scanner"]
            GI["📊 Git Churn"]
            CO["💰 COCOMO"]
            DU["🔁 Duplicate Finder"]
            CF["⚙️ Config Parser"]
        end

        frontend -- "IPC invoke()" --> backend
    end

    style shell fill:#1c1b22,stroke:#2a2935,color:#e8e6f0
    style frontend fill:#121114,stroke:#3178c6,color:#e8e6f0
    style backend fill:#121114,stroke:#dea584,color:#e8e6f0
```

---

## 🔄 Data Flow

```mermaid
flowchart LR
    A["👤 User clicks Open Folder"] --> B["📂 Native Dialog"]
    B --> C["🦀 IPC: scan_directory"]
    C --> D["🚶 WalkDir traversal"]
    D --> E["⚡ Rayon thread pool"]

    E --> F["📏 Count lines"]
    E --> G["🔢 Hash for ULOC"]
    E --> H["📝 Scan annotations"]
    E --> I["🔐 Scan secrets"]
    E --> J["🏷️ Classify role"]

    F & G & H & I & J --> K["📦 Post-scan aggregation"]

    K --> L["🧮 Complexity analysis"]
    K --> M["🔁 SHA-256 dedup"]
    K --> N["📊 Git log churn"]
    K --> O["💰 COCOMO estimate"]

    L & M & N & O --> P["📋 ProjectSummary"]
    P --> Q["⚛️ React Context"]
    Q --> R["🖥️ All UI Screens"]
```

---

## 📦 Module Breakdown

### 🦀 Rust Backend (`src-tauri/src/`)

| Module | File | Purpose |
|:---|:---|:---|
| 🔍 **Scanner** | `engine/scanner.rs` | Multi-threaded file walker with 250+ language support, shebang detection, and line counting |
| 🧮 **Complexity** | `engine/complexity.rs` | Cyclomatic complexity via keyword-based branching analysis |
| 💰 **COCOMO** | `engine/cocomo.rs` | COCOMO II cost/effort/schedule estimation |
| 🔁 **Duplicate** | `engine/duplicate.rs` | SHA-256 content hashing to detect identical files |
| 📏 **ULOC** | `engine/uloc.rs` | Unique Lines of Code via hash-set deduplication |
| 🏷️ **Roles** | `engine/roles.rs` | Semantic classification: Core / Test / Docs / Infra / Config / Scripts |
| 📝 **Annotations** | `engine/annotations.rs` | TODO / FIXME / HACK / BUG / DEPRECATED / XXX scanner |
| 🔐 **Secrets** | `engine/secrets.rs` | Credential leak detection (AWS, GitHub, Google, JWT, etc.) with entropy analysis |
| 📊 **Git** | `engine/git.rs` | Git log churn analysis, contributor extraction |
| ⚙️ **Config** | `engine/config.rs` | `.analyzer.json` custom rules parser |

### ⚛️ React Frontend (`src/`)

| Component | File | Purpose |
|:---|:---|:---|
| 🏠 **Welcome** | `components/Welcome.tsx` | Folder picker + recent projects |
| 📊 **Dashboard** | `components/Dashboard.tsx` | LOC overview, language bars, complexity, COCOMO |
| 🫀 **Health** | `components/Health.tsx` | DRYness gauge, comment density, semantic roles, health score |
| 🔐 **Insights** | `components/Insights.tsx` | Secrets alerts + searchable annotation browser |
| 🔥 **Git** | `components/Git.tsx` | Churn hotspots, contributor breakdown |
| 📁 **Files** | `components/Files.tsx` | File tree + squarified treemap |
| 🕸️ **Graph** | `components/Graph.tsx` | Circular dependency coupling graph |
| 📄 **Export** | `components/Export.tsx` | Multi-format report generator |

---

## 🧩 Component Relationships

```mermaid
graph TD
    App["App.tsx"] --> Shell["Shell.tsx"]
    Shell --> Welcome["Welcome.tsx"]
    Shell --> Dashboard["Dashboard.tsx"]
    Shell --> Health["Health.tsx"]
    Shell --> Insights["Insights.tsx"]
    Shell --> Git["Git.tsx"]
    Shell --> Files["Files.tsx"]
    Shell --> Graph["Graph.tsx"]
    Shell --> Export["Export.tsx"]

    App --> useAnalysis["useAnalysis.tsx"]
    useAnalysis --> |"invoke()"| scan["scan_directory"]
    useAnalysis --> |"invoke()"| cocomo["get_cocomo_estimate"]
    useAnalysis --> |"invoke()"| export["export_report"]

    Dashboard --> Card["Card.tsx"]
    Health --> Card
    Git --> Card

    style App fill:#f59e0b,color:#000
    style useAnalysis fill:#3178c6,color:#fff
```

---

## 🗄️ Key Data Structures

```mermaid
classDiagram
    class ProjectSummary {
        +String path
        +u32 total_files
        +u32 total_languages
        +u64 total_code
        +u64 total_comments
        +u64 total_blanks
        +u64 total_loc
        +Vec~LanguageStats~ languages
        +Vec~FileInfo~ files
        +u32 duplicates
        +f64 average_complexity
        +u64 uloc
        +f64 dryness
        +HashMap~String, RoleStats~ role_distribution
        +Vec~Annotation~ annotations
        +Vec~SecretFinding~ secrets
        +bool git_available
        +Vec~FileChurn~ file_churn
        +Vec~Contributor~ top_contributors
    }

    class RoleStats {
        +u32 files
        +u64 loc
        +f64 percentage
    }

    class Annotation {
        +String kind
        +String file_path
        +u32 line_number
        +String message
    }

    class SecretFinding {
        +String kind
        +String file_path
        +u32 line_number
        +String snippet
    }

    class FileChurn {
        +String file_path
        +u32 commits
    }

    class Contributor {
        +String author
        +u32 commits
    }

    ProjectSummary --> RoleStats
    ProjectSummary --> Annotation
    ProjectSummary --> SecretFinding
    ProjectSummary --> FileChurn
    ProjectSummary --> Contributor
```
