import React, { useEffect, useState, useRef } from 'react';
import { Search, ZoomIn, ZoomOut, RefreshCw, Layers, Server, Globe, Cpu } from 'lucide-react';

export default function TreeView() {
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedPath, setHighlightedPath] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);

  // Pan and Zoom viewport state
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://oxidex-api.onrender.com'}/api/admin/tree`);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setTreeData(buildTreeData(data.data));
        } else {
          setTreeData(null);
        }
      } catch (err) {
        console.error("Failed to fetch tree", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, []);

  const buildTreeData = (users) => {
    const nodeMap = {};
    users.forEach(user => {
      nodeMap[user.walletAddress] = {
        id: user.walletAddress,
        name: `${user.walletAddress.substring(0,6)}...${user.walletAddress.substring(38)}`,
        attributes: {
          Partners: user.partnersCount || 0,
          FullAddress: user.walletAddress,
          Earnings: user.totalEarnings ? parseFloat(user.totalEarnings).toFixed(4) + ' ETH' : '0.0000 ETH',
          Joined: user.registeredAt ? new Date(user.registeredAt).toLocaleDateString() : 'Unknown'
        },
        children: []
      };
    });

    const roots = [];
    users.forEach(user => {
      if (user.referrerAddress && nodeMap[user.referrerAddress]) {
        nodeMap[user.referrerAddress].children.push(nodeMap[user.walletAddress]);
      } else {
        roots.push(nodeMap[user.walletAddress]);
      }
    });

    let root = roots[0];
    if (roots.length > 1) {
      root = {
        id: 'protocol-root',
        name: 'OxideX Protocol Centroid',
        attributes: { Roots: roots.length, FullAddress: 'protocol' },
        children: roots
      };
    }
    return root;
  };

  // Search path highlighter
  useEffect(() => {
    if (!treeData || searchQuery.length < 4) {
      setHighlightedPath(new Set());
      return;
    }

    const query = searchQuery.toLowerCase();
    
    function findPath(node, query, path = []) {
      const currentPath = [...path, node.id];
      if (
        (node.attributes?.FullAddress && node.attributes.FullAddress.toLowerCase().includes(query)) ||
        node.name.toLowerCase().includes(query)
      ) {
        return currentPath;
      }
      if (node.children) {
        for (const child of node.children) {
          const res = findPath(child, query, currentPath);
          if (res) return res;
        }
      }
      return null;
    }

    const resPath = findPath(treeData, query);
    setHighlightedPath(new Set(resPath || []));
  }, [searchQuery, treeData]);

  // Compute 360-Degree Radial Polar Coordinates with Subtree Weighting & Staggered Spacing
  const computeRadialLayout = (root) => {
    if (!root) return { nodes: [], links: [] };

    // Step 1: Compute leaf count weight for every node to allocate proportional angle sectors
    function computeWeights(node) {
      if (!node.children || node.children.length === 0) {
        node._weight = 1;
        return 1;
      }
      let weight = 0;
      node.children.forEach(child => {
        weight += computeWeights(child);
      });
      node._weight = Math.max(weight, 1);
      return node._weight;
    }
    computeWeights(root);

    const nodes = [];
    const links = [];

    // Step 2: Radial layout using weighted angle allocation & staggered radii to prevent overlaps
    function layoutNode(node, parent, level, startAngle, endAngle, childIndex = 0) {
      // Dynamic level radial spacing: spacious 360° ring distances for 200+ nodes
      const baseRadii = [0, 340, 680, 1020, 1360, 1700, 2040];
      let radius = baseRadii[level] || (2040 + (level - 6) * 340);

      // Stagger radius for odd/even sibling nodes to completely prevent overlap collisions
      if (level > 0 && childIndex % 2 === 1) {
        radius += 75;
      }

      const angle = (startAngle + endAngle) / 2;
      const x = level === 0 ? 0 : Math.round(radius * Math.cos(angle));
      const y = level === 0 ? 0 : Math.round(radius * Math.sin(angle));

      const nodeObj = {
        ...node,
        level,
        x,
        y,
        angle,
        parent
      };
      nodes.push(nodeObj);

      if (parent) {
        links.push({
          source: parent,
          target: nodeObj,
          level
        });
      }

      if (node.children && node.children.length > 0) {
        const totalSubtreeWeight = node._weight;
        let currentAngle = startAngle;
        
        node.children.forEach((child, idx) => {
          const childAngleSpan = ((child._weight || 1) / totalSubtreeWeight) * (endAngle - startAngle);
          const childStart = currentAngle;
          const childEnd = currentAngle + childAngleSpan;
          currentAngle = childEnd;
          
          layoutNode(child, nodeObj, level + 1, childStart, childEnd, idx);
        });
      }
    }

    layoutNode(root, null, 0, 0, 2 * Math.PI, 0);
    return { nodes, links };
  };

  const { nodes, links } = computeRadialLayout(treeData);

  // Mouse pan & zoom event handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.3), 3.0));
  };

  const resetView = () => {
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
  };

  const categoryColors = [
    { name: 'Root Centroid', bg: '#f59e0b', stroke: '#fbbf24' },
    { name: 'Primary Hubs', bg: '#38bdf8', stroke: '#0284c7' },
    { name: 'Sub-Routers', bg: '#34d399', stroke: '#059669' },
    { name: 'Network Nodes', bg: '#f472b6', stroke: '#db2777' },
    { name: 'Peripherals', bg: '#a78bfa', stroke: '#7c3aed' }
  ];

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-sky-400 to-emerald-400 pb-2">
            360° Radial Centroid Topology
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Interactive 360-degree radial network map with the Root Node as the central protocol centroid.
          </p>
        </div>

        {/* Search Bar & Viewport Actions */}
        <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
          <div className="flex gap-2 w-full md:w-96">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-amber-400" />
              </div>
              <input
                type="text"
                className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500/50 text-xs font-mono"
                placeholder="Search node address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button
              onClick={resetView}
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-amber-400 transition-colors"
              title="Reset View"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {highlightedPath.size > 0 && searchQuery.length > 3 && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-ping"></div>
              Target Path Located: {highlightedPath.size - 1} hops from Centroid
            </div>
          )}
        </div>
      </div>

      {/* Main Radial Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="flex-1 bg-[#090b10] rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden cursor-grab active:cursor-grabbing"
      >
        {/* Legend Overlay */}
        <div className="absolute top-4 left-4 z-20 bg-black/70 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex flex-col gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Topology Legend</span>
          <div className="flex flex-col gap-1.5">
            {categoryColors.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.bg }}></span>
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 z-20 flex gap-2 bg-black/70 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
          <button onClick={() => setZoom(z => Math.min(z * 1.2, 3))} className="p-2 text-white hover:text-amber-400"><ZoomIn className="w-4 h-4" /></button>
          <button onClick={() => setZoom(z => Math.max(z * 0.8, 0.3))} className="p-2 text-white hover:text-amber-400"><ZoomOut className="w-4 h-4" /></button>
        </div>

        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-amber-400 animate-pulse font-bold tracking-widest uppercase">Calculating 360° Radial Centroid Map...</p>
          </div>
        ) : treeData ? (
          <svg className="w-full h-full select-none">
            <defs>
              <radialGradient id="centroidGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Transform Group for Pan & Zoom */}
            <g transform={`translate(${containerRef.current ? containerRef.current.clientWidth / 2 + pan.x : pan.x}, ${containerRef.current ? containerRef.current.clientHeight / 2 + pan.y : pan.y}) scale(${zoom})`}>

              {/* 360° Concentric Orbital Rings */}
              <circle r="340" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="6 6" />
              <circle r="680" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="8 8" />
              <circle r="1020" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeDasharray="10 10" />
              <circle r="1360" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeDasharray="12 12" />
              <circle r="1700" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeDasharray="14 14" />
              <circle r="2040" fill="none" stroke="rgba(255, 255, 255, 0.01)" strokeDasharray="16 16" />

              {/* Network Connections (Stepped Orthogonal Lines matching Reference Picture) */}
              {links.map((link, i) => {
                const isHighlight = highlightedPath.has(link.source.id) && highlightedPath.has(link.target.id);
                const midX = (link.source.x + link.target.x) / 2;

                // Orthogonal stepped line path (matching reference network map)
                const d = `M ${link.source.x} ${link.source.y} L ${midX} ${link.source.y} L ${midX} ${link.target.y} L ${link.target.x} ${link.target.y}`;
                
                const levelColors = ['#f59e0b', '#38bdf8', '#34d399', '#f472b6', '#a78bfa'];
                const strokeColor = isHighlight ? '#ef4444' : levelColors[link.level % levelColors.length];

                return (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isHighlight ? 4 : 2}
                    strokeOpacity={isHighlight ? 1 : 0.6}
                    style={{
                      filter: isHighlight ? 'drop-shadow(0px 0px 8px #ef4444)' : 'none',
                      transition: 'all 0.3s'
                    }}
                  />
                );
              })}

              {/* Nodes Rendering */}
              {nodes.map((node) => {
                const isRoot = node.level === 0;
                const isTarget = searchQuery.length > 3 && (
                  (node.attributes?.FullAddress && node.attributes.FullAddress.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  node.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
                const isPath = highlightedPath.has(node.id);

                const levelColors = ['#f59e0b', '#38bdf8', '#34d399', '#f472b6', '#a78bfa'];
                const color = isRoot ? '#f59e0b' : isTarget ? '#ef4444' : isPath ? '#ffffff' : levelColors[node.level % levelColors.length];

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* --- CENTRAL ROOT CENTROID (ROOT NODE) --- */}
                    {isRoot ? (
                      <g>
                        {/* Outer Glowing Background */}
                        <circle r="75" fill="url(#centroidGlow)" />
                        {/* Spinning Outer Orbit Ring */}
                        <circle r="48" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="8 6" className="animate-spin" style={{ animationDuration: '20s' }} />
                        {/* Pulsing Aura Ring */}
                        <circle r="36" fill="rgba(245, 158, 11, 0.2)" stroke="#fbbf24" strokeWidth="3" className="animate-pulse" />
                        {/* Core Hub Badge */}
                        <circle r="26" fill="#18181b" stroke="#f59e0b" strokeWidth="4" />
                        <text x="0" y="6" textAnchor="middle" fontSize="18" fill="#fbbf24">🌐</text>
                        
                        {/* Floating Centroid Title Badge */}
                        <g transform="translate(0, -52)">
                          <rect x="-60" y="-12" width="120" height="22" rx="11" fill="#f59e0b" />
                          <text x="0" y="2" textAnchor="middle" fill="#000000" fontSize="10" fontWeight="900" style={{ letterSpacing: '0.12em' }}>
                            CENTROID HUB
                          </text>
                        </g>

                        {/* Centroid Name Label */}
                        <rect x="-80" y="38" width="160" height="38" rx="8" fill="#000" fillOpacity="0.85" stroke="#f59e0b" strokeWidth="1.5" />
                        <text x="0" y="54" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="900" fontFamily="monospace">
                          {node.name}
                        </text>
                        <text x="0" y="69" textAnchor="middle" fill="#aaa" fontSize="9" fontWeight="bold">
                          ROOT PROTOCOL CORE
                        </text>
                      </g>
                    ) : (
                      /* --- BRANCH NODES (LEVEL 1+) --- */
                      <g>
                        {/* Target Halo */}
                        {isTarget && (
                          <circle r="32" fill="none" stroke="#ef4444" strokeWidth="2.5" className="animate-ping" />
                        )}

                        {/* Node Circle */}
                        <circle
                          r={isTarget ? 22 : 18}
                          fill="#12161f"
                          stroke={color}
                          strokeWidth={isTarget ? 4 : 3}
                          className="transition-transform duration-300 group-hover:scale-125"
                          style={{ filter: `drop-shadow(0px 0px 8px ${color})` }}
                        />

                        {/* Node Symbol */}
                        <text x="0" y="4" textAnchor="middle" fontSize="10" fill="#fff" className="pointer-events-none">
                          {node.level === 1 ? '🖥️' : '💻'}
                        </text>

                        {/* Node Label Plate */}
                        <g transform="translate(0, 26)">
                          <rect x="-65" y="0" width="130" height="32" rx="6" fill="#0a0c10" fillOpacity="0.9" stroke={color} strokeWidth="1" />
                          <text x="0" y="14" textAnchor="middle" fill={isTarget ? '#f87171' : '#ffffff'} fontSize="11" fontWeight="bold" fontFamily="monospace">
                            {node.name}
                          </text>
                          <text x="0" y="25" textAnchor="middle" fill="#888" fontSize="8">
                            PARTNERS: {node.attributes?.Partners || 0}
                          </text>
                        </g>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500 uppercase tracking-widest text-sm">No protocol nodes found.</p>
          </div>
        )}
      </div>

      {/* Selected Node Modal */}
      {selectedNode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedNode(null)}>
          <div className="bg-[#12161f] border border-amber-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-sky-400">
                  Node Specifications
                </h3>
                <p className="text-gray-400 text-xs font-mono mt-1">{selectedNode.attributes?.FullAddress}</p>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-white text-xl font-bold">✕</button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-black/50 p-4 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between"><span className="text-gray-400">Node Level:</span><span className="text-amber-400 font-bold">Level {selectedNode.level}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Direct Partners:</span><span className="text-white font-bold">{selectedNode.attributes?.Partners || 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Total Earnings:</span><span className="text-emerald-400 font-bold">{selectedNode.attributes?.Earnings || '0.0000 ETH'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Joined Date:</span><span className="text-gray-300 font-bold">{selectedNode.attributes?.Joined || 'N/A'}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
