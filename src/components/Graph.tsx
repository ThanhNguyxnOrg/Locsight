import { useState, useMemo, useEffect } from "react";
import { C, mono } from "./tokens";
import { ZoomIn, ZoomOut, Search, Network, FileCode, Folder, Compass, Minimize2, Maximize2, X } from "lucide-react";
import { useAnalysis } from "../hooks/useAnalysis";

type ViewMode = "system" | "container" | "component" | "file";

function applyLayout(
  nodes: any[],
  edges: any[],
  layoutStyle: "hierarchical" | "cluster",
  viewMode: ViewMode
) {
  const centerX = 450;
  const centerY = 280;
  const radius = 180;

  if (viewMode === "system") {
    return {
      nodes: nodes.map((n) => ({ ...n, x: centerX, y: centerY })),
      edges: [],
    };
  }

  if (layoutStyle === "cluster") {
    if (viewMode === "file") {
      const foldersMap: Record<string, any[]> = {};
      nodes.forEach((n) => {
        const folder = n.subtitle || "root";
        if (!foldersMap[folder]) foldersMap[folder] = [];
        foldersMap[folder].push(n);
      });

      const uniqueFolders = Object.keys(foldersMap);
      const M = uniqueFolders.length;
      const positionedNodes: any[] = [];

      uniqueFolders.forEach((folder, folderIdx) => {
        const clusterAngle = (folderIdx / M) * 2 * Math.PI;
        const cx = centerX + radius * Math.cos(clusterAngle);
        const cy = centerY + radius * Math.sin(clusterAngle);

        const filesInFolder = foldersMap[folder];
        const K = filesInFolder.length;

        filesInFolder.forEach((n, fileIdx) => {
          let x = cx;
          let y = cy;
          if (K > 1) {
            const subAngle = (fileIdx / K) * 2 * Math.PI;
            const subRadius = 25 + Math.min(15, K * 2);
            x = cx + subRadius * Math.cos(subAngle);
            y = cy + subRadius * Math.sin(subAngle);
          }
          positionedNodes.push({ ...n, x, y });
        });
      });

      const nodesMap = new Map(positionedNodes.map((n) => [n.id, n]));
      const positionedEdges = edges.map((e) => {
        const sNode = nodesMap.get(e.source);
        const tNode = nodesMap.get(e.target);
        return {
          ...e,
          x1: sNode ? sNode.x : centerX,
          y1: sNode ? sNode.y : centerY,
          x2: tNode ? tNode.x : centerX,
          y2: tNode ? tNode.y : centerY,
        };
      });

      return { nodes: positionedNodes, edges: positionedEdges };
    } else {
      const N = nodes.length;
      const positionedNodes = nodes.map((n, i) => {
        const angle = (i / N) * 2 * Math.PI;
        const rFactor = viewMode === "container" ? radius - 30 : radius;
        return {
          ...n,
          x: centerX + rFactor * Math.cos(angle),
          y: centerY + rFactor * Math.sin(angle),
        };
      });

      const nodesMap = new Map(positionedNodes.map((n) => [n.id, n]));
      const positionedEdges = edges.map((e) => {
        const sNode = nodesMap.get(e.source);
        const tNode = nodesMap.get(e.target);
        return {
          ...e,
          x1: sNode ? sNode.x : centerX,
          y1: sNode ? sNode.y : centerY,
          x2: tNode ? tNode.x : centerX,
          y2: tNode ? tNode.y : centerY,
        };
      });

      return { nodes: positionedNodes, edges: positionedEdges };
    }
  } else {
    const nodeIds = new Set(nodes.map((n) => n.id));
    const adj: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};

    nodes.forEach((n) => {
      adj[n.id] = [];
      inDegree[n.id] = 0;
    });

    edges.forEach((e) => {
      if (nodeIds.has(e.source) && nodeIds.has(e.target)) {
        adj[e.source].push(e.target);
        inDegree[e.target] = (inDegree[e.target] || 0) + 1;
      }
    });

    const levels: Record<string, number> = {};
    nodes.forEach((n) => {
      levels[n.id] = 0;
    });

    const maxIterations = Math.min(nodes.length, 12);
    for (let iter = 0; iter < maxIterations; iter++) {
      let changed = false;
      edges.forEach((e) => {
        if (nodeIds.has(e.source) && nodeIds.has(e.target)) {
          const srcLvl = levels[e.source];
          const destLvl = levels[e.target];
          if (destLvl <= srcLvl) {
            levels[e.target] = srcLvl + 1;
            changed = true;
          }
        }
      });
      if (!changed) break;
    }

    const levelGroups: Record<number, string[]> = {};
    nodes.forEach((n) => {
      const lvl = levels[n.id] || 0;
      if (!levelGroups[lvl]) levelGroups[lvl] = [];
      levelGroups[lvl].push(n.id);
    });

    const activeLevels = Object.keys(levelGroups).map(Number).sort((a, b) => a - b);
    const totalLevels = activeLevels.length;

    const positionedNodes: any[] = [];
    const width = 900;
    const height = 560;
    const paddingTop = 60;
    const paddingBottom = 60;
    const usableHeight = height - paddingTop - paddingBottom;

    const levelSpacing = totalLevels > 1 ? Math.min(130, Math.max(80, usableHeight / (totalLevels - 1))) : 120;

    let currentY = paddingTop;

    activeLevels.forEach((lvl, lvlIdx) => {
      const nodeIdsInLevel = levelGroups[lvl];
      const maxNodesPerRow = 5;
      const rows: string[][] = [];
      for (let i = 0; i < nodeIdsInLevel.length; i += maxNodesPerRow) {
        rows.push(nodeIdsInLevel.slice(i, i + maxNodesPerRow));
      }

      rows.forEach((row, rowIdx) => {
        const K = row.length;
        const stepX = Math.min(160, 800 / (K + 1));
        const startX = width / 2 - ((K - 1) * stepX) / 2;

        row.forEach((id, idx) => {
          const originalNode = nodes.find((n) => n.id === id)!;
          positionedNodes.push({
            ...originalNode,
            x: startX + idx * stepX,
            y: currentY,
          });
        });

        if (rowIdx < rows.length - 1) {
          currentY += 75;
        }
      });

      if (lvlIdx < activeLevels.length - 1) {
        currentY += levelSpacing;
      }
    });

    const nodesMap = new Map(positionedNodes.map((n) => [n.id, n]));
    const positionedEdges = edges.map((e) => {
      const sNode = nodesMap.get(e.source);
      const tNode = nodesMap.get(e.target);
      return {
        ...e,
        x1: sNode ? sNode.x : centerX,
        y1: sNode ? sNode.y : centerY,
        x2: tNode ? tNode.x : centerX,
        y2: tNode ? tNode.y : centerY,
      };
    });

    return { nodes: positionedNodes, edges: positionedEdges };
  }
}

