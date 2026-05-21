import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const SUPPORTED_EXTENSIONS = new Set([
  '.c',
  '.cc',
  '.cpp',
  '.cxx',
  '.h',
  '.hh',
  '.hpp',
  '.hxx',
  '.py',
  '.java',
  '.cs',
  '.html',
  '.htm',
  '.css',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
])

const IGNORED_DIRS = new Set([
  '.git',
  '.github',
  'build',
  'release',
  'bin',
  'dist',
  'node_modules',
  'venv',
  '.next',
  'coverage',
])

function repositorySnapshotPlugin(): Plugin {
  const virtualId = 'virtual:repo-snapshot'
  const resolvedVirtualId = `\0${virtualId}`
  const repoRoot = path.resolve(__dirname, '..')

  return {
    name: 'repository-snapshot',
    resolveId(id) {
      return id === virtualId ? resolvedVirtualId : undefined
    },
    load(id) {
      if (id !== resolvedVirtualId) return undefined

      const files = collectSourceFiles(repoRoot, repoRoot)
      const snapshot = {
        rootName: path.basename(repoRoot),
        rootPath: repoRoot,
        generatedAt: new Date().toISOString(),
        gitBranch: gitBranch(repoRoot),
        files,
      }

      return `export const repoSnapshot = ${JSON.stringify(snapshot)}`
    },
  }
}

function collectSourceFiles(directory: string, repoRoot: string): Array<{ path: string; text: string; size: number }> {
  const files: Array<{ path: string; text: string; size: number }> = []

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) continue

    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath, repoRoot))
      continue
    }

    if (!entry.isFile() || !SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue

    const relativePath = path.relative(repoRoot, fullPath).replace(/\\/g, '/')
    const stat = fs.statSync(fullPath)
    files.push({
      path: relativePath,
      text: fs.readFileSync(fullPath, 'utf8'),
      size: stat.size,
    })
  }

  return files.sort((a, b) => a.path.localeCompare(b.path))
}

function gitBranch(repoRoot: string) {
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return 'unknown'
  }
}

export default defineConfig({
  base: './',
  plugins: [
    repositorySnapshotPlugin(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],
})
