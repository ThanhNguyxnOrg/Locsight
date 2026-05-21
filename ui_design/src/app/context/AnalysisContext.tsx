import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  analyzeSources,
  collectDirectoryFiles,
  collectUploadedFiles,
  type AnalysisResult,
  type LogEntry,
  type SourceFile,
  type ScanStats,
} from "../lib/analysisEngine";

type ContextValue = {
  result: AnalysisResult | null;
  logs: LogEntry[];
  analyzing: boolean;
  progress: number;
  error: string | null;
  projectPath: string;
  runDirectoryPickerAnalysis: (ignores: string[]) => Promise<void>;
  runUploadedFilesAnalysis: (files: FileList, ignores: string[]) => Promise<void>;
  setProjectPath: (path: string) => void;
  clearError: () => void;
};

const AnalysisContext = createContext<ContextValue | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [projectPath, setProjectPath] = useState("");

  const addLog = useCallback((kind: LogEntry["kind"], message: string) => {
    setLogs((prev) => [...prev, { time: timeNow(), kind, message }]);
  }, []);

  const runSourceAnalysis = useCallback(
    async (
      path: string,
      source: AnalysisResult["source"],
      files: SourceFile[],
      ignores: string[],
      options?: { preserveLogs?: boolean; scanStats?: Partial<ScanStats> },
    ) => {
      setAnalyzing(true);
      setError(null);
      setProgress(0);
      if (!options?.preserveLogs) setLogs([]);
      setProjectPath(path);

      try {
        const data = await analyzeSources({
          path,
          source,
          files,
          ignores,
          scanStats: options?.scanStats,
          onLog: addLog,
          onProgress: setProgress,
        });
        setResult(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Analysis failed.";
        setError(message);
        addLog("err", message);
        throw err;
      } finally {
        setAnalyzing(false);
      }
    },
    [addLog],
  );

  const runDirectoryPickerAnalysis = useCallback(
    async (ignores: string[]) => {
      setAnalyzing(true);
      setError(null);
      setProgress(2);
      setLogs([]);

      try {
        const { rootPath, files, scanStats } = await collectDirectoryFiles(ignores, addLog);
        await runSourceAnalysis(rootPath, "directory", files, ignores, { preserveLogs: true, scanStats });
      } catch (err) {
        setAnalyzing(false);
        const message = err instanceof Error ? err.message : "Unable to read selected folder.";
        setError(message);
        addLog("err", message);
        throw err;
      }
    },
    [addLog, runSourceAnalysis],
  );

  const runUploadedFilesAnalysis = useCallback(
    async (fileList: FileList, ignores: string[]) => {
      setAnalyzing(true);
      setError(null);
      setProgress(2);
      setLogs([]);

      try {
        addLog("scan", `Reading ${fileList.length} uploaded files`);
        const { rootPath, files, scanStats } = await collectUploadedFiles(fileList, ignores);
        await runSourceAnalysis(rootPath, "upload", files, ignores, { preserveLogs: true, scanStats });
      } catch (err) {
        setAnalyzing(false);
        const message = err instanceof Error ? err.message : "Unable to read uploaded folder.";
        setError(message);
        addLog("err", message);
        throw err;
      }
    },
    [addLog, runSourceAnalysis],
  );

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<ContextValue>(
    () => ({
      result,
      logs,
      analyzing,
      progress,
      error,
      projectPath,
      runDirectoryPickerAnalysis,
      runUploadedFilesAnalysis,
      setProjectPath,
      clearError,
    }),
    [
      result,
      logs,
      analyzing,
      progress,
      error,
      projectPath,
      runDirectoryPickerAnalysis,
      runUploadedFilesAnalysis,
      clearError,
    ],
  );

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used inside AnalysisProvider");
  return ctx;
}

function timeNow() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export type { AnalysisResult, FileRow, LangStat, LogEntry } from "../lib/analysisEngine";
