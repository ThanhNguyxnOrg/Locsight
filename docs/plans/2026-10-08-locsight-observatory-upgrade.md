# Locsight Observatory Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve Locsight from a static metrics counter into a Codebase Observatory & Refactoring Decision System by shipping three high-impact pillars: Graph Heatmaps, Refactoring Hotspots, and Graph Export enhancements.

**Architecture:** All three features compose *existing* data already computed by `scanner.rs` — complexity per file, git churn per file, and dependency edges. The backend changes are purely computational (new derived fields on `ProjectSummary`). The frontend changes add new visualization modes to `Graph.tsx` and a new `Hotspots.tsx` tab. No new Rust dependencies required.

**Tech Stack:** Rust (Tauri v2 backend), React 19 + TypeScript (frontend), Recharts (charts), Tailwind CSS v4, Lucide icons.

**Spec:** [`docs/FEATURE_ROADMAP_AND_INNOVATIONS.md`](file:///D:/Code/Locsight/docs/FEATURE_ROADMAP_AND_INNOVATIONS.md)

## Global Constraints

- Rust edition 2021, no new crate dependencies unless absolutely necessary
- Frontend: React 19, TypeScript strict mode, Tailwind CSS v4 — no new npm packages (Recharts already installed)
- All struct fields use `#[serde(rename_all = "camelCase")]` for Rust-to-TS boundary
- All file paths normalized to forward slashes (`/`) before comparison
- CI must pass on Ubuntu, Windows, macOS (GitHub Actions matrix)
- Export formats must remain backward-compatible (existing JSON/CSV/MD/HTML exports unchanged)
- No new Tauri commands unless the computation cannot be done frontend-side — prefer deriving data in the frontend from existing `ProjectSummary` fields

## Review Focus

1. **Hotspot score for files with zero commits** — `ln(0 + 1) = 0`, so files outside git history silently get score 0 even if highly complex; verify the frontend handles this and still shows them in the "Complex Legacy" quadrant
2. **Graph heatmap with missing complexity data** — Markup files return `complexity = 1.0`; verify the heatmap does not visually misrepresent them as "healthy" when they simply lack a meaningful metric
3. **Mermaid export with special characters in file paths** — Paths containing spaces, parentheses, or Unicode must be properly escaped in Mermaid node IDs
4. **SVG/PNG export canvas size** — Very large graphs (1000+ nodes) could produce enormous SVG files; verify the export caps node count or warns the user
5. **Scatter plot with extremely skewed distributions** — A single outlier file with complexity=500 would crush all other dots into a corner; verify the axes use log scale or clamping

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/components/Hotspots.tsx` | Refactoring Hotspots scatter plot + top-N table (Feature 2.1) |
| Modify | `src/components/Graph.tsx` | Add heatmap color mode toggle (Feature 1.2), SVG/PNG export button (Feature 1.1) |
| Modify | `src/components/Shell.tsx` | Add "Hotspots" tab to the navigation |
| Modify | `src/types/index.ts` | Add `HotspotEntry` interface |
| Modify | `src/components/tokens.ts` | Add heatmap color scale constants |

---

### Task 1: Add Heatmap Color Scale Tokens

**Files:**
- Modify: `src/components/tokens.ts`

**Interfaces:**
- Consumes: nothing new
- Produces: `HEATMAP_COLORS: { low: string; mid: string; high: string; critical: string }` constant, `getHeatmapColor(value: number, max: number): string` function

- [ ] **Step 1: Add heatmap constants and utility to tokens.ts**

```typescript
// At the end of tokens.ts, add:

export const HEATMAP_COLORS = {
  low: "#22c55e",      // green-500
  mid: "#eab308",      // yellow-500
  high: "#f97316",     // orange-500
  critical: "#ef4444", // red-500
};

/** Returns a stepped color from green-yellow-orange-red based on value/max ratio. */
export function getHeatmapColor(value: number, max: number): string {
  if (max <= 0) return HEATMAP_COLORS.low;
  const ratio = Math.min(value / max, 1);
  if (ratio < 0.25) return HEATMAP_COLORS.low;
  if (ratio < 0.50) return HEATMAP_COLORS.mid;
  if (ratio < 0.75) return HEATMAP_COLORS.high;
  return HEATMAP_COLORS.critical;
}
```

- [ ] **Step 2: Verify tokens.ts compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to tokens.ts

- [ ] **Step 3: Commit**

```bash
git add src/components/tokens.ts
git commit -m "feat: add heatmap color scale tokens and utility"
```

---

### Task 2: Add HotspotEntry Type

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Consumes: nothing new
- Produces: `HotspotEntry` interface used by `Hotspots.tsx` and `Graph.tsx`

- [ ] **Step 1: Add HotspotEntry interface to types/index.ts**

Append after the existing `AssetReport` interface:

```typescript
export interface HotspotEntry {
  path: string;
  name: string;
  complexity: number;
  commits: number;
  hotspotScore: number; // complexity * ln(commits + 1)
  quadrant: "hotspot" | "complex-legacy" | "active-clean" | "stable";
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add HotspotEntry type for refactoring hotspots"
```

---

### Task 3: Graph Heatmap Overlay (Feature 1.2)

**Files:**
- Modify: `src/components/Graph.tsx`

**Interfaces:**
- Consumes: `ProjectSummary.files[].complexity`, `ProjectSummary.fileChurn[]`, `getHeatmapColor()` from `tokens.ts`
- Produces: `heatmapMode` state (`"default" | "complexity" | "churn" | "hotspot"`), nodes rendered with dynamic fill colors

- [ ] **Step 1: Add heatmap mode state and lookup maps**

At the top of the `Graph` component function (after existing state declarations), add:

```typescript
import { getHeatmapColor } from "./tokens";

// Inside Graph component:
type HeatmapMode = "default" | "complexity" | "churn" | "hotspot";
const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>("default");

// Build churn lookup from summary
const churnMap = useMemo(() => {
  const map = new Map<string, number>();
  if (!summary) return map;
  for (const fc of summary.fileChurn) {
    map.set(fc.filePath, fc.commits);
  }
  return map;
}, [summary]);

// Compute max values for normalization
const maxComplexity = useMemo(() => {
  if (!summary) return 1;
  return Math.max(1, ...summary.files.map(f => f.complexity));
}, [summary]);

const maxChurn = useMemo(() => {
  if (!summary) return 1;
  return Math.max(1, ...summary.fileChurn.map(fc => fc.commits));
}, [summary]);

// Heatmap color resolver
const getNodeColor = (filePath: string, defaultColor: string): string => {
  if (heatmapMode === "default") return defaultColor;
  if (!summary) return defaultColor;

  const file = summary.files.find(f => f.path === filePath);
  if (!file) return defaultColor;

  if (heatmapMode === "complexity") {
    return getHeatmapColor(file.complexity, maxComplexity);
  }
  if (heatmapMode === "churn") {
    const commits = churnMap.get(filePath) || 0;
    return getHeatmapColor(commits, maxChurn);
  }
  if (heatmapMode === "hotspot") {
    const commits = churnMap.get(filePath) || 0;
    const score = file.complexity * Math.log(commits + 1);
    const maxScore = maxComplexity * Math.log(maxChurn + 1);
    return getHeatmapColor(score, maxScore);
  }
  return defaultColor;
};
```

- [ ] **Step 2: Add heatmap mode toggle buttons to the graph toolbar**

In the toolbar area of `Graph.tsx` (near the existing ZoomIn/ZoomOut buttons), add a heatmap toggle group:

```tsx
{/* Heatmap Mode Toggle */}
<div style={{
  display: "flex", gap: 4, padding: "2px",
  background: C.surface1, borderRadius: 6, border: `1px solid ${C.border}`
}}>
  {(["default", "complexity", "churn", "hotspot"] as HeatmapMode[]).map(mode => (
    <button
      key={mode}
      onClick={() => setHeatmapMode(mode)}
      style={{
        padding: "4px 8px", fontSize: 11, fontFamily: mono,
        borderRadius: 4, border: "none", cursor: "pointer",
        background: heatmapMode === mode ? C.accent : "transparent",
        color: heatmapMode === mode ? "#fff" : C.fg2,
        transition: "all 0.15s ease",
      }}
    >
      {mode === "default" ? "Default" : mode === "complexity" ? "Complexity" : mode === "churn" ? "Churn" : "Hotspot"}
    </button>
  ))}
</div>
```

- [ ] **Step 3: Wire node fill color to heatmap resolver**

In the node rendering section of `Graph.tsx`, wherever the node circle/rect fill color is set (look for the `fill` prop on the main `<circle>` or `<rect>` element representing each node), replace the static color with:

```tsx
fill={getNodeColor(node.id, /* existing default color expression */)}
```

This ensures each node's color reflects the selected heatmap mode while falling back to the original color in "default" mode.

- [ ] **Step 4: Add a heatmap legend**

Below the graph canvas, add a small legend when heatmap is active:

```tsx
{heatmapMode !== "default" && (
  <div style={{
    display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
    background: C.surface1, borderRadius: 6, fontSize: 11, color: C.fg2,
    fontFamily: mono, border: `1px solid ${C.border}`,
    position: "absolute", bottom: 12, left: 12,
  }}>
    <span>Low</span>
    <div style={{ display: "flex", gap: 2 }}>
      {["#22c55e", "#eab308", "#f97316", "#ef4444"].map(c => (
        <div key={c} style={{ width: 16, height: 8, borderRadius: 2, background: c }} />
      ))}
    </div>
    <span>High</span>
  </div>
)}
```

- [ ] **Step 5: Verify the graph renders without errors**

Run: `npm run dev` (or `npm run build` for type-check)
Expected: Graph still renders in "default" mode identically to before. Switching to "complexity" mode colors nodes green-red. Switching to "churn" colors by commit frequency.

- [ ] **Step 6: Commit**

```bash
git add src/components/Graph.tsx
git commit -m "feat(graph): add complexity/churn/hotspot heatmap overlay modes"
```

---

### Task 4: Refactoring Hotspots Scatter Plot (Feature 2.1)

**Files:**
- Create: `src/components/Hotspots.tsx`

**Interfaces:**
- Consumes: `ProjectSummary.files[]`, `ProjectSummary.fileChurn[]`, `HotspotEntry` from types
- Produces: `Hotspots` React component (scatter plot + ranked table)

- [ ] **Step 1: Create Hotspots.tsx with data derivation and scatter plot**

```tsx
import { useState, useMemo } from "react";
import { C, mono, HEATMAP_COLORS } from "./tokens";
import { useAnalysis } from "../hooks/useAnalysis";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine, Label
} from "recharts";
import { HotspotEntry } from "../types";
import { Flame, AlertTriangle, CheckCircle, Archive } from "lucide-react";

function classifyQuadrant(
  complexity: number, commits: number,
  medianComplexity: number, medianCommits: number
): HotspotEntry["quadrant"] {
  const highComplexity = complexity > medianComplexity;
  const highChurn = commits > medianCommits;
  if (highComplexity && highChurn) return "hotspot";
  if (highComplexity && !highChurn) return "complex-legacy";
  if (!highComplexity && highChurn) return "active-clean";
  return "stable";
}

const QUADRANT_CONFIG = {
  hotspot:           { color: HEATMAP_COLORS.critical, icon: Flame,         label: "Hotspot - Refactor Priority #1" },
  "complex-legacy":  { color: HEATMAP_COLORS.high,     icon: AlertTriangle, label: "Complex Legacy - Monitor" },
  "active-clean":    { color: HEATMAP_COLORS.low,      icon: CheckCircle,   label: "Active & Clean" },
  stable:            { color: C.fg3 || "#6b7280",      icon: Archive,       label: "Stable & Simple" },
};

export function Hotspots() {
  const { summary } = useAnalysis();
  const [selectedQuadrant, setSelectedQuadrant] =
    useState<HotspotEntry["quadrant"] | "all">("all");

  const hotspots: HotspotEntry[] = useMemo(() => {
    if (!summary) return [];

    const churnMap = new Map<string, number>();
    for (const fc of summary.fileChurn) {
      churnMap.set(fc.filePath, fc.commits);
    }

    const entries: HotspotEntry[] = summary.files.map(f => {
      const commits = churnMap.get(f.path) || 0;
      return {
        path: f.path,
        name: f.name,
        complexity: f.complexity,
        commits,
        hotspotScore: f.complexity * Math.log(commits + 1),
        quadrant: "stable" as HotspotEntry["quadrant"],
      };
    });

    const complexities = entries.map(e => e.complexity).sort((a, b) => a - b);
    const commitsList = entries.map(e => e.commits).sort((a, b) => a - b);
    const medianComplexity = complexities[Math.floor(complexities.length / 2)] || 1;
    const medianCommits = commitsList[Math.floor(commitsList.length / 2)] || 1;

    for (const entry of entries) {
      entry.quadrant = classifyQuadrant(
        entry.complexity, entry.commits, medianComplexity, medianCommits
      );
    }

    return entries.sort((a, b) => b.hotspotScore - a.hotspotScore);
  }, [summary]);

  const filteredHotspots = useMemo(() => {
    if (selectedQuadrant === "all") return hotspots;
    return hotspots.filter(h => h.quadrant === selectedQuadrant);
  }, [hotspots, selectedQuadrant]);

  const quadrantCounts = useMemo(() => {
    const counts = { hotspot: 0, "complex-legacy": 0, "active-clean": 0, stable: 0 };
    for (const h of hotspots) counts[h.quadrant]++;
    return counts;
  }, [hotspots]);

  const medianComplexity = useMemo(() => {
    const sorted = hotspots.map(h => h.complexity).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] || 1;
  }, [hotspots]);

  const medianCommits = useMemo(() => {
    const sorted = hotspots.map(h => h.commits).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] || 1;
  }, [hotspots]);

  if (!summary) return null;
  if (!summary.gitAvailable) {
    return (
      <div style={{
        padding: 32, color: C.fg2, textAlign: "center",
        fontFamily: mono, fontSize: 13
      }}>
        <AlertTriangle size={32} style={{ marginBottom: 8, color: HEATMAP_COLORS.mid }} />
        <div>Hotspot analysis requires git history.</div>
        <div style={{ fontSize: 11, marginTop: 4 }}>
          Scan a git repository to enable this feature.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: "16px 20px", display: "flex", flexDirection: "column",
      gap: 16, height: "100%", overflow: "auto"
    }}>
      {/* Header */}
      <div>
        <h2 style={{
          fontSize: 16, fontWeight: 600, color: C.fg1,
          margin: 0, fontFamily: mono
        }}>
          Refactoring Hotspots
        </h2>
        <p style={{ fontSize: 12, color: C.fg3, margin: "4px 0 0", fontFamily: mono }}>
          Complexity x Git Churn — files in the top-right quadrant are priority
          refactoring targets.
        </p>
      </div>

      {/* Quadrant filter chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => setSelectedQuadrant("all")}
          style={{
            padding: "4px 10px", fontSize: 11, fontFamily: mono, borderRadius: 4,
            border: `1px solid ${selectedQuadrant === "all" ? C.accent : C.border}`,
            background: selectedQuadrant === "all" ? C.accent : "transparent",
            color: selectedQuadrant === "all" ? "#fff" : C.fg2, cursor: "pointer",
          }}
        >
          All ({hotspots.length})
        </button>
        {(Object.entries(QUADRANT_CONFIG) as
          [HotspotEntry["quadrant"], typeof QUADRANT_CONFIG["hotspot"]][]
        ).map(([q, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button
              key={q}
              onClick={() => setSelectedQuadrant(q)}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "4px 10px", fontSize: 11, fontFamily: mono, borderRadius: 4,
                border: `1px solid ${selectedQuadrant === q ? cfg.color : C.border}`,
                background: selectedQuadrant === q ? cfg.color + "22" : "transparent",
                color: selectedQuadrant === q ? cfg.color : C.fg2, cursor: "pointer",
              }}
            >
              <Icon size={12} />
              {cfg.label.split(" - ")[0].trim()} ({quadrantCounts[q]})
            </button>
          );
        })}
      </div>

      {/* Scatter Plot */}
      <div style={{
        background: C.surface1, borderRadius: 8, border: `1px solid ${C.border}`,
        padding: 16, minHeight: 320,
      }}>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
            <XAxis
              type="number" dataKey="commits" name="Git Churn (commits)"
              tick={{ fontSize: 10, fill: C.fg3, fontFamily: mono }}
              axisLine={{ stroke: C.border }} tickLine={{ stroke: C.border }}
            >
              <Label value="Git Churn (commits)" position="bottom" offset={10}
                style={{ fontSize: 11, fill: C.fg3, fontFamily: mono }} />
            </XAxis>
            <YAxis
              type="number" dataKey="complexity" name="Complexity"
              tick={{ fontSize: 10, fill: C.fg3, fontFamily: mono }}
              axisLine={{ stroke: C.border }} tickLine={{ stroke: C.border }}
            >
              <Label value="Complexity" angle={-90} position="left" offset={0}
                style={{ fontSize: 11, fill: C.fg3, fontFamily: mono }} />
            </YAxis>
            <ZAxis type="number" dataKey="hotspotScore" range={[20, 400]} name="Score" />
            <Tooltip
              content={({ payload }) => {
                if (!payload || !payload.length) return null;
                const d = payload[0].payload as HotspotEntry;
                return (
                  <div style={{
                    background: C.surface2 || C.surface1, padding: "8px 12px",
                    borderRadius: 6, border: `1px solid ${C.border}`,
                    fontSize: 11, fontFamily: mono, color: C.fg1,
                    maxWidth: 300,
                  }}>
                    <div style={{
                      fontWeight: 600, marginBottom: 4, wordBreak: "break-all"
                    }}>
                      {d.path}
                    </div>
                    <div>Complexity: {d.complexity}</div>
                    <div>Commits: {d.commits}</div>
                    <div>Hotspot Score: {d.hotspotScore.toFixed(1)}</div>
                    <div style={{
                      color: QUADRANT_CONFIG[d.quadrant].color, marginTop: 4
                    }}>
                      {QUADRANT_CONFIG[d.quadrant].label}
                    </div>
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={medianComplexity} stroke={C.fg3}
              strokeDasharray="4 4" strokeOpacity={0.5}
            />
            <ReferenceLine
              x={medianCommits} stroke={C.fg3}
              strokeDasharray="4 4" strokeOpacity={0.5}
            />
            <Scatter data={filteredHotspots} isAnimationActive={false}>
              {filteredHotspots.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={QUADRANT_CONFIG[entry.quadrant].color}
                  fillOpacity={0.7}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Top Hotspots Table */}
      <div>
        <h3 style={{
          fontSize: 13, fontWeight: 600, color: C.fg1,
          margin: "0 0 8px", fontFamily: mono
        }}>
          Top Refactoring Targets
        </h3>
        <div style={{
          background: C.surface1, borderRadius: 8,
          border: `1px solid ${C.border}`, overflow: "hidden",
        }}>
          <table style={{
            width: "100%", borderCollapse: "collapse",
            fontSize: 11, fontFamily: mono
          }}>
            <thead>
              <tr style={{ background: C.surface2 || C.surface1, color: C.fg2 }}>
                <th style={{ padding: "8px 12px", textAlign: "left",
                  borderBottom: `1px solid ${C.border}` }}>#</th>
                <th style={{ padding: "8px 12px", textAlign: "left",
                  borderBottom: `1px solid ${C.border}` }}>File</th>
                <th style={{ padding: "8px 12px", textAlign: "right",
                  borderBottom: `1px solid ${C.border}` }}>Complexity</th>
                <th style={{ padding: "8px 12px", textAlign: "right",
                  borderBottom: `1px solid ${C.border}` }}>Commits</th>
                <th style={{ padding: "8px 12px", textAlign: "right",
                  borderBottom: `1px solid ${C.border}` }}>Score</th>
                <th style={{ padding: "8px 12px", textAlign: "left",
                  borderBottom: `1px solid ${C.border}` }}>Quadrant</th>
              </tr>
            </thead>
            <tbody>
              {filteredHotspots.slice(0, 25).map((h, i) => (
                <tr key={h.path} style={{
                  borderBottom: `1px solid ${C.border}`,
                  background: i % 2 === 0 ? "transparent"
                    : (C.surface2 || C.surface1) + "44",
                }}>
                  <td style={{ padding: "6px 12px", color: C.fg3 }}>{i + 1}</td>
                  <td style={{
                    padding: "6px 12px", color: C.fg1,
                    wordBreak: "break-all", maxWidth: 300
                  }}>{h.path}</td>
                  <td style={{ padding: "6px 12px", textAlign: "right",
                    color: C.fg1 }}>{h.complexity}</td>
                  <td style={{ padding: "6px 12px", textAlign: "right",
                    color: C.fg1 }}>{h.commits}</td>
                  <td style={{
                    padding: "6px 12px", textAlign: "right",
                    color: QUADRANT_CONFIG[h.quadrant].color, fontWeight: 600
                  }}>
                    {h.hotspotScore.toFixed(1)}
                  </td>
                  <td style={{ padding: "6px 12px" }}>
                    <span style={{
                      padding: "2px 6px", borderRadius: 3, fontSize: 10,
                      background: QUADRANT_CONFIG[h.quadrant].color + "22",
                      color: QUADRANT_CONFIG[h.quadrant].color,
                    }}>
                      {h.quadrant}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify Hotspots.tsx compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/Hotspots.tsx src/types/index.ts
git commit -m "feat: add Hotspots scatter plot component (churn x complexity)"
```

---

### Task 5: Wire Hotspots Tab into Shell Navigation

**Files:**
- Modify: `src/components/Shell.tsx`

**Interfaces:**
- Consumes: `Hotspots` component from `./Hotspots`
- Produces: New "Hotspots" tab in the sidebar navigation

- [ ] **Step 1: Import Hotspots and add to tab config**

In `Shell.tsx`, add the import:

```typescript
import { Hotspots } from "./Hotspots";
```

Find the existing tabs array/config (look for entries like `{ id: "dashboard", ... }` or the tab rendering logic). Add a new entry:

```typescript
{ id: "hotspots", label: "Hotspots", icon: Flame, component: Hotspots }
```

Import `Flame` from `lucide-react` if not already imported.

- [ ] **Step 2: Add the Hotspots tab rendering**

In the tab content rendering section (the `switch`/conditional that maps tab ID to component), add:

```tsx
case "hotspots":
  return <Hotspots />;
```

Or if it uses a component map pattern, ensure `Hotspots` is mapped to `"hotspots"`.

- [ ] **Step 3: Verify tab appears and navigates correctly**

Run: `npm run dev`
Expected: "Hotspots" tab appears in the sidebar with a flame icon. Clicking it shows the scatter plot when a project with git history is loaded.

- [ ] **Step 4: Commit**

```bash
git add src/components/Shell.tsx
git commit -m "feat(shell): add Hotspots tab to navigation sidebar"
```

---

### Task 6: Graph SVG/PNG Export (Feature 1.1 Enhancement)

**Files:**
- Modify: `src/components/Graph.tsx`

**Interfaces:**
- Consumes: Graph SVG canvas DOM element
- Produces: `exportGraphSVG()` and `exportGraphPNG()` functions, toolbar buttons

The Mermaid export already exists in `Export.tsx`. This task adds direct visual export (SVG/PNG) from the Graph canvas itself — a one-click "screenshot" of the current graph view including heatmap colors.

- [ ] **Step 1: Add SVG/PNG export functions to Graph.tsx**

```typescript
const exportGraphSVG = () => {
  const svgEl = document.querySelector(
    "#locsight-graph-canvas svg"
  ) as SVGSVGElement | null;
  if (!svgEl) return;

  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const svgData = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "locsight-architecture.svg";
  a.click();
  URL.revokeObjectURL(url);
};

const exportGraphPNG = () => {
  const svgEl = document.querySelector(
    "#locsight-graph-canvas svg"
  ) as SVGSVGElement | null;
  if (!svgEl) return;

  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width * 2;  // 2x for retina
    canvas.height = img.height * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const pngUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = "locsight-architecture.png";
      a.click();
      URL.revokeObjectURL(pngUrl);
    }, "image/png");
    URL.revokeObjectURL(url);
  };
  img.src = url;
};
```

- [ ] **Step 2: Ensure the graph SVG container has a queryable ID**

Find the main container `<div>` or `<svg>` wrapping the graph canvas. Add `id="locsight-graph-canvas"` to it if it doesn't have one. Example:

```tsx
<div id="locsight-graph-canvas" style={{ ... }}>
  <svg ...>
```

- [ ] **Step 3: Add export buttons to the graph toolbar**

Near the zoom/layout controls, add two buttons:

```tsx
<button
  onClick={exportGraphSVG}
  title="Export SVG"
  style={{
    padding: "4px 8px", fontSize: 11, fontFamily: mono,
    borderRadius: 4, border: `1px solid ${C.border}`,
    background: C.surface1, color: C.fg2, cursor: "pointer",
  }}
>
  SVG
</button>
<button
  onClick={exportGraphPNG}
  title="Export PNG"
  style={{
    padding: "4px 8px", fontSize: 11, fontFamily: mono,
    borderRadius: 4, border: `1px solid ${C.border}`,
    background: C.surface1, color: C.fg2, cursor: "pointer",
  }}
>
  PNG
</button>
```

- [ ] **Step 4: Verify exports produce valid files**

Run: `npm run dev`, load a project, click SVG to verify `.svg` downloads and opens in a browser. Click PNG to verify `.png` downloads as a valid image.

- [ ] **Step 5: Commit**

```bash
git add src/components/Graph.tsx
git commit -m "feat(graph): add one-click SVG and PNG export from graph canvas"
```

---

### Task 7: Copy Mermaid to Clipboard (Feature 1.1 Quick Win)

**Files:**
- Modify: `src/components/Graph.tsx`

**Interfaces:**
- Consumes: `ProjectSummary.edges`, `ProjectSummary.architectureReport.clusters`
- Produces: `copyMermaidToClipboard()` function, toolbar button

- [ ] **Step 1: Add Mermaid generation and clipboard copy function**

```typescript
const copyMermaidToClipboard = async () => {
  if (!summary) return;

  const sanitizeId = (path: string) =>
    path.replace(/[^a-zA-Z0-9_]/g, "_").replace(/^_+/, "n_");

  const lines = ["flowchart TD"];

  // Collect unique nodes from edges
  const nodeSet = new Set<string>();
  for (const [from, to] of summary.edges) {
    nodeSet.add(from);
    nodeSet.add(to);
  }

  // Add node labels
  for (const node of nodeSet) {
    const basename = node.split("/").pop() || node;
    lines.push(`  ${sanitizeId(node)}["${basename}"]`);
  }

  // Add edges
  for (const [from, to] of summary.edges) {
    lines.push(`  ${sanitizeId(from)} --> ${sanitizeId(to)}`);
  }

  const mermaidCode = lines.join("\n");

  try {
    await navigator.clipboard.writeText(mermaidCode);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = mermaidCode;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
};
```

- [ ] **Step 2: Add "Copy Mermaid" button to toolbar**

```tsx
<button
  onClick={copyMermaidToClipboard}
  title="Copy Mermaid diagram to clipboard"
  style={{
    padding: "4px 8px", fontSize: 11, fontFamily: mono,
    borderRadius: 4, border: `1px solid ${C.border}`,
    background: C.surface1, color: C.fg2, cursor: "pointer",
  }}
>
  Mermaid
</button>
```

- [ ] **Step 3: Verify the copied Mermaid code renders correctly**

Copy the output, paste into [mermaid.live](https://mermaid.live). Expected: a valid flowchart renders with correct node names and edges.

- [ ] **Step 4: Commit**

```bash
git add src/components/Graph.tsx
git commit -m "feat(graph): add copy Mermaid diagram to clipboard button"
```

---

### Task 8: Final Integration Test and CI Verification

**Files:**
- No new files

**Interfaces:**
- Consumes: All previous tasks
- Produces: Verified green CI

- [ ] **Step 1: Run TypeScript type check**

Run: `npx tsc --noEmit`
Expected: Zero errors

- [ ] **Step 2: Run Rust tests**

Run: `cd src-tauri && cargo test`
Expected: All existing tests pass (no backend changes in this plan, but verify nothing is broken)

- [ ] **Step 3: Run full build**

Run: `npm run build`
Expected: Clean Vite build with no warnings

- [ ] **Step 4: Commit final cleanup if needed**

```bash
git add -A
git commit -m "chore: verify Phase 1 integration - all checks pass"
```

- [ ] **Step 5: Tag release**

```bash
git tag -a v2.2.0 -m "feat: Phase 1 - Graph Heatmaps, Hotspot Matrix, SVG/PNG/Mermaid Export"
```
