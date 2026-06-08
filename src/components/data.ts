export const LANG_DATA = [
  { name: "Rust", files: 312, code: 21840, comments: 3210, blanks: 2104, pct: 46.1 },
  { name: "TypeScript", files: 198, code: 12420, comments: 1820, blanks: 1502, pct: 26.2 },
  { name: "Python", files: 112, code: 5210, comments: 980, blanks: 612, pct: 11.0 },
  { name: "CSS", files: 64, code: 3120, comments: 210, blanks: 412, pct: 6.6 },
  { name: "JSON", files: 88, code: 1840, comments: 0, blanks: 12, pct: 3.9 },
  { name: "HTML", files: 24, code: 1240, comments: 80, blanks: 110, pct: 2.6 },
  { name: "Go", files: 18, code: 920, comments: 110, blanks: 80, pct: 1.9 },
  { name: "Shell", files: 22, code: 410, comments: 90, blanks: 60, pct: 0.9 },
  { name: "Markdown", files: 32, code: 240, comments: 0, blanks: 80, pct: 0.5 },
  { name: "TOML", files: 14, code: 80, comments: 12, blanks: 14, pct: 0.2 },
  { name: "YAML", files: 6, code: 42, comments: 4, blanks: 8, pct: 0.1 },
  { name: "JavaScript", files: 2, code: 20, comments: 2, blanks: 4, pct: 0.05 },
];

export const TOTAL_LOC = 47382;
export const TOTAL_FILES = 892;
export const TOTAL_LANGS = 12;
export const COST_EST = 340800;

export const RECENT = [
  { path: "~/projects/locsight", date: "2026-06-08 09:12", files: 892 },
  { path: "~/work/internal/billing-service", date: "2026-06-07 18:30", files: 1240 },
  { path: "~/oss/ripgrep", date: "2026-06-05 14:02", files: 318 },
  { path: "~/projects/tauri-experiments", date: "2026-06-02 11:48", files: 76 },
];

export const TREE: TreeNode[] = [
  {
    name: "src",
    children: [
      { name: "main.rs", lang: "Rust", loc: 412 },
      { name: "lib.rs", lang: "Rust", loc: 280 },
      {
        name: "scanner",
        children: [
          { name: "walker.rs", lang: "Rust", loc: 640 },
          { name: "parser.rs", lang: "Rust", loc: 820 },
          { name: "metrics.rs", lang: "Rust", loc: 510 },
        ],
      },
      {
        name: "ui",
        children: [
          { name: "App.tsx", lang: "TypeScript", loc: 320 },
          { name: "Dashboard.tsx", lang: "TypeScript", loc: 480 },
          { name: "styles.css", lang: "CSS", loc: 210 },
        ],
      },
    ],
  },
  {
    name: "scripts",
    children: [
      { name: "build.py", lang: "Python", loc: 180 },
      { name: "release.sh", lang: "Shell", loc: 90 },
    ],
  },
  { name: "Cargo.toml", lang: "TOML", loc: 48 },
  { name: "README.md", lang: "Markdown", loc: 120 },
];

export type TreeNode = {
  name: string;
  lang?: string;
  loc?: number;
  children?: TreeNode[];
};

export const TREEMAP_FILES = [
  { name: "parser.rs", lang: "Rust", loc: 820 },
  { name: "walker.rs", lang: "Rust", loc: 640 },
  { name: "metrics.rs", lang: "Rust", loc: 510 },
  { name: "Dashboard.tsx", lang: "TypeScript", loc: 480 },
  { name: "main.rs", lang: "Rust", loc: 412 },
  { name: "App.tsx", lang: "TypeScript", loc: 320 },
  { name: "lib.rs", lang: "Rust", loc: 280 },
  { name: "styles.css", lang: "CSS", loc: 210 },
  { name: "build.py", lang: "Python", loc: 180 },
  { name: "README.md", lang: "Markdown", loc: 120 },
  { name: "release.sh", lang: "Shell", loc: 90 },
  { name: "Cargo.toml", lang: "TOML", loc: 48 },
];

export const COMPLEXITY_DIST = [4, 9, 14, 22, 31, 28, 19, 12, 6, 3];

export const GRAPH_NODES = [
  { id: "main", lang: "Rust", x: 200, y: 220 },
  { id: "lib", lang: "Rust", x: 360, y: 180 },
  { id: "scanner/walker", lang: "Rust", x: 520, y: 100 },
  { id: "scanner/parser", lang: "Rust", x: 540, y: 240 },
  { id: "scanner/metrics", lang: "Rust", x: 700, y: 180 },
  { id: "ui/App", lang: "TypeScript", x: 380, y: 380 },
  { id: "ui/Dashboard", lang: "TypeScript", x: 560, y: 420 },
  { id: "ui/styles", lang: "CSS", x: 720, y: 380 },
  { id: "scripts/build", lang: "Python", x: 200, y: 420 },
];

export const GRAPH_EDGES: [string, string][] = [
  ["main", "lib"],
  ["lib", "scanner/walker"],
  ["lib", "scanner/parser"],
  ["scanner/parser", "scanner/metrics"],
  ["scanner/walker", "scanner/metrics"],
  ["ui/App", "ui/Dashboard"],
  ["ui/Dashboard", "ui/styles"],
  ["main", "ui/App"],
  ["scripts/build", "main"],
];
