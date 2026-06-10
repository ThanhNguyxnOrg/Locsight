import { useState, useEffect } from "react";
import { C, mono } from "./tokens";
import { FileJson, FileSpreadsheet, FileText, FileCode, CheckCircle, AlertCircle, Share2 } from "lucide-react";
import { useAnalysis } from "../hooks/useAnalysis";
import { save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

const FORMATS = [
  { id: "JSON", icon: FileJson, extension: "json", desc: "machine-readable, full data" },
  { id: "CSV", icon: FileSpreadsheet, extension: "csv", desc: "per-file metrics rows" },
  { id: "MARKDOWN", icon: FileText, extension: "md", desc: "readme-friendly summary" },
  { id: "HTML", icon: FileCode, extension: "html", desc: "interactive standalone report" },
];

const ARCH_FORMATS = [
  { id: "Mermaid", extension: "mmd", desc: "Flowchart diagram code for github readme" },
  { id: "Draw.io", extension: "drawio", desc: "Interactive diagram editable in draw.io editor" },
  { id: "Structurizr", extension: "dsl", desc: "C4 model dsl script for structurizr CLI" },
];

interface ExportHistoryItem {
  fmt: string;
  path: string;
  at: string;
}

const escapeXml = (str: string): string => {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

export function Export() {
  const {
    summary,
    exportSummaryReport,
    includeCode,
    includeMultimedia,
    includeGame,
    includeCad,
    includeDocuments,
    updateIncludeCode: setIncludeCode,
    updateIncludeMultimedia: setIncludeMultimedia,
    updateIncludeGame: setIncludeGame,
    updateIncludeCad: setIncludeCad,
    updateIncludeDocuments: setIncludeDocuments,
  } = useAnalysis();
  
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cb_analyzer_exports");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (_) {
        localStorage.removeItem("cb_analyzer_exports");
      }
    }
  }, []);

  const getParentFolder = (path: string): string => {
    const parts = path.replace(/\\/g, "/").split("/");
    if (parts.length > 1) {
      return parts.slice(0, parts.length - 1).join("/");
    }
    return "root";
  };

  const handleExport = async (formatId: string, extension: string) => {
    if (!summary) return;
    setStatus(null);
    setExporting(formatId);

    try {
      const defaultName = `locsight-report.${extension}`;
      const filePath = await save({
        filters: [{
          name: `${formatId} File`,
          extensions: [extension],
        }],
        defaultPath: defaultName,
        title: `Export report as ${formatId}`,
      });

      if (filePath) {
        await exportSummaryReport(filePath, formatId.toLowerCase(), {
          includeCode,
          includeMultimedia,
          includeGame,
          includeCad,
          includeDocuments
        });
        
        addHistoryItem(formatId, filePath);
        setStatus({ type: "success", msg: `Successfully exported report to ${filePath}` });
      }
    } catch (err: any) {
      setStatus({ type: "error", msg: `Failed to export report: ${err?.toString() || "Unknown error"}` });
    } finally {
      setExporting(null);
    }
  };

  const addHistoryItem = (fmt: string, path: string) => {
    const newHistItem: ExportHistoryItem = {
      fmt: fmt,
      path: path,
      at: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
    const updatedHistory = [newHistItem, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem("cb_analyzer_exports", JSON.stringify(updatedHistory));
  };

  const handleArchExport = async (formatId: string, extension: string) => {
    if (!summary) return;
    setStatus(null);
    setExporting(formatId);

    try {
      const defaultName = `locsight-architecture.${extension}`;
      const filePath = await save({
        filters: [{
          name: `${formatId} Model`,
          extensions: [extension],
        }],
        defaultPath: defaultName,
        title: `Export architecture model as ${formatId}`,
      });

      if (filePath) {
        let content = "";
        
        // Map each file path to its parent folder (component level)
        const fileToFolder: Record<string, string> = {};
        summary.files.forEach((f) => {
          const normPath = f.path.replace(/\\/g, "/");
          fileToFolder[normPath] = getParentFolder(normPath);
        });

        const uniqueFolders = Array.from(new Set(Object.values(fileToFolder)));
        
        if (formatId === "Mermaid") {
          content = "graph TD\n";
          
          // Generate component-level connections
          const folderEdges = new Set<string>();
          summary.edges.forEach(([src, dest]) => {
            const normSrc = src.replace(/\\/g, "/");
            const normDest = dest.replace(/\\/g, "/");
            const srcFolder = fileToFolder[normSrc] || getParentFolder(normSrc);
            const destFolder = fileToFolder[normDest] || getParentFolder(normDest);
            
            if (srcFolder && destFolder && srcFolder !== destFolder) {
              const srcId = srcFolder.replace(/[^a-zA-Z0-9]/g, "_") || "root_folder";
              const destId = destFolder.replace(/[^a-zA-Z0-9]/g, "_") || "root_folder";
              const edgeKey = `${srcId} --> ${destId}`;
              
              if (!folderEdges.has(edgeKey)) {
                folderEdges.add(edgeKey);
                content += `  ${srcId}["${srcFolder}"] --> ${destId}["${destFolder}"]\n`;
              }
            }
          });

        } else if (formatId === "Draw.io") {
          content = `<mxfile host="Electron" modified="${new Date().toISOString()}" agent="Locsight" version="20.0.0" type="device">
  <diagram id="LocsightDiagram" name="Architecture Diagram">
    <mxGraphModel dx="1200" dy="1200" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />`;
          
          // Count files inside each folder
          const folderFilesCount: Record<string, number> = {};
          summary.files.forEach((f) => {
            const normPath = f.path.replace(/\\/g, "/");
            const folder = fileToFolder[normPath];
            folderFilesCount[folder] = (folderFilesCount[folder] || 0) + 1;
          });

          // Compute dependency levels for Hierarchical (Top-Down) Layout
          const levels: Record<string, number> = {};
          uniqueFolders.forEach(f => {
            levels[f] = 0;
          });

          // Build folder connections list
          const folderConnections: { src: string; dest: string }[] = [];
          const seenConnections = new Set<string>();

          summary.edges.forEach(([src, dest]) => {
            const normSrc = src.replace(/\\/g, "/");
            const normDest = dest.replace(/\\/g, "/");
            const srcFolder = fileToFolder[normSrc];
            const destFolder = fileToFolder[normDest];
            if (srcFolder && destFolder && srcFolder !== destFolder) {
              const key = `${srcFolder}->${destFolder}`;
              if (!seenConnections.has(key)) {
                seenConnections.add(key);
                folderConnections.push({ src: srcFolder, dest: destFolder });
              }
            }
          });

          // Bellman-Ford style relaxation to push dependent modules down (to higher level index)
          // Limit iterations to uniqueFolders.length to prevent infinite loops from circular dependencies
          for (let iter = 0; iter < uniqueFolders.length; iter++) {
            let changed = false;
            for (const conn of folderConnections) {
              if (levels[conn.dest] <= levels[conn.src]) {
                levels[conn.dest] = levels[conn.src] + 1;
                changed = true;
              }
            }
            if (!changed) break;
          }

          // Group folders by their calculated level
          const layers: Record<number, string[]> = {};
          uniqueFolders.forEach(folder => {
            const lvl = levels[folder] || 0;
            if (!layers[lvl]) layers[lvl] = [];
            layers[lvl].push(folder);
          });

          const activeLevels = Object.keys(layers).map(Number).sort((a, b) => a - b);

          // Place component boxes in grid based on their hierarchy level
          activeLevels.forEach((lvl) => {
            const foldersInLayer = layers[lvl];
            const K = foldersInLayer.length;
            const gapX = K > 4 ? 180 : 230; // shrink slightly if many components in one layer
            const startX = 500 - ((K - 1) * gapX) / 2; // center align
            
            foldersInLayer.forEach((folder, idx) => {
              const x = Math.round(startX + idx * gapX - 85); // 85 is half of 170 (box width)
              const y = 80 + lvl * 180; // 180px gap between vertical layers
              const cleanId = folder.replace(/[^a-zA-Z0-9]/g, "_") || "root_folder";
              const fileCount = folderFilesCount[folder] || 0;
              
              content += `\n        <mxCell id="${cleanId}" value="${escapeXml(folder)}&#xa;(${fileCount} files)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1c1b22;strokeColor=#f59e0b;strokeWidth=2;fontColor=#e8e6f0;fontFamily=Courier New;fontSize=12;align=center;" vertex="1" parent="1">
          <mxGeometry x="${x}" y="${y}" width="170" height="70" as="geometry" />
        </mxCell>`;
            });
          });

          // Generate component-level edges with curved orthogonal styling
          const folderEdges = new Set<string>();
          let edgeIdx = 0;
          summary.edges.forEach(([src, dest]) => {
            const normSrc = src.replace(/\\/g, "/");
            const normDest = dest.replace(/\\/g, "/");
            const srcFolder = fileToFolder[normSrc];
            const destFolder = fileToFolder[normDest];
            
            if (srcFolder && destFolder && srcFolder !== destFolder) {
              const srcId = srcFolder.replace(/[^a-zA-Z0-9]/g, "_") || "root_folder";
              const destId = destFolder.replace(/[^a-zA-Z0-9]/g, "_") || "root_folder";
              const edgeKey = `${srcId}->${destId}`;
              
              if (!folderEdges.has(edgeKey)) {
                folderEdges.add(edgeKey);
                content += `\n        <mxCell id="edge_${edgeIdx}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#38bdf8;strokeWidth=1.5;curved=1;" edge="1" parent="1" source="${srcId}" target="${destId}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>`;
                edgeIdx++;
              }
            }
          });

          content += `\n      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

        } else if (formatId === "Structurizr") {
          const systemName = summary.path.replace(/\\/g, "/").split("/").pop() || "System";
          content = `workspace {\n    model {\n        user = person "User"\n        softwareSystem = softwareSystem "${systemName}" {\n`;
          
          const componentsMap: Record<string, string[]> = {};
          summary.files.forEach((f) => {
            const normPath = f.path.replace(/\\/g, "/");
            const parent = getParentFolder(normPath);
            if (!componentsMap[parent]) componentsMap[parent] = [];
            componentsMap[parent].push(normPath);
          });

          content += `            container = container "Application Codebase" {\n`;
          
          Object.entries(componentsMap).forEach(([folder, files]) => {
            const cleanFolder = folder.replace(/\\/g, "/");
            const compName = cleanFolder.replace(/[^a-zA-Z0-9]/g, "_") || `root_folder`;
            content += `                ${compName} = component "${cleanFolder}" "${files.length} files inside"\n`;
          });
          
          content += `            }\n`;
          content += `        }\n`;
          content += `        user -> softwareSystem "Uses"\n`;
          
          const folderEdges = new Set<string>();
          summary.edges.forEach(([src, dest]) => {
            const normSrc = src.replace(/\\/g, "/");
            const normDest = dest.replace(/\\/g, "/");
            const srcFolder = getParentFolder(normSrc);
            const destFolder = getParentFolder(normDest);
            if (srcFolder !== destFolder) {
              const srcName = srcFolder.replace(/[^a-zA-Z0-9]/g, "_") || `root_folder`;
              const destName = destFolder.replace(/[^a-zA-Z0-9]/g, "_") || `root_folder`;
              const edgeKey = `${srcName} -> ${destName}`;
              if (!folderEdges.has(edgeKey)) {
                folderEdges.add(edgeKey);
                // Structurizr DSL Component relationship uses component variables directly
                content += `        ${srcName} -> ${destName} "Calls"\n`;
              }
            }
          });

          content += `    }\n`;
          content += `    views {\n        component container {\n            include *\n            autoLayout\n        }\n        theme default\n    }\n}`;
        }

        // Write content to selected file path using write_text_file Tauri command
        await invoke("write_text_file", { path: filePath, content });
        addHistoryItem(formatId, filePath);
        setStatus({ type: "success", msg: `Successfully exported diagram to ${filePath}` });
      }
    } catch (err: any) {
      setStatus({ type: "error", msg: `Failed to export diagram: ${err?.toString() || "Unknown error"}` });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="px-10 py-8 h-full overflow-y-auto" style={{ background: C.bg }}>
      <div style={{ ...mono, fontSize: 11, color: C.muted, letterSpacing: "0.08em", marginBottom: 6 }}>
        EXPORT SUMMARY REPORT
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>
        Choose a format. Export saves a complete report file containing stats and file summaries.
      </div>

      {/* Export Section Customizer */}
      <div className="mb-6 p-4 rounded-lg border flex flex-col gap-3" style={{ borderColor: C.border, background: C.surface }}>
        <div style={{ ...mono, fontSize: 10, color: C.muted, letterSpacing: "0.08em" }}>
          SELECT SECTIONS TO INCLUDE IN REPORT
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-white/90 hover:text-white select-none">
            <input
              type="checkbox"
              checked={includeCode}
              onChange={(e) => setIncludeCode(e.target.checked)}
              className="accent-amber-500 rounded border-zinc-700 bg-black"
            />
            <span>Code Analysis (Rust, C++, etc.)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-white/90 hover:text-white select-none">
            <input
              type="checkbox"
              checked={includeMultimedia}
              onChange={(e) => setIncludeMultimedia(e.target.checked)}
              className="accent-amber-500 rounded border-zinc-700 bg-black"
            />
            <span>Multimedia (Images, Video, Audio)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-white/90 hover:text-white select-none">
            <input
              type="checkbox"
              checked={includeGame}
              onChange={(e) => setIncludeGame(e.target.checked)}
              className="accent-amber-500 rounded border-zinc-700 bg-black"
            />
            <span>Game & 3D (Models, Prefabs, Textures)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-white/90 hover:text-white select-none">
            <input
              type="checkbox"
              checked={includeCad}
              onChange={(e) => setIncludeCad(e.target.checked)}
              className="accent-amber-500 rounded border-zinc-700 bg-black"
            />
            <span>CAD Drawings (DXF, DWG)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-white/90 hover:text-white select-none">
            <input
              type="checkbox"
              checked={includeDocuments}
              onChange={(e) => setIncludeDocuments(e.target.checked)}
              className="accent-amber-500 rounded border-zinc-700 bg-black"
            />
            <span>Documents & Others (Docs, Databases)</span>
          </label>
        </div>
      </div>

      {status && (
        <div
          className={`flex items-center gap-2 mb-6 px-4 py-2 border rounded-md max-w-2xl ${
            status.type === "success"
              ? "border-emerald-900/50 bg-emerald-950/20 text-emerald-400"
              : "border-red-900/50 bg-red-950/20 text-red-400"
          }`}
          style={{ ...mono, fontSize: 11 }}
        >
          {status.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          <span className="break-all">{status.msg}</span>
        </div>
      )}

      {/* Grid of Standard Reports */}
      <div className="grid gap-4 md:grid-cols-4 mb-10">
        {FORMATS.map((f) => {
          const Icon = f.icon;
          const isCurrentExporting = exporting === f.id;
          return (
            <div
              key={f.id}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: 180,
              }}
            >
              <div>
                <Icon size={20} color={C.accent} strokeWidth={1.5} />
                <div style={{ ...mono, fontSize: 13, marginTop: 10, fontWeight: 600, letterSpacing: "0.04em" }}>
                  {f.id}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                  {f.desc}
                </div>
              </div>
              
              <button
                onClick={() => handleExport(f.id, f.extension)}
                disabled={exporting !== null || !summary}
                className="w-full flex items-center justify-center hover:brightness-110 active:scale-98 transition-all disabled:opacity-50"
                style={{
                  ...mono,
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "7px 0",
                  background: "transparent",
                  border: `1px solid ${C.accent}`,
                  color: C.accent,
                  borderRadius: 4,
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                }}
              >
                {isCurrentExporting ? "EXPORTING..." : "EXPORT REPORT"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Architecture Model Exporters */}
      <div>
        <div style={{ ...mono, fontSize: 11, color: C.muted, letterSpacing: "0.08em", marginBottom: 6 }}>
          LIVING ARCHITECTURE MODEL & DIAGRAM EXPORTERS
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>
          Export codebase dependency models into third-party formats for editing, presentations, or README documentation.
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {ARCH_FORMATS.map((f) => {
            const isCurrentExporting = exporting === f.id;
            return (
              <div
                key={f.id}
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: 180,
                }}
              >
                <div>
                  <Share2 size={20} color="#38bdf8" strokeWidth={1.5} />
                  <div style={{ ...mono, fontSize: 13, marginTop: 10, fontWeight: 600, letterSpacing: "0.04em" }}>
                    {f.id.toUpperCase()} (.{f.extension})
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                    {f.desc}
                  </div>
                </div>
                
                <button
                  onClick={() => handleArchExport(f.id, f.extension)}
                  disabled={exporting !== null || !summary}
                  className="w-full flex items-center justify-center hover:brightness-110 active:scale-98 transition-all disabled:opacity-50"
                  style={{
                    ...mono,
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "7px 0",
                    background: "transparent",
                    border: "1px solid #38bdf8",
                    color: "#38bdf8",
                    borderRadius: 4,
                    cursor: "pointer",
                    letterSpacing: "0.06em",
                  }}
                >
                  {isCurrentExporting ? "EXPORTING..." : `EXPORT ${f.id.toUpperCase()}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export History */}
      {history.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div
            style={{
              ...mono,
              fontSize: 11,
              color: C.muted,
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}
          >
            EXPORT HISTORY
          </div>
          <div style={{ borderTop: `1px solid ${C.border}` }}>
            {history.map((h, i) => (
              <div
                key={h.path + i}
                className="flex items-center gap-4"
                style={{
                  padding: "12px 4px",
                  borderBottom: `1px solid ${C.border}`,
                  ...mono,
                  fontSize: 11,
                }}
              >
                <span
                  style={{
                    color: h.fmt === "Mermaid" || h.fmt === "Draw.io" || h.fmt === "Structurizr" ? "#38bdf8" : C.accent,
                    fontSize: 10,
                    fontWeight: 600,
                    width: 80,
                    letterSpacing: "0.06em",
                  }}
                >
                  {h.fmt}
                </span>
                <span style={{ flex: 1, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={h.path}>
                  {h.path}
                </span>
                <span style={{ color: C.muted, flexShrink: 0 }}>{h.at}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
