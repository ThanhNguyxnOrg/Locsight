import { useMemo, useState } from "react";
import { C, mono, LANG_COLORS } from "./tokens";
import { useAnalysis } from "../hooks/useAnalysis";
import { FileInfo } from "../types";

export interface TreeNode {
  name: string;
  fullPath: string;
  lang?: string;
  loc?: number;
  children?: TreeNode[];
}

function getContrastColor(hexColor: string): string {
  if (!hexColor || hexColor === "transparent") return "#ffffff";
  let hex = hexColor.trim().replace("#", "");
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6) return "#ffffff";
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#121114" : "#ffffff";
}

// Helper to build a file tree from a flat file list
function buildTree(files: FileInfo[]): TreeNode[] {
  const rootNodes: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split(/[\\/]/);
    let currentLevel = rootNodes;
    let accumulatedPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
      const isLast = i === parts.length - 1;

      let existingNode = currentLevel.find((n) => n.name === part);

      if (!existingNode) {
        existingNode = {
          name: part,
          fullPath: accumulatedPath,
        };
        if (isLast) {
          existingNode.lang = file.lang;
          existingNode.loc = file.loc;
        } else {
          existingNode.children = [];
        }
        currentLevel.push(existingNode);
      }

      if (existingNode.children) {
        currentLevel = existingNode.children;
      }
    }
  }

  // Helper to recursively sort directories first, then files
  const sortTree = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      const aIsDir = !!a.children;
      const bIsDir = !!b.children;
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children) sortTree(node.children);
    }
  };

  sortTree(rootNodes);
  return rootNodes;
}

function flatten(nodes: TreeNode[], depth = 0): { node: TreeNode; depth: number }[] {
  const out: { node: TreeNode; depth: number }[] = [];
  for (const n of nodes) {
    out.push({ node: n, depth });
    if (n.children) out.push(...flatten(n.children, depth + 1));
  }
  return out;
}

type Rect = { x: number; y: number; w: number; h: number; item: FileInfo };

function squarify(items: FileInfo[], W: number, H: number): Rect[] {
  if (items.length === 0) return [];
  const rects: Rect[] = [];
  let x = 0,
    y = 0,
    remW = W,
    remH = H;
  let i = 0;
  while (i < items.length) {
    const remaining = items.slice(i);
    const remTotal = remaining.reduce((s, it) => s + it.loc, 0);
    const horizontal = remW >= remH;
    const stripSize = horizontal ? remH : remW;
    let count = 1;
    while (count < remaining.length) {
      const sum = remaining.slice(0, count + 1).reduce((s, it) => s + it.loc, 0);
      const newRatio = compareRatio(remaining.slice(0, count + 1), stripSize, sum, remTotal, remW, remH);
      const oldSum = remaining.slice(0, count).reduce((s, it) => s + it.loc, 0);
      const oldRatio = compareRatio(remaining.slice(0, count), stripSize, oldSum, remTotal, remW, remH);
      if (newRatio > oldRatio) break;
      count++;
    }
    const row = remaining.slice(0, count);
    const rowSum = row.reduce((s, it) => s + it.loc, 0);
    const stripLen = horizontal
      ? (rowSum / remTotal) * remW
      : (rowSum / remTotal) * remH;
    let cursor = horizontal ? y : x;
    for (const it of row) {
      const share = it.loc / rowSum;
      if (horizontal) {
        const h = share * remH;
        rects.push({ x, y: cursor, w: stripLen, h, item: it });
        cursor += h;
      } else {
        const w = share * remW;
        rects.push({ x: cursor, y, w, h: stripLen, item: it });
        cursor += w;
      }
    }
    if (horizontal) {
      x += stripLen;
      remW -= stripLen;
    } else {
      y += stripLen;
      remH -= stripLen;
    }
    i += count;
  }
  return rects;
}

function compareRatio(
  row: FileInfo[],
  stripSize: number,
  rowSum: number,
  total: number,
  W: number,
  H: number,
) {
  if (row.length === 0) return Infinity;
  const area = (rowSum / total) * W * H;
  const len = area / stripSize;
  let worst = 0;
  for (const it of row) {
    const a = (it.loc / total) * W * H;
    const side = a / len;
    worst = Math.max(worst, len / side, side / len);
  }
  return worst;
}

