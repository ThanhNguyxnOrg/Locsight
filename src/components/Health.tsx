import { useState, useMemo } from "react";
import { C, mono } from "./tokens";
import { Card } from "./Card";
import { useAnalysis } from "../hooks/useAnalysis";
import { AlertTriangle, Activity, ArrowRight } from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

export function Health() {
  const { summary } = useAnalysis();
  const [metricsSort, setMetricsSort] = useState<"instability" | "ca" | "ce">("instability");
  const [searchQuery, setSearchQuery] = useState("");

  if (!summary) return null;

  const totalCode = summary.totalCode;
  const uniqueCode = summary.uloc;
  const redundantCode = totalCode > uniqueCode ? totalCode - uniqueCode : 0;
  const drynessPct = summary.dryness * 100;
  const redundancyPct = (1 - summary.dryness) * 100;

  const commentDensity = summary.totalLoc > 0 
    ? (summary.totalComments / summary.totalLoc) * 100 
    : 0;

  // Calculate Health Score
  let score = 100;

  // Deduct for redundancy
  score -= redundancyPct * 1.5;

  // Deduct for poor comment density (ideal is 15-30%)
  if (commentDensity < 12) {
    score -= (12 - commentDensity) * 1.5;
  } else if (commentDensity > 45) {
    score -= (commentDensity - 45) * 0.4;
  }

  // Deduct for average complexity
  if (summary.averageComplexity > 12) {
    score -= (summary.averageComplexity - 12) * 2.5;
  }

  // Deduct for circular dependencies
  const circularDeps = summary.architectureReport?.circularDependencies || [];
  score -= circularDeps.length * 5; // -5% for each circular dependency

  // Deduct for rule violations
  const ruleViolations = summary.architectureReport?.ruleViolations || [];
  score -= ruleViolations.length * 3; // -3% for each rule violation

  score = Math.max(0, Math.min(100, score));

  // Determine Grade
  let grade = "A+";
  let gradeColor = "#4ade80"; // green
  if (score >= 95) {
    grade = "A+";
    gradeColor = "#4ade80";
  } else if (score >= 88) {
    grade = "A";
    gradeColor = "#22c55e";
  } else if (score >= 80) {
    grade = "B";
    gradeColor = "#a3e635";
  } else if (score >= 70) {
    grade = "C";
    gradeColor = "#f59e0b";
  } else if (score >= 50) {
    grade = "D";
    gradeColor = "#f97316";
  } else {
    grade = "F";
    gradeColor = "#ef4444"; // red
  }

  // Prep metrics data for display
  const couplingData = useMemo(() => {
    const metricsMap = summary.architectureReport?.caCeMetrics || {};
    return summary.files.map((f) => {
      const m = metricsMap[f.path] || { afferent: 0, efferent: 0, instability: 0.0 };
      return {
        path: f.path,
        name: f.name,
        loc: f.loc,
        ca: m.afferent,
        ce: m.efferent,
        instability: m.instability,
      };
    });
  }, [summary]);

  const filteredCouplingData = useMemo(() => {
    let list = [...couplingData];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => item.path.toLowerCase().includes(q));
    }
    
    return list.sort((a, b) => {
      if (metricsSort === "instability") {
        return b.instability - a.instability || b.loc - a.loc;
      } else if (metricsSort === "ca") {
        return b.ca - a.ca;
      } else {
        return b.ce - a.ce;
      }
    });
  }, [couplingData, searchQuery, metricsSort]);

  // Dasharray math for circular gauge SVG
  const strokeRadius = 45;
  const strokeCircumference = 2 * Math.PI * strokeRadius;
  const strokeDashoffset = strokeCircumference - (strokeCircumference * score) / 100;

  return (
    <div className="px-10 py-8 h-full overflow-y-auto" style={{ background: C.bg }}>
      {/* Title & Gauge Panel */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-[#ffffff02] border border-white/[0.03] rounded-lg p-6">
        <div>
          <h2 style={{ ...mono, fontSize: 24, fontWeight: 500, color: C.text, margin: 0 }}>CODEBASE HEALTH</h2>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 4, maxWidth: 500, lineHeight: 1.5 }}>
            Architectural coupling, cyclic warning logs, and code DRYness metrics computed directly from parsed repository imports.
          </p>
        </div>
        
        {/* Dynamic Circular Gauge */}
        <div className="flex items-center gap-6">
          <div style={{ position: "relative", width: 110, height: 110 }}>
            <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
              {/* Background Circle */}
              <circle
                cx="55"
                cy="55"
                r={strokeRadius}
                fill="transparent"
                stroke={C.border}
                strokeWidth="8"
              />
              {/* Progress Circle */}
              <circle
                cx="55"
                cy="55"
                r={strokeRadius}
                fill="transparent"
                stroke={gradeColor}
                strokeWidth="8"
                strokeDasharray={strokeCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
              />
            </svg>
            {/* Centered Grade */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ top: 0, left: 0, width: "100%", height: "100%" }}
            >
              <span style={{ ...mono, fontSize: 28, fontWeight: 700, color: gradeColor }}>
                {grade}
              </span>
              <span style={{ ...mono, fontSize: 10, color: C.muted, marginTop: -2 }}>
                {Math.round(score)}%
              </span>
            </div>
          </div>

          <div>
            <div style={{ ...mono, fontSize: 10, color: C.muted, letterSpacing: "0.08em" }}>OVERALL RATING</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.text, marginTop: 4 }}>
              Architecture Health Rating
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
              <span>• {circularDeps.length} Cycles</span>
              <span>• {ruleViolations.length} Violations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Circular Dependencies Alert Box */}
      {circularDeps.length > 0 && (
        <div 
          className="p-5 rounded-lg border flex flex-col gap-4 mb-8"
          style={{ background: "#ef444407", borderColor: "#ef444422" }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} style={{ color: "#ef4444", marginTop: 2, flexShrink: 0 }} />
            <div>
              <h4 style={{ ...mono, fontSize: 13, fontWeight: 600, color: "#ef4444", margin: 0, textTransform: "uppercase" }}>
                CIRCULAR DEPENDENCY WARN ({circularDeps.length} cycles detected)
              </h4>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>
                Cycles represent circular reference paths (e.g. A calls B, B calls A) that cause high coupling, complicate testing, and reduce modular code reusability. Break these dependencies by separating contracts/interfaces.
              </p>
            </div>
          </div>

          <div style={{ width: "100%" }} className="max-h-60 overflow-y-auto bg-black/40 border border-white/[0.03] rounded p-3">
            <div className="flex flex-col gap-2">
              {circularDeps.map((cycle, idx) => (
                <div key={idx} style={{ ...mono, fontSize: 11, color: C.text }} className="flex items-center flex-wrap gap-1 py-1 border-b border-white/[0.02] last:border-b-0">
                  <span style={{ color: "#ef4444", fontWeight: 600, marginRight: 6 }}>#{idx + 1}</span>
                  {cycle.map((node, cidx) => (
                    <span key={cidx} className="flex items-center">
                      <span className="bg-white/[0.04] px-1.5 py-0.5 rounded text-zinc-300 max-w-xs truncate" title={node}>
                        {node.split(/[\\/]/).pop()}
                      </span>
                      {cidx < cycle.length - 1 && <ArrowRight size={10} color={C.muted} className="mx-1.5" />}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Existing DRYness & Comments Cards */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card label="DRYness (Don't Repeat Yourself)">
          <div className="flex justify-between items-baseline mb-2">
            <span style={{ ...mono, fontSize: 32, fontWeight: 600 }}>{drynessPct.toFixed(1)}%</span>
            <span style={{ fontSize: 12, color: C.muted }}>dry ratio</span>
          </div>
          
          <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ height: "100%", width: `${drynessPct}%`, background: drynessPct > 80 ? "#22c55e" : "#eab308", borderRadius: 3 }} />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/[0.04]">
            <div>
              <div style={{ ...mono, fontSize: 13 }}>{fmt(uniqueCode)}</div>
              <div style={{ ...mono, fontSize: 10, color: C.muted, marginTop: 2 }}>UNIQUE CODE LINES</div>
            </div>
            <div>
              <div style={{ ...mono, fontSize: 13, color: redundancyPct > 15 ? C.accent : C.text }}>
                {fmt(redundantCode)}
              </div>
              <div style={{ ...mono, fontSize: 10, color: C.muted, marginTop: 2 }}>REDUNDANT LINES ({redundancyPct.toFixed(1)}%)</div>
            </div>
          </div>
        </Card>

        <Card label="DOCUMENTATION DENSITY">
          <div className="flex justify-between items-baseline mb-2">
            <span style={{ ...mono, fontSize: 32, fontWeight: 600 }}>{commentDensity.toFixed(1)}%</span>
            <span style={{ fontSize: 12, color: C.muted }}>comment ratio</span>
          </div>

          <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ height: "100%", width: `${commentDensity}%`, background: "#3b82f6", borderRadius: 3 }} />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/[0.04]">
            <div>
              <div style={{ ...mono, fontSize: 13 }}>{fmt(summary.totalComments)}</div>
              <div style={{ ...mono, fontSize: 10, color: C.muted, marginTop: 2 }}>COMMENT LINES</div>
            </div>
            <div>
              <div style={{ ...mono, fontSize: 13 }}>{fmt(summary.totalCode)}</div>
              <div style={{ ...mono, fontSize: 10, color: C.muted, marginTop: 2 }}>SOURCE CODE LINES</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Component Coupling Table */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div style={{ ...mono, fontSize: 14, color: C.muted, letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6 }}>
            <Activity size={15} color={C.accent} />
            ARCHITECTURE COUPLING METRICS
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#ffffff03] border border-white/[0.06] rounded px-3 py-1">
              <input
                placeholder="search file paths..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  ...mono,
                  fontSize: 11,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: C.text,
                  width: 140,
                }}
              />
            </div>

            <div className="flex items-center bg-[#ffffff03] border border-white/[0.06] rounded px-3 py-1">
              <span style={{ ...mono, fontSize: 10, color: C.muted, marginRight: 8 }}>SORT BY:</span>
              <select
                value={metricsSort}
                onChange={(e) => setMetricsSort(e.target.value as any)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 11,
                  color: C.text,
                  cursor: "pointer",
                  ...mono,
                }}
              >
                <option value="instability" style={{ background: C.surface }}>Instability (I)</option>
                <option value="ca" style={{ background: C.surface }}>Afferent (Ca)</option>
                <option value="ce" style={{ background: C.surface }}>Efferent (Ce)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border border-white/[0.05] rounded-lg overflow-hidden" style={{ background: C.surface }}>
          <table className="w-full text-left border-collapse" style={{ ...mono, fontSize: 11 }}>
            <thead>
              <tr style={{ background: "#ffffff02", borderBottom: `1px solid ${C.border}` }}>
                <th className="p-3 text-zinc-500 font-medium">FILE MODULE</th>
                <th className="p-3 text-zinc-500 font-medium text-center" title="Afferent coupling: number of files that depend on this file">Ca</th>
                <th className="p-3 text-zinc-500 font-medium text-center" title="Efferent coupling: number of files this file depends on">Ce</th>
                <th className="p-3 text-zinc-500 font-medium text-center" title="Instability = Ce / (Ca + Ce). 1.0 is totally unstable/fragile, 0.0 is stable.">INSTABILITY (I)</th>
                <th className="p-3 text-zinc-500 font-medium text-right">LOC</th>
              </tr>
            </thead>
            <tbody>
              {filteredCouplingData.slice(0, 10).map((row, idx) => {
                // Style coloring for instability
                let instColor = "#22c55e";
                if (row.instability > 0.8) instColor = "#ef4444";
                else if (row.instability > 0.5) instColor = "#eab308";

                return (
                  <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }} className="hover:bg-white/[0.01]">
                    <td className="p-3 truncate max-w-sm" style={{ color: C.text }}>
                      <span className="text-zinc-500" style={{ fontSize: 9 }}>{row.path.substring(0, row.path.length - row.name.length)}</span>
                      <span>{row.name}</span>
                    </td>
                    <td className="p-3 text-center text-zinc-300 font-medium">{row.ca}</td>
                    <td className="p-3 text-center text-zinc-300 font-medium">{row.ce}</td>
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs" style={{ background: `${instColor}10`, color: instColor }}>
                        {row.instability.toFixed(2)}
                      </div>
                    </td>
                    <td className="p-3 text-right text-zinc-400">{row.loc}</td>
                  </tr>
                );
              })}
              {filteredCouplingData.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-zinc-500">No matching files found.</td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredCouplingData.length > 10 && (
            <div className="p-3 text-center text-xs text-zinc-500 border-t border-white/[0.03]">
              Showing top 10 of {filteredCouplingData.length} files. Search or sort to explore more.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
