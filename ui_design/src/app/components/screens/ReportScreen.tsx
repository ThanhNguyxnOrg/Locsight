import { useState, useMemo } from "react";
import { Header, PanelHeader } from "./AnalyzeScreen";
import { Download, FileText, Copy, Check, AlertCircle } from "lucide-react";
import { useAnalysis } from "../../context/AnalysisContext";
import { shortcut, shellName } from "../../utils/platform";

export function ReportScreen() {
  const { result, logs } = useAnalysis();
  const [copied, setCopied] = useState(false);

  const md = useMemo(() => {
    if (!result) return "";
    const totalLines = result.files.reduce((a, f) => a + f.total, 0);
    const totalCode = result.files.reduce((a, f) => a + f.code, 0);
    const totalComments = result.files.reduce((a, f) => a + f.comments, 0);
    const totalBlanks = result.files.reduce((a, f) => a + f.blanks, 0);

    const langTable = result.langs
      .map((l) => {
        const percentage = totalCode > 0 ? ((l.code / totalCode) * 100).toFixed(2) : "0.00";
        return `| ${l.name} | ${l.files} | ${l.lines} | ${l.code} | ${l.comments} | ${l.blanks} | ${percentage}% |`;
      })
      .join("\n");

    const fileTable = result.files
      .map((f) => `| \`${f.file}\` | ${f.lang} | ${f.total} | ${f.code} | ${f.comments} | ${f.blanks} |`)
      .join("\n");

    const ignoreTable = result.ignores
      .map((rule) => {
        const fromGitignore = result.gitignoreRules.includes(rule);
        return `| \`${rule}\` | ${fromGitignore ? ".gitignore" : "default"} |`;
      })
      .join("\n");

    return `# Codebase Analyzer Report

**Project Folder:** \`${result.path.split(/[\\/]/).pop() || result.path}\`  
**Scan Timestamp:** \`${result.timestamp}\`  
**Directory Path:** \`${result.path}\`  

## Summary Metrics

| Metric | Count |
| :--- | :--- |
| Scanned Files | ${result.scannedFiles} |
| Supported Source Files | ${result.files.length} |
| Ignored Folders | ${result.ignoredFolders} |
| Ignored Files | ${result.ignoredFiles} |
| Unsupported Files Skipped | ${result.unsupportedFiles} |
| Total Lines | ${totalLines} |
| Code Lines | ${totalCode} |
| Comment Lines | ${totalComments} |
| Blank Lines | ${totalBlanks} |

## Language Distribution

| Language | Files | Total Lines | Code Lines | Comment Lines | Blank Lines | Percentage |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
${langTable}

## Applied Ignore Rules

| Ignore Rule | Source |
| :--- | :--- |
${ignoreTable}

## File Details

| File | Language | Total | Code | Comments | Blank |
| :--- | :--- | :---: | :---: | :---: | :---: |
${fileTable}
`;
  }, [result]);

  if (!result) {
    return (
      <div className="h-full overflow-auto bg-[#070a0f]">
        <div className="max-w-[1200px] mx-auto px-10 py-10">
          <Header title="Report" subtitle="Export the analysis as Markdown or PDF." />
          <div className="rounded-md border border-amber-700/30 bg-amber-500/[0.04] px-4 py-4 flex items-center gap-3 text-[13px] text-amber-300 font-mono">
            <AlertCircle size={16} />
            <div>
              <div>No analysis data yet.</div>
              <div className="text-[11px] text-amber-600 mt-1">Go to the Analyze tab to scan a project first.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = md;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportMd = () => {
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "codebase_report.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`
        <html><head><title>Codebase Report</title>
        <style>body{font-family:monospace;padding:40px;max-width:800px;margin:0 auto}
        h1{font-size:22px}h2{font-size:16px;margin-top:24px;color:#555}
        table{border-collapse:collapse;width:100%;margin:12px 0}
        th,td{text-align:left;padding:6px 12px;border:1px solid #ddd}
        th{background:#f5f5f5}ul{padding-left:20px}</style></head>
        <body><pre>${escapeHtml(md)}</pre></body></html>
      `);
      win.document.close();
      setTimeout(() => win.print(), 300);
    }
  };

  return (
    <div className="h-full overflow-auto bg-[#070a0f]">
      <div className="max-w-[1200px] mx-auto px-10 py-10">
        <Header title="Report" subtitle="Export the analysis as Markdown or PDF." path={result.path} />

        <div className="grid grid-cols-[1.4fr_1fr] gap-4">
          <div className="rounded-lg border border-[#1f2430] bg-[#0d1117]">
            <PanelHeader label="codebase_report.md" right={`preview · ${(new Blob([md]).size / 1024).toFixed(1)} KB`} />
            <div className="grid grid-cols-[40px_1fr] font-mono text-[12px]">
              <div className="bg-[#0a0d12] border-r border-[#1f2430] text-right py-4 px-2 text-[#3f4654] text-[10px] leading-[1.7] select-none">
                {md.split("\n").map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <pre className="py-4 px-4 leading-[1.7] text-[#cbd5e1] whitespace-pre-wrap overflow-auto">
{renderMd(md)}
              </pre>
            </div>
            <div className="px-4 py-2.5 border-t border-[#1f2430] flex items-center justify-between text-[11px] font-mono text-[#4b5563]">
              <span>md · utf-8 · LF</span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-[#9ca3af] hover:text-[#e5e7eb] cursor-pointer transition-colors"
              >
                {copied ? <><Check size={11} className="text-emerald-400" /> copied!</> : <><Copy size={11} /> copy</>}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-[#1f2430] bg-[#0d1117]">
              <PanelHeader label="export" right="2 outputs" />
              <div className="p-4 space-y-2">
                <button
                  onClick={handleExportMd}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-md bg-[#3b5bff] hover:bg-[#4d6bff] text-white text-[13px] cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2"><Download size={14} /> Export Markdown</span>
                  <span className="text-[10px] font-mono text-white/70">{shortcut("E")}</span>
                </button>
                <button
                  onClick={handleExportPdf}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-md border border-[#1f2430] hover:bg-[#11151d] text-[#cbd5e1] text-[13px] cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2"><FileText size={14} /> Export PDF (Print)</span>
                  <span className="text-[10px] font-mono text-[#4b5563]">{shortcut("⇧+E")}</span>
                </button>
              </div>
              <div className="px-4 py-2.5 border-t border-[#1f2430] text-[11px] font-mono text-[#4b5563]">
                output · app download
              </div>
            </div>

            <div className="rounded-lg border border-[#1f2430] bg-[#0a0d12]">
              <div className="px-3 py-2 border-b border-[#1f2430] flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#6b7280]">activity log · {shellName()}</span>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#ff5f57]/70" />
                  <span className="w-2 h-2 rounded-full bg-[#febc2e]/70" />
                  <span className="w-2 h-2 rounded-full bg-[#28c840]/70" />
                </div>
              </div>
              <div className="p-3 font-mono text-[11px] leading-[1.75] text-[#9ca3af] max-h-[200px] overflow-auto">
                {logs.map((log, i) => (
                  <Line
                    key={i}
                    t={log.time}
                    k={log.kind === "ok" ? "ok" : log.kind === "err" ? "err" : log.kind === "parse" ? "run" : "info"}
                    v={log.message}
                  />
                ))}
                <div className="text-[#7c9cff]">$ <span className="animate-pulse">▍</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Line({ t, k, v }: { t: string; k: "info" | "run" | "ok" | "err"; v: string }) {
  const color =
    k === "ok" ? "text-emerald-400" : k === "run" ? "text-amber-400" : k === "err" ? "text-rose-400" : "text-[#7c9cff]";
  return (
    <div className="grid grid-cols-[68px_44px_1fr] gap-2">
      <span className="text-[#4b5563]">{t}</span>
      <span className={color}>[{k}]</span>
      <span className="truncate">{v}</span>
    </div>
  );
}

function renderMd(src: string) {
  return src.split("\n").map((line, i) => {
    if (line.startsWith("# ")) return <div key={i} className="text-[#f3f4f6] text-[15px] mb-1">{line.slice(2)}</div>;
    if (line.startsWith("## ")) return <div key={i} className="text-[#7c9cff] mt-2 mb-0.5">{line.slice(3)}</div>;
    if (line.startsWith("|")) return <div key={i} className="text-[#9ca3af]">{line}</div>;
    if (line.startsWith("- ")) return <div key={i} className="text-[#cbd5e1]">• {line.slice(2)}</div>;
    return <div key={i}>{line || " "}</div>;
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
