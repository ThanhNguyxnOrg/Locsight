import { useState } from "react";
import { C, mono } from "./tokens";
import { useAnalysis } from "../hooks/useAnalysis";
import { ShieldCheck, ShieldAlert, Search, Filter } from "lucide-react";

export function Insights() {
  const { summary } = useAnalysis();
  const [filterKind, setFilterKind] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (!summary) return null;

  const { secrets, annotations } = summary;

  // Filter annotations
  const filteredAnnotations = annotations.filter((ann) => {
    const matchesKind = filterKind === "ALL" || ann.kind.toUpperCase() === filterKind;
    const matchesSearch = ann.filePath.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ann.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesKind && matchesSearch;
  });

  // Unique annotation kinds for filter dropdown
  const annotationKinds = ["ALL", ...Array.from(new Set(annotations.map(a => a.kind.toUpperCase())))];

  return (
    <div className="px-10 py-8 h-full overflow-y-auto">
      {/* Title */}
      <div className="mb-8">
        <h2 style={{ ...mono, fontSize: 24, fontWeight: 500, color: C.text, margin: 0 }}>CODEBASE INSIGHTS</h2>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Security warnings, credentials, and code annotations</p>
      </div>

      {/* Security Check Section */}
      <div className="mb-10">
        <div style={{ ...mono, fontSize: 14, color: C.muted, letterSpacing: "0.08em", marginBottom: 16 }}>
          SECURITY CREDENTIAL SCANNER
        </div>

        {secrets.length === 0 ? (
          <div 
            className="p-6 rounded border flex items-center gap-4"
            style={{ background: "#4ade800a", borderColor: "#4ade8022" }}
          >
            <ShieldCheck size={32} style={{ color: "#4ade80" }} />
            <div>
              <div style={{ ...mono, fontSize: 14, fontWeight: 600, color: "#4ade80" }}>
                No exposed keys or credentials detected
              </div>
              <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 0 0" }}>
                No AWS credentials, GitHub tokens, Google API keys, or private keys found in codebase files.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div 
              className="p-6 rounded border flex items-center gap-4 mb-4"
              style={{ background: "#ef44440a", borderColor: "#ef444422" }}
            >
              <ShieldAlert size={32} style={{ color: "#ef4444" }} />
              <div>
                <div style={{ ...mono, fontSize: 14, fontWeight: 600, color: "#ef4444" }}>
                  {secrets.length} exposed credential finding{secrets.length > 1 ? "s" : ""} detected!
                </div>
                <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 0 0" }}>
                  CRITICAL: Exposed credentials were found in plain text. Exclude these files or revoke/mask the keys immediately.
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {secrets.map((sec, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded border flex flex-col md:flex-row md:items-center justify-between gap-4"
                  style={{ background: "#ffffff02", borderColor: C.border }}
                >
                  <div>
                    <span 
                      style={{ 
                        ...mono, 
                        fontSize: 10, 
                        background: "#ef44441e", 
                        color: "#ef4444", 
                        padding: "2px 6px", 
                        borderRadius: 2,
                        marginRight: 8
                      }}
                    >
                      {sec.kind.toUpperCase()}
                    </span>
                    <span style={{ ...mono, fontSize: 12, color: C.text }}>
                      {sec.filePath}:{sec.lineNumber}
                    </span>
                    <div 
                      className="mt-2 p-2 rounded text-xs bg-black/40 border border-white/[0.04]"
                      style={{ ...mono, color: C.muted }}
                    >
                      {sec.snippet}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Code Annotations / TODOs */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div style={{ ...mono, fontSize: 14, color: C.muted, letterSpacing: "0.08em" }}>
            CODE ANNOTATIONS ({filteredAnnotations.length} of {annotations.length})
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center bg-[#ffffff03] border border-white/[0.08] rounded px-3 py-1.5" style={{ minWidth: 200 }}>
              <Search size={14} style={{ color: C.muted, marginRight: 8 }} />
              <input
                type="text"
                placeholder="Search tags or files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 12,
                  color: C.text,
                  width: "100%",
                }}
              />
            </div>

            {/* Filter Kind */}
            <div className="flex items-center bg-[#ffffff03] border border-white/[0.08] rounded px-3 py-1.5">
              <Filter size={14} style={{ color: C.muted, marginRight: 8 }} />
              <select
                value={filterKind}
                onChange={(e) => setFilterKind(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 12,
                  color: C.text,
                  cursor: "pointer",
                }}
              >
                {annotationKinds.map((k) => (
                  <option key={k} value={k} style={{ background: C.bg, color: C.text }}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredAnnotations.length === 0 ? (
          <div 
            className="p-8 rounded border text-center text-sm"
            style={{ background: "#ffffff02", borderColor: C.border, color: C.muted }}
          >
            No annotations match the current query.
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredAnnotations.map((ann, idx) => {
              let tagColor = "#a3e635";
              let tagBg = "#a3e63515";
              const k = ann.kind.toUpperCase();
              
              if (k === "FIXME" || k === "BUG") {
                tagColor = "#ef4444";
                tagBg = "#ef444415";
              } else if (k === "HACK" || k === "XXX") {
                tagColor = "#f59e0b";
                tagBg = "#f59e0b15";
              } else if (k === "DEPRECATED") {
                tagColor = "#94a3b8";
                tagBg = "#94a3b815";
              }

              return (
                <div 
                  key={idx}
                  className="p-4 rounded border flex flex-col md:flex-row md:items-start justify-between gap-3"
                  style={{ background: "#ffffff02", borderColor: C.border }}
                >
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span 
                        style={{ 
                          ...mono, 
                          fontSize: 9, 
                          fontWeight: 600, 
                          color: tagColor, 
                          background: tagBg, 
                          padding: "2px 6px", 
                          borderRadius: 2 
                        }}
                      >
                        {k}
                      </span>
                      <span style={{ ...mono, fontSize: 12, color: C.text, fontWeight: 500 }}>
                        {ann.filePath}:{ann.lineNumber}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                      {ann.message}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
