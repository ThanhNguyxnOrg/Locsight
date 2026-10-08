import { useState, useMemo } from "react";
import { C, mono, HEATMAP_COLORS } from "./tokens";
import { useAnalysis } from "../hooks/useAnalysis";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine, Label
} from "recharts";
import { HotspotEntry } from "../types";
import { Flame, AlertTriangle, CheckCircle, Archive } from "lucide-react";

function classifyQuadrant(
  complexity: number,
  commits: number,
  medianComplexity: number,
  medianCommits: number
): HotspotEntry["quadrant"] {
  const highComplexity = complexity > medianComplexity;
  const highChurn = commits > medianCommits;
  if (highComplexity && highChurn) return "hotspot";
  if (highComplexity && !highChurn) return "complex-legacy";
  if (!highComplexity && highChurn) return "active-clean";
  return "stable";
}

const QUADRANT_CONFIG = {
  hotspot: { color: HEATMAP_COLORS.critical, icon: Flame, label: "Hotspot - Refactor Priority #1" },
  "complex-legacy": { color: HEATMAP_COLORS.high, icon: AlertTriangle, label: "Complex Legacy - Monitor" },
  "active-clean": { color: HEATMAP_COLORS.low, icon: CheckCircle, label: "Active & Clean" },
  stable: { color: C.fg3 || "#6b7280", icon: Archive, label: "Stable & Simple" },
};

