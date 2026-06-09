import { useState } from "react";
import { C, mono, LANG_COLORS, TECH_CATEGORY_COLORS } from "./tokens";
import { Card } from "./Card";
import { useAnalysis } from "../hooks/useAnalysis";

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

export function Dashboard() {
  const { summary, cocomoRate, setCocomoRate, cocomo } = useAnalysis();
  const [hover, setHover] = useState<string | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);

  if (!summary) return null;

  // Extract directory name for breadcrumb
  const pathParts = summary.path.split(/[\\/]/);
  const projectName = pathParts[pathParts.length - 1] || summary.path;

  // Est. Cost from COCOMO
  const estCostStr = cocomo ? `$${fmt(cocomo.estimatedCostUsd)}` : "—";

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
            {fmt(summary.totalLoc)}
          </div>

          <div className="flex gap-8" style={{ marginTop: 24 }}>
            {[
              { v: fmt(summary.totalFiles), l: "FILES" },
              { v: summary.totalLanguages, l: "LANGUAGES" },
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
              {summary.languages.map((l) => (
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
                ? `${hover} — ${summary.languages.find((l) => l.name === hover)?.pct.toFixed(1)}% · ${fmt(
                    summary.languages.find((l) => l.name === hover)?.code || 0,
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
                {summary.languages.map((l, i) => (
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
              {summary.averageComplexity.toFixed(1)}
            </div>
            <div style={{ ...mono, fontSize: 10, color: C.muted, marginTop: 4 }}>
              average · cyclomatic
            </div>
            <div className="flex items-end gap-1" style={{ marginTop: 18, height: 36 }}>
              {summary.complexityDist.map((v, i) => {
                const maxVal = Math.max(...summary.complexityDist);
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
                {cocomo ? cocomo.effortPersonMonths : "—"} person-months
              </span>
            </div>
            <div className="flex justify-between" style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: C.muted }}>Time</span>
              <span style={{ ...mono, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                {cocomo ? cocomo.developmentTimeMonths : "—"} months
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
                {cocomo ? `$${fmt(cocomo.estimatedCostUsd)}` : "—"}
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
                  {summary.duplicates}
                </span>
                <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>
                  duplicate files
                </span>
              </div>
              {summary.duplicates > 0 && (
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

            {showDuplicates && summary.duplicateGroups.length > 0 && (
              <div 
                className="mt-4 pt-3 border-t border-white/[0.08] overflow-y-auto max-h-48"
                style={{ ...mono, fontSize: 11 }}
              >
                {summary.duplicateGroups.map((group, gIdx) => (
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
