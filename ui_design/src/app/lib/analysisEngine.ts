export type LangStat = {
  name: string;
  files: number;
  lines: number;
  code: number;
  comments: number;
  blanks: number;
  color: string;
};

export type FileRow = {
  file: string;
  lang: string;
  total: number;
  code: number;
  comments: number;
  blanks: number;
  color: string;
  size: number;
};

export type ScanStats = {
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

export type AnalysisResult = {
  path: string;
  timestamp: string;
  elapsed: string;
  source: "repository" | "directory" | "upload";
  langs: LangStat[];
  files: FileRow[];
  scannedFiles: number;
  ignoredFolders: number;
  ignoredFiles: number;
  unsupportedFiles: number;
  gitignoreFiles: number;
  gitignoreRules: string[];
  ignores: string[];
};

export type LogEntry = {
  time: string;
  kind: "scan" | "info" | "parse" | "ok" | "err";
  message: string;
};

export type SourceFile = {
  path: string;
  text: string;
  size: number;
  lastModified?: number;
};

export type RepositorySnapshot = {
  rootName: string;
  rootPath: string;
  generatedAt: string;
  gitBranch: string;
  files: SourceFile[];
};

type AnalyzeOptions = {
  path: string;
  source: AnalysisResult["source"];
  files: SourceFile[];
  ignores: string[];
  scanStats?: Partial<ScanStats>;
  onLog?: (kind: LogEntry["kind"], message: string) => void;
  onProgress?: (value: number) => void;
};

type Counter = {
  total: number;
  code: number;
  comments: number;
  blanks: number;
};

type LanguageSpec = {
  name: string;
  extensions: string[];
  color: string;
  kind: "cLike" | "css" | "html" | "python";
};

type DirectoryCollection = {
  rootPath: string;
  files: SourceFile[];
  scanStats: ScanStats;
};

type DesktopBridge = {
  pickDirectory: (ignoreRules?: string[]) => Promise<DirectoryCollection | null>;
};

export const DEFAULT_IGNORES = [".git", "build", "release", "node_modules", "bin", "dist", "venv", ".next", "coverage"];

const LANGUAGE_SPECS: LanguageSpec[] = [
  { name: "C++", extensions: [".cpp", ".cxx", ".cc", ".hpp", ".hxx", ".hh"], color: "#4f8cff", kind: "cLike" },
  { name: "C", extensions: [".c", ".h"], color: "#8b949e", kind: "cLike" },
  { name: "Python", extensions: [".py"], color: "#ffd43b", kind: "python" },
  { name: "Java", extensions: [".java"], color: "#f89820", kind: "cLike" },
  { name: "C#", extensions: [".cs"], color: "#7c3aed", kind: "cLike" },
  { name: "HTML", extensions: [".html", ".htm"], color: "#e34c26", kind: "html" },
  { name: "CSS", extensions: [".css"], color: "#38bdf8", kind: "css" },
  { name: "JavaScript", extensions: [".js", ".jsx", ".mjs", ".cjs"], color: "#f7df1e", kind: "cLike" },
  { name: "TypeScript", extensions: [".ts", ".tsx", ".mts", ".cts"], color: "#3178c6", kind: "cLike" },
];

export const SUPPORTED_LANGUAGES = LANGUAGE_SPECS.map((spec) => spec.name);

const LANGUAGE_BY_EXT = new Map<string, LanguageSpec>(
  LANGUAGE_SPECS.flatMap((spec) => spec.extensions.map((ext) => [ext, spec] as const)),
);

export function canUseDirectoryPicker() {
  return typeof window !== "undefined" && (Boolean(getDesktopBridge()) || "showDirectoryPicker" in window);
}

export function detectLanguage(filePath: string): LanguageSpec | null {
  const cleanPath = normalizePath(filePath).toLowerCase();
  const dot = cleanPath.lastIndexOf(".");
  if (dot < 0) return null;
  return LANGUAGE_BY_EXT.get(cleanPath.slice(dot)) ?? null;
}

export async function analyzeSources(options: AnalyzeOptions): Promise<AnalysisResult> {
  const started = performance.now();
  const ignores = normalizeIgnores(options.ignores);
  const rows: FileRow[] = [];
  const providedStats = options.scanStats ?? {};
  const scannedFiles = providedStats.scannedFiles ?? options.files.length;
  const ignoredFolders = providedStats.ignoredFolders ?? 0;
  let ignoredFiles = providedStats.ignoredFiles ?? 0;
  let unsupportedFiles = providedStats.unsupportedFiles ?? 0;
  const gitignoreFiles = providedStats.gitignoreFiles ?? 0;
  const gitignoreRules = providedStats.gitignoreRules ?? [];
  const appliedIgnoreRules = providedStats.appliedIgnoreRules ?? ignores;

  options.onProgress?.(4);
  options.onLog?.("scan", `Loaded ${options.files.length} supported files from ${options.path}`);

  for (let index = 0; index < options.files.length; index++) {
    const sourceFile = options.files[index];
    const filePath = normalizePath(sourceFile.path);

    if (isIgnored(filePath, ignores)) {
      ignoredFiles++;
      continue;
    }

    const spec = detectLanguage(filePath);
    if (!spec) {
      unsupportedFiles++;
      continue;
    }

    const counts = countLines(sourceFile.text, spec.kind);
    rows.push({
      file: filePath,
      lang: spec.name,
      total: counts.total,
      code: counts.code,
      comments: counts.comments,
      blanks: counts.blanks,
      color: spec.color,
      size: sourceFile.size,
    });

    if (index % 15 === 0 || index === options.files.length - 1) {
      const progress = Math.min(96, 8 + Math.round(((index + 1) / Math.max(options.files.length, 1)) * 84));
      options.onProgress?.(progress);
    }
  }

  rows.sort((a, b) => b.total - a.total || a.file.localeCompare(b.file));

  const langs = aggregateLanguages(rows);
  for (const lang of langs) {
    options.onLog?.("parse", `${lang.name}: ${lang.files} files, ${lang.lines} lines`);
  }

  const elapsed = ((performance.now() - started) / 1000).toFixed(2);
  options.onProgress?.(100);
  options.onLog?.("ok", `Analysis completed in ${elapsed}s with ${rows.length} supported files`);

  return {
    path: options.path,
    timestamp: formatTimestamp(new Date()),
    elapsed,
    source: options.source,
    langs,
    files: rows,
    scannedFiles,
    ignoredFolders,
    ignoredFiles,
    unsupportedFiles,
    gitignoreFiles,
    gitignoreRules,
    ignores: appliedIgnoreRules,
  };
}

export async function collectDirectoryFiles(ignores: string[], onLog?: (kind: LogEntry["kind"], message: string) => void) {
  const desktopBridge = getDesktopBridge();
  if (desktopBridge) {
    const result = await desktopBridge.pickDirectory(ignores);
    if (!result) {
      throw new Error("No folder selected.");
    }

    onLog?.("scan", `Reading ${result.rootPath}`);
    onLog?.("info", `Applied ${result.scanStats.appliedIgnoreRules?.length ?? ignores.length} ignore rules (${result.scanStats.gitignoreRules?.length ?? 0} from .gitignore)`);
    onLog?.("info", `Skipped ${result.scanStats.ignoredFolders} ignored folders, ${result.scanStats.ignoredFiles} ignored files, and ${result.scanStats.unsupportedFiles} unsupported files`);
    return result;
  }

  if (!canUseDirectoryPicker()) {
    throw new Error("Directory picker is not available in this browser.");
  }

  const picker = (window as Window & { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
  const root = await picker.call(window);
  const files: SourceFile[] = [];
  const scanStats = createScanStats();
  const normalizedIgnores = normalizeIgnores(ignores);
  const gitignoreRules = await readGitignoreFromHandle(root);
  const appliedIgnores = uniqueRules([...normalizedIgnores, ...gitignoreRules]);
  scanStats.defaultIgnoreRules = [...DEFAULT_IGNORES];
  scanStats.customIgnoreRules = normalizedIgnores;
  scanStats.gitignoreRules = gitignoreRules;
  scanStats.gitignoreFiles = gitignoreRules.length > 0 ? 1 : 0;
  scanStats.appliedIgnoreRules = appliedIgnores;

  onLog?.("scan", `Reading ${root.name}`);
  await walkDirectoryHandle(root, "", appliedIgnores, files, scanStats);
  return { rootPath: root.name, files, scanStats };
}

export async function collectUploadedFiles(fileList: FileList, ignores: string[] = DEFAULT_IGNORES): Promise<DirectoryCollection> {
  const rawFiles = await Promise.all(
    Array.from(fileList).map(async (file) => {
      const relativePath = normalizePath((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name);
      return {
        path: relativePath,
        text: await file.text(),
        size: file.size,
        lastModified: file.lastModified,
      };
    }),
  );

  const firstPath = rawFiles[0]?.path ?? "uploaded-folder";
  const rootPath = firstPath.includes("/") ? firstPath.split("/")[0] : "uploaded-folder";
  const rootPrefix = rootPath === "uploaded-folder" ? "" : `${rootPath}/`;
  const gitignoreFile = rawFiles.find((file) => file.path === `${rootPrefix}.gitignore` || file.path === ".gitignore");
  const gitignoreRules = gitignoreFile ? parseGitignore(gitignoreFile.text) : [];
  const normalizedIgnores = normalizeIgnores(ignores);
  const appliedIgnores = uniqueRules([...normalizedIgnores, ...gitignoreRules]);
  const scanStats = createScanStats();
  scanStats.defaultIgnoreRules = [...DEFAULT_IGNORES];
  scanStats.customIgnoreRules = normalizedIgnores;
  scanStats.gitignoreRules = gitignoreRules;
  scanStats.gitignoreFiles = gitignoreFile ? 1 : 0;
  scanStats.appliedIgnoreRules = appliedIgnores;

  const files: SourceFile[] = [];
  const ignoredDirectories = new Set<string>();

  for (const file of rawFiles) {
    const relativeToRoot = rootPrefix && file.path.startsWith(rootPrefix) ? file.path.slice(rootPrefix.length) : file.path;
    const segments = relativeToRoot.split("/");
    const ignoredDirectory = segments.slice(0, -1).find((_, index) => isIgnored(segments.slice(0, index + 1).join("/"), appliedIgnores));
    if (ignoredDirectory) {
      ignoredDirectories.add(ignoredDirectory);
      continue;
    }

    if (isIgnored(relativeToRoot, appliedIgnores)) {
      scanStats.ignoredFiles++;
      continue;
    }

    scanStats.scannedFiles++;
    if (!detectLanguage(relativeToRoot)) {
      scanStats.unsupportedFiles++;
      continue;
    }

    files.push({ ...file, path: relativeToRoot });
  }

  scanStats.ignoredFolders = ignoredDirectories.size;
  return { rootPath, files, scanStats };
}

function aggregateLanguages(rows: FileRow[]): LangStat[] {
  const byLanguage = new Map<string, LangStat>();

  for (const row of rows) {
    const existing = byLanguage.get(row.lang);
    if (existing) {
      existing.files++;
      existing.lines += row.total;
      existing.code += row.code;
      existing.comments += row.comments;
      existing.blanks += row.blanks;
    } else {
      byLanguage.set(row.lang, {
        name: row.lang,
        files: 1,
        lines: row.total,
        code: row.code,
        comments: row.comments,
        blanks: row.blanks,
        color: row.color,
      });
    }
  }

  return Array.from(byLanguage.values()).sort((a, b) => b.lines - a.lines || a.name.localeCompare(b.name));
}

function countLines(text: string, kind: LanguageSpec["kind"]): Counter {
  if (text.length === 0) return { total: 0, code: 0, comments: 0, blanks: 0 };

  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  if (lines.at(-1) === "") lines.pop();

  if (kind === "python") return countPython(lines);
  if (kind === "html") return countBlockOnly(lines, "<!--", "-->");
  if (kind === "css") return countBlockOnly(lines, "/*", "*/");
  return countCLike(lines);
}

function countCLike(lines: string[]): Counter {
  const counter = emptyCounter();
  let inBlockComment = false;

  for (const raw of lines) {
    const line = raw.trim();
    countLine(counter, line, () => {
      if (inBlockComment) {
        const end = line.indexOf("*/");
        if (end >= 0) {
          inBlockComment = false;
          return line.slice(end + 2).trim().length === 0;
        }
        return true;
      }

      if (line.startsWith("/*")) {
        const end = line.indexOf("*/");
        if (end < 0) {
          inBlockComment = true;
          return true;
        }
        return line.slice(end + 2).trim().length === 0;
      }

      return line.startsWith("//");
    });
  }

  return finalizeCounter(counter);
}

function countBlockOnly(lines: string[], startToken: string, endToken: string): Counter {
  const counter = emptyCounter();
  let inBlockComment = false;

  for (const raw of lines) {
    const line = raw.trim();
    countLine(counter, line, () => {
      if (inBlockComment) {
        const end = line.indexOf(endToken);
        if (end >= 0) {
          inBlockComment = false;
          return line.slice(end + endToken.length).trim().length === 0;
        }
        return true;
      }

      if (line.startsWith(startToken)) {
        const end = line.indexOf(endToken, startToken.length);
        if (end < 0) {
          inBlockComment = true;
          return true;
        }
        return line.slice(end + endToken.length).trim().length === 0;
      }

      return false;
    });
  }

  return finalizeCounter(counter);
}

function countPython(lines: string[]): Counter {
  const counter = emptyCounter();
  let inTripleSingle = false;
  let inTripleDouble = false;

  for (const raw of lines) {
    const line = raw.trim();
    countLine(counter, line, () => {
      if (inTripleDouble) {
        const end = line.indexOf('"""');
        if (end >= 0) {
          inTripleDouble = false;
          return line.slice(end + 3).trim().length === 0;
        }
        return true;
      }

      if (inTripleSingle) {
        const end = line.indexOf("'''");
        if (end >= 0) {
          inTripleSingle = false;
          return line.slice(end + 3).trim().length === 0;
        }
        return true;
      }

      if (line.startsWith('"""')) {
        const end = line.indexOf('"""', 3);
        if (end < 0) {
          inTripleDouble = true;
          return true;
        }
        return line.slice(end + 3).trim().length === 0;
      }

      if (line.startsWith("'''")) {
        const end = line.indexOf("'''", 3);
        if (end < 0) {
          inTripleSingle = true;
          return true;
        }
        return line.slice(end + 3).trim().length === 0;
      }

      return line.startsWith("#");
    });
  }

  return finalizeCounter(counter);
}

function countLine(counter: Counter, line: string, isComment: () => boolean) {
  if (line.length === 0) {
    counter.blanks++;
  } else if (isComment()) {
    counter.comments++;
  } else {
    counter.code++;
  }
}

function emptyCounter(): Counter {
  return { total: 0, code: 0, comments: 0, blanks: 0 };
}

function finalizeCounter(counter: Counter): Counter {
  counter.total = counter.code + counter.comments + counter.blanks;
  return counter;
}

function parseGitignore(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

async function readGitignoreFromHandle(root: FileSystemDirectoryHandle) {
  try {
    const gitignore = await root.getFileHandle(".gitignore");
    const file = await gitignore.getFile();
    return parseGitignore(await file.text());
  } catch {
    return [];
  }
}

function normalizeIgnores(ignores: string[]) {
  return uniqueRules(ignores.map((rule) => rule.trim()).filter(Boolean));
}

function uniqueRules(rules: string[]) {
  return Array.from(new Set(rules));
}

function isIgnored(filePath: string, ignores: string[]) {
  const path = normalizePath(filePath);
  const segments = path.split("/");
  let ignored = false;

  for (const rawRule of ignores) {
    const negate = rawRule.startsWith("!");
    const normalizedRule = normalizePath((negate ? rawRule.slice(1) : rawRule).replace(/^\/+/, "").replace(/\/+$/, ""));
    if (!normalizedRule) continue;

    const hasWildcard = /[*?[]/.test(normalizedRule);
    const hasSlash = normalizedRule.includes("/");
    let matched = false;

    if (!hasSlash) {
      matched = hasWildcard
        ? segments.some((segment) => wildcardToRegExp(normalizedRule, true).test(segment))
        : segments.includes(normalizedRule);
    } else if (hasWildcard) {
      matched = wildcardToRegExp(normalizedRule).test(path);
    } else {
      matched = path === normalizedRule || path.startsWith(`${normalizedRule}/`) || path.includes(`/${normalizedRule}/`);
    }

    if (matched) ignored = !negate;
  }

  return ignored;
}

function wildcardToRegExp(pattern: string, basenameOnly = false) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]");
  return new RegExp(basenameOnly ? `^${escaped}$` : `(^|/)${escaped}($|/)`);
}

async function walkDirectoryHandle(
  directory: FileSystemDirectoryHandle,
  basePath: string,
  ignores: string[],
  files: SourceFile[],
  scanStats: ScanStats,
) {
  for await (const [name, handle] of directory.entries()) {
    const relativePath = basePath ? `${basePath}/${name}` : name;

    if (handle.kind === "directory") {
      if (isIgnored(relativePath, ignores)) {
        scanStats.ignoredFolders++;
        continue;
      }

      await walkDirectoryHandle(handle, relativePath, ignores, files, scanStats);
      continue;
    }

    if (handle.kind === "file") {
      if (isIgnored(relativePath, ignores)) {
        scanStats.ignoredFiles++;
        continue;
      }

      scanStats.scannedFiles++;
      const language = detectLanguage(relativePath);
      if (!language) {
        scanStats.unsupportedFiles++;
        continue;
      }
      const file = await handle.getFile();
      files.push({
        path: relativePath,
        text: await file.text(),
        size: file.size,
        lastModified: file.lastModified,
      });
    }
  }
}

function createScanStats(): ScanStats {
  return {
    scannedFiles: 0,
    ignoredFolders: 0,
    ignoredFiles: 0,
    unsupportedFiles: 0,
    gitignoreFiles: 0,
    defaultIgnoreRules: [...DEFAULT_IGNORES],
    customIgnoreRules: [],
    gitignoreRules: [],
    appliedIgnoreRules: [],
  };
}

function normalizePath(path: string) {
  return path.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/{2,}/g, "/");
}

function getDesktopBridge(): DesktopBridge | null {
  if (typeof window === "undefined") return null;
  return window.codebaseAnalyzer ?? null;
}

function formatTimestamp(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
