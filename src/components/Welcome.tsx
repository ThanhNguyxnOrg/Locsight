import { useState } from "react";
import { C, mono, LANG_COLORS } from "./tokens";
import { FolderOpen, AlertCircle, LayoutDashboard } from "lucide-react";
import { useAnalysis } from "../hooks/useAnalysis";

export function Welcome({ onOpen, onGoToDashboard }: { onOpen: () => void; onGoToDashboard: () => void }) {
  const { 
    recentProjects, 
    error, 
    loading, 
    summary,
    pendingFolder,
    pendingLocignore,
    setPendingLocignore,
    preparePendingFolder,
    confirmAndScanPending,
    cancelPending,
    importGitignoreToPending
  } = useAnalysis();

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleImport = async () => {
    setImportStatus(null);
    setImportError(null);
    try {
      await importGitignoreToPending();
      setImportStatus("Imported patterns from .gitignore!");
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err: any) {
      setImportError(err.message || err.toString());
      setTimeout(() => setImportError(null), 4000);
    }
  };

  // If there's a folder selected but not yet scanned, show the configuration panel
  if (pendingFolder) {
    return (
      <div className="size-full flex flex-col items-center justify-center px-8 relative overflow-hidden">
        <div 
          className="p-6 rounded-lg border flex flex-col w-full max-w-2xl animate-fade-in"
          style={{ borderColor: C.border, background: C.surface, maxHeight: "90vh" }}
        >
          {/* Header */}
          <div className="flex flex-col gap-1 mb-4">
            <div style={{ ...mono, fontSize: 11, color: C.muted, letterSpacing: "0.05em" }}>
              SCAN CONFIGURATION
            </div>
            <div className="text-sm font-bold truncate text-white" title={pendingFolder}>
              Folder: <span className="font-mono text-amber-500">{pendingFolder}</span>
            </div>
          </div>

          {/* Ignore editor section */}
          <div className="flex flex-col gap-2 flex-1 overflow-hidden min-h-[220px] mb-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-white/50">
                Configure .locignore rules:
              </span>
              <button
                onClick={handleImport}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold border transition hover:border-amber-500 hover:text-amber-500 cursor-pointer"
                style={{ borderColor: C.border, background: "rgba(0,0,0,0.2)", color: C.text }}
              >
                Import from .gitignore
              </button>
            </div>

            {/* Presets row */}
            <div className="flex flex-wrap gap-1.5 items-center my-1">
              <span className="text-[9px] uppercase font-bold text-white/40">Presets:</span>
              {[
                { label: "node_modules/", pattern: "node_modules/" },
                { label: "dist/", pattern: "dist/" },
                { label: "build/", pattern: "build/" },
                { label: "*.log", pattern: "*.log" },
                { label: ".env*", pattern: ".env*" },
                { label: "coverage/", pattern: "coverage/" },
              ].map(preset => (
                <button
                  key={preset.label}
                  onClick={() => {
                    const lines = pendingLocignore.split("\n");
                    if (lines.some(l => l.trim() === preset.pattern)) {
                      return;
                    }
                    const suffix = pendingLocignore.endsWith("\n") || pendingLocignore === "" ? "" : "\n";
                    setPendingLocignore(`${pendingLocignore}${suffix}${preset.pattern}\n`);
                  }}
                  className="px-2 py-0.5 rounded text-[9px] border transition cursor-pointer text-white/70 hover:border-amber-500"
                  style={{ borderColor: C.border, background: "transparent" }}
                >
                  +{preset.label}
                </button>
              ))}
            </div>

            {/* Editor Textarea with line numbers */}
            <div 
              className="flex-1 rounded border overflow-hidden flex relative"
              style={{ borderColor: C.border, background: "#0c0b0e" }}
            >
              <div 
                className="select-none py-3 px-2 text-right overflow-hidden shrink-0 border-r"
                style={{ 
                  borderColor: C.border, 
                  color: "rgba(255, 255, 255, 0.15)",
                  background: "#080709",
                  minWidth: 36,
                  height: "100%",
                }}
              >
                <div style={{ transform: `translateY(${-scrollTop}px)` }}>
                  {Array.from({ length: Math.max(pendingLocignore.split("\n").length, 10) }, (_, i) => i + 1).map(n => (
                    <div key={n} style={{ height: 18, fontSize: 11, fontFamily: "monospace" }}>{n}</div>
                  ))}
                </div>
              </div>

              <textarea
                value={pendingLocignore}
                onChange={(e) => setPendingLocignore(e.target.value)}
                onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
                placeholder="# Enter files, folders or patterns to ignore.&#10;# Examples:&#10;node_modules/&#10;dist/&#10;*.min.js"
                className="flex-1 p-3 bg-transparent outline-none resize-none font-mono overflow-y-auto leading-[18px]"
                style={{
                  ...mono,
                  color: "#d1d0d5",
                  caretColor: C.accent,
                  lineHeight: "18px",
                  fontSize: 11,
                }}
              />
            </div>
          </div>

          {/* Inline notifications */}
          {importStatus && (
            <div className="mb-4 text-[10.5px] text-green-400 font-mono text-center">
              ✓ {importStatus}
            </div>
          )}
          {importError && (
            <div className="mb-4 text-[10.5px] text-red-400 font-mono text-center">
              ⚠️ {importError}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 mt-auto">
            <button
              onClick={cancelPending}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded text-xs font-semibold border transition hover:bg-white/[0.02] cursor-pointer"
              style={{ borderColor: C.border, background: "transparent", color: C.text, ...mono }}
            >
              CANCEL
            </button>
            <button
              onClick={confirmAndScanPending}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded text-xs font-semibold text-black transition hover:brightness-110 cursor-pointer"
              style={{ background: C.accent, ...mono }}
            >
              {loading ? "ANALYZING..." : "CONFIRM & SCAN"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full flex flex-col items-center justify-center px-8 relative">
      <img
        src="/logo.png"
        alt="Locsight Logo"
        style={{
          width: 48,
          height: 48,
          borderRadius: 6,
          marginBottom: 18,
          objectFit: "contain",
        }}
      />
      <div style={{ ...mono, fontSize: 13, color: C.text, letterSpacing: "0.06em" }}>
        locsight
        <span style={{ color: C.muted }}> · v1.2.0</span>
      </div>
      
      {error && (
        <div 
          className="flex items-center gap-2 mt-4 px-4 py-2 border border-red-900/50 bg-red-950/20 text-red-400 rounded-md max-w-lg"
          style={{ ...mono, fontSize: 11 }}
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {summary ? (
        /* Active Project Details Card */
        <div 
          className="mt-6 p-6 rounded-lg border flex flex-col items-center max-w-md w-full animate-fade-in"
          style={{ borderColor: C.border, background: C.surface }}
        >
          <div style={{ ...mono, fontSize: 11, color: C.muted, letterSpacing: "0.05em", marginBottom: 8 }}>
            ACTIVE SESSION
          </div>
          <div className="text-sm font-bold text-center truncate w-full mb-2" style={{ color: C.text }}>
            {summary.path.split(/[\/\\]/).pop()}
          </div>
          
          <div className="text-xs text-center leading-relaxed mb-1" style={{ color: C.muted }}>
            {summary.totalFiles.toLocaleString()} files · {summary.totalLoc.toLocaleString()} LOC
            {summary.techStack && summary.techStack.length > 0 && ` · ${summary.techStack.length} Techs`}
          </div>
          <div className="text-[10px] text-center font-mono text-amber-500/80 mb-4">
            scanned in {(summary.scanDurationMs / 1000).toFixed(2)}s
          </div>

          {/* Mini language distribution bar */}
          {summary.languages && summary.languages.length > 0 && (
            <div className="w-full mt-1 mb-5">
              <div 
                className="w-full flex h-1.5 rounded-full overflow-hidden border"
                style={{ borderColor: C.border }}
              >
                {summary.languages.slice(0, 5).map(l => (
                  <div 
                    key={l.name}
                    style={{ 
                      width: `${l.pct}%`, 
                      background: LANG_COLORS[l.name] || C.muted 
                    }}
                    title={`${l.name}: ${l.pct.toFixed(1)}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2 text-[9.5px] font-mono text-white/50">
                {summary.languages.slice(0, 3).map(l => (
                  <span key={l.name} className="flex items-center gap-1">
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ background: LANG_COLORS[l.name] || C.muted }}
                    />
                    {l.name} ({l.pct.toFixed(0)}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 w-full">
            <button
              onClick={onGoToDashboard}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded text-xs font-semibold text-black transition-all hover:brightness-110"
              style={{
                background: C.accent,
                cursor: "pointer",
                ...mono,
              }}
            >
              <LayoutDashboard size={14} />
              DASHBOARD
            </button>
            <button
              onClick={onOpen}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded text-xs font-semibold border transition-all hover:bg-white/[0.02]"
              style={{
                borderColor: C.border,
                background: "transparent",
                color: C.text,
                cursor: "pointer",
                ...mono,
              }}
            >
              <FolderOpen size={14} />
              SWITCH FOLDER
            </button>
          </div>
        </div>
      ) : (
        /* Empty welcome state */
        <>
          <div style={{ marginTop: 22, color: C.muted, fontSize: 13 }}>
            {loading ? "Analyzing files..." : "Open a folder to begin"}
          </div>

          <button
            onClick={onOpen}
            disabled={loading}
            className="flex items-center gap-2 hover:brightness-110 active:scale-98 transition-all disabled:opacity-50"
            style={{
              marginTop: 18,
              padding: "10px 18px",
              background: C.accent,
              color: "#1a1208",
              border: "none",
              borderRadius: 4,
              ...mono,
              fontSize: 12,
              letterSpacing: "0.04em",
              cursor: "pointer",
            }}
          >
            <FolderOpen size={14} strokeWidth={2} />
            {loading ? "SCANNING..." : "OPEN FOLDER"}
            <kbd
              style={{
                marginLeft: 6,
                padding: "1px 5px",
                borderRadius: 3,
                background: "#00000033",
                fontSize: 10,
              }}
            >
              ⌘O
            </kbd>
          </button>
        </>
      )}

      {recentProjects.length > 0 && (
        <div style={{ marginTop: 56, width: 520 }}>
          <div
            style={{
              ...mono,
              fontSize: 11,
              color: C.muted,
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}
          >
            RECENT PROJECTS
          </div>
          <div style={{ borderTop: `1px solid ${C.border}` }}>
            {recentProjects.map((r) => (
              <button
                key={r.path}
                onClick={() => !loading && preparePendingFolder(r.path)}
                disabled={loading}
                className="w-full flex items-center text-left hover:bg-white/[0.02] transition-colors disabled:opacity-50"
                style={{
                  padding: "10px 4px",
                  borderBottom: `1px solid ${C.border}`,
                  background: "transparent",
                  cursor: "pointer",
                  ...mono,
                  fontSize: 12,
                  color: C.text,
                }}
              >
                <span style={{ color: C.accent, marginRight: 10 }}>›</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.path}
                </span>
                <span style={{ color: C.muted, marginRight: 16 }}>{r.files} files</span>
                <span style={{ color: C.muted }}>{r.date}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
