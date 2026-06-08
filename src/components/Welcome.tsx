import { C, mono } from "./tokens";
import { FolderOpen, AlertCircle } from "lucide-react";
import { useAnalysis } from "../hooks/useAnalysis";

export function Welcome({ onOpen }: { onOpen: () => void }) {
  const { recentProjects, scanFolder, error, loading } = useAnalysis();

  return (
    <div className="size-full flex flex-col items-center justify-center px-8 relative">
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 6,
          border: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
        }}
      >
        <div style={{ width: 14, height: 14, background: C.accent, borderRadius: 2 }} />
      </div>
      <div style={{ ...mono, fontSize: 13, color: C.text, letterSpacing: "0.06em" }}>
        locsight
        <span style={{ color: C.muted }}> · v1.0.0</span>
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
                onClick={() => !loading && scanFolder(r.path)}
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
