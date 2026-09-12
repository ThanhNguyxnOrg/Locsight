import React, { createContext, useContext, useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { ProjectSummary, CocomoResult } from "../types";

interface RecentProject {
  path: string;
  date: string;
  files: number;
}

interface AnalysisContextType {
  summary: ProjectSummary | null;
  loading: boolean;
  progress: number;
  error: string | null;
  cocomoRate: number;
  setCocomoRate: (rate: number) => void;
  cocomo: CocomoResult | null;
  recentProjects: RecentProject[];
  scanFolder: (path: string) => Promise<void>;
  selectFolderAndScan: () => Promise<void>;
  exportSummaryReport: (
    filePath: string,
    format: string,
    options: {
      includeCode: boolean;
      includeMultimedia: boolean;
      includeGame: boolean;
      includeCad: boolean;
      includeDocuments: boolean;
    }
  ) => Promise<void>;
  includeCode: boolean;
  includeMultimedia: boolean;
  includeGame: boolean;
  includeCad: boolean;
  includeDocuments: boolean;
  updateIncludeCode: (val: boolean) => void;
  updateIncludeMultimedia: (val: boolean) => void;
  updateIncludeGame: (val: boolean) => void;
  updateIncludeCad: (val: boolean) => void;
  updateIncludeDocuments: (val: boolean) => void;
  resetAnalysis: () => void;
  pendingFolder: string | null;
  pendingLocignore: string;
  setPendingLocignore: (content: string) => void;
  preparePendingFolder: (path: string) => Promise<void>;
  confirmAndScanPending: () => Promise<void>;
  cancelPending: () => void;
  importGitignoreToPending: () => Promise<void>;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

import { mockProjectSummary, mockCocomoResult } from "../mockData";

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const isDemo = typeof window !== "undefined" && (window.location.search.includes("demo=true") || !(window as any).__TAURI_INTERNALS__);
  const [summary, setSummary] = useState<ProjectSummary | null>(() => isDemo ? mockProjectSummary : null);
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [cocomoRate, setCocomoRate] = useState<number>(2400); // Default multiplier ($2,400)
  const [cocomo, setCocomo] = useState<CocomoResult | null>(() => isDemo ? mockCocomoResult : null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);

  // Global visibility/export settings
  const [includeCode, setIncludeCode] = useState<boolean>(() => {
    const saved = localStorage.getItem("locsight_dash_show_code");
    return saved !== null ? saved === "true" : true;
  });
  const [includeMultimedia, setIncludeMultimedia] = useState<boolean>(() => {
    const saved = localStorage.getItem("locsight_dash_show_multimedia");
    return saved !== null ? saved === "true" : true;
  });
  const [includeGame, setIncludeGame] = useState<boolean>(() => {
    const saved = localStorage.getItem("locsight_dash_show_game");
    return saved !== null ? saved === "true" : true;
  });
  const [includeCad, setIncludeCad] = useState<boolean>(() => {
    const saved = localStorage.getItem("locsight_dash_show_cad");
    return saved !== null ? saved === "true" : true;
  });
  const [includeDocuments, setIncludeDocuments] = useState<boolean>(() => {
    const saved = localStorage.getItem("locsight_dash_show_documents");
    return saved !== null ? saved === "true" : true;
  });

  const updateIncludeCode = (val: boolean) => {
    setIncludeCode(val);
    localStorage.setItem("locsight_dash_show_code", String(val));
  };
  const updateIncludeMultimedia = (val: boolean) => {
    setIncludeMultimedia(val);
    localStorage.setItem("locsight_dash_show_multimedia", String(val));
  };
  const updateIncludeGame = (val: boolean) => {
    setIncludeGame(val);
    localStorage.setItem("locsight_dash_show_game", String(val));
  };
  const updateIncludeCad = (val: boolean) => {
    setIncludeCad(val);
    localStorage.setItem("locsight_dash_show_cad", String(val));
  };
  const updateIncludeDocuments = (val: boolean) => {
    setIncludeDocuments(val);
    localStorage.setItem("locsight_dash_show_documents", String(val));
  };
  
  // Pending scan config states
  const [pendingFolder, setPendingFolder] = useState<string | null>(null);
  const [pendingLocignore, setPendingLocignore] = useState<string>("");

  // Load recent projects on mount
  useEffect(() => {
    const saved = localStorage.getItem("cb_analyzer_recents");
    if (saved) {
      try {
        setRecentProjects(JSON.parse(saved));
      } catch (_) {
        // Clear corrupt storage
        localStorage.removeItem("cb_analyzer_recents");
      }
    }
  }, []);

  // Update COCOMO estimates dynamically when summary or rate changes
  useEffect(() => {
    if (!summary) {
      setCocomo(null);
      return;
    }

    const calculateFallback = () => {
      const kloc = summary.totalLoc / 1000.0;
      if (kloc <= 0) {
        setCocomo({ effortPersonMonths: 0, developmentTimeMonths: 0, estimatedCostUsd: 0, teamSize: 0 });
        return;
      }
      const effort = 2.4 * Math.pow(kloc, 1.05);
      const devTime = 2.5 * Math.pow(effort, 0.38);
      const teamSize = devTime > 0 ? effort / devTime : 0;
      const cost = effort * (cocomoRate * 1000.0);
      setCocomo({
        effortPersonMonths: Math.round(effort * 10) / 10,
        developmentTimeMonths: Math.round(devTime * 10) / 10,
        estimatedCostUsd: Math.round(cost),
        teamSize: Math.round(teamSize * 10) / 10,
      });
    };
    
    // Check if running inside Tauri
    if (typeof window === "undefined" || !(window as any).__TAURI_INTERNALS__) {
      calculateFallback();
      return;
    }

    // Invoke the Rust COCOMO estimation command
    invoke<CocomoResult>("get_cocomo_estimate", {
      loc: summary.totalLoc,
      monthlyRateUsd: cocomoRate * 1000.0,
    })
      .then((res) => setCocomo(res))
      .catch(() => calculateFallback());
  }, [summary, cocomoRate]);

  // Perform codebase scan on path
  const scanFolder = async (folderPath: string) => {
    setLoading(true);
    setProgress(0);
    setError(null);

    // Dynamic progress bar emulation for scanning UI
    const progressTimer = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        return p + Math.floor(Math.random() * 10) + 2;
      });
    }, 150);

    try {
      const result = await invoke<ProjectSummary>("scan_directory", { path: folderPath });
      clearInterval(progressTimer);
      setProgress(100);
      setSummary(result);

      // Save to recent projects
      const updatedRecents = [
        {
          path: folderPath,
          date: new Date().toISOString().replace("T", " ").substring(0, 16),
          files: result.totalFiles,
        },
        ...recentProjects.filter((p) => p.path !== folderPath),
      ].slice(0, 5); // Limit to 5 entries

      setRecentProjects(updatedRecents);
      localStorage.setItem("cb_analyzer_recents", JSON.stringify(updatedRecents));
    } catch (err: any) {
      clearInterval(progressTimer);
      setError(err?.toString() || "An unknown error occurred during scan.");
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const preparePendingFolder = async (folderPath: string) => {
    setPendingFolder(folderPath);
    setError(null);
    try {
      const content = await invoke<string>("read_locignore", { rootPath: folderPath });
      setPendingLocignore(content);
    } catch (err: any) {
      setPendingLocignore("");
    }
  };

  const confirmAndScanPending = async () => {
    if (!pendingFolder) return;
    try {
      await invoke("write_locignore", { rootPath: pendingFolder, content: pendingLocignore });
      await scanFolder(pendingFolder);
      setPendingFolder(null);
      setPendingLocignore("");
    } catch (err: any) {
      setError(err?.toString() || "Failed to write .locignore or scan directory.");
    }
  };

  const cancelPending = () => {
    setPendingFolder(null);
    setPendingLocignore("");
  };

  const importGitignoreToPending = async () => {
    if (!pendingFolder) return;
    try {
      const content = await invoke<string>("read_gitignore", { rootPath: pendingFolder });
      setPendingLocignore((prev) => {
        const separator = prev.trim() ? "\n\n" : "";
        return `${prev}${separator}# Imported from .gitignore\n${content}`;
      });
    } catch (err: any) {
      throw new Error(err?.toString() || "No .gitignore file found in the selected folder.");
    }
  };

  // Open native system folder picker dialog and prepare scan config
  const selectFolderAndScan = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Project Directory for Analysis",
      });

      if (selected && typeof selected === "string") {
        await preparePendingFolder(selected);
      }
    } catch (err: any) {
      setError(err?.toString() || "Failed to open folder picker.");
    }
  };

  // Export report via Rust file writer
  const exportSummaryReport = async (
    filePath: string,
    format: string,
    options: {
      includeCode: boolean;
      includeMultimedia: boolean;
      includeGame: boolean;
      includeCad: boolean;
      includeDocuments: boolean;
    }
  ) => {
    if (!summary) throw new Error("No scan data available to export.");
    await invoke("export_report", {
      path: filePath,
      format,
      summary,
      options,
    });
  };

  const resetAnalysis = () => {
    setSummary(null);
    setError(null);
    setProgress(0);
  };

  return (
    <AnalysisContext.Provider
      value={{
        summary,
        loading,
        progress,
        error,
        cocomoRate,
        setCocomoRate,
        cocomo,
        recentProjects,
        scanFolder,
        selectFolderAndScan,
        exportSummaryReport,
        resetAnalysis,
        includeCode,
        includeMultimedia,
        includeGame,
        includeCad,
        includeDocuments,
        updateIncludeCode,
        updateIncludeMultimedia,
        updateIncludeGame,
        updateIncludeCad,
        updateIncludeDocuments,
        pendingFolder,
        pendingLocignore,
        setPendingLocignore,
        preparePendingFolder,
        confirmAndScanPending,
        cancelPending,
        importGitignoreToPending,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return context;
}
