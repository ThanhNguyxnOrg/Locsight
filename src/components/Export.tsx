import { useState, useEffect } from "react";
import { C, mono } from "./tokens";
import { FileJson, FileSpreadsheet, FileText, FileCode, CheckCircle, AlertCircle } from "lucide-react";
import { useAnalysis } from "../hooks/useAnalysis";
import { save } from "@tauri-apps/plugin-dialog";

const FORMATS = [
  { id: "JSON", icon: FileJson, extension: "json", desc: "machine-readable, full data" },
  { id: "CSV", icon: FileSpreadsheet, extension: "csv", desc: "per-file metrics rows" },
  { id: "MARKDOWN", icon: FileText, extension: "md", desc: "readme-friendly summary" },
  { id: "HTML", icon: FileCode, extension: "html", desc: "interactive standalone report" },
];

interface ExportHistoryItem {
  fmt: string;
  path: string;
  at: string;
}

export function Export() {
  const { summary, exportSummaryReport } = useAnalysis();
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
        await exportSummaryReport(filePath, formatId.toLowerCase());
        
        // Add to history
        const newHistItem: ExportHistoryItem = {
          fmt: formatId,
          path: filePath,
          at: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        };
        const updatedHistory = [newHistItem, ...history].slice(0, 10);
        setHistory(updatedHistory);
        localStorage.setItem("cb_analyzer_exports", JSON.stringify(updatedHistory));

        setStatus({ type: "success", msg: `Successfully exported report to ${filePath}` });
      }
    } catch (err: any) {
      setStatus({ type: "error", msg: `Failed to export report: ${err?.toString() || "Unknown error"}` });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="px-10 py-8 h-full overflow-y-auto">
      <div
        style={{
          ...mono,
          fontSize: 11,
          color: C.muted,
          letterSpacing: "0.08em",
          marginBottom: 6,
        }}
      >
        EXPORT REPORT
      </div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>
        Choose a format. Export saves a complete report file containing stats and data.
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

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {FORMATS.map((f) => {
          const Icon = f.icon;
          const isCurrentExporting = exporting === f.id;
          return (
            <div
              key={f.id}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: 200,
              }}
            >
              <div>
                <Icon size={24} color={C.accent} strokeWidth={1.5} />
                <div style={{ ...mono, fontSize: 14, marginTop: 14, letterSpacing: "0.04em" }}>
                  {f.id}
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
                  {f.desc}
                </div>
              </div>
              
              <button
                onClick={() => handleExport(f.id, f.extension)}
                disabled={exporting !== null || !summary}
                className="w-full flex items-center justify-center hover:brightness-110 active:scale-98 transition-all disabled:opacity-50"
                style={{
                  ...mono,
                  fontSize: 11,
                  padding: "8px 0",
                  background: "transparent",
                  border: `1px solid ${C.accent}`,
                  color: C.accent,
                  borderRadius: 3,
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                  marginTop: 14,
                }}
              >
                {isCurrentExporting ? "EXPORTING..." : "EXPORT →"}
              </button>
            </div>
          );
        })}
      </div>

      {history.length > 0 && (
        <div style={{ marginTop: 48 }}>
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
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    color: C.accent,
                    fontSize: 10,
                    width: 70,
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
