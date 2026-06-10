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
  techStack: TechStackItem[];
  assetReport?: AssetReport;
  architectureReport?: ArchitectureAnalysisReport;
  changeCoupling?: ChangeCoupling[];
}

export interface ChangeCoupling {
  fileA: string;
  fileB: string;
  couplingDegree: number;
  sharedCommits: number;
}

export interface ComponentCoupling {
  afferent: number;
  efferent: number;
  instability: number;
}

export interface RuleViolation {
  source: string;
  target: string;
  ruleName: string;
  description: string;
  severity: string;
}

export interface ArchitectureAnalysisReport {
  caCeMetrics: Record<string, ComponentCoupling>;
  circularDependencies: string[][];
  ruleViolations: RuleViolation[];
  clusters: Record<string, string>;
}

export interface TechStackItem {
  name: string;
  version: string;
  category: string;
  icon?: string;
}

export interface CocomoResult {
  effortPersonMonths: number;
  developmentTimeMonths: number;
  estimatedCostUsd: number;
  teamSize: number;
}

export interface AssetInfo {
  path: string;
  name: string;
  extension: string;
  size: number;
  category: string;
  subcategory: string;
  description: string;
  sha256?: string;
}

export interface AssetSummary {
  totalFiles: number;
  totalSize: number;
  categoryCounts: Record<string, number>;
  categorySizes: Record<string, number>;
  subcategoryCounts: Record<string, number>;
}

export interface AssetDuplicate {
  sha256: string;
  size: number;
  files: string[];
}

export interface OrphanAsset {
  path: string;
  name: string;
  category: string;
  size: number;
}

export interface OptimizationHint {
  path: string;
  name: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  potentialSavings: number;
}

export interface AssetReport {
  summary: AssetSummary;
  assets: AssetInfo[];
  duplicates: AssetDuplicate[];
  orphans: OrphanAsset[];
  optimizationHints: OptimizationHint[];
  edges: [string, string][];
}

