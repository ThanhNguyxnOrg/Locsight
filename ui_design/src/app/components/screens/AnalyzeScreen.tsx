import { useCallback, useRef, useState } from "react";
import { Check, FolderOpen, Plus, RotateCcw, Upload, X } from "lucide-react";
import { useAnalysis } from "../../context/AnalysisContext";
import { canUseDirectoryPicker, DEFAULT_IGNORES, SUPPORTED_LANGUAGES } from "../../lib/analysisEngine";
import { shortcut } from "../../utils/platform";

export function AnalyzeScreen({ onComplete }: { onComplete: () => void }) {
  const {
    runDirectoryPickerAnalysis,
    runUploadedFilesAnalysis,
    analyzing,
    progress,
    projectPath,
    error,
    clearError,
  } = useAnalysis();
  const [ignores, setIgnores] = useState(DEFAULT_IGNORES);
  const [newIgnore, setNewIgnore] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const uploadRef = useRef<HTMLInputElement | null>(null);

  const complete = useCallback(() => {
    window.setTimeout(onComplete, 250);
  }, [onComplete]);

  const analyzeDirectory = useCallback(async () => {
    clearError();
    if (!canUseDirectoryPicker()) {
      uploadRef.current?.setAttribute("webkitdirectory", "");
      uploadRef.current?.click();
      return;
    }

    try {
      await runDirectoryPickerAnalysis(ignores);
      complete();
    } catch {
      // surfaced by context error state
    }
  }, [clearError, complete, ignores, runDirectoryPickerAnalysis]);

  const uploadFolder = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      clearError();
      try {
        await runUploadedFilesAnalysis(files, ignores);
        if (uploadRef.current) uploadRef.current.value = "";
        complete();
      } catch {
        // surfaced by context error state
      }
    },
    [clearError, complete, ignores, runUploadedFilesAnalysis],
  );

  const openUploadFallback = () => {
    uploadRef.current?.setAttribute("webkitdirectory", "");
    uploadRef.current?.click();
  };

  const addIgnore = () => {
    const val = newIgnore.trim();
    if (val && !ignores.includes(val)) setIgnores([...ignores, val]);
    setNewIgnore("");
    setShowAddInput(false);
  };

  return (
    <div className="h-full overflow-auto bg-[#070a0f]">
      <div className="max-w-[980px] mx-auto px-10 py-10">
        <Header title="Analyze" subtitle="Choose a local project folder to start analysis." path={projectPath} />

        <input
          ref={uploadRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => void uploadFolder(event.currentTarget.files)}
        />

        <div className="grid grid-cols-[1.15fr_0.85fr] gap-4">
          <div className="rounded-lg border border-[#1f2430] bg-[#0d1117]">
            <PanelHeader label="source.target" right="required" />
            <div className="p-4 space-y-3">
              <button
                onClick={analyzeDirectory}
                disabled={analyzing}
                className="w-full flex items-center justify-between px-4 py-3 rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-[13px]">
                  <FolderOpen size={15} />
                  Choose Local Folder
                </span>
                <span className="text-[10px] font-mono text-white/75">{canUseDirectoryPicker() ? shortcut("O") : "upload"}</span>
              </button>

              <div className="rounded-md border border-[#1f2430] bg-[#090d14] px-3 py-2 font-mono text-[11px] text-[#6b7280]">
                <div className="flex items-center justify-between">
                  <span>current_target</span>
                  <span className="text-[#9ca3af] truncate max-w-[340px]">{projectPath || "No folder selected"}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span>browser_mode</span>
                  <span className="text-[#9ca3af]">{canUseDirectoryPicker() ? "directory picker" : "folder upload"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#1f2430] bg-[#0d1117]">
            <PanelHeader label="supported.parsers" right={`${SUPPORTED_LANGUAGES.length} languages`} />
            <div className="p-4 grid grid-cols-2 gap-1.5">
              {SUPPORTED_LANGUAGES.map((language) => (
                <div key={language} className="flex items-center gap-2 text-[12px] font-mono text-[#cbd5e1]">
                  <span className="w-4 h-4 rounded-sm bg-[#161b24] border border-[#1f2430] flex items-center justify-center">
                    <Check size={9} className="text-emerald-400" />
                  </span>
                  {language}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-[#1f2430] bg-[#0d1117]">
          <PanelHeader label="ignore.patterns" right={`${ignores.length} default rules + .gitignore`} />
          <div className="p-4">
            <div className="flex flex-wrap gap-1.5">
              {ignores.map((rule) => (
                <span key={rule} className="group inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded-md bg-[#161b24] border border-[#1f2430] text-[#cbd5e1]">
                  {rule}
                  <button onClick={() => setIgnores(ignores.filter((x) => x !== rule))} className="cursor-pointer" aria-label={`Remove ${rule}`}>
                    <X size={10} className="text-[#6b7280] hover:text-rose-400 transition-colors" />
                  </button>
                </span>
              ))}
              {showAddInput ? (
                <input
                  autoFocus
                  value={newIgnore}
                  onChange={(event) => setNewIgnore(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addIgnore();
                    if (event.key === "Escape") {
                      setShowAddInput(false);
                      setNewIgnore("");
                    }
                  }}
                  onBlur={addIgnore}
                  className="w-24 px-2 py-1 rounded-md bg-[#0a0d12] border border-[#3b5bff]/60 text-[11px] font-mono text-[#e5e7eb] outline-none"
                  placeholder="pattern"
                />
              ) : (
                <button
                  onClick={() => setShowAddInput(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-md border border-dashed border-[#2a3346] text-[#6b7280] hover:text-[#e5e7eb] hover:border-[#3b5bff] transition-colors cursor-pointer"
                >
                  <Plus size={10} /> add
                </button>
              )}
              <button
                onClick={() => setIgnores(DEFAULT_IGNORES)}
                className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-md border border-[#1f2430] text-[#6b7280] hover:text-[#e5e7eb] hover:bg-[#11151d] transition-colors cursor-pointer"
              >
                <RotateCcw size={10} /> reset
              </button>
            </div>
            <p className="mt-3 text-[11px] font-mono text-[#6b7280]">
              .gitignore in the selected folder is detected automatically and merged with these rules.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-[#1f2430] bg-[#0d1117]">
          <PanelHeader label="run.status" right={analyzing ? `${progress}%` : "ready"} />
          <div className="p-4">
            <div className="h-1.5 rounded-full bg-[#11151d] overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r from-[#2563eb] via-[#14b8a6] to-[#f59e0b] transition-all duration-300 ${analyzing ? "animate-pulse" : ""}`}
                style={{ width: `${analyzing ? progress : 0}%` }}
              />
            </div>

            <div className="mt-3 font-mono text-[11px] leading-relaxed">
              {error ? (
                <div className="text-rose-300">error · {error}</div>
              ) : analyzing ? (
                <>
                  <div className="text-[#7c9cff]">scanning · {projectPath}</div>
                  <div className="text-[#6b7280]">parsing supported files and applying ignore rules</div>
                </>
              ) : (
                <div className="text-[#4b5563]">idle · choose a source to run analysis</div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-[#4b5563]">
              <span>engine: web renderer · reports: markdown/pdf</span>
              <button
                onClick={openUploadFallback}
                disabled={analyzing}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#1f2430] hover:bg-[#11151d] disabled:opacity-50 text-[#9ca3af] transition-colors cursor-pointer"
              >
                <Upload size={12} />
                Upload Folder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Header({ title, subtitle, path }: { title: string; subtitle: string; path?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <div className="text-[11px] font-mono text-[#6b7280] mb-1.5">// {title.toLowerCase()}</div>
        <h2 className="text-[22px] tracking-tight text-[#f3f4f6]">{title}</h2>
        <p className="text-[13px] text-[#9ca3af] mt-0.5">{subtitle}</p>
      </div>
      {path && <div className="text-[10px] font-mono text-[#4b5563] max-w-[360px] truncate">{path}</div>}
    </div>
  );
}

export function PanelHeader({ label, right }: { label: string; right?: string }) {
  return (
    <div className="px-4 py-2.5 border-b border-[#1f2430] flex items-center justify-between">
      <div className="text-[11px] font-mono text-[#6b7280]">{label}</div>
      {right && <div className="text-[10px] font-mono text-[#4b5563]">{right}</div>}
    </div>
  );
}
