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
import { useAnalysis } from "./hooks/useAnalysis";

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const { summary, loading, progress, error, selectFolderAndScan, resetAnalysis } = useAnalysis();

  // Route automatically to dashboard upon successful directory scan
  // but if we are already on some other screen like files/graph, don't kick us back
  useEffect(() => {
    if (summary && screen === "welcome") {
      setScreen("dashboard");
    }
  }, [summary]);

  // If user navigates back to welcome, clear current scan summary
  useEffect(() => {
    if (screen === "welcome" && summary) {
      resetAnalysis();
    }
  }, [screen]);

  const status =
    loading
      ? `scanning… ${progress}%`
      : error
      ? `error · ${error}`
      : screen === "welcome"
      ? "idle"
      : `scan complete · ${summary?.path || ""}`;

  return (
    <Shell screen={screen} onChange={setScreen} progress={loading ? progress : undefined} status={status}>
      {screen === "welcome" && <Welcome onOpen={selectFolderAndScan} />}
      {screen === "dashboard" && <Dashboard />}
      {screen === "files" && <Files />}
      {screen === "graph" && <Graph />}
      {screen === "health" && <Health />}
      {screen === "insights" && <Insights />}
      {screen === "git" && <Git />}
      {screen === "export" && <Export />}
    </Shell>
  );
}

