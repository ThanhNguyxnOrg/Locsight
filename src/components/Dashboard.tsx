import { useState, useMemo } from "react";
import { C, mono, LANG_COLORS, TECH_CATEGORY_COLORS } from "./tokens";
import { Card } from "./Card";
import { useAnalysis } from "../hooks/useAnalysis";
import { FileCode, Image as ImageIcon, Compass, Layers, FileText } from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function Dashboard() {
  const {
    summary,
    cocomoRate,
    setCocomoRate,
    includeCode: showCode,
    includeMultimedia: showMultimedia,
    includeGame: showGame,
    includeCad: showCad,
    includeDocuments: showDocuments,
    updateIncludeCode: setShowCode,
    updateIncludeMultimedia: setShowMultimedia,
    updateIncludeGame: setShowGame,
    updateIncludeCad: setShowCad,
    updateIncludeDocuments: setShowDocuments,
  } = useAnalysis();
  const [hover, setHover] = useState<string | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);

  const toggleShow = (_key: string, value: boolean, setter: (val: boolean) => void) => {
    setter(value);
  };

  if (!summary) return null;

  const assetReport = summary.assetReport;

  // Active files filtering based on visibility toggles
  const allActiveFiles = useMemo(() => {
    const list: any[] = [];

    const getAssetCategory = (ext: string): string | null => {
      const extLower = ext.toLowerCase();
      const multimediaExts = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "psd", "tiff", "tif", "ai", "heic", "heif", "mp4", "m4v", "mov", "avi", "mkv", "webm", "flv", "mp3", "wav", "ogg", "ogv", "oga", "flac", "aac", "m4a"];
      const gameExts = ["fbx", "obj", "gltf", "glb", "blend", "stl", "dae", "tga", "dds", "meta", "prefab", "unity", "asset", "uasset", "umap", "uproject", "tscn", "tres", "gdns", "gdnlib", "import"];
      const cadExts = ["dxf", "dwg", "step", "stp", "iges", "igs"];
      const docExts = ["txt", "text", "md", "markdown", "pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt", "ttf", "otf", "woff", "woff2", "zip", "tar", "gz", "tgz", "7z", "rar", "sqlite", "db", "parquet", "arrow"];

      if (multimediaExts.includes(extLower)) return "multimedia";
      if (gameExts.includes(extLower)) return "game_3d";
      if (cadExts.includes(extLower)) return "cad_drawing";
      if (docExts.includes(extLower)) return "document";
      return null;
    };

    const assetAsFileInfo = (a: any) => ({
      name: a.name,
      path: a.path,
      lang: a.subcategory ? a.subcategory.toUpperCase() : "ASSET",
      loc: 0,
      code: 0,
      comments: 0,
      blanks: 0,
      sizeBytes: a.size,
      complexity: 0
    });

    // 1. Add files from code scan
    if (showCode) {
      summary.files.forEach(f => {
        const ext = f.path.split('.').pop() || "";
        const cat = getAssetCategory(ext);
        if (cat === "multimedia" && !showMultimedia) return;
        if (cat === "game_3d" && !showGame) return;
        if (cat === "cad_drawing" && !showCad) return;
        if (cat === "document" && !showDocuments) return;
        list.push(f);
      });
    }

    // 2. Add files from asset scan
    if (summary.assetReport) {
      summary.assetReport.assets.forEach(a => {
        const cat = a.category;
        const isDocRelated = ["document", "font", "archive", "data"].includes(cat);
        
        if (cat === "multimedia" && showMultimedia) {
          list.push(assetAsFileInfo(a));
        } else if (cat === "game_3d" && showGame) {
          list.push(assetAsFileInfo(a));
        } else if (cat === "cad_drawing" && showCad) {
          list.push(assetAsFileInfo(a));
        } else if (isDocRelated && showDocuments) {
          list.push(assetAsFileInfo(a));
        }
      });
    }

    return list;
  }, [summary, showCode, showMultimedia, showGame, showCad, showDocuments]);

  // Recalculate languages stats dynamically
  const activeLanguages = useMemo(() => {
    const langGroups: Record<string, { files: number; code: number; comments: number; blanks: number }> = {};
    let totalLoc = 0;

    allActiveFiles.forEach(f => {
      const loc = f.code + f.comments + f.blanks;
      totalLoc += loc;
      if (!langGroups[f.lang]) {
        langGroups[f.lang] = { files: 0, code: 0, comments: 0, blanks: 0 };
      }
      langGroups[f.lang].files += 1;
      langGroups[f.lang].code += f.code;
      langGroups[f.lang].comments += f.comments;
      langGroups[f.lang].blanks += f.blanks;
    });

    const list = Object.entries(langGroups).map(([name, stats]) => {
      const loc = stats.code + stats.comments + stats.blanks;
      const pct = totalLoc > 0 ? (loc / totalLoc) * 100 : 0;
      return {
        name,
        files: stats.files,
        code: stats.code,
        comments: stats.comments,
        blanks: stats.blanks,
        pct,
      };
    });

    list.sort((a, b) => (b.code + b.comments + b.blanks) - (a.code + a.comments + a.blanks));
    return list;
  }, [allActiveFiles]);

  // Recalculate dynamic statistics
  const dynamicStats = useMemo(() => {
    const filesCount = allActiveFiles.length;
    const locCount = allActiveFiles.reduce((sum, f) => sum + (f.code + f.comments + f.blanks), 0);
    const langsCount = activeLanguages.length;

    // Calculate COCOMO Organic mode
    const kloc = locCount / 1000.0;
    let effort = 0;
    let devTime = 0;
    let cost = 0;
    if (kloc > 0) {
      effort = 2.4 * Math.pow(kloc, 1.05);
      devTime = 2.5 * Math.pow(effort, 0.38);
      cost = effort * (cocomoRate * 1000.0);
    }

    return {
      totalFiles: filesCount,
      totalLoc: locCount,
      totalLanguages: langsCount,
      effort: Math.round(effort * 10) / 10,
      devTime: Math.round(devTime * 10) / 10,
      estimatedCostUsd: Math.round(cost),
    };
  }, [allActiveFiles, activeLanguages, cocomoRate]);

  // Recalculate average complexity & complexity distribution
  const dynamicComplexity = useMemo(() => {
    let totalComplexity = 0.0;
    const complexityDist = Array(10).fill(0);
    let codeFilesCount = 0;

    allActiveFiles.forEach(f => {
      if (f.complexity !== undefined && f.loc > 0) { 
        totalComplexity += f.complexity;
        codeFilesCount += 1;

        const compIdx = Math.min(9, (() => {
          const val = f.complexity;
          if (val <= 1) return 0;
          if (val <= 3) return 1;
          if (val <= 5) return 2;
          if (val <= 7) return 3;
          if (val <= 9) return 4;
          if (val <= 12) return 5;
          if (val <= 15) return 6;
          if (val <= 18) return 7;
          if (val <= 20) return 8;
          return 9;
        })());
        complexityDist[compIdx] += 1;
      }
    });

    const averageComplexity = codeFilesCount > 0 ? totalComplexity / codeFilesCount : 1.0;

    return {
      averageComplexity,
      complexityDist,
      codeFilesCount
    };
  }, [allActiveFiles]);

  // Recalculate duplicates dynamically
  const dynamicDuplicates = useMemo(() => {
    if (!showCode) {
      return { count: 0, groups: [] as string[][] };
    }

    const getAssetCategory = (ext: string): string | null => {
      const extLower = ext.toLowerCase();
      const multimediaExts = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "psd", "tiff", "tif", "ai", "heic", "heif", "mp4", "m4v", "mov", "avi", "mkv", "webm", "flv", "mp3", "wav", "ogg", "ogv", "oga", "flac", "aac", "m4a"];
      const gameExts = ["fbx", "obj", "gltf", "glb", "blend", "stl", "dae", "tga", "dds", "meta", "prefab", "unity", "asset", "uasset", "umap", "uproject", "tscn", "tres", "gdns", "gdnlib", "import"];
      const cadExts = ["dxf", "dwg", "step", "stp", "iges", "igs"];
      const docExts = ["txt", "text", "md", "markdown", "pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt", "ttf", "otf", "woff", "woff2", "zip", "tar", "gz", "tgz", "7z", "rar", "sqlite", "db", "parquet", "arrow"];

      if (multimediaExts.includes(extLower)) return "multimedia";
      if (gameExts.includes(extLower)) return "game_3d";
      if (cadExts.includes(extLower)) return "cad_drawing";
      if (docExts.includes(extLower)) return "document";
      return null;
    };

    const isPathExcluded = (p: string) => {
      const ext = p.split('.').pop() || "";
      const cat = getAssetCategory(ext);
      if (cat === "multimedia" && !showMultimedia) return true;
      if (cat === "game_3d" && !showGame) return true;
      if (cat === "cad_drawing" && !showCad) return true;
      if (cat === "document" && !showDocuments) return true;
      return false;
    };

    const filteredGroups = (summary.duplicateGroups || [])
      .map(group => group.filter(p => !isPathExcluded(p)))
      .filter(group => group.length > 1);

    const count = filteredGroups.reduce((acc, group) => acc + group.length, 0);

    return {
      count,
      groups: filteredGroups
    };
  }, [summary, showCode, showMultimedia, showGame, showCad, showDocuments]);

  // Extract directory name for breadcrumb
  const pathParts = summary.path.split(/[\\/]/);
  const projectName = pathParts[pathParts.length - 1] || summary.path;

  // Est. Cost from COCOMO
  const estCostStr = dynamicStats.estimatedCostUsd ? `$${fmt(dynamicStats.estimatedCostUsd)}` : "—";

  return (
    <div className="px-10 py-8 h-full overflow-y-auto">
      {/* breadcrumb */}
      <div className="flex justify-between items-center mb-6">
        <div style={{ ...mono, fontSize: 11, color: C.muted }}>
          {summary.path.substring(0, summary.path.length - projectName.length)}
          <span style={{ color: C.text }}>{projectName}</span>
        </div>
        
        {/* Mini tech stack summary bar */}
        {summary.techStack && summary.techStack.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[50%] no-scrollbar">
            {summary.techStack
              .filter(item => ["Frontend", "Backend", "Desktop Framework", "Environment", "Database/ORM"].includes(item.category))
              .slice(0, 8)
              .map(item => (
                <span 
                  key={item.name}
                  style={{ ...mono, fontSize: 10, borderColor: C.border }}
                  className="px-2 py-0.5 rounded border bg-white/[0.02] text-white/80 font-medium whitespace-nowrap"
                >
                  {item.name}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Dashboard View Control Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded border" style={{ borderColor: C.border, background: C.surface }}>
        <span style={{ ...mono, fontSize: 10, color: C.muted, letterSpacing: "0.08em", marginRight: 8 }}>
          SHOW REPORTS:
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "code", label: "Code Analysis", val: showCode, set: setShowCode, icon: FileCode },
            { id: "multimedia", label: "Multimedia", val: showMultimedia, set: setShowMultimedia, icon: ImageIcon },
            { id: "game", label: "Game & 3D", val: showGame, set: setShowGame, icon: Compass },
            { id: "cad", label: "CAD Drawings", val: showCad, set: setShowCad, icon: Layers },
            { id: "documents", label: "Documents", val: showDocuments, set: setShowDocuments, icon: FileText },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => toggleShow(item.id, !item.val, item.set)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border transition-all cursor-pointer select-none font-medium ${
                  item.val
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                    : "bg-white/[0.01] text-neutral-500 border-white/[0.04] hover:text-neutral-300"
                }`}
                style={{ ...mono, fontSize: 11 }}
              >
                <Icon size={12} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {showCode && (
        <div className="grid gap-8" style={{ gridTemplateColumns: "2fr 1fr" }}>
          {/* Left column */}
          <div>
            <div
              style={{
                ...mono,
                fontSize: 11,
                color: C.muted,
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              LINES OF CODE
            </div>
            <div
              style={{
                ...mono,
                fontSize: 56,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
                color: C.text,
                fontWeight: 500,
              }}
            >
              {fmt(dynamicStats.totalLoc)}
            </div>

            <div className="flex gap-8" style={{ marginTop: 24 }}>
              {[
                { v: fmt(dynamicStats.totalFiles), l: "FILES" },
                { v: dynamicStats.totalLanguages, l: "LANGUAGES" },
                { v: estCostStr, l: "EST. COST" },
              ].map((it) => (
                <div key={it.l}>
                  <div
                    style={{
                      ...mono,
                      fontSize: 20,
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {it.v}
                  </div>
                  <div
                    style={{
                      ...mono,
                      fontSize: 10,
                      color: C.muted,
                      letterSpacing: "0.08em",
                      marginTop: 4,
                    }}
                  >
                    {it.l}
                  </div>
                </div>
              ))}
            </div>

            {/* Stacked bar */}
            <div style={{ marginTop: 40 }}>
              <div
                style={{
                  ...mono,
                  fontSize: 11,
                  color: C.muted,
                  letterSpacing: "0.08em",
                  marginBottom: 10,
                }}
              >
                LANGUAGE DISTRIBUTION
              </div>
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: 24,
                  borderRadius: 2,
                  overflow: "hidden",
                  border: `1px solid ${C.border}`,
                }}
              >
                {activeLanguages.map((l) => (
                  <div
                    key={l.name}
                    onMouseEnter={() => setHover(l.name)}
                    onMouseLeave={() => setHover(null)}
                    style={{
                      width: `${l.pct}%`,
                      background: LANG_COLORS[l.name] || C.muted,
                      opacity: hover && hover !== l.name ? 0.35 : 1,
                      transition: "opacity 150ms",
                    }}
                    title={`${l.name} · ${l.pct.toFixed(1)}%`}
                  />
                ))}
              </div>
              <div
                style={{
                  ...mono,
                  fontSize: 11,
                  color: C.muted,
                  marginTop: 8,
                  minHeight: 14,
                }}
              >
                {hover
                  ? `${hover} — ${activeLanguages.find((l) => l.name === hover)?.pct.toFixed(1)}% · ${fmt(
                      activeLanguages.find((l) => l.name === hover)?.code || 0,
                    )} loc`
                  : "hover a segment for details"}
              </div>
            </div>

            {/* Table */}
            <div style={{ marginTop: 32 }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  ...mono,
                  fontSize: 12,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <thead>
                  <tr style={{ color: C.muted, fontSize: 10, letterSpacing: "0.08em" }}>
                    <th style={th}>LANGUAGE</th>
                    <th style={thRight}>FILES</th>
                    <th style={thRight}>CODE</th>
                    <th style={thRight}>COMMENTS</th>
                    <th style={thRight}>BLANKS</th>
                    <th style={thRight}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLanguages.map((l, i) => (
                    <tr
                      key={l.name}
                      style={{
                        background: i % 2 ? "#ffffff04" : "transparent",
                        borderTop: `1px solid ${C.border}`,
                      }}
                    >
                      <td style={td}>
                        <span
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            background: LANG_COLORS[l.name] || C.muted,
                            marginRight: 10,
                            verticalAlign: "middle",
                          }}
                        />
                        {l.name}
                      </td>
                      <td style={tdRight}>{fmt(l.files)}</td>
                      <td style={tdRight}>{fmt(l.code)}</td>
                      <td style={tdRight}>{fmt(l.comments)}</td>
                      <td style={tdRight}>{fmt(l.blanks)}</td>
                      <td style={{ ...tdRight, color: C.muted }}>{l.pct.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <Card label="DETECTED TECH STACK">
              {summary.techStack && summary.techStack.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }} className="max-h-72 overflow-y-auto pr-1">
                  {Object.entries(
                    summary.techStack.reduce((acc, item) => {
                      const cat = item.category || "General";
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(item);
                      return acc;
                    }, {} as Record<string, typeof summary.techStack>)
                  ).map(([category, items]) => {
                    const catColors = TECH_CATEGORY_COLORS[category] || {
                      bg: "rgba(255, 255, 255, 0.05)",
                      text: C.muted,
                      border: C.border
                    };
                    return (
                      <div key={category} className="border-b border-white/[0.03] pb-3 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-center mb-2.5">
                          <span
                            style={{
                              ...mono,
                              fontSize: 9.5,
                              color: catColors.text,
                              letterSpacing: "0.08em",
                              fontWeight: 600,
                            }}
                          >
                            {category.toUpperCase()}
                          </span>
                          <span 
                            style={{
                              ...mono,
                              fontSize: 9,
                              background: catColors.bg,
                              color: catColors.text,
                              borderColor: catColors.border,
                            }}
                            className="px-1.5 py-0.2 rounded-full border text-[9px] font-semibold"
                          >
                            {items.length}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {items.map((item) => (
                            <div
                              key={item.name}
                              className="px-2.5 py-1 rounded flex items-center gap-1.5 border text-xs transition-all hover:bg-white/[0.04]"
                              style={{
                                borderColor: C.border,
                                background: "rgba(255, 255, 255, 0.01)",
                              }}
                              title={`Category: ${category}${item.version ? `\nVersion: ${item.version}` : ""}`}
                            >
                              <span 
                                style={{ background: catColors.text }} 
                                className="inline-block w-1.5 h-1.5 rounded-full"
                              />
                              <span style={{ color: C.text, fontWeight: 500 }}>{item.name}</span>
                              {item.version && (
                                <span 
                                  style={{ 
                                    color: C.accent, 
                                    fontSize: 9.5, 
                                    fontFamily: "monospace",
                                    background: "rgba(245, 158, 11, 0.08)",
                                    borderColor: "rgba(245, 158, 11, 0.15)"
                                  }} 
                                  className="px-1 py-0.2 rounded border text-[9px]"
                                >
                                  {item.version}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ ...mono, fontSize: 11, color: C.muted, padding: "8px 0" }}>
                  No dependencies detected. (Scan a project containing package.json, Cargo.toml, go.mod, etc.)
                </div>
              )}
            </Card>

            <Card label="COMPLEXITY">
              <div
                style={{
                  ...mono,
                  fontSize: 36,
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {dynamicComplexity.averageComplexity.toFixed(1)}
              </div>
              <div style={{ ...mono, fontSize: 10, color: C.muted, marginTop: 4 }}>
                average · cyclomatic
              </div>
              <div className="flex items-end gap-1" style={{ marginTop: 18, height: 36 }}>
                {dynamicComplexity.complexityDist.map((v, i) => {
                  const maxVal = Math.max(...dynamicComplexity.complexityDist);
                  const heightPct = maxVal > 0 ? (v / maxVal) * 100 : 0;
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${heightPct}%`,
                        background: i === 4 ? C.accent : C.border,
                      }}
                      title={`Bin ${i + 1}: ${v} files`}
                    />
                  );
                })}
              </div>
              <div
                className="flex justify-between"
                style={{ ...mono, fontSize: 10, color: C.muted, marginTop: 6 }}
              >
                <span>1</span>
                <span>20+</span>
              </div>
            </Card>

            <Card label="COCOMO ESTIMATE">
              <div className="flex justify-between" style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Effort</span>
                <span style={{ ...mono, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                  {dynamicStats.effort} person-months
                </span>
              </div>
              <div className="flex justify-between" style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Time</span>
                <span style={{ ...mono, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                  {dynamicStats.devTime} months
                </span>
              </div>
              <div className="flex justify-between" style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: C.muted }}>Cost</span>
                <span
                  style={{
                    ...mono,
                    fontSize: 16,
                    color: C.accent,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {dynamicStats.estimatedCostUsd ? `$${fmt(dynamicStats.estimatedCostUsd)}` : "—"}
                </span>
              </div>
              <div
                className="flex items-center gap-2"
                style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}
              >
                <label style={{ fontSize: 11, color: C.muted }}>$/month</label>
                <input
                  type="number"
                  value={cocomoRate}
                  onChange={(e) => setCocomoRate(Number(e.target.value) || 0)}
                  style={{
                    ...mono,
                    fontSize: 12,
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    padding: "4px 8px",
                    color: C.text,
                    width: 90,
                    outline: "none",
                  }}
                />
                <span style={{ ...mono, fontSize: 11, color: C.muted }}>× 1000</span>
              </div>
            </Card>

            <Card label="DUPLICATES">
              <div className="flex items-baseline justify-between">
                <div>
                  <span
                    style={{
                      ...mono,
                      fontSize: 28,
                      letterSpacing: "-0.02em",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {dynamicDuplicates.count}
                  </span>
                  <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>
                    duplicate files
                  </span>
                </div>
                {dynamicDuplicates.count > 0 && (
                  <button
                    onClick={() => setShowDuplicates(!showDuplicates)}
                    style={{
                      ...mono,
                      fontSize: 11,
                      background: "transparent",
                      border: `1px solid ${C.border}`,
                      borderRadius: 3,
                      padding: "4px 10px",
                      color: C.accent,
                      cursor: "pointer",
                    }}
                  >
                    {showDuplicates ? "HIDE" : "VIEW →"}
                  </button>
                )}
              </div>

              {showDuplicates && dynamicDuplicates.groups.length > 0 && (
                <div 
                  className="mt-4 pt-3 border-t border-white/[0.08] overflow-y-auto max-h-48"
                  style={{ ...mono, fontSize: 11 }}
                >
                  {dynamicDuplicates.groups.map((group, gIdx) => (
                    <div key={gIdx} className="mb-3 last:mb-0">
                      <div style={{ color: C.accent }}>Group #{gIdx + 1}</div>
                      {group.map((p, pIdx) => (
                        <div key={pIdx} className="pl-2 text-white/70 overflow-hidden text-ellipsis whitespace-nowrap">
                          • {p}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Assets Analysis Grid */}
      {(showMultimedia || showGame || showCad || showDocuments) && assetReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Multimedia Analysis Card */}
          {showMultimedia && assetReport.summary.categoryCounts["multimedia"] > 0 && (
            <Card label="MULTIMEDIA ANALYSIS">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
                <div>
                  <div style={{ ...mono, fontSize: 32, fontWeight: 500, color: C.text }}>
                    {fmt(assetReport.summary.categoryCounts["multimedia"] || 0)}
                  </div>
                  <div style={{ ...mono, fontSize: 10, color: C.muted, marginTop: 2 }}>
                    MULTIMEDIA FILES
                  </div>
                  <div style={{ ...mono, fontSize: 14, color: C.accent, marginTop: 8 }}>
                    {formatBytes(assetReport.summary.categorySizes["multimedia"] || 0)}
                  </div>
                </div>
                
                <div className="sm:col-span-2 space-y-2">
                  <div style={{ ...mono, fontSize: 10, color: C.muted, letterSpacing: "0.05em" }}>
                    BY SUBCATEGORY
                  </div>
                  {["image", "video", "audio"].map(sub => {
                    const count = assetReport.summary.subcategoryCounts[sub] || 0;
                    if (count === 0) return null;
                    const size = assetReport.assets.filter(a => a.subcategory === sub).reduce((sum, a) => sum + a.size, 0);
                    return (
                      <div key={sub} className="flex justify-between items-center text-xs">
                        <span className="capitalize text-white/80">{sub}</span>
                        <span style={mono} className="text-neutral-400">
                          {count} files · {formatBytes(size)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* Game & 3D Analysis Card */}
          {showGame && assetReport.summary.categoryCounts["game_3d"] > 0 && (
            <Card label="GAME & 3D ASSETS">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
                <div>
                  <div style={{ ...mono, fontSize: 32, fontWeight: 500, color: C.text }}>
                    {fmt(assetReport.summary.categoryCounts["game_3d"] || 0)}
                  </div>
                  <div style={{ ...mono, fontSize: 10, color: C.muted, marginTop: 2 }}>
                    3D & GAME FILES
                  </div>
                  <div style={{ ...mono, fontSize: 14, color: C.accent, marginTop: 8 }}>
                    {formatBytes(assetReport.summary.categorySizes["game_3d"] || 0)}
                  </div>
                </div>
                
                <div className="sm:col-span-2 space-y-2">
                  <div style={{ ...mono, fontSize: 10, color: C.muted, letterSpacing: "0.05em" }}>
                    HINTS & ORPHANS
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/80">Orphan Assets</span>
                    <span style={mono} className={assetReport.orphans.length > 0 ? "text-amber-500" : "text-neutral-400"}>
                      {assetReport.orphans.length} files
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/80">Active Connections</span>
                    <span style={mono} className="text-neutral-400">
                      {assetReport.edges.length} links
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* CAD Drawings Card */}
          {showCad && assetReport.summary.categoryCounts["cad_drawing"] > 0 && (
            <Card label="CAD DRAWINGS ANALYSIS">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
                <div>
                  <div style={{ ...mono, fontSize: 32, fontWeight: 500, color: C.text }}>
                    {fmt(assetReport.summary.categoryCounts["cad_drawing"] || 0)}
                  </div>
                  <div style={{ ...mono, fontSize: 10, color: C.muted, marginTop: 2 }}>
                    CAD DRAWINGS
                  </div>
                  <div style={{ ...mono, fontSize: 14, color: C.accent, marginTop: 8 }}>
                    {formatBytes(assetReport.summary.categorySizes["cad_drawing"] || 0)}
                  </div>
                </div>
                
                <div className="sm:col-span-2 space-y-2">
                  <div style={{ ...mono, fontSize: 10, color: C.muted, letterSpacing: "0.05em" }}>
                    DETAILS
                  </div>
                  <div className="text-xs text-neutral-400 leading-relaxed">
                    Analyze vector CAD design drawings and external reference links. Supports DXF, DWG, STEP, IGES.
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Documents Card */}
          {showDocuments && (
            (assetReport.summary.categoryCounts["document"] || 0) +
            (assetReport.summary.categoryCounts["archive"] || 0) +
            (assetReport.summary.categoryCounts["data"] || 0) +
            (assetReport.summary.categoryCounts["font"] || 0) > 0
          ) && (
            <Card label="DOCUMENTS & OTHER ASSETS">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
                <div>
                  <div style={{ ...mono, fontSize: 32, fontWeight: 500, color: C.text }}>
                    {fmt(
                      (assetReport.summary.categoryCounts["document"] || 0) +
                      (assetReport.summary.categoryCounts["archive"] || 0) +
                      (assetReport.summary.categoryCounts["data"] || 0) +
                      (assetReport.summary.categoryCounts["font"] || 0)
                    )}
                  </div>
                  <div style={{ ...mono, fontSize: 10, color: C.muted, marginTop: 2 }}>
                    SUPPORT FILES
                  </div>
                  <div style={{ ...mono, fontSize: 14, color: C.accent, marginTop: 8 }}>
                    {formatBytes(
                      (assetReport.summary.categorySizes["document"] || 0) +
                      (assetReport.summary.categorySizes["archive"] || 0) +
                      (assetReport.summary.categorySizes["data"] || 0) +
                      (assetReport.summary.categorySizes["font"] || 0)
                    )}
                  </div>
                </div>
                
                <div className="sm:col-span-2 space-y-2">
                  <div style={{ ...mono, fontSize: 10, color: C.muted, letterSpacing: "0.05em" }}>
                    BY CATEGORY
                  </div>
                  {["document", "archive", "data", "font"].map(cat => {
                    const count = assetReport.summary.categoryCounts[cat] || 0;
                    if (count === 0) return null;
                    const size = assetReport.summary.categorySizes[cat] || 0;
                    return (
                      <div key={cat} className="flex justify-between items-center text-xs">
                        <span className="capitalize text-white/80">{cat === "document" ? "Docs (txt, md...)" : cat}</span>
                        <span style={mono} className="text-neutral-400">
                          {count} files · {formatBytes(size)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Empty State when all sections hidden */}
      {!showCode && !showMultimedia && !showGame && !showCad && !showDocuments && (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded mt-6" style={{ borderColor: C.border }}>
          <div style={{ ...mono, fontSize: 12, color: C.muted }}>
            All report sections are hidden. Toggle the options above to view details.
          </div>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 6px",
  fontWeight: 500,
};
const thRight: React.CSSProperties = { ...th, textAlign: "right" };
const td: React.CSSProperties = { padding: "10px 6px" };
const tdRight: React.CSSProperties = { ...td, textAlign: "right" };
