import React, { useEffect, useState, useCallback } from 'react';
import Tree from 'react-d3-tree';

export default function TreeView() {
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

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
          Roots: roots.length
        },
        children: roots
      };
    }
    
    return roots[0];
  };

  return (
    <div className="space-y-8 flex flex-col h-[calc(100vh-8rem)]">
      <div>
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-500 pb-2">
          Network Topology
        </h1>
        <p className="text-gray-400 mt-2">Interactive visualization of the multi-level affiliation tree. Drag to pan, scroll to zoom.</p>
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
            nodeSize={{ x: 220, y: 160 }}
            pathFunc="step"
            pathClassFunc={() => 'custom-link'}
            renderCustomNodeElement={({ nodeDatum, toggleNode }) => (
              <g>
                <circle 
                  r="24" 
                  fill="#18181b" 
                  stroke="#f59e0b"
                  strokeWidth="3"
                  onClick={toggleNode} 
                  className="cursor-pointer transition-all duration-300 hover:stroke-[#fbbf24]" 
                  style={{ filter: 'drop-shadow(0px 0px 8px rgba(245,158,11,0.5))' }}
                />
                <text 
                  fill="#ffffff"
                  fontSize="14"
                  fontWeight="bold"
                  x="35" y="-5" 
                  fontFamily="monospace"
                >
                  {nodeDatum.name}
                </text>
                {nodeDatum.attributes?.Partners !== undefined && (
                  <text 
                    style={{ fill: '#fbbf24', fontSize: '12px', fontWeight: 'bold' }}
                    x="35" y="15"
                    className="uppercase tracking-widest"
                  >
                    Partners: {nodeDatum.attributes.Partners}
                  </text>
                )}
                {nodeDatum.attributes?.Roots !== undefined && (
                  <text 
                    style={{ fill: '#fbbf24', fontSize: '12px', fontWeight: 'bold' }}
                    x="35" y="15"
                    className="uppercase tracking-widest"
                  >
                    Roots: {nodeDatum.attributes.Roots}
                  </text>
                )}
              </g>
            )}
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
