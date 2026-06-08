export interface FileInfo {
  name: string;
  path: string;
  lang: string;
  loc: number;
  code: number;
  comments: number;
  blanks: number;
  sizeBytes: number;
  complexity: number;
}

export interface LanguageStats {
  name: string;
  files: number;
  code: number;
  comments: number;
  blanks: number;
  pct: number;
}

export interface RoleStats {
  files: number;
  loc: number;
  percentage: number;
}

export interface Annotation {
  kind: string;
  filePath: string;
  lineNumber: number;
  message: string;
}

export interface SecretFinding {
  kind: string;
  filePath: string;
  lineNumber: number;
  snippet: string;
}

export interface FileChurn {
  filePath: string;
  commits: number;
}

export interface Contributor {
  author: string;
  commits: number;
}

export interface ProjectSummary {
  path: string;
  totalFiles: number;
  totalLanguages: number;
  totalCode: number;
  totalComments: number;
  totalBlanks: number;
  totalLoc: number;
  languages: LanguageStats[];
  files: FileInfo[];
  duplicates: number;
  duplicateGroups: string[][];
  averageComplexity: number;
  complexityDist: number[];
  edges: [string, string][];
  scanDurationMs: number;

  // Phase 2-6 additions
  uloc: number;
  dryness: number;
  roleDistribution: Record<string, RoleStats>;
  annotations: Annotation[];
  secrets: SecretFinding[];
  gitAvailable: boolean;
  fileChurn: FileChurn[];
  topContributors: Contributor[];
}

export interface CocomoResult {
  effortPersonMonths: number;
  developmentTimeMonths: number;
  estimatedCostUsd: number;
  teamSize: number;
}

