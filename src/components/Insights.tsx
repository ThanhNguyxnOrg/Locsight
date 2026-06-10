import { useState } from "react";
import { C, mono } from "./tokens";
import { useAnalysis } from "../hooks/useAnalysis";
import { ShieldCheck, ShieldAlert, Search, Filter, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";

export function Insights() {
  const { summary } = useAnalysis();
  const [filterKind, setFilterKind] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (!summary) return null;

  const { secrets, annotations, architectureReport } = summary;
  const ruleViolations = architectureReport?.ruleViolations || [];

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
    <div className="px-10 py-8 h-full overflow-y-auto" style={{ background: C.bg }}>
      {/* Title */}
      <div className="mb-8">
        <h2 style={{ ...mono, fontSize: 24, fontWeight: 500, color: C.text, margin: 0 }}>CODEBASE INSIGHTS</h2>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Security alerts, architecture rule validation, and code annotations</p>
      </div>

      {/* 1. Architecture Violations Section */}
      <div className="mb-10">
        <div style={{ ...mono, fontSize: 14, color: C.muted, letterSpacing: "0.08em", marginBottom: 16 }}>
          ARCHITECTURE COMPLIANCE VALIDATOR
        </div>

        {ruleViolations.length === 0 ? (
          <div 
            className="p-5 rounded-lg border flex items-center gap-4"
            style={{ background: "#22c55e08", borderColor: "#22c55e22" }}
          >
            <CheckCircle size={28} style={{ color: "#22c55e" }} />
            <div>
              <div style={{ ...mono, fontSize: 13, fontWeight: 600, color: "#22c55e" }}>
                Architecture rules are fully compliant
              </div>
              <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0 0" }}>
                No restricted imports detected. Validated against rules configured in <code>.locsight.rules.json</code>.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div 
              className="p-5 rounded-lg border flex items-center gap-4 mb-4"
              style={{ background: "#ef444408", borderColor: "#ef444422" }}
            >
              <AlertCircle size={28} style={{ color: "#ef4444" }} />
              <div>
                <div style={{ ...mono, fontSize: 13, fontWeight: 600, color: "#ef4444" }}>
                  {ruleViolations.length} architecture rule violation{ruleViolations.length > 1 ? "s" : ""} detected!
                </div>
                <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0 0" }}>
                  Restricted imports found between architectural component boundaries. Refactor to preserve layering.
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {ruleViolations.map((violation, idx) => {
                const isError = violation.severity.toLowerCase() === "error";
                const sevColor = isError ? "#ef4444" : "#eab308";
                const sevBg = isError ? "#ef444410" : "#eab30810";

                return (
                  <div 
                    key={idx}
                    className="p-4 rounded-lg border flex flex-col justify-between gap-2"
                    style={{ background: C.surface, borderColor: C.border }}
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span 
                          style={{ 
                            ...mono, 
                            fontSize: 9, 
                            fontWeight: 600, 
                            color: sevColor, 
                            background: sevBg, 
                            padding: "2px 6px", 
                            borderRadius: 3 
                          }}
                        >
                          {violation.ruleName.toUpperCase()}
                        </span>
                        <div style={{ ...mono, fontSize: 11, color: C.text }} className="flex items-center gap-2">
                          <span className="bg-white/[0.03] px-1.5 py-0.5 rounded truncate max-w-xs">{violation.source}</span>
                          <ArrowRight size={12} color={C.muted} />
                          <span className="bg-white/[0.03] px-1.5 py-0.5 rounded truncate max-w-xs">{violation.target}</span>
                        </div>
                      </div>
                      <span style={{ ...mono, fontSize: 9, color: C.muted }}>{violation.severity.toUpperCase()}</span>
                    </div>
                    <p style={{ fontSize: 11, color: C.muted, margin: "4px 0 0 0", lineHeight: 1.4 }}>
                      {violation.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Security Check Section */}
      <div className="mb-10">
        <div style={{ ...mono, fontSize: 14, color: C.muted, letterSpacing: "0.08em", marginBottom: 16 }}>
          SECURITY CREDENTIAL SCANNER
        </div>

        {secrets.length === 0 ? (
          <div 
            className="p-5 rounded-lg border flex items-center gap-4"
            style={{ background: "#22c55e08", borderColor: "#22c55e22" }}
          >
            <ShieldCheck size={28} style={{ color: "#22c55e" }} />
            <div>
              <div style={{ ...mono, fontSize: 13, fontWeight: 600, color: "#22c55e" }}>
                No exposed keys or credentials detected
              </div>
              <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0 0" }}>
                No AWS credentials, GitHub tokens, Google API keys, or private keys found in codebase files.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div 
              className="p-5 rounded-lg border flex items-center gap-4 mb-4"
              style={{ background: "#ef444408", borderColor: "#ef444422" }}
            >
              <ShieldAlert size={28} style={{ color: "#ef4444" }} />
              <div>
                <div style={{ ...mono, fontSize: 13, fontWeight: 600, color: "#ef4444" }}>
                  {secrets.length} exposed credential finding{secrets.length > 1 ? "s" : ""} detected!
                </div>
                <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0 0" }}>
                  CRITICAL: Exposed credentials were found in plain text. Exclude these files or revoke/mask the keys immediately.
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {secrets.map((sec, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-lg border flex flex-col gap-2"
                  style={{ background: C.surface, borderColor: C.border }}
                >
                  <div className="flex items-center gap-3">
                    <span 
                      style={{ 
                        ...mono, 
                        fontSize: 9, 
                        background: "#ef44441e", 
                        color: "#ef4444", 
                        padding: "2px 6px", 
                        borderRadius: 3
                      }}
                    >
                      {sec.kind.toUpperCase()}
                    </span>
                    <span style={{ ...mono, fontSize: 11, color: C.text }}>
                      {sec.filePath}:{sec.lineNumber}
                    </span>
                  </div>
                  <div 
                    className="p-2 rounded text-xs bg-black/40 border border-white/[0.04]"
                    style={{ ...mono, color: C.muted, overflowX: "auto" }}
                  >
                    {sec.snippet}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Code Annotations / TODOs */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div style={{ ...mono, fontSize: 14, color: C.muted, letterSpacing: "0.08em" }}>
            CODE ANNOTATIONS ({filteredAnnotations.length} of {annotations.length})
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center bg-[#ffffff03] border border-white/[0.06] rounded px-3 py-1.5" style={{ minWidth: 200 }}>
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
            <div className="flex items-center bg-[#ffffff03] border border-white/[0.06] rounded px-3 py-1.5">
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
                  <option key={k} value={k} style={{ background: C.surface, color: C.text }}>
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
              let tagColor = "#22c55e";
              let tagBg = "#22c55e15";
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
                  className="p-4 rounded border flex flex-col justify-between gap-3"
                  style={{ background: C.surface, borderColor: C.border }}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span 
                        style={{ 
                          ...mono, 
                          fontSize: 9, 
                          fontWeight: 600, 
                          color: tagColor, 
                          background: tagBg, 
                          padding: "2px 6px", 
                          borderRadius: 3 
                        }}
                      >
                        {k}
                      </span>
                      <span style={{ ...mono, fontSize: 11, color: C.text, fontWeight: 500 }}>
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
