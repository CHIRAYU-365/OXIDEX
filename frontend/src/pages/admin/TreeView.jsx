import React, { useEffect, useState, useCallback } from 'react';
import Tree from 'react-d3-tree';
import { Search } from 'lucide-react';

export default function TreeView() {
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedPath, setHighlightedPath] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [treeKey, setTreeKey] = useState(0);

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
      
      nodeMap[user.walletAddress] = {
        name: `${user.walletAddress.substring(0,6)}...${user.walletAddress.substring(38)}`,
        attributes: {
          Partners: user.partnersCount,
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

    let finalTree = roots[0];
    if (roots.length > 1) {
      finalTree = {
        name: 'Launchpad Protocol',
        attributes: { Roots: roots.length, FullAddress: 'protocol' },
        children: roots
      };
    }

    
    
    function pruneTree(root, maxDepth) {
      if (!root) return;
      const queue = [{ node: root, depth: 1 }];
      
      while (queue.length > 0) {
        const { node, depth } = queue.shift();
        
        if (depth >= maxDepth) {
          if (node.children && node.children.length > 0) {
            node.attributes = { 
              ...node.attributes, 
              Status: 'Network Pruned (EVM Gas Cap)' 
            };
          }
          node.children = []; 
        } else if (node.children) {
          for (const child of node.children) {
            queue.push({ node: child, depth: depth + 1 });
          }
        }
      }
    }

    pruneTree(finalTree, 50);
    return finalTree;
  };

  
  useEffect(() => {
    if (!treeData || searchQuery.length < 4) {
      setHighlightedPath(new Set());
      return;
    }

    const query = searchQuery.toLowerCase();
    
    function findPath(root, query) {
      const stack = [{ node: root, path: [] }];
      
      while (stack.length > 0) {
        const { node, path } = stack.pop();
        const currentPath = [...path, node.name];
        
        if (
          (node.attributes?.FullAddress && node.attributes.FullAddress.toLowerCase().includes(query)) ||
          node.name.toLowerCase().includes(query)
        ) {
          return currentPath;
        }
        
        if (node.children) {
          
          for (let i = node.children.length - 1; i >= 0; i--) {
            stack.push({ node: node.children[i], path: currentPath });
          }
        }
      }
      return null;
    }

    const resultPath = findPath(treeData, query);
    if (resultPath) {
      setHighlightedPath(new Set(resultPath));
    } else {
      setHighlightedPath(new Set());
    }
  }, [searchQuery, treeData]);

  const getPathClass = ({ target }) => {
    
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
        
        {}
        <div className="flex flex-col md:items-end gap-2 w-full md:w-96">
          <div className="flex gap-2 w-full">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-amber-500/50" />
              </div>
              <input
                type="text"
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500/50 shadow-inner transition-colors font-mono text-sm"
                placeholder="Search wallet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => {
                setIsExpanded(!isExpanded);
                setTreeKey(k => k + 1);
              }}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 rounded-xl text-amber-400 font-bold uppercase tracking-wider text-xs whitespace-nowrap transition-colors"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
          
          {highlightedPath.size > 0 && searchQuery.length > 3 && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold shadow-[0_0_10px_rgba(239,68,68,0.2)] flex items-center gap-2 w-full md:w-auto">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-ping"></div>
              Target Located: {highlightedPath.size - 1} node{highlightedPath.size - 1 !== 1 ? 's' : ''} from root
            </div>
          )}
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
            key={treeKey}
            initialDepth={isExpanded ? 50 : 1}
            data={treeData} 
            orientation="vertical"
            pathFunc="straight"
            translate={translate}
            nodeSize={{ x: 220, y: 220 }}
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
                    <circle r="35" fill="none" stroke="#ef4444" strokeWidth="2" className="animate-pulse" style={{ filter: 'drop-shadow(0px 0px 15px rgba(239,68,68,0.8))' }} />
                  )}
                  
                  <circle 
                    r={isTarget ? "22" : "18"} 
                    fill="#18181b" 
                    stroke={isTarget ? "#ef4444" : isPath ? "#fbbf24" : "#f59e0b"}
                    strokeWidth={isTarget ? "4" : isPath ? "3" : "2"}
                    onClick={() => {
                      toggleNode();
                      setSelectedNode(nodeDatum);
                    }} 
                    className="cursor-pointer transition-all duration-300 hover:stroke-[#fbbf24]" 
                    style={{ filter: isTarget ? 'drop-shadow(0px 0px 10px rgba(239,68,68,0.6))' : 'drop-shadow(0px 0px 8px rgba(245,158,11,0.5))' }}
                  />
                  
                  {(isTarget || selectedNode?.name === nodeDatum.name) && (
                    <g>
                      {/* Background plate for highly visible text */}
                      <rect 
                        x="25" y="-14" 
                        width="145" height="42" 
                        fill="#000000" 
                        fillOpacity="0.75" 
                        rx="6" 
                        stroke={isTarget ? "#ef4444" : "rgba(255,255,255,0.1)"}
                      />
                      
                      <text 
                        fill={isTarget ? "#f87171" : "#ffffff"}
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

      {}
      {selectedNode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedNode(null)}>
          <div className="bg-zinc-950 border border-amber-500/20 rounded-2xl p-6 w-full max-w-md shadow-[0_0_30px_rgba(245,158,11,0.15)] transform transition-transform" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-500">
                Network Node Details
              </h3>
              <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            
            <div className="space-y-5">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 font-bold">Wallet Address</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-amber-400 break-all bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-sm flex-1">
                    {selectedNode.attributes?.FullAddress || selectedNode.name}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Direct Partners</p>
                  <p className="text-3xl font-black text-white mt-1">{selectedNode.attributes?.Partners || 0}</p>
                </div>
                <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 shadow-inner">
                  <p className="text-[10px] text-emerald-500/70 uppercase font-bold tracking-widest">Total Earnings</p>
                  <p className="text-xl font-black text-emerald-400 mt-1 truncate">{selectedNode.attributes?.Earnings || '0.0000 ETH'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Registration Date</p>
                <p className="text-gray-300 bg-white/5 inline-block px-3 py-1.5 rounded-lg text-sm">{selectedNode.attributes?.Joined || 'Protocol Genesis'}</p>
              </div>
            </div>
            
            <div className="mt-8">
               <button 
                 onClick={() => { navigator.clipboard.writeText(selectedNode.attributes?.FullAddress || ''); alert('Wallet Address Copied!'); }} 
                 className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-xl text-white font-black uppercase tracking-widest transition-all duration-300 shadow-lg text-sm"
               >
                 Copy Full Address
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
