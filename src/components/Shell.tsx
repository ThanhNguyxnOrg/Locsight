import { useState, useEffect } from "react";
import { Home, LayoutDashboard, FolderTree, Share2, Download, Minus, Square, X, Activity, ShieldAlert, History, Maximize2, Settings, FolderOpen } from "lucide-react";
import { C, mono } from "./tokens";
import { useAnalysis } from "../hooks/useAnalysis";
import { getCurrentWindow } from "@tauri-apps/api/window";

// Add "settings" to the available screens
export type Screen = "welcome" | "dashboard" | "files" | "graph" | "health" | "insights" | "git" | "export" | "settings";

const ITEMS: { id: Screen; icon: any; label: string; key: string }[] = [
  { id: "welcome", icon: Home, label: "Home", key: "1" },
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", key: "2" },
  { id: "files", icon: FolderTree, label: "Files", key: "3" },
  { id: "graph", icon: Share2, label: "Graph", key: "4" },
  { id: "health", icon: Activity, label: "Health", key: "5" },
  { id: "insights", icon: ShieldAlert, label: "Insights", key: "6" },
  { id: "git", icon: History, label: "Git", key: "7" },
  { id: "export", icon: Download, label: "Export", key: "8" },
];

export function Shell({
  screen,
  onChange,
  children,
  progress,
  status,
  onOpenFolder,
}: {
  screen: Screen;
  onChange: (s: Screen) => void;
  children: React.ReactNode;
  progress?: number;
  status: string;
  onOpenFolder?: () => void;
}) {
  const { summary } = useAnalysis();
  const [platform, setPlatform] = useState<"windows" | "macos" | "linux">("windows");

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("mac")) {
      setPlatform("macos");
    } else if (ua.includes("linux")) {
      setPlatform("linux");
    } else {
      setPlatform("windows");
    }
  }, []);

  // Native window controls using Tauri APIs
  const handleMinimize = () => {
    getCurrentWindow().minimize().catch((err) => console.error(err));
  };

  const handleMaximize = () => {
    getCurrentWindow().toggleMaximize().catch((err) => console.error(err));
  };

  const handleClose = () => {
    getCurrentWindow().close().catch((err) => console.error(err));
  };

  const renderTitlebar = () => {
    if (platform === "macos") {
      return (
        <div
          className="flex items-center select-none"
          style={{ height: 32, borderBottom: `1px solid ${C.border}`, paddingLeft: 12, paddingRight: 12 }}
        >
          {/* macOS traffic light controls on left */}
          <div className="flex items-center gap-2 group/mac" style={{ height: "100%" }}>
            <button
              onClick={handleClose}
              style={{ ...macBtnStyle, background: "#ff5f56" }}
              className="flex items-center justify-center relative active:brightness-75"
              title="Close"
            >
              <X className="opacity-0 group-hover/mac:opacity-100 transition-opacity" style={{ width: 6, height: 6, color: "#4c0002" }} strokeWidth={4} />
            </button>
            <button
              onClick={handleMinimize}
              style={{ ...macBtnStyle, background: "#ffbd2e" }}
              className="flex items-center justify-center relative active:brightness-75"
              title="Minimize"
            >
              <Minus className="opacity-0 group-hover/mac:opacity-100 transition-opacity" style={{ width: 6, height: 6, color: "#5c3e00" }} strokeWidth={4} />
            </button>
            <button
              onClick={handleMaximize}
              style={{ ...macBtnStyle, background: "#27c93f" }}
              className="flex items-center justify-center relative active:brightness-75"
              title="Maximize"
            >
              <Maximize2 className="opacity-0 group-hover/mac:opacity-100 transition-opacity" style={{ width: 6, height: 6, color: "#004d04" }} strokeWidth={4} />
            </button>
          </div>

          {/* Draggable Title Area - Centered for macOS */}
          <div
            data-tauri-drag-region
            className="flex-1 flex items-center justify-center h-full select-none"
            style={{ marginRight: 52 }} // Offset to visually balance traffic lights
          >
            <div data-tauri-drag-region className="flex items-center gap-2">
              <div
                data-tauri-drag-region
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 1,
                  background: C.accent,
                }}
              />
              <div
                data-tauri-drag-region
                style={{
                  ...mono,
                  color: C.text,
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  fontWeight: 600,
                }}
              >
                LOCSIGHT
              </div>
              <div data-tauri-drag-region style={{ ...mono, color: C.muted, fontSize: 11, marginLeft: 6 }} className="truncate max-w-sm">
                {summary ? `— ${summary.path.split(/[\/\\]/).pop()}` : "— Welcome"}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (platform === "linux") {
      return (
        <div
          className="flex items-center select-none"
          style={{ height: 32, borderBottom: `1px solid ${C.border}`, paddingLeft: 12 }}
        >
          {/* Title Area left-aligned */}
          <div
            data-tauri-drag-region
            className="flex items-center gap-2 h-full flex-1"
          >
            <div
              data-tauri-drag-region
              style={{
                width: 6,
                height: 6,
                borderRadius: 1,
                background: C.accent,
              }}
            />
            <div
              data-tauri-drag-region
              style={{
                ...mono,
                color: C.text,
                fontSize: 11,
                letterSpacing: "0.06em",
                fontWeight: 500,
              }}
            >
              LOCSIGHT
            </div>
            <div data-tauri-drag-region style={{ ...mono, color: C.muted, fontSize: 11, marginLeft: 8 }} className="truncate max-w-lg">
              {summary ? `— ${summary.path}` : "— Welcome"}
            </div>
          </div>

          {/* Linux GTK circle buttons on right */}
          <div className="flex items-center gap-1.5 px-2" style={{ height: "100%" }}>
            <button
              onClick={handleMinimize}
              style={linuxBtnStyle}
              className="hover:bg-white/10 active:bg-white/15"
              title="Minimize"
            >
              <Minus size={11} strokeWidth={2} />
            </button>
            <button
              onClick={handleMaximize}
              style={linuxBtnStyle}
              className="hover:bg-white/10 active:bg-white/15"
              title="Maximize"
            >
              <Square size={9} strokeWidth={2} />
            </button>
            <button
              onClick={handleClose}
              style={{ ...linuxBtnStyle }}
              className="hover:bg-red-500/80 hover:text-white active:bg-red-600"
              title="Close"
            >
              <X size={11} strokeWidth={2} />
            </button>
          </div>
        </div>
      );
    }

    // Windows Layout (Default)
    return (
      <div
        className="flex items-center select-none"
        style={{ height: 32, borderBottom: `1px solid ${C.border}`, paddingLeft: 12 }}
      >
        {/* Title Area left-aligned */}
        <div
          data-tauri-drag-region
          className="flex items-center gap-2 h-full flex-1"
        >
          <div
            data-tauri-drag-region
            style={{
              width: 6,
              height: 6,
              borderRadius: 1,
              background: C.accent,
            }}
          />
          <div
            data-tauri-drag-region
            style={{
              ...mono,
              color: C.text,
              fontSize: 11,
              letterSpacing: "0.06em",
              fontWeight: 500,
            }}
          >
            LOCSIGHT
          </div>
          <div data-tauri-drag-region style={{ ...mono, color: C.muted, fontSize: 11, marginLeft: 8 }} className="truncate max-w-lg">
            {summary ? `— ${summary.path}` : "— Welcome"}
          </div>
        </div>

        {/* Windows 11 style window controls on right */}
        <div className="flex" style={{ height: "100%" }}>
          <button
            onClick={handleMinimize}
            style={winBtnStyle}
            className="hover:bg-white/5 text-white/70 hover:text-white active:bg-white/10"
            title="Minimize"
          >
            <Minus size={13} strokeWidth={1.5} />
          </button>
          <button
            onClick={handleMaximize}
            style={winBtnStyle}
            className="hover:bg-white/5 text-white/70 hover:text-white active:bg-white/10"
            title="Maximize"
          >
            <Square size={10} strokeWidth={1.5} />
          </button>
          <button
            onClick={handleClose}
            style={winBtnStyle}
            className="hover:bg-[#e81123] text-white/70 hover:text-white active:bg-[#f1707a]"
            title="Close"
          >
            <X size={13} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className="size-full flex flex-col overflow-hidden"
      style={{ background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif" }}
    >
      {renderTitlebar()}

      {/* Progress bar */}
      <div style={{ height: 2, position: "relative" }}>
        {progress !== undefined && progress < 100 && (
          <div
            style={{
              height: 2,
              width: `${progress}%`,
              background: C.accent,
              transition: "width 200ms linear",
            }}
          />
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left toolbar */}
        <nav
          className="flex flex-col items-center py-3"
          style={{ width: 48, borderRight: `1px solid ${C.border}`, gap: 2 }}
        >
          {ITEMS.map((it) => {
            const active = screen === it.id;
            const Icon = it.icon;
            
            // Disable dashboard, files, graph, export if no summary is loaded
            const disabled = !summary && it.id !== "welcome";

            const mod = platform === "macos" ? "⌘" : "Ctrl+";
            return (
              <button
                key={it.id}
                onClick={() => !disabled && onChange(it.id)}
                disabled={disabled}
                title={disabled ? `${it.label} (Scan codebase first)` : `${it.label} (${mod}${it.key})`}
                className="flex items-center justify-center relative group disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 4,
                  background: active ? `${C.accent}1a` : "transparent",
                  color: active ? C.accent : C.muted,
                  border: "1px solid transparent",
                  cursor: disabled ? "not-allowed" : "pointer",
                  transition: "color 120ms, background 120ms",
                }}
                onMouseEnter={(e) => {
                  if (!active && !disabled) (e.currentTarget as HTMLElement).style.color = C.text;
                }}
                onMouseLeave={(e) => {
                  if (!active && !disabled) (e.currentTarget as HTMLElement).style.color = C.muted;
                }}
              >
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      left: -1,
                      top: 6,
                      bottom: 6,
                      width: 2,
                      background: C.accent,
                      borderRadius: 1,
                    }}
                  />
                )}
                <Icon size={16} strokeWidth={1.75} />
              </button>
            );
          })}
          <div className="flex-1" />

          {/* Open Another Folder Quick Switch */}
          <button
            onClick={onOpenFolder}
            title={platform === "macos" ? "Open Another Folder (⌘⇧O)" : "Open Another Folder (Ctrl+Shift+O)"}
            className="flex items-center justify-center relative group"
            style={{
              width: 34,
              height: 34,
              borderRadius: 4,
              background: "transparent",
              color: C.muted,
              border: "1px solid transparent",
              cursor: "pointer",
              transition: "color 120ms, background 120ms",
              marginBottom: 4
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = C.text;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = C.muted;
            }}
          >
            <FolderOpen size={16} strokeWidth={1.75} />
          </button>

          {/* Settings / Locignore Button */}
          <button
            onClick={() => onChange("settings")}
            title="Locignore Settings"
            className="flex items-center justify-center relative group"
            style={{
              width: 34,
              height: 34,
              borderRadius: 4,
              background: screen === "settings" ? `${C.accent}1a` : "transparent",
              color: screen === "settings" ? C.accent : C.muted,
              border: "1px solid transparent",
              cursor: "pointer",
              transition: "color 120ms, background 120ms",
              marginBottom: 12
            }}
            onMouseEnter={(e) => {
              if (screen !== "settings") (e.currentTarget as HTMLElement).style.color = C.text;
            }}
            onMouseLeave={(e) => {
              if (screen !== "settings") (e.currentTarget as HTMLElement).style.color = C.muted;
            }}
          >
            {screen === "settings" && (
              <span
                style={{
                  position: "absolute",
                  left: -1,
                  top: 6,
                  bottom: 6,
                  width: 2,
                  background: C.accent,
                  borderRadius: 1,
                }}
              />
            )}
            <Settings size={16} strokeWidth={1.75} />
          </button>

          <div
            style={{
              ...mono,
              fontSize: 9,
              color: C.muted,
              letterSpacing: "0.1em",
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              padding: "8px 0",
            }}
          >
            v1.1.0
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Status bar */}
      <div
        className="flex items-center px-3"
        style={{
          height: 22,
          borderTop: `1px solid ${C.border}`,
          ...mono,
          fontSize: 10.5,
          color: C.muted,
          letterSpacing: "0.02em",
        }}
      >
        <span
          style={{
            color: progress !== undefined && progress < 100 ? C.accent : "#4ade80",
            marginRight: 8,
            fontSize: 8,
          }}
        >
          ●
        </span>
        {status}
        <div className="flex-1" />
        {summary && (
          <>
            <span>{summary.totalFiles.toLocaleString()} files</span>
            <span style={{ margin: "0 10px", color: C.border }}>│</span>
            <span>{summary.totalLoc.toLocaleString()} loc</span>
            <span style={{ margin: "0 10px", color: C.border }}>│</span>
            <span>UTF-8</span>
            <span style={{ margin: "0 10px", color: C.border }}>│</span>
            <span>↑ {(summary.scanDurationMs / 1000).toFixed(2)}s</span>
          </>
        )}
      </div>
    </div>
  );
}

const macBtnStyle: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: "50%",
  border: "none",
  padding: 0,
  cursor: "pointer",
  outline: "none",
};

const winBtnStyle: React.CSSProperties = {
  width: 46,
  height: "100%",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background-color 100ms, color 100ms",
  outline: "none",
};

const linuxBtnStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: "50%",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background-color 100ms, color 100ms",
  outline: "none",
};
