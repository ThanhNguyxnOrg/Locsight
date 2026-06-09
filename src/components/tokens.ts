export const C = {
  bg: "#121114",
  surface: "#1c1b22",
  border: "#2a2935",
  text: "#e8e6f0",
  muted: "#7c7a8a",
  accent: "#f59e0b",
};

export const LANG_COLORS: Record<string, string> = {
  // Core / Common
  Rust: "#dea584",
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  CSS: "#563d7c",
  HTML: "#e34c26",
  JSON: "#292929",
  Markdown: "#083fa1",
  Shell: "#89e051",
  TOML: "#9c4221",
  YAML: "#cb171e",
  
  // JVM
  Java: "#b07219",
  Kotlin: "#A97BFF",
  Scala: "#c22d40",
  Groovy: "#427819",
  Gradle: "#02303a",

  // Microsoft / Systems
  "C#": "#178600",
  C: "#555555",
  "C++": "#f34b7d",
  "C Header": "#555555",
  "C++ Header": "#f34b7d",
  Assembly: "#6E4C13",
  PowerShell: "#012456",

  // Web / Design
  PHP: "#4F5D95",
  Ruby: "#701516",
  Swift: "#F05138",
  Dart: "#00B4AB",
  Vue: "#41B883",
  Svelte: "#ff3e00",
  Astro: "#ff5a03",
  Less: "#1d365d",
  Sass: "#a53b70",
  SCSS: "#c6538c",

  // Functional / Scientific
  Elixir: "#6e4a7e",
  Erlang: "#B83998",
  Elm: "#60B5CC",
  PureScript: "#1D222D",
  Haskell: "#5e5086",
  Clojure: "#db5855",
  Lisp: "#3fb68b",
  "Common Lisp": "#3fb68b",
  Scheme: "#1e4aec",
  Racket: "#3c5caa",
  Coq: "#ab0000",
  Odin: "#60A5FA",
  V: "#4f87c4",
  Zig: "#ec915c",
  "Zig Config": "#ec915c",
  OCaml: "#3be133",
  D: "#ba595e",
  Nim: "#37775b",
  Crystal: "#000100",
  Mojo: "#ff4c3b",
  LaTeX: "#3D6117",
  MATLAB: "#e16737",

  // Databases & Query
  SQL: "#e38c00",
  "PL/SQL": "#f0a84c",
  "T-SQL": "#e38c00",
  CQL: "#007acc",
  HiveQL: "#fb9b22",
  PRQL: "#1b78e2",

  // Config / IaC / DevOps
  Dockerfile: "#384d54",
  Makefile: "#427819",
  CMake: "#DA3434",
  "Protocol Buffers": "#0F802F",
  GraphQL: "#e10098",
  HCL: "#844fba",
  Dhall: "#dfafff",
  CUE: "#58c4e6",
  Jsonnet: "#0064b6",
  "JSON-LD": "#0c4b33",
  Bicep: "#519aba",
  Starlark: "#76d275",

  // Markup / Docs
  XML: "#0060ac",
  INI: "#d1d1d1",
  reStructuredText: "#147fa0",
  AsciiDoc: "#15a9ff",
  "Org-mode": "#77aa99",
  Textile: "#ffe79a",

  // Game Dev & Shaders
  GDScript: "#355570",
  GLSL: "#5686a5",
  Solidity: "#AA6746",
  Typst: "#239dad",
  Nix: "#7e7eff",
  UnrealScript: "#a54c4c",
  GDResource: "#355570",
  GDShader: "#355570",

  // Apple Specific
  "Xcode Config": "#1475c0",
  "Xcode Project": "#1475c0",
  
  // Legacy / Scripting
  "VB.NET": "#945db7",
  VBScript: "#15dcdc",
  VBA: "#867db1",
  Delphi: "#b0ce4e",
  RPG: "#2BDE21",
  Tcl: "#e4cc98",
  AWK: "#c30e9b",
  AutoHotkey: "#65766c",
  AutoIt: "#3670a0",
  AppleScript: "#101f10",
  
  // Other
  ATS: "#1a1a1a",
  Beancount: "#f43f5e",
  EDN: "#db5855",
};

export const TECH_CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Frontend: { bg: "rgba(59, 130, 246, 0.1)", text: "#60a5fa", border: "rgba(59, 130, 246, 0.2)" },
  Backend: { bg: "rgba(16, 185, 129, 0.1)", text: "#34d399", border: "rgba(16, 185, 129, 0.2)" },
  Database: { bg: "rgba(139, 92, 246, 0.1)", text: "#a78bfa", border: "rgba(139, 92, 246, 0.2)" },
  DevOps: { bg: "rgba(245, 158, 11, 0.1)", text: "#fbbf24", border: "rgba(245, 158, 11, 0.2)" },
  Testing: { bg: "rgba(236, 72, 153, 0.1)", text: "#f472b6", border: "rgba(236, 72, 153, 0.2)" },
  Infrastructure: { bg: "rgba(14, 165, 233, 0.1)", text: "#38bdf8", border: "rgba(14, 165, 233, 0.2)" },
  Build: { bg: "rgba(107, 114, 128, 0.1)", text: "#9ca3af", border: "rgba(107, 114, 128, 0.2)" },
  Utility: { bg: "rgba(75, 85, 99, 0.1)", text: "#d1d5db", border: "rgba(75, 85, 99, 0.2)" },
};

export const mono = { fontFamily: "'JetBrains Mono', monospace" };
export const sans = { fontFamily: "'Inter', sans-serif" };

