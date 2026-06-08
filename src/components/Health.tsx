import { C, mono } from "./tokens";
import { Card } from "./Card";
import { useAnalysis } from "../hooks/useAnalysis";
import { Heart } from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

export function Health() {
  const { summary } = useAnalysis();

  if (!summary) return null;

  const totalCode = summary.totalCode;
  const uniqueCode = summary.uloc;
  const redundantCode = totalCode > uniqueCode ? totalCode - uniqueCode : 0;
  const drynessPct = summary.dryness * 100;
  const redundancyPct = (1 - summary.dryness) * 100;

  const commentDensity = summary.totalLoc > 0 
    ? (summary.totalComments / summary.totalLoc) * 100 
    : 0;

  // Simple classification of overall score
  let score = 100;
  let grade = "A+";
  let gradeColor = "#4ade80";

  // Deduct for redundancy
  score -= redundancyPct * 1.5;
  // Deduct for poor comment density (ideal is 10-30%)
  if (commentDensity < 10) {
    score -= (10 - commentDensity) * 2;
  } else if (commentDensity > 40) {
    score -= (commentDensity - 40) * 0.5;
  }
  // Deduct for complexity
  if (summary.averageComplexity > 15) {
    score -= (summary.averageComplexity - 15) * 3;
  }

  score = Math.max(0, Math.min(100, score));

  if (score >= 90) {
    grade = "A";
    gradeColor = "#4ade80";
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
    gradeColor = "#ef4444";
  }

  return (
    <div className="px-10 py-8 h-full overflow-y-auto">
      {/* Title */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 style={{ ...mono, fontSize: 24, fontWeight: 500, color: C.text, margin: 0 }}>CODEBASE HEALTH</h2>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Static quality metrics & semantic breakdown</p>
        </div>
        <div className="flex items-center gap-4 bg-[#ffffff05] border border-white/[0.05] rounded px-4 py-2">
          <Heart size={20} style={{ color: gradeColor }} />
          <div>
            <div style={{ ...mono, fontSize: 10, color: C.muted, letterSpacing: "0.08em" }}>HEALTH SCORE</div>
            <div style={{ ...mono, fontSize: 18, fontWeight: 600, color: gradeColor }}>
              {Math.round(score)}% · Grade {grade}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* DRYness Card */}
        <Card label="DRYness (Don't Repeat Yourself)">
          <div className="flex justify-between items-baseline mb-2">
            <span style={{ ...mono, fontSize: 36, fontWeight: 600 }}>{drynessPct.toFixed(1)}%</span>
            <span style={{ fontSize: 12, color: C.muted }}>dry ratio</span>
          </div>
          
          <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ height: "100%", width: `${drynessPct}%`, background: "#4ade80", borderRadius: 3 }} />
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

        {/* Documentation Density */}
        <Card label="DOCUMENTATION DENSITY">
          <div className="flex justify-between items-baseline mb-2">
            <span style={{ ...mono, fontSize: 36, fontWeight: 600 }}>{commentDensity.toFixed(1)}%</span>
            <span style={{ fontSize: 12, color: C.muted }}>comment density</span>
          </div>

          <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ height: "100%", width: `${commentDensity}%`, background: "#3178c6", borderRadius: 3 }} />
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

      {/* Semantic Roles Distribution */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ ...mono, fontSize: 14, color: C.muted, letterSpacing: "0.08em", marginBottom: 16 }}>
          SEMANTIC LAYERS / FILE ROLES
        </h3>

        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(summary.roleDistribution).map(([role, stats]) => {
            let desc = "Standard application logic";
            let color = "#dea584";
            
            if (role === "core") { desc = "Application & core business logic"; color = "#a3e635"; }
            else if (role === "test") { desc = "Unit, integration, and mock tests"; color = "#38bdf8"; }
            else if (role === "docs") { desc = "Readmes, documentation, and markdowns"; color = "#fb7185"; }
            else if (role === "infra") { desc = "CI/CD pipelines, Docker, & deployment config"; color = "#c084fc"; }
            else if (role === "config") { desc = "JSON, TOML, settings and metadata"; color = "#94a3b8"; }
            else if (role === "scripts") { desc = "Utility scripts and build workflows"; color = "#fbbf24"; }

            return (
              <div 
                key={role}
                className="p-5 rounded border flex flex-col justify-between"
                style={{ background: "#ffffff03", borderColor: C.border }}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ ...mono, fontSize: 13, fontWeight: 600, textTransform: "uppercase", color }}>
                      {role}
                    </span>
                    <span style={{ ...mono, fontSize: 12, color: C.muted }}>
                      {stats.percentage}%
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: C.muted, margin: "4px 0 16px 0", minHeight: 30 }}>{desc}</p>
                </div>

                <div className="pt-3 border-t border-white/[0.04] flex justify-between items-center">
                  <div>
                    <span style={{ ...mono, fontSize: 14 }}>{fmt(stats.files)}</span>
                    <span style={{ fontSize: 10, color: C.muted, marginLeft: 6 }}>files</span>
                  </div>
                  <div style={{ ...mono, fontSize: 11, color: C.muted }}>
                    {fmt(stats.loc)} loc
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
