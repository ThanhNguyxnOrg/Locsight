const fs = require("node:fs/promises");
const path = require("node:path");

const SUPPORTED_EXTENSIONS = new Set([
  ".c",
  ".cc",
  ".cpp",
  ".cxx",
  ".h",
  ".hh",
  ".hpp",
  ".hxx",
  ".py",
  ".java",
  ".cs",
  ".html",
  ".htm",
  ".css",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
]);

const DEFAULT_IGNORES = [
  ".git",
  "build",
  "release",
  "bin",
  "dist",
  "node_modules",
  "venv",
  ".next",
  "coverage",
];

function createScanStats() {
  return {
    scannedFiles: 0,
    ignoredFolders: 0,
    ignoredFiles: 0,
    unsupportedFiles: 0,
    gitignoreFiles: 0,
    defaultIgnoreRules: [],
    customIgnoreRules: [],
    gitignoreRules: [],
    appliedIgnoreRules: [],
  };
}

async function collectSourceFiles(rootPath, userIgnoreRules = DEFAULT_IGNORES) {
  const files = [];
  const scanStats = createScanStats();
  const defaultRules = normalizeRules(userIgnoreRules.length ? userIgnoreRules : DEFAULT_IGNORES);
  const gitignore = await loadRootGitignore(rootPath);
  const rules = compileRules([...defaultRules, ...gitignore.rules]);

  scanStats.defaultIgnoreRules = [...DEFAULT_IGNORES];
  scanStats.customIgnoreRules = defaultRules;
  scanStats.gitignoreRules = gitignore.rules;
  scanStats.gitignoreFiles = gitignore.found ? 1 : 0;
  scanStats.appliedIgnoreRules = uniqueRules([...defaultRules, ...gitignore.rules]);

  await walkDirectory(rootPath, rootPath, files, scanStats, rules);

  return {
    files: files.sort((a, b) => a.path.localeCompare(b.path)),
    scanStats,
  };
}

async function walkDirectory(currentPath, rootPath, files, scanStats, rules) {
  const entries = await fs.readdir(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name);
    const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      if (isIgnored(relativePath, true, rules)) {
        scanStats.ignoredFolders++;
        continue;
      }

      await walkDirectory(fullPath, rootPath, files, scanStats, rules);
      continue;
    }

    if (!entry.isFile()) continue;

    if (isIgnored(relativePath, false, rules)) {
      scanStats.ignoredFiles++;
      continue;
    }

    scanStats.scannedFiles++;

    const extension = path.extname(entry.name).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      scanStats.unsupportedFiles++;
      continue;
    }

    const [text, stat] = await Promise.all([
      fs.readFile(fullPath, "utf8"),
      fs.stat(fullPath),
    ]);

    files.push({
      path: relativePath,
      text,
      size: stat.size,
    });
  }
}

async function loadRootGitignore(rootPath) {
  const gitignorePath = path.join(rootPath, ".gitignore");

  try {
    const content = await fs.readFile(gitignorePath, "utf8");
    return {
      found: true,
      rules: parseGitignore(content),
    };
  } catch (error) {
    if (error && error.code !== "ENOENT") {
      console.warn(`Unable to read .gitignore: ${error.message}`);
    }
    return { found: false, rules: [] };
  }
}

function parseGitignore(content) {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function normalizeRules(rules) {
  return uniqueRules(
    rules
      .map((rule) => String(rule).trim())
      .filter(Boolean),
  );
}

function uniqueRules(rules) {
  return Array.from(new Set(rules));
}

function compileRules(rawRules) {
  return normalizeRules(rawRules).map((raw) => {
    const negate = raw.startsWith("!");
    const withoutNegation = negate ? raw.slice(1) : raw;
    const dirOnly = withoutNegation.endsWith("/");
    const anchored = withoutNegation.startsWith("/");
    const normalized = normalizePath(withoutNegation.replace(/^\/+/, "").replace(/\/+$/, ""));

    return {
      raw,
      negate,
      dirOnly,
      anchored,
      pattern: normalized,
      hasSlash: normalized.includes("/"),
      hasWildcard: /[*?[]/.test(normalized),
    };
  }).filter((rule) => rule.pattern.length > 0);
}

function isIgnored(relativePath, isDirectory, rules) {
  const cleanPath = normalizePath(relativePath);
  let ignored = false;

  for (const rule of rules) {
    if (matchesRule(rule, cleanPath, isDirectory)) {
      ignored = !rule.negate;
    }
  }

  return ignored;
}

function matchesRule(rule, cleanPath, isDirectory) {
  if (rule.dirOnly && !isDirectory) return false;

  const segments = cleanPath.split("/");

  if (!rule.hasSlash && !rule.anchored) {
    if (rule.hasWildcard) {
      const re = wildcardToRegExp(rule.pattern, true);
      return segments.some((segment) => re.test(segment));
    }
    return segments.includes(rule.pattern);
  }

  if (rule.hasWildcard) {
    const re = wildcardToRegExp(rule.pattern, false, rule.anchored);
    return re.test(cleanPath);
  }

  if (rule.anchored) {
    return cleanPath === rule.pattern || (isDirectory && cleanPath.startsWith(`${rule.pattern}/`));
  }

  return cleanPath === rule.pattern || cleanPath.endsWith(`/${rule.pattern}`) || (isDirectory && cleanPath.includes(`/${rule.pattern}/`));
}

function wildcardToRegExp(pattern, basenameOnly = false, anchored = false) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]");

  if (basenameOnly) return new RegExp(`^${escaped}$`);
  if (anchored) return new RegExp(`^${escaped}($|/)`);
  return new RegExp(`(^|/)${escaped}($|/)`);
}

function normalizePath(value) {
  return String(value).replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/{2,}/g, "/");
}

module.exports = {
  SUPPORTED_EXTENSIONS,
  DEFAULT_IGNORES,
  collectSourceFiles,
  parseGitignore,
};