export function Files() {
  const { summary } = useAnalysis();

  if (!summary || summary.files.length === 0) {
    return (
      <div className="size-full flex items-center justify-center text-zinc-500" style={mono}>
        No files available to view.
      </div>
    );
  }

  // 1. Build tree dynamically
  const tree = useMemo(() => buildTree(summary.files), [summary.files]);
  const flat = useMemo(() => flatten(tree), [tree]);

  // Default selection to the first file
  const firstFilePath = summary.files[0]?.path || "";
  const [selectedPath, setSelectedPath] = useState<string>(firstFilePath);

  // 2. Select top 50 largest files for clean treemap visualization
  const treemapFiles = useMemo(() => {
    return [...summary.files]
      .sort((a, b) => b.loc - a.loc)
      .slice(0, 50);
  }, [summary.files]);

  const rects = useMemo(() => squarify(treemapFiles, 560, 480), [treemapFiles]);

  const selectedFile = useMemo(() => {
    return summary.files.find((f) => f.path === selectedPath) || summary.files[0];
  }, [summary.files, selectedPath]);

  if (!selectedFile) return null;

  return (
    <div
      className="grid h-full"
      style={{ gridTemplateColumns: "30% 1fr 25%", height: "100%" }}
    >
      {/* tree */}
      <div
        style={{
          borderRight: `1px solid ${C.border}`,
          padding: "20px 0",
          overflow: "auto",
        }}
      >
        <div
          style={{
            ...mono,
            fontSize: 11,
            color: C.muted,
            letterSpacing: "0.08em",
            padding: "0 20px 12px",
          }}
        >
          FILE TREE
        </div>
        {flat.map(({ node, depth }) => {
          const isFile = !node.children;
          const active = node.fullPath === selectedPath;
          return (
            <button
              key={node.fullPath + depth}
              onClick={() => isFile && setSelectedPath(node.fullPath)}
              className="w-full flex items-center text-left hover:bg-white/[0.01]"
              style={{
                padding: `5px 20px 5px ${20 + depth * 14}px`,
                background: active ? `${C.accent}15` : "transparent",
                borderLeft: active ? `2px solid ${C.accent}` : "2px solid transparent",
                ...mono,
                fontSize: 12,
                color: isFile ? C.text : C.muted,
                cursor: isFile ? "pointer" : "default",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: isFile ? LANG_COLORS[node.lang || ""] || C.muted : "transparent",
                  border: isFile ? "none" : `1px solid ${C.muted}`,
                  marginRight: 10,
                  flexShrink: 0,
                }}
              />
              <span className="truncate">{node.name}</span>
              {isFile && (
                <span style={{ marginLeft: "auto", color: C.muted, fontSize: 10 }}>
                  {node.loc}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* treemap */}
      <div style={{ padding: 24, overflow: "hidden" }} className="flex flex-col items-center">
        <div
          style={{
            ...mono,
            fontSize: 11,
            color: C.muted,
            letterSpacing: "0.08em",
            marginBottom: 14,
            width: "100%",
            textAlign: "left",
          }}
        >
          TREEMAP · SIZED BY LOC (TOP 50)
        </div>
        <div style={{ position: "relative", width: 560, height: 480 }}>
          {rects.map((r) => {
            const active = r.item.path === selectedPath;
            return (
              <button
                key={r.item.path}
                onClick={() => setSelectedPath(r.item.path)}
                style={{
                  position: "absolute",
                  left: r.x + 1,
                  top: r.y + 1,
                  width: r.w - 2,
                  height: r.h - 2,
                  background: LANG_COLORS[r.item.lang] || C.muted,
                  border: active ? `2px solid ${C.accent}` : "none",
                  cursor: "pointer",
                  padding: 6,
                  textAlign: "left",
                  overflow: "hidden",
                  color: getContrastColor(LANG_COLORS[r.item.lang] || C.muted),
                  ...mono,
                  fontSize: 10,
                }}
                title={`${r.item.name} · ${r.item.loc} loc`}
              >
                <div className="truncate font-semibold">
                  {r.item.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* details */}
      <div
        style={{
          borderLeft: `1px solid ${C.border}`,
          padding: 24,
          overflow: "auto",
        }}
      >
        <div
          style={{
            ...mono,
            fontSize: 11,
            color: C.muted,
            letterSpacing: "0.08em",
            marginBottom: 14,
          }}
        >
          FILE DETAILS
        </div>
        <div style={{ ...mono, fontSize: 13, marginBottom: 4 }} className="break-all">{selectedFile.name}</div>
        <div style={{ ...mono, fontSize: 11, color: C.muted, marginBottom: 24 }} className="break-all">
          {selectedFile.path}
        </div>

        <Row label="Language">
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: 4,
              background: LANG_COLORS[selectedFile.lang],
              marginRight: 8,
              verticalAlign: "middle",
            }}
          />
          {selectedFile.lang}
        </Row>
        <Row label="Size">{selectedFile.sizeBytes.toLocaleString()} bytes</Row>
        <Row label="Lines">{selectedFile.loc}</Row>
        <Row label="Complexity">
          <span style={{ color: C.accent }}>{selectedFile.complexity.toFixed(1)}</span>
        </Row>

        <div
          style={{
            ...mono,
            fontSize: 10,
            color: C.muted,
            letterSpacing: "0.08em",
            marginTop: 20,
            marginBottom: 8,
          }}
        >
          BREAKDOWN
        </div>
        <div
          style={{
            display: "flex",
            height: 18,
            borderRadius: 2,
            overflow: "hidden",
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ width: `${(selectedFile.code / (selectedFile.loc || 1)) * 100}%`, background: C.accent }} />
          <div style={{ width: `${(selectedFile.comments / (selectedFile.loc || 1)) * 100}%`, background: "#7c7a8a" }} />
          <div style={{ width: `${(selectedFile.blanks / (selectedFile.loc || 1)) * 100}%`, background: "#2a2935" }} />
        </div>
        <div
          className="flex justify-between"
          style={{ ...mono, fontSize: 10, color: C.muted, marginTop: 8 }}
        >
          <span>code {selectedFile.code}</span>
          <span>cmt {selectedFile.comments}</span>
          <span>blank {selectedFile.blanks}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="flex justify-between"
      style={{
        ...mono,
        fontSize: 12,
        padding: "8px 0",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <span style={{ color: C.muted }}>{label}</span>
      <span>{children}</span>
    </div>
  );
}
