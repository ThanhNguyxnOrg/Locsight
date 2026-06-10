import { useState, useMemo, useEffect } from "react";
import { C, mono } from "./tokens";
import { Card } from "./Card";
import { useAnalysis } from "../hooks/useAnalysis";
import { 
  Boxes, Image as ImageIcon, Film, Music, Compass, 
  Layers, AlertTriangle, HelpCircle, Search, 
  ArrowRight, CheckCircle2, FileText, X, Copy,
  GitBranch, Type, Database, FolderArchive
} from "lucide-react";

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

type SubTab = "overview" | "all" | "relations" | "duplicates" | "hints";

export function Assets() {
  const { summary } = useAnalysis();
  const [subTab, setSubTab] = useState<SubTab>("overview");
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");
  
  // Pagination optimization for large projects
  const [visibleCount, setVisibleCount] = useState(50);

  // Selected asset for details panel
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const assetReport = summary?.assetReport;

  // Reset pagination on filter/search change
  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery, categoryFilter, subcategoryFilter, subTab]);

  // If no assets found or report is empty
  const hasAssets = assetReport && assetReport.summary.totalFiles > 0;

  // Group assets for subcategory filtering dynamically
  const subcategories = useMemo(() => {
    if (!assetReport) return [];
    const subs = new Set<string>();
    assetReport.assets.forEach(a => {
      if (categoryFilter === "all" || a.category === categoryFilter) {
        subs.add(a.subcategory);
      }
    });
    return Array.from(subs);
  }, [assetReport, categoryFilter]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    if (!assetReport) return [];
    return assetReport.assets.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            a.path.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || a.category === categoryFilter;
      const matchesSubcategory = subcategoryFilter === "all" || a.subcategory === subcategoryFilter;
      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [assetReport, searchQuery, categoryFilter, subcategoryFilter]);

  // Wasted space from duplicates
  const wastedSpace = useMemo(() => {
    if (!assetReport) return 0;
    return assetReport.duplicates.reduce((sum, dup) => {
      return sum + (dup.size * (dup.files.length - 1));
    }, 0);
  }, [assetReport]);

  // Map parent assets to their children references (for dependency visualization)
  const assetRelations = useMemo(() => {
    if (!assetReport || !assetReport.edges) return new Map<string, any[]>();
    const parentMap = new Map<string, any[]>();
    
    assetReport.edges.forEach(([src, dest]) => {
      const parentAsset = assetReport.assets.find(a => a.path === src);
      const childAsset = assetReport.assets.find(a => a.path === dest);
      
      if (parentAsset && childAsset) {
        if (!parentMap.has(src)) {
          parentMap.set(src, []);
        }
        parentMap.get(src)!.push(childAsset);
      }
    });
    
    return parentMap;
  }, [assetReport]);

  if (!summary) return null;

  if (!assetReport || !hasAssets) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-10 text-center">
        <Boxes size={48} className="text-neutral-600 mb-4 animate-pulse" />
        <h3 style={{ ...mono, fontSize: 16, color: C.text }}>NO ASSETS FOUND</h3>
        <p className="max-w-md mt-2 text-xs" style={{ color: C.muted }}>
          No multimedia files (Images, Video, Audio), 3D/Game assets, or CAD drawings detected in the scanned directory.
        </p>
      </div>
    );
  }

  const { summary: stats, duplicates, optimizationHints, orphans, edges } = assetReport;

  // Get active categories based on stats (only show categories that have files)
  const activeCategories = useMemo(() => {
    return Object.keys(stats.categoryCounts)
      .filter(cat => stats.categoryCounts[cat] > 0)
      .sort((a, b) => (stats.categorySizes[b] || 0) - (stats.categorySizes[a] || 0));
  }, [stats]);

  // Category Icons & Color Mapping
  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case "multimedia":
        return { label: "Multimedia", icon: ImageIcon, color: "#38bdf8", bg: "rgba(56, 189, 248, 0.1)" };
      case "game_3d":
        return { label: "3D & Game", icon: Compass, color: "#a78bfa", bg: "rgba(167, 139, 250, 0.1)" };
      case "cad_drawing":
        return { label: "CAD / Drawings", icon: Layers, color: "#fb923c", bg: "rgba(251, 146, 60, 0.1)" };
      case "font":
        return { label: "Fonts", icon: Type, color: "#2dd4bf", bg: "rgba(45, 212, 191, 0.1)" };
      case "document":
        return { label: "Documents", icon: FileText, color: "#34d399", bg: "rgba(52, 211, 153, 0.1)" };
      case "archive":
        return { label: "Archives", icon: FolderArchive, color: "#f43f5e", bg: "rgba(244, 63, 94, 0.1)" };
      case "data":
        return { label: "Data & DB", icon: Database, color: "#fb7185", bg: "rgba(251, 113, 133, 0.1)" };
      default:
        return { label: "Other Assets", icon: Boxes, color: "#94a3b8", bg: "rgba(148, 163, 184, 0.1)" };
    }
  };

  const getSubcategoryIcon = (sub: string) => {
    switch (sub) {
      case "image":
      case "texture":
        return ImageIcon;
      case "video":
        return Film;
      case "audio":
        return Music;
      case "model":
        return Compass;
      case "drawing":
        return Layers;
      case "typography":
        return Type;
      case "office":
        return FileText;
      case "compress":
        return FolderArchive;
      case "database":
        return Database;
      case "config":
        return Boxes;
      default:
        return FileText;
    }
  };

  const isSelectedOrphan = selectedAsset 
    ? orphans.some((o: any) => o.path === selectedAsset.path)
    : false;

  const selectedAssetHint = selectedAsset
    ? optimizationHints.find((h: any) => h.path === selectedAsset.path)
    : null;

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-10 py-8 h-full overflow-y-auto flex flex-col">
      {/* Title */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 style={{ ...mono, fontSize: 24, fontWeight: 500, color: C.text, margin: 0 }}>ASSET INTELLIGENCE</h2>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
            Manage and optimize multimedia resources, 3D/Game assets, and CAD drawings in your project.
          </p>
        </div>
        
        {/* Quick Summary Badge */}
        <div className="flex items-center gap-4 bg-[#ffffff02] border border-white/[0.04] rounded px-4 py-2 self-start md:self-auto">
          <Boxes size={20} style={{ color: C.accent }} />
          <div>
            <div style={{ ...mono, fontSize: 10, color: C.muted, letterSpacing: "0.08em" }}>TOTAL ASSETS SIZE</div>
            <div style={{ ...mono, fontSize: 16, fontWeight: 600, color: C.accent }}>
              {formatBytes(stats.totalSize)} · {stats.totalFiles} files
            </div>
          </div>
        </div>
      </div>

      {/* Categories Cards Row (Dynamic Grid layout based on active count) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {activeCategories.map((cat) => {
          const meta = getCategoryMeta(cat);
          const Icon = meta.icon;
          const count = stats.categoryCounts[cat] || 0;
          const size = stats.categorySizes[cat] || 0;
          const percentage = stats.totalSize > 0 ? (size / stats.totalSize) * 100 : 0;
          
          return (
            <div 
              key={cat} 
              className="p-4 rounded border flex items-center justify-between"
              style={{ 
                background: C.surface, 
                borderColor: C.border 
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded" style={{ backgroundColor: meta.bg }}>
                  <Icon size={20} style={{ color: meta.color }} />
                </div>
                <div>
                  <div style={{ ...mono, fontSize: 10, color: C.muted, letterSpacing: "0.05em" }}>
                    {meta.label.toUpperCase()}
                  </div>
                  <div style={{ ...mono, fontSize: 16, fontWeight: 500, color: C.text, marginTop: 2 }}>
                    {count} files
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                    {formatBytes(size)} ({percentage.toFixed(1)}%)
                  </div>
                </div>
              </div>
              
              {/* Radial representation */}
              <div className="w-1.5 h-12 rounded-full bg-white/[0.03] overflow-hidden">
                <div 
                  className="rounded-full w-full" 
                  style={{ 
                    height: `${percentage}%`, 
                    backgroundColor: meta.color, 
                    marginTop: `${100 - percentage}%`
                  }} 
                  
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub tabs Navigation */}
      <div className="flex border-b mb-6" style={{ borderColor: C.border }}>
        {[
          { id: "overview", label: "Overview" },
          { id: "all", label: `All Assets (${stats.totalFiles})` },
          { id: "relations", label: `Relations (${edges.length})` },
          { id: "duplicates", label: `Duplicates (${duplicates.length})` },
          { id: "hints", label: `Optimization Hints (${optimizationHints.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setSubTab(tab.id as SubTab);
              setSelectedAsset(null);
            }}
            style={{ ...mono, fontSize: 12 }}
            className={`px-4 py-2 -mb-[1px] border-b-2 font-medium transition-all ${
              subTab === tab.id 
                ? `border-[${C.accent}] text-[${C.text}]` 
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}
      <div className="flex-1 min-h-0">
        
        {/* OVERVIEW TAB */}
        {subTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Size Distribution card */}
              <Card label="RESOURCE DISTRIBUTION DETAILS">
                <div className="space-y-4">
                  {Object.entries(stats.subcategoryCounts).map(([sub, count]) => {
                    const size = assetReport.assets
                      .filter(a => a.subcategory === sub)
                      .reduce((sum, a) => sum + a.size, 0);
                    
                    const parentCat = assetReport.assets.find(a => a.subcategory === sub)?.category || "";
                    const meta = getCategoryMeta(parentCat);
                    const SubIcon = getSubcategoryIcon(sub);
                    const barWidth = stats.totalSize > 0 ? (size / stats.totalSize) * 100 : 0;
                    
                    return (
                      <div key={sub} className="space-y-1">
                         <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <SubIcon size={12} style={{ color: meta.color }} />
                            <span className="capitalize" style={{ color: C.text }}>{sub}</span>
                            <span className="text-[10px]" style={{ color: C.muted }}>({count} files)</span>
                          </div>
                          <span style={{ ...mono, color: C.text }}>{formatBytes(size)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/[0.02] rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${barWidth}%`, 
                              backgroundColor: meta.color 
                            }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Duplicate & Optimization Summary */}
              <div className="space-y-4">
                
                {/* Wasted space warning card */}
                {duplicates.length > 0 ? (
                  <div className="p-4 rounded border border-red-500/20 bg-red-950/10 flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-200">Duplicate Space Wasted</h4>
                      <p className="text-xs text-red-400/80 mt-1">
                        Found <strong className="text-red-300">{duplicates.length} duplicate file groups</strong> with identical content (SHA-256), wasting about <strong className="text-red-300">{formatBytes(wastedSpace)}</strong>.
                      </p>
                      <button 
                        onClick={() => setSubTab("duplicates")}
                        className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1 mt-2.5 transition-all"
                      >
                        View duplicate details <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded border border-green-500/20 bg-green-950/10 flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-green-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-green-200">No Duplicate Files</h4>
                      <p className="text-xs text-green-400/80 mt-1">
                        The system did not detect any duplicate assets based on SHA-256. Your repository is well organized!
                      </p>
                    </div>
                  </div>
                )}

                {/* Optimization hints summary card */}
                <div className="p-4 rounded border border-blue-500/20 bg-blue-950/10 flex items-start gap-3">
                  <Compass size={20} className="text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-200">Optimization Hints Available</h4>
                    <p className="text-xs text-blue-400/80 mt-1">
                      There are <strong className="text-blue-300">{optimizationHints.length} compression/conversion recommendations</strong>. Estimated potential size savings:{" "}
                      <strong className="text-blue-300">
                        {formatBytes(optimizationHints.reduce((sum, h) => sum + h.potentialSavings, 0))}
                      </strong>.
                    </p>
                    <button 
                      onClick={() => setSubTab("hints")}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 mt-2.5 transition-all"
                    >
                      Check optimization hints <ArrowRight size={12} />
                    </button>
                  </div>
                </div>

                {/* Orphan assets summary card */}
                {orphans.length > 0 && (
                  <div className="p-4 rounded border border-orange-500/20 bg-orange-950/10 flex items-start gap-3">
                    <HelpCircle size={20} className="text-orange-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-orange-200">Orphan Assets Detected</h4>
                      <p className="text-xs text-orange-400/80 mt-1">
                        Detected <strong className="text-orange-300">{orphans.length} unreferenced assets</strong> not used by any source code or game/CAD config files. You can safely delete them to free up disk space.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>
            
            {/* Top largest assets */}
            <Card label="LARGEST ASSETS IN PROJECT">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-[10px] text-neutral-500" style={{ borderColor: C.border }}>
                      <th className="pb-2 font-medium">ASSET NAME</th>
                      <th className="pb-2 font-medium">FILE PATH</th>
                      <th className="pb-2 font-medium">CATEGORY</th>
                      <th className="pb-2 font-medium text-right">SIZE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02] text-xs">
                    {assetReport.assets.slice(0, 5).map((asset) => {
                      const meta = getCategoryMeta(asset.category);
                      const SubIcon = getSubcategoryIcon(asset.subcategory);
                      
                      return (
                        <tr key={asset.path} className="hover:bg-white/[0.01]">
                          <td className="py-2.5 font-medium flex items-center gap-2">
                            <SubIcon size={14} style={{ color: meta.color }} />
                            <span className="truncate max-w-[180px]">{asset.name}</span>
                          </td>
                          <td className="py-2.5 text-neutral-500 font-mono truncate max-w-[300px]" title={asset.path}>
                            {asset.path}
                          </td>
                          <td className="py-2.5 capitalize">
                            <span className="px-2 py-0.5 rounded text-[10px]" style={{ color: meta.color, backgroundColor: meta.bg }}>
                              {asset.subcategory}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-mono" style={{ color: C.text }}>
                            {formatBytes(asset.size)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ALL ASSETS TAB */}
        {subTab === "all" && (
          <div className="flex gap-4 h-full min-h-0">
            {/* Left list container */}
            <div className="flex-1 min-h-0 flex flex-col space-y-4">
              
              {/* Search and filter row */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search input */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search by filename or path..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      background: C.surface,
                      borderColor: C.border,
                      color: C.text,
                    }}
                    className="w-full pl-9 pr-4 py-1.5 text-xs rounded border outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>

                {/* Category selector */}
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setSubcategoryFilter("all");
                  }}
                  style={{ background: C.surface, borderColor: C.border, color: C.text }}
                  className="px-3 py-1.5 text-xs rounded border outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {activeCategories.map(cat => (
                    <option key={cat} value={cat}>{getCategoryMeta(cat).label}</option>
                  ))}
                </select>

                {/* Subcategory selector */}
                {subcategories.length > 0 && (
                  <select
                    value={subcategoryFilter}
                    onChange={(e) => setSubcategoryFilter(e.target.value)}
                    style={{ background: C.surface, borderColor: C.border, color: C.text }}
                    className="px-3 py-1.5 text-xs rounded border outline-none cursor-pointer"
                  >
                    <option value="all">All Subcategories</option>
                    {subcategories.map(sub => (
                      <option key={sub} value={sub} className="capitalize">{sub}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* List Table */}
              <div className="flex-1 min-h-0 overflow-auto border rounded flex flex-col" style={{ borderColor: C.border, background: C.surface }}>
                {filteredAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-neutral-500 flex-1">
                    No assets matched your filter criteria.
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b text-[10px] text-neutral-500 sticky top-0 bg-neutral-950 z-10" style={{ borderColor: C.border }}>
                          <th className="p-3 font-medium">FILENAME</th>
                          <th className="p-3 font-medium">FILE PATH</th>
                          <th className="p-3 font-medium">CATEGORY</th>
                          <th className="p-3 font-medium text-right">SIZE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.02] text-xs">
                        {filteredAssets.slice(0, visibleCount).map((asset) => {
                          const meta = getCategoryMeta(asset.category);
                          const SubIcon = getSubcategoryIcon(asset.subcategory);
                          const isSelected = selectedAsset && selectedAsset.path === asset.path;
                          
                          return (
                            <tr 
                              key={asset.path} 
                              onClick={() => setSelectedAsset(asset)}
                              style={{ 
                                backgroundColor: isSelected ? "rgba(255, 255, 255, 0.03)" : "transparent",
                                cursor: "pointer"
                              }}
                              className="hover:bg-white/[0.01] transition-colors"
                            >
                              <td className="p-3 font-medium flex items-center gap-2">
                                <SubIcon size={14} style={{ color: meta.color }} />
                                <span className="truncate max-w-[200px]" title={asset.name}>{asset.name}</span>
                              </td>
                              <td className="p-3 text-neutral-500 font-mono truncate max-w-[280px]" title={asset.path}>
                                {asset.path}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded text-[10px] capitalize" style={{ color: meta.color, backgroundColor: meta.bg }}>
                                  {asset.subcategory}
                                </span>
                              </td>
                              <td className="p-3 text-right font-mono" style={{ color: C.text }}>
                                {formatBytes(asset.size)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Pagination / Load more button */}
                {filteredAssets.length > visibleCount && (
                  <div className="p-3 text-center border-t shrink-0 bg-neutral-900/10" style={{ borderColor: C.border }}>
                    <button 
                      onClick={() => setVisibleCount(prev => prev + 50)}
                      className="px-4 py-1.5 text-xs rounded border hover:bg-white/5 transition-colors cursor-pointer"
                      style={{ borderColor: C.border, color: C.text }}
                    >
                      Load more ({filteredAssets.length - visibleCount} files remaining)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right details panel */}
            {selectedAsset && <DetailsPanel selectedAsset={selectedAsset} isSelectedOrphan={isSelectedOrphan} selectedAssetHint={selectedAssetHint} getCategoryMeta={getCategoryMeta} getSubcategoryIcon={getSubcategoryIcon} handleCopyPath={handleCopyPath} copied={copied} onClose={() => setSelectedAsset(null)} />}
          </div>
        )}

        {/* RELATIONS (DEPENDENCY GRAPH) TAB */}
        {subTab === "relations" && (
          <div className="flex gap-4 h-full min-h-0">
            {/* Dependency list */}
            <div className="flex-1 min-h-0 flex flex-col space-y-4 overflow-auto">
              {assetRelations.size === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <GitBranch size={32} className="text-neutral-500 mb-2" />
                  <h4 style={{ ...mono, fontSize: 14, color: C.text }}>No Relations Detected</h4>
                  <p className="text-xs text-neutral-500 mt-1 max-w-md">
                    No dependency relationships were detected between scenes, config files, textures, or 3D models.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from(assetRelations.entries()).map(([parentPath, children]) => {
                    const parentName = parentPath.split("/").pop() || "";
                    const parentAsset = assetReport.assets.find(a => a.path === parentPath);
                    const parentMeta = getCategoryMeta(parentAsset?.category || "game_3d");
                    const ParentIcon = getSubcategoryIcon(parentAsset?.subcategory || "config");
                    
                    return (
                      <div 
                        key={parentPath} 
                        className="border rounded p-4 flex flex-col"
                        style={{ 
                          background: C.surface, 
                          borderColor: C.border 
                        }}
                      >
                        {/* Parent Node Info */}
                        <div 
                          onClick={() => setSelectedAsset(parentAsset)}
                          className="flex items-center justify-between pb-3 border-b border-white/[0.02] cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <div className="flex items-center gap-2">
                            <ParentIcon size={14} style={{ color: parentMeta.color }} />
                            <span className="text-xs font-semibold text-neutral-200 truncate max-w-[180px]">
                              {parentName}
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-500 font-mono truncate max-w-[150px]">
                            {parentPath}
                          </span>
                        </div>

                        {/* Connected children */}
                        <div className="mt-3 space-y-2">
                          <div className="text-[10px] text-neutral-500 font-medium flex items-center gap-1">
                            <ArrowRight size={10} /> REFERENCES TO ({children.length})
                          </div>
                          <div className="space-y-1.5 pl-3 border-l border-white/[0.04]">
                            {children.map((child) => {
                              const childMeta = getCategoryMeta(child.category);
                              const ChildIcon = getSubcategoryIcon(child.subcategory);
                              
                              return (
                                <div 
                                  key={child.path}
                                  onClick={() => setSelectedAsset(child)}
                                  className="flex items-center justify-between p-1.5 rounded bg-white/[0.01] hover:bg-white/[0.03] text-xs cursor-pointer transition-colors"
                                >
                                  <div className="flex items-center gap-2 truncate max-w-[80%]">
                                    <ChildIcon size={12} style={{ color: childMeta.color }} />
                                    <span className="truncate text-neutral-300 font-mono text-[11px]">{child.name}</span>
                                  </div>
                                  <span className="text-[10px] text-neutral-500 font-mono">{formatBytes(child.size)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right details panel */}
            {selectedAsset && <DetailsPanel selectedAsset={selectedAsset} isSelectedOrphan={isSelectedOrphan} selectedAssetHint={selectedAssetHint} getCategoryMeta={getCategoryMeta} getSubcategoryIcon={getSubcategoryIcon} handleCopyPath={handleCopyPath} copied={copied} onClose={() => setSelectedAsset(null)} />}
          </div>
        )}

        {/* DUPLICATES TAB */}
        {subTab === "duplicates" && (
          <div className="space-y-4">
            {duplicates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 size={32} className="text-green-500 mb-2" />
                <h4 style={{ ...mono, fontSize: 14, color: C.text }}>Great!</h4>
                <p className="text-xs text-neutral-500 mt-1">No duplicate asset files were found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs text-neutral-400 bg-neutral-900/40 p-3 rounded border" style={{ borderColor: C.border }}>
                  Found <strong className="text-neutral-200">{duplicates.length} duplicate file groups</strong> via SHA-256. Estimated wasted space:{" "}
                  <strong className="text-red-400">{formatBytes(wastedSpace)}</strong>.
                </div>
                
                <div className="space-y-3">
                  {duplicates.map((dup, idx) => (
                    <div 
                      key={dup.sha256} 
                      className="border rounded p-4" 
                      style={{ 
                        background: C.surface, 
                        borderColor: C.border 
                      }}
                    >
                      <div className="flex items-center justify-between border-b pb-2 mb-3" style={{ borderColor: C.border }}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full font-mono">
                            Group #{idx + 1}
                          </span>
                          <span className="text-[11px] text-neutral-500 font-mono">
                            SHA-256: {dup.sha256.substring(0, 16)}...
                          </span>
                        </div>
                        <div className="text-right text-xs">
                          <span style={{ color: C.muted }}>Wasted: </span>
                          <strong className="text-red-400 font-mono">
                            {formatBytes(dup.size * (dup.files.length - 1))}
                          </strong>{" "}
                          <span className="text-neutral-500 font-mono">({formatBytes(dup.size)} x {dup.files.length})</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {dup.files.map((file) => {
                          const parentCat = assetReport.assets.find(a => a.path === file)?.category || "";
                          const meta = getCategoryMeta(parentCat);
                          const SubIcon = getSubcategoryIcon(assetReport.assets.find(a => a.path === file)?.subcategory || "");
                          
                          return (
                            <div key={file} className="flex items-center justify-between text-xs hover:bg-white/[0.01] p-1 rounded">
                              <div className="flex items-center gap-2 font-mono truncate max-w-[80%]">
                                <SubIcon size={12} style={{ color: meta.color }} />
                                <span className="truncate text-neutral-300">{file}</span>
                              </div>
                              <span className="text-[10px] text-neutral-500">Duplicate</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* HINTS TAB */}
        {subTab === "hints" && (
          <div className="space-y-4">
            {optimizationHints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 size={32} className="text-green-500 mb-2" />
                <h4 style={{ ...mono, fontSize: 14, color: C.text }}>Project is optimized!</h4>
                <p className="text-xs text-neutral-500 mt-1">No resource optimization recommendations require attention.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {optimizationHints.map((hint) => {
                  const isCritical = hint.severity === "critical";
                  const isWarning = hint.severity === "warning";
                  
                  const borderCol = isCritical 
                    ? "rgba(239, 68, 68, 0.2)" 
                    : isWarning 
                    ? "rgba(245, 158, 11, 0.2)" 
                    : "rgba(59, 130, 246, 0.2)";
                  
                  const bgCol = isCritical 
                    ? "rgba(239, 68, 68, 0.03)" 
                    : isWarning 
                    ? "rgba(245, 158, 11, 0.03)" 
                    : "rgba(59, 130, 246, 0.02)";
                  
                  const iconColor = isCritical 
                    ? "#ef4444" 
                    : isWarning 
                    ? "#f59e0b" 
                    : "#3b82f6";
                  
                  return (
                    <div 
                      key={hint.path} 
                      className="border rounded p-4 flex items-start justify-between gap-4"
                      style={{ 
                        background: bgCol, 
                        borderColor: borderCol 
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color: iconColor }} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-neutral-200 truncate max-w-sm">
                              {hint.name}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-500 truncate max-w-[200px]" title={hint.path}>
                              {hint.path}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                            {hint.message}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <div style={{ ...mono, fontSize: 10, color: C.muted, letterSpacing: "0.05em" }}>
                          ESTIMATED SAVINGS
                        </div>
                        <div style={{ ...mono, fontSize: 16, fontWeight: 600, color: "#4ade80", marginTop: 2 }}>
                          ~{formatBytes(hint.potentialSavings)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// Side details panel subcomponent
function DetailsPanel({ 
  selectedAsset, isSelectedOrphan, selectedAssetHint, 
  getCategoryMeta, getSubcategoryIcon, handleCopyPath, copied, onClose 
}: any) {
  return (
    <div 
      className="w-80 border rounded flex flex-col justify-between shrink-0 overflow-y-auto"
      style={{ 
        background: C.surface, 
        borderColor: C.border 
      }}
    >
      {/* Header panel */}
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: C.border }}>
        <div style={{ ...mono, fontSize: 11, color: C.muted, letterSpacing: "0.05em" }}>
          ASSET DETAILS
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-white/5 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content Panel */}
      <div className="p-4 flex-1 space-y-4">
        {/* Central icon visual */}
        <div className="flex flex-col items-center justify-center py-6 bg-neutral-900/20 border border-dashed rounded" style={{ borderColor: C.border }}>
          <div 
            className="p-4 rounded-full mb-3 shadow-lg" 
            style={{ 
              backgroundColor: getCategoryMeta(selectedAsset.category).bg,
              color: getCategoryMeta(selectedAsset.category).color
            }}
          >
            {(() => {
              const Icon = getSubcategoryIcon(selectedAsset.subcategory);
              return <Icon size={28} />;
            })()}
          </div>
          <span className="text-xs font-semibold text-center max-w-[90%] truncate text-neutral-200">
            {selectedAsset.name}
          </span>
          <span className="text-[10px] text-neutral-500 font-mono mt-1">
            .{selectedAsset.extension.toUpperCase()}
          </span>
        </div>

        {/* Basic specifications */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-white/[0.01]">
            <span className="text-neutral-500">Main Category:</span>
            <span className="font-medium capitalize text-neutral-300">
              {getCategoryMeta(selectedAsset.category).label}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/[0.01]">
            <span className="text-neutral-500">Asset Type:</span>
            <span className="font-medium capitalize text-neutral-300">
              {selectedAsset.subcategory}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/[0.01]">
            <span className="text-neutral-500">Size:</span>
            <span className="font-mono text-neutral-300">
              {formatBytes(selectedAsset.size)}
            </span>
          </div>
          {selectedAsset.metadata && Object.entries(selectedAsset.metadata).map(([key, val]) => (
            <div key={key} className="flex justify-between py-1 border-b border-white/[0.01]">
              <span className="text-neutral-500 capitalize">{key}:</span>
              <span className="font-medium text-neutral-300">{val as string}</span>
            </div>
          ))}
        </div>

        {/* Code references status (Orphan status) */}
        <div className="space-y-1.5 pt-2">
          <span className="text-[10px] text-neutral-500 font-medium block">REFERENCE STATUS</span>
          {isSelectedOrphan ? (
            <div className="p-3 rounded border border-orange-500/20 bg-orange-950/5 text-xs text-orange-400">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle size={12} />
                Orphan Asset
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                No reference strings to this file were found in the source code or game/CAD configuration files.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded border border-green-500/20 bg-green-950/5 text-xs text-green-400">
              <div className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 size={12} />
                Referenced / In Use
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                The asset file name appears in project source code or configuration files.
              </p>
            </div>
          )}
        </div>

        {/* File specific optimization recommendations */}
        {selectedAssetHint && (
          <div className="space-y-1.5 pt-2">
            <span className="text-[10px] text-neutral-500 font-medium block">OPTIMIZATION HINTS</span>
            <div 
              className="p-3 rounded border text-xs"
              style={{ 
                borderColor: selectedAssetHint.severity === "warning" ? "rgba(245, 158, 11, 0.2)" : "rgba(59, 130, 246, 0.2)",
                background: selectedAssetHint.severity === "warning" ? "rgba(245, 158, 11, 0.02)" : "rgba(59, 130, 246, 0.02)"
              }}
            >
              <p className="leading-relaxed text-neutral-300">
                {selectedAssetHint.message}
              </p>
              <div className="mt-2 text-right">
                <span className="text-[10px] text-neutral-500">Savings: </span>
                <strong className="text-green-400 font-mono">
                  ~{formatBytes(selectedAssetHint.potentialSavings)}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer panel - Copy Path */}
      <div className="p-3 border-t bg-neutral-900/10 flex gap-2" style={{ borderColor: C.border }}>
        <button
          onClick={() => handleCopyPath(selectedAsset.path)}
          style={{ background: C.surface, borderColor: C.border }}
          className="flex-1 py-1.5 border rounded flex items-center justify-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <Copy size={12} />
          {copied ? "Copied!" : "Copy Path"}
        </button>
      </div>
    </div>
  );
}
