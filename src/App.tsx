import { useEffect, useState } from "react";
import { Shell, Screen } from "./components/Shell";
import { Welcome } from "./components/Welcome";
import { Dashboard } from "./components/Dashboard";
import { Files } from "./components/Files";
import { Graph } from "./components/Graph";
import { Health } from "./components/Health";
import { Insights } from "./components/Insights";
import { Git } from "./components/Git";
import { Export } from "./components/Export";
import { Settings } from "./components/Settings";
import { useAnalysis } from "./hooks/useAnalysis";

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const { summary, loading, progress, error, selectFolderAndScan, pendingFolder } = useAnalysis();

  // Route automatically to dashboard upon successful directory scan
  // but if we are already on some other screen like files/graph, don't kick us back
  useEffect(() => {
    if (summary && screen === "welcome") {
      setScreen("dashboard");
    }
  }, [summary]);

  // Route automatically to welcome screen when preparing a scan (ignore configuration)
  useEffect(() => {
    if (pendingFolder) {
      setScreen("welcome");
    }
  }, [pendingFolder]);

  // Confirm folder switch wrapper
  const handleOpenFolderWithConfirm = () => {
    if (summary) {
      const confirmSwitch = window.confirm("Are you sure you want to select another folder? Your current analysis data will be replaced.");
      if (!confirmSwitch) return;
    }
    selectFolderAndScan();
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Folder picker: Ctrl/Cmd + Shift + O
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        handleOpenFolderWithConfirm();
        return;
      }
      
      // 2. Tab Navigation: Ctrl/Cmd + 1-8
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        const numKeys = ["1", "2", "3", "4", "5", "6", "7", "8"];
        if (numKeys.includes(e.key)) {
          e.preventDefault();
          const targetScreens: Screen[] = ["welcome", "dashboard", "files", "graph", "health", "insights", "git", "export"];
          const targetScreen = targetScreens[Number(e.key) - 1];
          
          if (targetScreen === "welcome" || summary) {
            setScreen(targetScreen);
          }
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [summary, selectFolderAndScan]);

  const status =
    loading
      ? `scanning… ${progress}%`
      : error
      ? `error · ${error}`
      : screen === "welcome"
      ? "idle"
      : `scan complete · ${summary?.path || ""}`;

  return (
    <Shell
      screen={screen}
      onChange={setScreen}
      progress={loading ? progress : undefined}
      status={status}
      onOpenFolder={handleOpenFolderWithConfirm}
    >
      {screen === "welcome" && (
        <Welcome onOpen={handleOpenFolderWithConfirm} onGoToDashboard={() => setScreen("dashboard")} />
      )}
      {screen === "dashboard" && <Dashboard />}
      {screen === "files" && <Files />}
      {screen === "graph" && <Graph />}
      {screen === "health" && <Health />}
      {screen === "insights" && <Insights />}
      {screen === "git" && <Git />}
      {screen === "export" && <Export />}
      {screen === "settings" && <Settings onNavigateToDashboard={() => setScreen("dashboard")} />}
    </Shell>
  );
}


