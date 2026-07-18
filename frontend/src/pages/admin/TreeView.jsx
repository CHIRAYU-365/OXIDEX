import React, { useEffect, useState, useCallback } from 'react';
import Tree from 'react-d3-tree';
import { Search } from 'lucide-react';

export default function TreeView() {
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedPath, setHighlightedPath] = useState(new Set());

  // Dynamically calculate the center of the container when it mounts or resizes
  const containerRef = useCallback((containerElem) => {
    if (containerElem !== null) {
      const { width } = containerElem.getBoundingClientRect();
      setTranslate({
        x: width / 2,
        y: 100 // Top padding
      });
    }
  }, []);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}/api/admin/tree`);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setTreeData(buildTree(data.data));
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

  const buildTree = (users) => {
    const nodeMap = {};
    users.forEach(user => {
      // Keep full address in an attribute so we can search it, but display truncated
      nodeMap[user.walletAddress] = {
        name: `${user.walletAddress.substring(0,6)}...${user.walletAddress.substring(38)}`,
        attributes: {
          Partners: user.partnersCount,
          FullAddress: user.walletAddress
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

    if (roots.length > 1) {
      return {
        name: 'Launchpad Protocol',
        attributes: {
          Roots: roots.length,
          FullAddress: 'protocol'
        },
        children: roots
      };
    }
    
    return roots[0];
  };

  // DFS to find path to the searched wallet
  useEffect(() => {
    if (!treeData || searchQuery.length < 4) {
      setHighlightedPath(new Set());
      return;
    }

    const query = searchQuery.toLowerCase();
    
    function dfs(node, path) {
      const currentPath = [...path, node.name];
      
      // If we found a match in the full address or the truncated name
      if (
        (node.attributes?.FullAddress && node.attributes.FullAddress.toLowerCase().includes(query)) ||
        node.name.toLowerCase().includes(query)
      ) {
        return currentPath;
      }
      
      if (node.children) {
        for (const child of node.children) {
          const result = dfs(child, currentPath);
          if (result) return result;
        }
      }
      return null;
    }

    const resultPath = dfs(treeData, []);
    if (resultPath) {
      setHighlightedPath(new Set(resultPath));
    } else {
      setHighlightedPath(new Set());
    }
  }, [searchQuery, treeData]);

  const getPathClass = ({ target }) => {
    // target is the child node in the link. If child is in highlighted path, line is highlighted
    if (highlightedPath.has(target.data.name)) {
      return 'custom-link-highlighted';
    }
    return 'custom-link';
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-500 pb-2">
            Network Topology
          </h1>
          <p className="text-gray-400 mt-2">Interactive visualization of the multi-level affiliation tree.</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-amber-500/50" />
          </div>
          <input
            type="text"
            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500/50 shadow-inner transition-colors font-mono text-sm"
            placeholder="Search wallet address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(245,158,11,0.05)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 z-10"></div>
        
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-amber-500/60 animate-pulse text-lg uppercase tracking-widest font-bold">Scanning Network...</p>
          </div>
        ) : treeData ? (
          <Tree 
            data={treeData} 
            orientation="vertical"
            pathFunc="step"
            translate={translate}
            nodeSize={{ x: 320, y: 180 }}
            pathClassFunc={getPathClass}
            renderCustomNodeElement={({ nodeDatum, toggleNode }) => {
              const isTarget = searchQuery.length > 3 && (
                (nodeDatum.attributes?.FullAddress && nodeDatum.attributes.FullAddress.toLowerCase().includes(searchQuery.toLowerCase())) ||
                nodeDatum.name.toLowerCase().includes(searchQuery.toLowerCase())
              );
              
              const isPath = highlightedPath.has(nodeDatum.name);

              return (
                <g>
                  {/* Glowing halo for target node */}
                  {isTarget && (
                    <circle r="35" fill="none" stroke="#22c55e" strokeWidth="2" className="animate-pulse" style={{ filter: 'drop-shadow(0px 0px 15px rgba(34,197,94,0.8))' }} />
                  )}
                  
                  <circle 
                    r={isTarget ? "22" : "18"} 
                    fill="#18181b" 
                    stroke={isTarget ? "#22c55e" : isPath ? "#fbbf24" : "#f59e0b"}
                    strokeWidth={isTarget ? "4" : isPath ? "3" : "2"}
                    onClick={toggleNode} 
                    className="cursor-pointer transition-all duration-300 hover:stroke-[#fbbf24]" 
                    style={{ filter: isTarget ? 'drop-shadow(0px 0px 10px rgba(34,197,94,0.6))' : 'drop-shadow(0px 0px 8px rgba(245,158,11,0.5))' }}
                  />
                  
                  {/* Background plate for highly visible text */}
                  <rect 
                    x="25" y="-14" 
                    width="145" height="42" 
                    fill="#000000" 
                    fillOpacity="0.75" 
                    rx="6" 
                    stroke={isTarget ? "#22c55e" : "rgba(255,255,255,0.1)"}
                  />
                  
                  <text 
                    fill={isTarget ? "#4ade80" : "#ffffff"}
                    fontSize="15"
                    fontWeight="900"
                    x="33" y="2" 
                    fontFamily="monospace"
                    style={{ letterSpacing: '0.05em' }}
                  >
                    {nodeDatum.name}
                  </text>
                  
                  {nodeDatum.attributes?.Partners !== undefined && (
                    <text 
                      fill="#fbbf24"
                      fontSize="11"
                      fontWeight="bold"
                      x="33" y="18"
                      style={{ letterSpacing: '0.1em' }}
                    >
                      PARTNERS: {nodeDatum.attributes.Partners}
                    </text>
                  )}
                  {nodeDatum.attributes?.Roots !== undefined && (
                    <text 
                      fill="#fbbf24"
                      fontSize="11"
                      fontWeight="bold"
                      x="33" y="18"
                      style={{ letterSpacing: '0.1em' }}
                    >
                      ROOTS: {nodeDatum.attributes.Roots}
                    </text>
                  )}
                </g>
              )
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500 uppercase tracking-widest text-sm">No users found in the protocol.</p>
          </div>
        )}
      </div>
    </div>
  );
}