export function Hotspots() {
  const { summary } = useAnalysis();
  const [selectedQuadrant, setSelectedQuadrant] =
    useState<HotspotEntry["quadrant"] | "all">("all");

  const hotspots: HotspotEntry[] = useMemo(() => {
    if (!summary?.files) return [];

    const churnMap = new Map<string, number>();
    if (summary.fileChurn) {
      for (const fc of summary.fileChurn) {
        const p = fc.filePath || fc.path;
        if (p) churnMap.set(p, fc.commits);
      }
    }

    const entries: HotspotEntry[] = summary.files.map((f) => {
      const commits = churnMap.get(f.path) || 0;
      const complexity = f.complexity || 0;
      return {
        path: f.path,
        name: f.name,
        complexity,
        commits,
        hotspotScore: complexity * Math.log(commits + 1),
        quadrant: "stable" as HotspotEntry["quadrant"],
      };
    });

    const complexities = entries.map((e) => e.complexity).sort((a, b) => a - b);
    const commitsList = entries.map((e) => e.commits).sort((a, b) => a - b);
    const medianComplexity = complexities[Math.floor(complexities.length / 2)] || 1;
    const medianCommits = commitsList[Math.floor(commitsList.length / 2)] || 1;

    for (const entry of entries) {
      entry.quadrant = classifyQuadrant(
        entry.complexity,
        entry.commits,
        medianComplexity,
        medianCommits
      );
    }

    return entries.sort((a, b) => b.hotspotScore - a.hotspotScore);
  }, [summary]);

  const filteredHotspots = useMemo(() => {
    if (selectedQuadrant === "all") return hotspots;
    return hotspots.filter((h) => h.quadrant === selectedQuadrant);
  }, [hotspots, selectedQuadrant]);

  const quadrantCounts = useMemo(() => {
    const counts = { hotspot: 0, "complex-legacy": 0, "active-clean": 0, stable: 0 };
    for (const h of hotspots) counts[h.quadrant]++;
    return counts;
  }, [hotspots]);

  const medianComplexity = useMemo(() => {
    const sorted = hotspots.map((h) => h.complexity).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] || 1;
  }, [hotspots]);

  const medianCommits = useMemo(() => {
    const sorted = hotspots.map((h) => h.commits).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] || 1;
  }, [hotspots]);

  if (!summary) return null;

  if (!summary.gitAvailable) {
    return (
      <div
        style={{
          padding: 48,
          color: C.fg2,
          textAlign: "center",
          ...mono,
          fontSize: 13,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <AlertTriangle size={36} style={{ marginBottom: 12, color: HEATMAP_COLORS.mid }} />
        <div style={{ fontWeight: 600, fontSize: 15, color: C.fg1, marginBottom: 6 }}>
          Hotspot analysis requires git history
        </div>
        <div style={{ fontSize: 12, color: C.fg3, maxWidth: 400, lineHeight: 1.5 }}>
          Scan a repository with an active git history (.git directory) to compute file churn and complexity hotspots.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        height: "100%",
        overflow: "auto",
        background: C.bg,
      }}
    >
      {/* Header */}
      <div>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: C.fg1,
            margin: 0,
            ...mono,
          }}
        >
          Refactoring Hotspots
        </h2>
        <p style={{ fontSize: 12, color: C.fg3, margin: "4px 0 0", ...mono }}>
          Complexity × Git Churn — files in the top-right quadrant are priority refactoring targets.
        </p>
      </div>

      {/* Quadrant filter chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => setSelectedQuadrant("all")}
          style={{
            padding: "4px 10px",
            fontSize: 11,
            ...mono,
            borderRadius: 4,
            border: `1px solid ${selectedQuadrant === "all" ? C.accent : C.border}`,
            background: selectedQuadrant === "all" ? C.accent : "transparent",
            color: selectedQuadrant === "all" ? "#121114" : C.fg2,
            fontWeight: selectedQuadrant === "all" ? 600 : 400,
            cursor: "pointer",
            transition: "all 120ms ease",
          }}
        >
          All ({hotspots.length})
        </button>
        {(
          Object.entries(QUADRANT_CONFIG) as [
            HotspotEntry["quadrant"],
            (typeof QUADRANT_CONFIG)["hotspot"]
          ][]
        ).map(([q, cfg]) => {
          const Icon = cfg.icon;
          const isSelected = selectedQuadrant === q;
          return (
            <button
              key={q}
              onClick={() => setSelectedQuadrant(q)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                fontSize: 11,
                ...mono,
                borderRadius: 4,
                border: `1px solid ${isSelected ? cfg.color : C.border}`,
                background: isSelected ? `${cfg.color}22` : "transparent",
                color: isSelected ? cfg.color : C.fg2,
                fontWeight: isSelected ? 600 : 400,
                cursor: "pointer",
                transition: "all 120ms ease",
              }}
            >
              <Icon size={12} />
              {cfg.label.split(" - ")[0].trim()} ({quadrantCounts[q]})
            </button>
          );
        })}
      </div>

      {/* Scatter Plot */}
      <div
        style={{
          background: C.surface1,
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          padding: 16,
          minHeight: 320,
        }}
      >
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
            <XAxis
              type="number"
              dataKey="commits"
              name="Git Churn (commits)"
              tick={{ fontSize: 10, fill: C.fg3, fontFamily: "'JetBrains Mono', monospace" }}
              axisLine={{ stroke: C.border }}
              tickLine={{ stroke: C.border }}
            >
              <Label
                value="Git Churn (commits)"
                position="bottom"
                offset={10}
                style={{ fontSize: 11, fill: C.fg3, fontFamily: "'JetBrains Mono', monospace" }}
              />
            </XAxis>
            <YAxis
              type="number"
              dataKey="complexity"
              name="Complexity"
              tick={{ fontSize: 10, fill: C.fg3, fontFamily: "'JetBrains Mono', monospace" }}
              axisLine={{ stroke: C.border }}
              tickLine={{ stroke: C.border }}
            >
              <Label
                value="Complexity"
                angle={-90}
                position="left"
                offset={0}
                style={{ fontSize: 11, fill: C.fg3, fontFamily: "'JetBrains Mono', monospace" }}
              />
            </YAxis>
            <ZAxis type="number" dataKey="hotspotScore" range={[30, 450]} name="Score" />
            <Tooltip
              content={({ payload }) => {
                if (!payload || !payload.length) return null;
                const d = payload[0].payload as HotspotEntry;
                return (
                  <div
                    style={{
                      background: C.surface2 || C.surface1,
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: `1px solid ${C.border}`,
                      fontSize: 11,
                      ...mono,
                      color: C.fg1,
                      maxWidth: 320,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 4,
                        wordBreak: "break-all",
                        color: C.text,
                      }}
                    >
                      {d.path}
                    </div>
                    <div style={{ color: C.fg2 }}>Complexity: {d.complexity}</div>
                    <div style={{ color: C.fg2 }}>Commits: {d.commits}</div>
                    <div style={{ color: C.accent }}>Hotspot Score: {d.hotspotScore.toFixed(1)}</div>
                    <div
                      style={{
                        color: QUADRANT_CONFIG[d.quadrant].color,
                        marginTop: 4,
                        fontWeight: 600,
                      }}
                    >
                      {QUADRANT_CONFIG[d.quadrant].label}
                    </div>
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={medianComplexity}
              stroke={C.fg3}
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
            <ReferenceLine
              x={medianCommits}
              stroke={C.fg3}
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
            <Scatter data={filteredHotspots} isAnimationActive={false}>
              {filteredHotspots.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={QUADRANT_CONFIG[entry.quadrant].color}
                  fillOpacity={0.75}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Top Hotspots Table */}
      <div>
        <h3
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: C.fg1,
            margin: "0 0 8px",
            ...mono,
          }}
        >
          Top Refactoring Targets
        </h3>
        <div
          style={{
            background: C.surface1,
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 11,
              ...mono,
            }}
          >
            <thead>
              <tr style={{ background: C.surface2 || C.surface1, color: C.fg2 }}>
                <th
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  #
                </th>
                <th
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  File
                </th>
                <th
                  style={{
                    padding: "8px 12px",
                    textAlign: "right",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  Complexity
                </th>
                <th
                  style={{
                    padding: "8px 12px",
                    textAlign: "right",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  Commits
                </th>
                <th
                  style={{
                    padding: "8px 12px",
                    textAlign: "right",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  Score
                </th>
                <th
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  Quadrant
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredHotspots.slice(0, 25).map((h, i) => (
                <tr
                  key={h.path}
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    background:
                      i % 2 === 0 ? "transparent" : `${C.surface2 || C.surface1}44`,
                  }}
                >
                  <td style={{ padding: "6px 12px", color: C.fg3 }}>{i + 1}</td>
                  <td
                    style={{
                      padding: "6px 12px",
                      color: C.fg1,
                      wordBreak: "break-all",
                      maxWidth: 300,
                    }}
                  >
                    {h.path}
                  </td>
                  <td style={{ padding: "6px 12px", textAlign: "right", color: C.fg1 }}>
                    {h.complexity}
                  </td>
                  <td style={{ padding: "6px 12px", textAlign: "right", color: C.fg1 }}>
                    {h.commits}
                  </td>
                  <td
                    style={{
                      padding: "6px 12px",
                      textAlign: "right",
                      color: QUADRANT_CONFIG[h.quadrant].color,
                      fontWeight: 600,
                    }}
                  >
                    {h.hotspotScore.toFixed(1)}
                  </td>
                  <td style={{ padding: "6px 12px" }}>
                    <span
                      style={{
                        padding: "2px 6px",
                        borderRadius: 3,
                        fontSize: 10,
                        background: `${QUADRANT_CONFIG[h.quadrant].color}22`,
                        color: QUADRANT_CONFIG[h.quadrant].color,
                      }}
                    >
                      {h.quadrant}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
