import { C, mono } from "./tokens";
import { Card } from "./Card";
import { useAnalysis } from "../hooks/useAnalysis";
import { GitBranch, User, Flame, AlertTriangle, Link2, ArrowRight } from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

export function Git() {
  const { summary } = useAnalysis();

  if (!summary) return null;

  const { gitAvailable, fileChurn, topContributors, files, changeCoupling = [] } = summary;

  if (!gitAvailable) {
    return (
      <div className="px-10 py-8 h-full flex flex-col items-center justify-center text-center">
        <GitBranch size={48} className="mb-4" style={{ color: C.muted }} />
        <h3 style={{ ...mono, fontSize: 18, fontWeight: 500, color: C.text, margin: 0 }}>Git Integration Unavailable</h3>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 8, maxWidth: 460, lineHeight: 1.5 }}>
          Could not extract repository commit history. Verify that this directory is inside an initialized Git repository and that the <code>git</code> command is available on your path.
        </p>
      </div>
    );
  }

  // Calculate hotspot candidates: Churn * Complexity
  const fileMap = new Map(files.map(f => [f.path, f]));
  
  const hotspots = fileChurn
    .map((churn) => {
      const fileInfo = fileMap.get(churn.filePath);
      const complexity = fileInfo ? fileInfo.complexity : 0;
      const score = churn.commits * complexity;
      return {
        path: churn.filePath,
        commits: churn.commits,
        complexity,
        score,
      };
    })
    .filter(h => h.complexity > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // top 5

  const totalCommits = topContributors.reduce((acc, c) => acc + c.commits, 0);

  return (
    <div className="px-10 py-8 h-full overflow-y-auto" style={{ background: C.bg }}>
      {/* Title */}
      <div className="mb-8">
        <h2 style={{ ...mono, fontSize: 24, fontWeight: 500, color: C.text, margin: 0 }}>GIT CHURN & HOTSPOTS</h2>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Repository history analysis, refactoring hotspots, and temporal change coupling</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card label="TOTAL COMMITS">
          <div style={{ ...mono, fontSize: 32, fontWeight: 600 }}>{fmt(totalCommits)}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>tracked across contributors</div>
        </Card>
        <Card label="CHURNED FILES">
          <div style={{ ...mono, fontSize: 32, fontWeight: 600 }}>{fmt(fileChurn.length)}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>files with modifications</div>
        </Card>
        <Card label="CONTRIBUTORS">
          <div style={{ ...mono, fontSize: 32, fontWeight: 600 }}>{fmt(topContributors.length)}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>active authors</div>
        </Card>
      </div>

      <div className="grid gap-8 mb-8" style={{ gridTemplateColumns: "1.8fr 1.2fr" }}>
        {/* Refactoring Hotspots */}
        <div>
          <div style={{ ...mono, fontSize: 14, color: C.muted, letterSpacing: "0.08em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Flame size={16} style={{ color: C.accent }} />
            REFACTORING HOTSPOTS (COMPLEXITY × CHURN)
          </div>

          {hotspots.length === 0 ? (
            <div 
              className="p-8 rounded border text-center text-sm"
              style={{ background: "#ffffff02", borderColor: C.border, color: C.muted }}
            >
              No high-churn, high-complexity files identified yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {hotspots.map((h, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded border flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  style={{ background: C.surface, borderColor: C.border }}
                >
                  <div className="truncate flex-1 max-w-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={14} style={{ color: h.score > 100 ? "#ef4444" : C.accent }} />
                      <span style={{ ...mono, fontSize: 13, fontWeight: 600, color: C.text }} className="truncate">
                        {h.path.split(/[\\/]/).pop()}
                      </span>
                    </div>
                    <div style={{ ...mono, fontSize: 11, color: C.muted }} className="truncate">
                      {h.path}
                    </div>
                  </div>

                  <div className="flex gap-6 items-center">
                    <div>
                      <div style={{ ...mono, fontSize: 12, textAlign: "right" }}>{h.commits}</div>
                      <div style={{ ...mono, fontSize: 9, color: C.muted, textAlign: "right" }}>COMMITS</div>
                    </div>
                    <div>
                      <div style={{ ...mono, fontSize: 12, textAlign: "right" }}>{h.complexity}</div>
                      <div style={{ ...mono, fontSize: 9, color: C.muted, textAlign: "right" }}>COMPLEXITY</div>
                    </div>
                    <div style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 16 }}>
                      <div style={{ ...mono, fontSize: 14, fontWeight: 600, color: h.score > 100 ? "#ef4444" : C.accent, textAlign: "right" }}>
                        {h.score}
                      </div>
                      <div style={{ ...mono, fontSize: 9, color: C.muted, textAlign: "right" }}>HOTSPOT</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contributors */}
        <div>
          <div style={{ ...mono, fontSize: 14, color: C.muted, letterSpacing: "0.08em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <User size={16} />
            TOP CONTRIBUTORS
          </div>

          <div 
            className="p-5 rounded border"
            style={{ background: C.surface, borderColor: C.border }}
          >
            {topContributors.length === 0 ? (
              <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>No contributor info found.</p>
            ) : (
              <div className="grid gap-4">
                {topContributors.map((c, idx) => {
                  const pct = totalCommits > 0 ? (c.commits / totalCommits) * 100 : 0;
                  return (
                    <div key={idx}>
                      <div className="flex justify-between items-baseline mb-1">
                        <span style={{ ...mono, fontSize: 12, fontWeight: 600 }}>{c.author}</span>
                        <span style={{ ...mono, fontSize: 11, color: C.muted }}>
                          {c.commits} commits ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: C.accent, borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Temporal Change Coupling (Hidden Dependencies) */}
      <div>
        <div style={{ ...mono, fontSize: 14, color: C.muted, letterSpacing: "0.08em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Link2 size={16} style={{ color: C.accent }} />
          TEMPORAL CHANGE COUPLING (HIDDEN DEPENDENCIES)
        </div>

        {changeCoupling.length === 0 ? (
          <div 
            className="p-8 rounded border text-center text-sm"
            style={{ background: "#ffffff02", borderColor: C.border, color: C.muted }}
          >
            No significant change coupling detected in recent commit history.
          </div>
        ) : (
          <div className="grid gap-3">
            <div 
              className="p-4 rounded-lg border mb-4"
              style={{ background: "#38bdf805", borderColor: "#38bdf81a", fontSize: 12, color: C.muted, lineHeight: 1.5 }}
            >
              These file pairs <strong>do not directly import each other</strong> but are modified together in commits at least 25% of the time. This indicates a <strong>hidden dependency</strong> (logical coupling). Consider refactoring them into a single module or separating their shared concerns.
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {changeCoupling.map((cc, idx) => {
                const degreePct = cc.couplingDegree * 100;
                let degreeColor = "#38bdf8"; // blue
                if (degreePct > 70) degreeColor = "#ef4444"; // red
                else if (degreePct > 45) degreeColor = "#f59e0b"; // yellow

                return (
                  <div 
                    key={idx}
                    className="p-4 rounded border flex flex-col justify-between gap-3"
                    style={{ background: C.surface, borderColor: C.border }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap" style={{ ...mono, fontSize: 11, fontWeight: 600 }}>
                        <span className="bg-white/[0.03] px-2 py-0.5 rounded truncate max-w-[150px]" title={cc.fileA}>
                          {cc.fileA.split("/").pop()}
                        </span>
                        <ArrowRight size={12} color={C.muted} />
                        <span className="bg-white/[0.03] px-2 py-0.5 rounded truncate max-w-[150px]" title={cc.fileB}>
                          {cc.fileB.split("/").pop()}
                        </span>
                      </div>
                      <div className="truncate text-zinc-500" style={{ ...mono, fontSize: 9 }}>
                        {cc.fileA} <br/> {cc.fileB}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="flex justify-between items-baseline mb-1" style={{ ...mono, fontSize: 9, color: C.muted }}>
                          <span>COUPLING</span>
                          <span style={{ color: degreeColor, fontWeight: 600 }}>{degreePct.toFixed(0)}%</span>
                        </div>
                        <div style={{ height: 3, background: C.border, borderRadius: 1.5, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${degreePct}%`, background: degreeColor, borderRadius: 1.5 }} />
                        </div>
                      </div>
                      
                      <div style={{ ...mono, fontSize: 10, color: C.muted }} className="text-right whitespace-nowrap">
                        <strong>{cc.sharedCommits}</strong> shared commits
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
