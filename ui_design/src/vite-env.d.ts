/// <reference types="vite/client" />

type CodebaseAnalyzerScanStats = {
  scannedFiles: number;
  ignoredFolders: number;
  ignoredFiles: number;
  unsupportedFiles: number;
  gitignoreFiles?: number;
  defaultIgnoreRules?: string[];
  customIgnoreRules?: string[];
  gitignoreRules?: string[];
  appliedIgnoreRules?: string[];
};

declare global {
  interface Window {
    codebaseAnalyzer?: {
      pickDirectory: (ignoreRules?: string[]) => Promise<{
        rootPath: string;
        files: Array<{ path: string; text: string; size: number; lastModified?: number }>;
        scanStats: CodebaseAnalyzerScanStats;
      } | null>;
    };
  }
}