export function Graph() {
  const { summary } = useAnalysis();
  const [viewMode, setViewMode] = useState<ViewMode>("file");
  const [layoutStyle, setLayoutStyle] = useState<"hierarchical" | "cluster">("hierarchical");
  const [selectedLang, setSelectedLang] = useState<string>("All languages");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const activeNodeId = hoveredNodeId || selectedNodeId;
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // States for Node Dragging
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number, y: number }>>({});
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragStartMouse, setDragStartMouse] = useState({ x: 0, y: 0 });
  const [dragStartNode, setDragStartNode] = useState({ x: 0, y: 0 });

  // States for Panel Dragging
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const [panelDragStart, setPanelDragStart] = useState({ x: 0, y: 0 });

  // Helper to extract folder paths
  const getParentFolder = (path: string): string => {
    const parts = path.replace(/\\/g, "/").split("/");
    if (parts.length > 1) {
      return parts.slice(0, parts.length - 1).join("/");
    }
    return "root";
  };

  const getTopFolder = (path: string): string => {
    const parts = path.replace(/\\/g, "/").split("/");
    return parts[0] || "root";
  };

  // Get dynamic colors for clusters (directories)
  const clusterColors = useMemo(() => {
    if (!summary) return {};
    const folders = Array.from(new Set(summary.files.map(f => getParentFolder(f.path))));
    const colors: Record<string, string> = {};
    folders.forEach((folder, idx) => {
      // Harmonized HSL colors
      colors[folder] = `hsl(${(idx * 137.5) % 360}, 65%, 60%)`;
    });
    return colors;
  }, [summary]);

  // 1. Process files, components, and containers to get nodes and edges (metadata only, no positions)
  const graphData = useMemo(() => {
    if (!summary) return { nodes: [], edges: [] };

    // Filtered files list for "file" view or for aggregation
    let filteredFiles = [...summary.files];
    if (selectedLang !== "All languages") {
      filteredFiles = filteredFiles.filter((f) => f.lang === selectedLang);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredFiles = filteredFiles.filter(
        (f) => f.path.toLowerCase().includes(q) || f.name.toLowerCase().includes(q)
      );
    }

    if (viewMode === "file") {
      // Keep top 32 files to avoid clutter
      const filesToRender = filteredFiles.sort((a, b) => b.loc - a.loc).slice(0, 32);
      
      // Group files by parent folder
      const foldersMap: Record<string, typeof filesToRender> = {};
      filesToRender.forEach(f => {
        const folder = getParentFolder(f.path);
        if (!foldersMap[folder]) foldersMap[folder] = [];
        foldersMap[folder].push(f);
      });

      const uniqueFolders = Object.keys(foldersMap);
      const nodes: any[] = [];

      uniqueFolders.forEach((folder) => {
        const filesInFolder = foldersMap[folder];
        filesInFolder.forEach((f) => {
          const coupling = summary.architectureReport?.caCeMetrics?.[f.path];
          nodes.push({
            id: f.path,
            name: f.name,
            subtitle: folder,
            loc: f.loc,
            complexity: f.complexity,
            lang: f.lang,
            color: clusterColors[folder] || C.muted,
            r: 7 + Math.min(10, Math.sqrt(f.loc) * 0.15),
            afferent: coupling?.afferent ?? 0,
            efferent: coupling?.efferent ?? 0,
            instability: coupling?.instability ?? 0.0,
          });
        });
      });

      const nodeIds = new Set(nodes.map((n) => n.id));
      const edges = (summary.edges as [string, string][])
        .filter(([src, dest]) => nodeIds.has(src) && nodeIds.has(dest))
        .map(([src, dest]) => ({ source: src, target: dest }));

      return { nodes, edges };

    } else if (viewMode === "component") {
      // Group by component (parent directory)
      const groups: Record<string, { files: string[]; loc: number; complexity: number; langs: Set<string> }> = {};
      
      filteredFiles.forEach((f) => {
        const folder = getParentFolder(f.path);
        if (!groups[folder]) {
          groups[folder] = { files: [], loc: 0, complexity: 0, langs: new Set() };
        }
        groups[folder].files.push(f.path);
        groups[folder].loc += f.loc;
        groups[folder].complexity += f.complexity;
        groups[folder].langs.add(f.lang);
      });

      const componentNames = Object.keys(groups).sort((a, b) => groups[b].loc - groups[a].loc);

      const nodes = componentNames.map((name) => {
        const g = groups[name];
        const avgComplexity = g.files.length > 0 ? g.complexity / g.files.length : 0;
        return {
          id: name,
          name: name.split("/").pop() || name,
          subtitle: `${g.files.length} files · ${Array.from(g.langs).slice(0, 2).join(", ")}`,
          loc: g.loc,
          complexity: avgComplexity,
          color: clusterColors[name] || C.accent,
          r: 12 + Math.min(18, Math.sqrt(g.loc) * 0.35),
          filesCount: g.files.length,
          afferent: 0, // calculated below
          efferent: 0, // calculated below
          instability: 0.0,
        };
      });

      // Calculate component-level edges
      const edgesMap: Record<string, { source: string; target: string; weight: number }> = {};
      const fileToComponent: Record<string, string> = {};
      filteredFiles.forEach((f) => {
        fileToComponent[f.path] = getParentFolder(f.path);
      });

      (summary.edges as [string, string][]).forEach(([src, dest]) => {
        const srcComp = fileToComponent[src];
        const destComp = fileToComponent[dest];
        if (srcComp && destComp && srcComp !== destComp) {
          const key = `${srcComp}->${destComp}`;
          if (edgesMap[key]) {
            edgesMap[key].weight += 1;
          } else {
            edgesMap[key] = { source: srcComp, target: destComp, weight: 1 };
          }
        }
      });

      const nodeIds = new Set(nodes.map((n) => n.id));
      const edges = Object.values(edgesMap)
        .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

      // Calculate Ca/Ce for components
      nodes.forEach((node) => {
        const ce = edges.filter((e) => e.source === node.id).length;
        const ca = edges.filter((e) => e.target === node.id).length;
        node.efferent = ce;
        node.afferent = ca;
        node.instability = ca + ce > 0 ? ce / (ca + ce) : 0.0;
      });

      return { nodes, edges };

    } else if (viewMode === "container") {
      // Group by top-level folder
      const groups: Record<string, { files: string[]; loc: number; complexity: number; langs: Set<string> }> = {};
      filteredFiles.forEach((f) => {
        const topFolder = getTopFolder(f.path);
        if (!groups[topFolder]) {
          groups[topFolder] = { files: [], loc: 0, complexity: 0, langs: new Set() };
        }
        groups[topFolder].files.push(f.path);
        groups[topFolder].loc += f.loc;
        groups[topFolder].complexity += f.complexity;
        groups[topFolder].langs.add(f.lang);
      });

      const containerNames = Object.keys(groups).sort((a, b) => groups[b].loc - groups[a].loc);

      const nodes = containerNames.map((name) => {
        const g = groups[name];
        const avgComplexity = g.files.length > 0 ? g.complexity / g.files.length : 0;
        return {
          id: name,
          name: name,
          subtitle: `${g.files.length} files`,
          loc: g.loc,
          complexity: avgComplexity,
          color: C.accent,
          r: 15 + Math.min(22, Math.sqrt(g.loc) * 0.4),
          filesCount: g.files.length,
          afferent: 0,
          efferent: 0,
          instability: 0.0,
        };
      });

      const edgesMap: Record<string, { source: string; target: string; weight: number }> = {};
      const fileToContainer: Record<string, string> = {};
      filteredFiles.forEach((f) => {
        fileToContainer[f.path] = getTopFolder(f.path);
      });

      (summary.edges as [string, string][]).forEach(([src, dest]) => {
        const srcCont = fileToContainer[src];
        const destCont = fileToContainer[dest];
        if (srcCont && destCont && srcCont !== destCont) {
          const key = `${srcCont}->${destCont}`;
          if (edgesMap[key]) {
            edgesMap[key].weight += 1;
          } else {
            edgesMap[key] = { source: srcCont, target: destCont, weight: 1 };
          }
        }
      });

      const nodeIds = new Set(nodes.map((n) => n.id));
      const edges = Object.values(edgesMap)
        .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

      nodes.forEach((node) => {
        const ce = edges.filter((e) => e.source === node.id).length;
        const ca = edges.filter((e) => e.target === node.id).length;
        node.efferent = ce;
        node.afferent = ca;
        node.instability = ca + ce > 0 ? ce / (ca + ce) : 0.0;
      });

      return { nodes, edges };

    } else {
      // System view (single giant node)
      const systemName = summary.path.replace(/\\/g, "/").split("/").pop() || "System";
      const node = {
        id: "system",
        name: systemName,
        subtitle: `${summary.totalFiles} files total`,
        loc: summary.totalLoc,
        complexity: summary.averageComplexity,
        color: C.accent,
        r: 60,
        afferent: 0,
        efferent: 0,
        instability: 0.0,
      };
      return { nodes: [node], edges: [] };
    }
  }, [summary, viewMode, selectedLang, searchQuery, clusterColors]);

  // Apply layout algorithm to calculate actual node positions
  const positionedGraphData = useMemo(() => {
    return applyLayout(graphData.nodes, graphData.edges, layoutStyle, viewMode);
  }, [graphData, layoutStyle, viewMode]);

  const { nodes: positionedNodes, edges: positionedEdges } = positionedGraphData;

  // Set default selection when nodes list changes
  useMemo(() => {
    if (positionedNodes.length > 0) {
      if (!selectedNodeId || !positionedNodes.find((n) => n.id === selectedNodeId)) {
        setSelectedNodeId(positionedNodes[0].id);
      }
    } else {
      setSelectedNodeId(null);
    }
  }, [positionedNodes, selectedNodeId]);

  const selectedNode = useMemo(() => {
    return positionedNodes.find((n) => n.id === selectedNodeId) || null;
  }, [positionedNodes, selectedNodeId]);

  // Sync node positions state when graph nodes change
  useEffect(() => {
    const initialPositions: Record<string, { x: number, y: number }> = {};
    positionedNodes.forEach((n) => {
      initialPositions[n.id] = { x: n.x, y: n.y };
    });
    setNodePositions(initialPositions);
  }, [positionedNodes]);

  // Handle Node Drag Start
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggedNodeId(nodeId);
    setDragStartMouse({ x: e.clientX, y: e.clientY });
    const pos = nodePositions[nodeId] || positionedNodes.find(n => n.id === nodeId) || { x: 0, y: 0 };
    setDragStartNode({ x: pos.x, y: pos.y });
  };

  // Handle Panel Drag Start
  const handlePanelMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Do not drag if user is interacting with interactive components inside panel
    if (target.closest("button") || target.closest("a") || target.closest("input") || target.closest("select")) {
      return;
    }
    setIsDraggingPanel(true);
    setPanelDragStart({
      x: e.clientX - panelPos.x,
      y: e.clientY - panelPos.y,
    });
  };

  // Global mousemove/mouseup listener for Node dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggedNodeId) {
        const dx = (e.clientX - dragStartMouse.x) / zoom;
        const dy = (e.clientY - dragStartMouse.y) / zoom;
        setNodePositions((prev) => ({
          ...prev,
          [draggedNodeId]: {
            x: dragStartNode.x + dx,
            y: dragStartNode.y + dy,
          },
        }));
      }
    };

    const handleGlobalMouseUp = () => {
      setDraggedNodeId(null);
    };

    if (draggedNodeId) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [draggedNodeId, dragStartMouse, dragStartNode, zoom]);

  // Global mousemove/mouseup listener for Panel dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingPanel) {
        setPanelPos({
          x: e.clientX - panelDragStart.x,
          y: e.clientY - panelDragStart.y,
        });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDraggingPanel(false);
    };

    if (isDraggingPanel) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDraggingPanel, panelDragStart]);

  // 2. Calculate Blast Radius transitive dependents
  const blastRadiusInfo = useMemo(() => {
    if (!selectedNodeId || !summary || !summary.edges) return { set: new Set<string>(), pct: 0 };

    const visited = new Set<string>();
    const queue: string[] = [selectedNodeId];
    visited.add(selectedNodeId);

    // BFS to find transitive dependents: traverse from 'target' to 'source' (who depends on us)
    if (viewMode === "file") {
      while (queue.length > 0) {
        const curr = queue.shift()!;
        for (const [from, to] of summary.edges as [string, string][]) {
          if (to === curr && !visited.has(from)) {
            visited.add(from);
            queue.push(from);
          }
        }
      }
    } else {
      // For Component/Container view modes
      while (queue.length > 0) {
        const curr = queue.shift()!;
        for (const edge of positionedEdges) {
          if (edge.target === curr && !visited.has(edge.source)) {
            visited.add(edge.source);
            queue.push(edge.source);
          }
        }
      }
    }

    const pct = summary.files.length > 0 ? (visited.size / summary.files.length) * 100 : 0;
    return { set: visited, pct };
  }, [selectedNodeId, summary, positionedEdges, viewMode]);

  // Direct relations for selected node (for list & highlighting)
  const relations = useMemo(() => {
    if (!selectedNodeId) return { imports: [], dependents: [] };

    const imports = positionedEdges.filter((e) => e.source === selectedNodeId).map((e) => e.target);
    const dependents = positionedEdges.filter((e) => e.target === selectedNodeId).map((e) => e.source);

    return { imports, dependents };
  }, [positionedEdges, selectedNodeId]);

  // SVG Panning handlers
  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement;
    if (target.tagName === "svg" || target.id === "svg-background") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleSvgMouseUp = () => {
    setIsPanning(false);
  };

  const handleSvgMouseLeave = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = 1.08;
    const nextZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    setZoom(Math.max(0.05, Math.min(5.0, nextZoom)));
  };

  if (!summary) {
    return (
      <div className="size-full flex items-center justify-center text-zinc-500" style={mono}>
        No scan data available.
      </div>
    );
  }

  return (
    <div style={{ height: "100%", position: "relative", background: C.bg, overflow: "hidden" }}>
      {/* SVG Canvas */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 900 560"
        onMouseDown={handleSvgMouseDown}
        onMouseMove={handleSvgMouseMove}
        onMouseUp={handleSvgMouseUp}
        onMouseLeave={handleSvgMouseLeave}
        onWheel={handleWheel}
        style={{
          cursor: isPanning ? "grabbing" : "grab",
          outline: "none",
        }}
      >
        <defs>
          <filter id="card-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* Clickable background to capture pan events */}
        <rect
          id="svg-background"
          width="100%"
          height="100%"
          fill="transparent"
          style={{ pointerEvents: "all" }}
        />

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Render edges */}
          {positionedEdges.map((e, idx) => {
            const isDirectImport = activeNodeId && e.source === activeNodeId;
            const isDirectDependent = activeNodeId && e.target === activeNodeId;
            const isBlastRadius = activeNodeId && blastRadiusInfo.set.has(e.source) && blastRadiusInfo.set.has(e.target);

            let strokeColor = C.border;
            let opacity = 0.35;
            let strokeWidth = 0.8;

            if (isDirectImport) {
              strokeColor = "#38bdf8"; // Light blue for imports
              opacity = 1.0;
              strokeWidth = 1.8;
            } else if (isDirectDependent) {
              strokeColor = "#fb7185"; // Pink for dependents
              opacity = 1.0;
              strokeWidth = 1.8;
            } else if (isBlastRadius) {
              strokeColor = "#ef4444"; // Transitive dependents highlighted red
              opacity = 0.6;
              strokeWidth = 1.2;
            } else if (activeNodeId) {
              opacity = 0.1; // dim everything else
            }

            const sPos = nodePositions[e.source] || { x: e.x1, y: e.y1 };
            const tPos = nodePositions[e.target] || { x: e.x2, y: e.y2 };

            let pathD = "";
            const isHierarchical = layoutStyle === "hierarchical";
            if (isHierarchical) {
              const cardHeight = 46;
              const startX = sPos.x;
              const startY = sPos.y + cardHeight / 2;
              const endX = tPos.x;
              const endY = tPos.y - cardHeight / 2;

              // Nice smooth S-curve
              const cp1X = startX;
              const cp1Y = startY + (endY - startY) / 2;
              const cp2X = endX;
              const cp2Y = endY - (endY - startY) / 2;
              pathD = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
            } else {
              const mx = (sPos.x + tPos.x) / 2;
              const my = (sPos.y + tPos.y) / 2 - 15;
              pathD = `M ${sPos.x} ${sPos.y} Q ${mx} ${my} ${tPos.x} ${tPos.y}`;
            }

            return (
              <g key={idx}>
                <path
                  d={pathD}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                  opacity={opacity}
                  style={{ transition: "stroke 200ms, stroke-width 200ms, opacity 200ms" }}
                />
              </g>
            );
          })}

          {/* Render nodes */}
          {positionedNodes.map((n) => {
            const pos = nodePositions[n.id] || { x: n.x, y: n.y };
            const isSelected = n.id === selectedNodeId;
            const isHovered = n.id === hoveredNodeId;
            const isActive = n.id === activeNodeId;
            
            const isDirectImport = relations.imports.includes(n.id);
            const isDirectDependent = relations.dependents.includes(n.id);
            const isTransitiveDependent = blastRadiusInfo.set.has(n.id) && !isActive && !isDirectDependent;

            let strokeColor = "transparent";
            let opacity = 1.0;
            let r = n.r;

            if (activeNodeId) {
              if (isActive) {
                strokeColor = isSelected ? C.accent : "#38bdf8";
                r += 2;
              } else if (isDirectImport) {
                strokeColor = "#38bdf8";
              } else if (isDirectDependent) {
                strokeColor = "#fb7185";
              } else if (isTransitiveDependent) {
                strokeColor = "#ef4444";
              } else {
                opacity = 0.2; // dim other nodes
              }
            }

            const isHierarchical = layoutStyle === "hierarchical";

            if (isHierarchical) {
              const W = 140;
              const H = 46;
              const rectX = pos.x - W / 2;
              const rectY = pos.y - H / 2;

              let iconPath = "";
              if (viewMode === "file") {
                iconPath = "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6";
              } else {
                iconPath = "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z";
              }

              const displayName = n.name.length > 15 ? n.name.slice(0, 13) + "..." : n.name;

              let subtitleText = "";
              if (viewMode === "file") {
                subtitleText = `${n.lang} · ${n.loc} L`;
              } else {
                subtitleText = n.subtitle || `${n.loc} LOC`;
              }

              return (
                <g
                  key={n.id}
                  style={{
                    cursor: "pointer",
                    transition: "transform 150ms ease-out, opacity 200ms",
                    transform: isHovered ? "scale(1.05)" : "scale(1)",
                    transformOrigin: `${pos.x}px ${pos.y}px`
                  }}
                  onClick={() => setSelectedNodeId(n.id)}
                  onMouseDown={(e) => handleNodeMouseDown(e, n.id)}
                  onMouseEnter={() => setHoveredNodeId(n.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  opacity={opacity}
                >
                  {/* Background card with premium design & shadow */}
                  <rect
                    x={rectX}
                    y={rectY}
                    width={W}
                    height={H}
                    rx={6}
                    ry={6}
                    fill={C.surface}
                    stroke={strokeColor === "transparent" ? n.color : strokeColor}
                    strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5}
                    filter="url(#card-shadow)"
                    style={{ transition: "stroke 200ms, stroke-width 200ms" }}
                  />

                  {/* Left accent color strip */}
                  <path
                    d={`M ${rectX + 1.5} ${rectY + 6} L ${rectX + 1.5} ${rectY + H - 6}`}
                    stroke={n.color}
                    strokeWidth={3}
                    strokeLinecap="round"
                  />

                  {/* Left side Mini Icon */}
                  <svg
                    x={rectX + 10}
                    y={rectY + 16}
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={n.color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={iconPath} />
                  </svg>

                  {/* Name */}
                  <text
                    x={rectX + 30}
                    y={rectY + 20}
                    fill={C.text}
                    style={{ ...mono, fontSize: 10, fontWeight: 600, pointerEvents: "none" }}
                  >
                    {displayName}
                  </text>

                  {/* Subtitle */}
                  <text
                    x={rectX + 30}
                    y={rectY + 34}
                    fill={C.muted}
                    style={{ ...mono, fontSize: 8, pointerEvents: "none" }}
                  >
                    {subtitleText}
                  </text>
                </g>
              );
            } else {
              return (
                <g
                  key={n.id}
                  style={{
                    cursor: "pointer",
                    transition: "transform 150ms ease-out, opacity 200ms",
                    transform: isHovered ? "scale(1.15)" : "scale(1)",
                    transformOrigin: `${pos.x}px ${pos.y}px`
                  }}
                  onClick={() => setSelectedNodeId(n.id)}
                  onMouseDown={(e) => handleNodeMouseDown(e, n.id)}
                  onMouseEnter={() => setHoveredNodeId(n.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r}
                    fill={n.color}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 2}
                    opacity={opacity}
                    style={{ transition: "r 200ms, opacity 200ms, stroke 200ms" }}
                  />
                  <text
                    x={pos.x + n.r + 5}
                    y={pos.y + 4}
                    fill={isSelected ? C.text : isDirectImport ? "#38bdf8" : isDirectDependent ? "#fb7185" : C.muted}
                    opacity={opacity}
                    style={{ ...mono, fontSize: isSelected ? 11 : 9, fontWeight: isSelected ? 600 : 400, pointerEvents: "none", transition: "opacity 200ms" }}
                  >
                    {n.name}
                  </text>
                </g>
              );
            }
          })}
        </g>
      </svg>

      {/* Toolbar Segmented Controls */}
      <div
        className="flex items-center gap-3 absolute"
        style={{
          top: 20,
          left: 20,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 6,
          padding: "4px 8px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <div className="flex items-center gap-1">
          <Network size={14} color={C.accent} style={{ marginRight: 4 }} />
          {(["system", "container", "component", "file"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                ...mono,
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                padding: "4px 8px",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                background: viewMode === mode ? C.accent : "transparent",
                color: viewMode === mode ? "#121114" : C.muted,
                transition: "all 150ms ease",
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {viewMode !== "system" && (
          <>
            <div style={{ width: 1, height: 16, background: C.border, margin: "0 4px" }} />
            <div className="flex items-center gap-1">
              {(["hierarchical", "cluster"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setLayoutStyle(style)}
                  style={{
                    ...mono,
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    padding: "4px 8px",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    background: layoutStyle === style ? C.accent : "transparent",
                    color: layoutStyle === style ? "#121114" : C.muted,
                    transition: "all 150ms ease",
                  }}
                >
                  {style === "hierarchical" ? "HIERARCHICAL" : "CLUSTER"}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Navigation Controls */}
      <div
        className="flex items-center gap-2 absolute"
        style={{
          top: 20,
          right: 20,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 6,
          padding: 6,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <button onClick={() => setZoom((z) => Math.max(0.05, z - 0.1))} style={iconBtn} title="Zoom Out">
          <ZoomOut size={14} color={C.muted} />
        </button>
        <button onClick={() => setZoom((z) => Math.min(5.0, z + 0.1))} style={iconBtn} title="Zoom In">
          <ZoomIn size={14} color={C.muted} />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          style={iconBtn}
          title="Reset View"
        >
          <Compass size={14} color={C.muted} />
        </button>
        <div style={{ width: 1, height: 18, background: C.border }} />
        
        {viewMode === "file" && (
          <>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              style={{
                ...mono,
                fontSize: 11,
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 3,
                color: C.text,
                padding: "3px 6px",
                outline: "none",
              }}
            >
              <option>All languages</option>
              {summary.languages.map((l) => (
                <option key={l.name} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
            <div
              className="flex items-center gap-1"
              style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 3,
                padding: "3px 8px",
              }}
            >
              <Search size={12} color={C.muted} />
              <input
                placeholder="search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  ...mono,
                  fontSize: 11,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: C.text,
                  width: 100,
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Code Navigation / Sidepanel */}
      {selectedNode && (
        <div
          className="absolute flex flex-col"
          style={{
            right: 24,
            bottom: 24,
            transform: `translate(${panelPos.x}px, ${panelPos.y}px)`,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            padding: isPanelCollapsed ? "10px 14px" : 16,
            minWidth: isPanelCollapsed ? 260 : 320,
            maxWidth: 380,
            maxHeight: isPanelCollapsed ? "auto" : "75%",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
            zIndex: 10,
            transition: "all 150ms ease-in-out",
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between gap-4 cursor-grab active:cursor-grabbing select-none" 
            style={{ 
              borderBottom: isPanelCollapsed ? "none" : `1px solid ${C.border}`, 
              paddingBottom: isPanelCollapsed ? 0 : 10,
              marginBottom: isPanelCollapsed ? 0 : 12 
            }}
            onMouseDown={handlePanelMouseDown}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                {viewMode === "file" ? <FileCode size={14} color={C.accent} /> : <Folder size={14} color={C.accent} />}
                <span className="truncate" style={{ ...mono, fontSize: 13, fontWeight: 600, color: C.text }} title={selectedNode.name}>
                  {selectedNode.name}
                </span>
              </div>
              {!isPanelCollapsed && (
                <div style={{ ...mono, fontSize: 9, color: C.muted, wordBreak: "break-all" }}>
                  {selectedNode.id}
                </div>
              )}
            </div>

            {/* Panel Action Controls */}
            <div className="flex items-center gap-1.5 shrink-0" onMouseDown={(e) => e.stopPropagation()}>
              <button
                onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                style={iconBtn}
                title={isPanelCollapsed ? "Expand Panel" : "Collapse Panel"}
                className="p-1 hover:bg-white/5 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                {isPanelCollapsed ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
              </button>
              <button
                onClick={() => setSelectedNodeId(null)}
                style={iconBtn}
                title="Close Panel"
                className="p-1 hover:bg-white/5 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {!isPanelCollapsed && (
            <div style={{ overflowY: "auto", flex: 1, paddingRight: 4 }}>
              {/* Core Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2 rounded bg-black/30 border border-white/[0.02]">
                  <div style={{ ...mono, fontSize: 9, color: C.muted }}>LOC</div>
                  <div style={{ ...mono, fontSize: 13, fontWeight: 600 }}>{selectedNode.loc}</div>
                </div>
                <div className="p-2 rounded bg-black/30 border border-white/[0.02]">
                  <div style={{ ...mono, fontSize: 9, color: C.muted }}>COMPLEXITY</div>
                  <div style={{ ...mono, fontSize: 13, fontWeight: 600 }}>{selectedNode.complexity.toFixed(1)}</div>
                </div>
              </div>

              {/* Coupling metrics */}
              <div className="mb-4">
                <div style={{ ...mono, fontSize: 10, color: C.muted, letterSpacing: "0.08em", marginBottom: 6 }}>COUPLING METRICS</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded bg-black/25 text-center">
                    <div style={{ ...mono, fontSize: 9, color: C.muted }} title="Afferent Coupling (Ca) - Who imports this">Ca</div>
                    <div style={{ ...mono, fontSize: 12, fontWeight: 600, color: "#fb7185" }}>{selectedNode.afferent}</div>
                  </div>
                  <div className="p-2 rounded bg-black/25 text-center">
                    <div style={{ ...mono, fontSize: 9, color: C.muted }} title="Efferent Coupling (Ce) - What this imports">Ce</div>
                    <div style={{ ...mono, fontSize: 12, fontWeight: 600, color: "#38bdf8" }}>{selectedNode.efferent}</div>
                  </div>
                  <div className="p-2 rounded bg-black/25 text-center">
                    <div style={{ ...mono, fontSize: 9, color: C.muted }} title="Instability (Ce / (Ca+Ce))">Instability</div>
                    <div style={{ ...mono, fontSize: 12, fontWeight: 600, color: selectedNode.instability > 0.7 ? "#ef4444" : "#4ade80" }}>
                      {selectedNode.instability.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Blast Radius Section */}
              {viewMode !== "system" && (
                <div className="p-3 rounded border mb-4" style={{ background: "#ef444405", borderColor: "#ef44441c" }}>
                  <div style={{ ...mono, fontSize: 10, color: "#ef4444", fontWeight: 600, display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                    <Compass size={12} />
                    BLAST RADIUS IMPACT
                  </div>
                  <div style={{ ...mono, fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                    {blastRadiusInfo.set.size} {viewMode === "file" ? "files" : "components"} affected ({blastRadiusInfo.pct.toFixed(0)}%)
                  </div>
                  <p style={{ fontSize: 10, color: C.muted, margin: 0, lineHeight: 1.4 }}>
                    Modifying this component affects transitively dependent downstream code. High percentage implies higher risk refactoring.
                  </p>
                </div>
              )}

              {/* Relationships lists */}
              {viewMode !== "system" && (
                <div className="flex flex-col gap-3">
                  {/* Imports */}
                  <div>
                    <div style={{ ...mono, fontSize: 9, color: "#38bdf8", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 4 }}>
                      IMPORTS DIRECTLY ({relations.imports.length})
                    </div>
                    {relations.imports.length === 0 ? (
                      <div style={{ fontSize: 10, color: C.muted }}>No outbound dependencies in view</div>
                    ) : (
                      <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-1">
                        {relations.imports.map((id) => (
                          <button
                            key={id}
                            onClick={() => setSelectedNodeId(id)}
                            className="text-left truncate px-2 py-1 rounded hover:bg-white/[0.04] border-0"
                            style={{ ...mono, fontSize: 10, color: C.text, background: "transparent", cursor: "pointer", width: "100%" }}
                          >
                            {id.split("/").pop()}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Imported By */}
                  <div>
                    <div style={{ ...mono, fontSize: 9, color: "#fb7185", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 4 }}>
                      IMPORTED BY ({relations.dependents.length})
                    </div>
                    {relations.dependents.length === 0 ? (
                      <div style={{ fontSize: 10, color: C.muted }}>No inbound dependencies in view</div>
                    ) : (
                      <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-1">
                        {relations.dependents.map((id) => (
                          <button
                            key={id}
                            onClick={() => setSelectedNodeId(id)}
                            className="text-left truncate px-2 py-1 rounded hover:bg-white/[0.04] border-0"
                            style={{ ...mono, fontSize: 10, color: C.text, background: "transparent", cursor: "pointer", width: "100%" }}
                          >
                            {id.split("/").pop()}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 4,
  cursor: "pointer",
  display: "flex",
};
