import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAnalysis } from "../hooks/useAnalysis";
import { C, mono } from "./tokens";
import { Save, RefreshCw, FileCode, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";

export function Settings({ onNavigateToDashboard }: { onNavigateToDashboard: () => void }) {
  const { summary, scanFolder } = useAnalysis();
  const [locignoreContent, setLocignoreContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const rootPath = summary?.path || "";

  // Load existing .locignore on mount
  useEffect(() => {
    if (!rootPath) return;
    setLoading(true);
    invoke<string>("read_locignore", { rootPath })
      .then((content) => {
        setLocignoreContent(content);
        setLoading(false);
      })
      .catch((err) => {
        setStatus({ type: "error", message: `Failed to load .locignore: ${err}` });
        setLoading(false);
      });
  }, [rootPath]);

  const handleSave = async (andRescan: boolean) => {
    if (!rootPath) return;
    setSaving(true);
    setStatus(null);

    try {
      await invoke("write_locignore", { rootPath, content: locignoreContent });
      
      if (andRescan) {
        setStatus({ type: "info", message: "Saving rules and re-scanning project..." });
        await scanFolder(rootPath);
        setStatus({ type: "success", message: ".locignore saved and project re-scanned successfully!" });
        // After success, navigate to dashboard automatically after 1 second
        setTimeout(() => {
          onNavigateToDashboard();
        }, 1200);
      } else {
        setStatus({ type: "success", message: ".locignore saved successfully!" });
      }
    } catch (err: any) {
      setStatus({ type: "error", message: `Failed to save/scan: ${err.message || err}` });
    } finally {
      setSaving(false);
    }
  };

  const handleImportGitignore = async () => {
    if (!rootPath) return;
    setStatus(null);

    try {
      const content = await invoke<string>("read_gitignore", { rootPath });
      setLocignoreContent((prev) => {
        const separator = prev.trim() ? "\n\n" : "";
        return `${prev}${separator}# Imported from .gitignore\n${content}`;
      });
      setStatus({ type: "success", message: "Successfully imported patterns from .gitignore!" });
    } catch (err: any) {
      setStatus({ type: "error", message: `Could not import: ${err}` });
    }
  };

  if (!rootPath) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" style={{ background: C.bg }}>
        <AlertTriangle size={48} className="text-amber-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-bold mb-2">No Active Project</h2>
        <p className="text-sm max-w-md" style={{ color: C.muted }}>
          Please select a codebase folder from the Home screen first to edit custom exclusion rules.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: C.bg }}>
      {/* Header */}
      <div
        className="px-8 py-5 flex items-center justify-between border-b"
        style={{ borderColor: C.border, background: C.surface }}
      >
        <div>
          <h1 className="text-xl font-bold tracking-tight">Custom Exclusion Settings</h1>
          <p className="text-xs mt-1 truncate max-w-2xl" style={{ color: C.muted }}>
            Project Root: <span className="font-mono text-amber-500/90">{rootPath}</span>
          </p>
        </div>
        <button
          onClick={handleImportGitignore}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold border transition"
          style={{
            borderColor: C.border,
            background: `${C.surface}`,
            color: C.text,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.accent)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
        >
          <FileCode size={14} />
          Import from .gitignore
        </button>
      </div>

      {/* Editor & Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Text Editor */}
        <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
                .locignore file content
              </span>
              <span className="text-[10px] font-mono" style={{ color: C.muted }}>
                Supports standard gitignore glob patterns
              </span>
            </div>
            
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] uppercase font-bold" style={{ color: C.muted }}>Quick Add:</span>
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
                    setLocignoreContent(prev => {
                      const lines = prev.split("\n");
                      if (lines.some(l => l.trim() === preset.pattern)) {
                        return prev;
                      }
                      const suffix = prev.endsWith("\n") || prev === "" ? "" : "\n";
                      return `${prev}${suffix}${preset.pattern}\n`;
                    });
                  }}
                  className="px-2 py-0.5 rounded text-[10px] border transition"
                  style={{
                    borderColor: C.border,
                    background: C.surface,
                    color: C.text,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
                >
                  +{preset.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="flex-1 rounded-lg border overflow-hidden flex relative"
            style={{ borderColor: C.border, background: "#0c0b0e" }}
          >
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                <RefreshCw className="animate-spin text-amber-500" size={24} />
              </div>
            ) : null}

            {/* Line numbers column */}
            <div 
              className="select-none py-4 px-3 text-right overflow-hidden shrink-0 border-r"
              style={{ 
                borderColor: C.border, 
                color: "rgba(255, 255, 255, 0.18)",
                background: "#080709",
                minWidth: 44,
                height: "100%",
              }}
            >
              <div style={{ transform: `translateY(${-scrollTop}px)`, transition: "transform 0ms" }}>
                {Array.from({ length: Math.max(locignoreContent.split("\n").length, 15) }, (_, i) => i + 1).map(n => (
                  <div key={n} style={{ height: 21, fontSize: 13, fontFamily: "monospace" }}>{n}</div>
                ))}
              </div>
            </div>

            <textarea
              value={locignoreContent}
              onChange={(e) => setLocignoreContent(e.target.value)}
              onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
              placeholder="# Enter files, folders, or patterns to ignore during codebase analysis&#10;# Examples:&#10;node_modules/&#10;dist/&#10;*.min.js&#10;**/*.test.js"
              className="flex-1 p-4 bg-transparent outline-none resize-none font-mono overflow-y-auto leading-[21px]"
              style={{
                ...mono,
                color: "#d1d0d5",
                caretColor: C.accent,
                lineHeight: "21px",
                fontSize: 13,
              }}
            />
          </div>

          {/* Status Alert */}
          {status && (
            <div
              className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs transition-all duration-200`}
              style={{
                background:
                  status.type === "success"
                    ? "rgba(16, 185, 129, 0.08)"
                    : status.type === "error"
                    ? "rgba(239, 68, 68, 0.08)"
                    : "rgba(59, 130, 246, 0.08)",
                borderColor:
                  status.type === "success"
                    ? "rgba(16, 185, 129, 0.2)"
                    : status.type === "error"
                    ? "rgba(239, 68, 68, 0.2)"
                    : "rgba(59, 130, 246, 0.2)",
                color:
                  status.type === "success"
                    ? "#34d399"
                    : status.type === "error"
                    ? "#f87171"
                    : "#60a5fa",
              }}
            >
              {status.type === "success" ? (
                <CheckCircle size={15} className="mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={15} className="mt-0.5 shrink-0 animate-pulse" />
              )}
              <span className="font-medium">{status.message}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold transition select-none disabled:opacity-50"
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                color: C.text,
                cursor: saving ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.borderColor = C.accent;
              }}
              onMouseLeave={(e) => {
                if (!saving) e.currentTarget.style.borderColor = C.border;
              }}
            >
              <Save size={14} />
              Save Rules
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded text-xs font-semibold text-black transition select-none disabled:opacity-50"
              style={{
                background: C.accent,
                cursor: saving ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.filter = "brightness(1.1)";
              }}
              onMouseLeave={(e) => {
                if (!saving) e.currentTarget.style.filter = "brightness(1.0)";
              }}
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Save &amp; Re-scan Project
            </button>
          </div>
        </div>

        {/* Documentation Sidebar */}
        <div
          className="w-80 border-l p-6 hidden lg:flex flex-col gap-5 overflow-auto"
          style={{ borderColor: C.border, background: `${C.surface}40` }}
        >
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>
              How Ignore Rules Work
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
              Locsight uses custom exclusion pattern matching to ignore files or directories during code analysis. This is saved as <code style={mono} className="bg-black/40 px-1 py-0.5 rounded text-[10.5px] ">.locignore</code> in your project root.
            </p>
          </div>

          <div className="border-t pt-4" style={{ borderColor: C.border }}>
            <h4 className="text-xs font-bold mb-2">Exclusion Syntax</h4>
            <ul className="text-xs space-y-2.5" style={{ color: C.muted }}>
              <li className="flex items-start gap-2">
                <ArrowRight size={12} className="mt-0.5 shrink-0 text-amber-500" />
                <span>
                  <code style={mono} className="bg-black/30 px-1 py-0.5 rounded text-[10.5px]">node_modules/</code>: ignores any folder named node_modules.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight size={12} className="mt-0.5 shrink-0 text-amber-500" />
                <span>
                  <code style={mono} className="bg-black/30 px-1 py-0.5 rounded text-[10.5px]">*.min.js</code>: ignores any file ending with .min.js.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight size={12} className="mt-0.5 shrink-0 text-amber-500" />
                <span>
                  <code style={mono} className="bg-black/30 px-1 py-0.5 rounded text-[10.5px]">dist/**/bundle.js</code>: ignores bundle.js inside any depth of dist directory.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight size={12} className="mt-0.5 shrink-0 text-amber-500" />
                <span>
                  <code style={mono} className="bg-black/30 px-1 py-0.5 rounded text-[10.5px]"># Comment</code>: lines starting with # are treated as comments.
                </span>
              </li>
            </ul>
          </div>

          <div className="border-t pt-4 mt-auto flex flex-col gap-4" style={{ borderColor: C.border }}>
            <UpdateChecker />
            
            <div className="p-3.5 rounded bg-amber-500/5 border border-amber-500/10 text-xs text-amber-500/90 leading-relaxed">
              <strong>Tip:</strong> Re-scanning will overwrite the cache data. This ensures your dashboard statistics remain perfectly accurate and up-to-date.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UpdateChecker() {
  const [checking, setChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{
    status: "idle" | "latest" | "available" | "error";
    version?: string;
    url?: string;
    errorMsg?: string;
  }>({ status: "idle" });

  const currentVersion = "2.0.0"; // Current version of the app

  const handleCheckUpdate = async () => {
    setChecking(true);
    setUpdateInfo({ status: "idle" });
    try {
      const response = await fetch("https://api.github.com/repos/ThanhNguyxnOrg/Locsight/releases/latest");
      if (!response.ok) {
        throw new Error(`Failed to fetch release: HTTP ${response.status}`);
      }
      const data = await response.json();
      const latestTag = data.tag_name;
      const cleanLatest = latestTag.replace(/^v/, "");
      
      if (cleanLatest !== currentVersion) {
        setUpdateInfo({
          status: "available",
          version: latestTag,
          url: data.html_url
        });
      } else {
        setUpdateInfo({ status: "latest" });
      }
    } catch (err: any) {
      setUpdateInfo({
        status: "error",
        errorMsg: err.message || "Unknown network error"
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="p-4 rounded border flex flex-col gap-3" style={{ borderColor: C.border, background: "rgba(255, 255, 255, 0.01)" }}>
      <h4 className="text-xs font-bold flex items-center justify-between">
        <span style={{ color: C.text }}>SOFTWARE UPDATE</span>
        <span style={{ ...mono, fontSize: 9, color: C.muted }}>v{currentVersion}</span>
      </h4>
      
      {updateInfo.status === "idle" && !checking && (
        <button
          onClick={handleCheckUpdate}
          className="w-full py-1.5 rounded text-xs font-semibold border flex items-center justify-center gap-2 transition cursor-pointer"
          style={{ borderColor: C.border, background: C.surface, color: C.text }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
        >
          Check for Updates
        </button>
      )}

      {checking && (
        <div className="flex items-center justify-center gap-2 py-1.5 text-xs text-neutral-400">
          <RefreshCw className="animate-spin text-amber-500" size={13} />
          <span>Checking GitHub...</span>
        </div>
      )}

      {updateInfo.status === "latest" && (
        <div className="text-xs text-emerald-400 py-1 flex flex-col gap-1">
          <div className="font-semibold">✓ Locsight is up to date!</div>
          <div className="text-[10px] text-neutral-500">You are on the latest version.</div>
          <button
            onClick={handleCheckUpdate}
            className="mt-1 text-[10px] text-neutral-400 hover:text-white underline text-left"
          >
            Check again
          </button>
        </div>
      )}

      {updateInfo.status === "available" && (
        <div className="text-xs text-amber-400 py-1 flex flex-col gap-2">
          <div className="font-semibold">⚠️ New version {updateInfo.version} is available!</div>
          <button
            onClick={() => {
              if (updateInfo.url) {
                openUrl(updateInfo.url).catch(console.error);
              }
            }}
            className="w-full py-1.5 rounded text-xs font-bold text-black flex items-center justify-center gap-1.5 transition cursor-pointer"
            style={{ background: C.accent }}
          >
            Download Update
          </button>
        </div>
      )}

      {updateInfo.status === "error" && (
        <div className="text-xs text-red-400 py-1 flex flex-col gap-1">
          <div className="font-semibold">Failed to check updates</div>
          <div className="text-[10px] text-neutral-500 truncate" title={updateInfo.errorMsg}>{updateInfo.errorMsg}</div>
          <button
            onClick={handleCheckUpdate}
            className="mt-1 text-[10px] text-neutral-400 hover:text-white underline text-left"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
