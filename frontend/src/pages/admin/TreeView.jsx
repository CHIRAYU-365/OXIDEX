import React, { useEffect, useState } from 'react';
import Tree from 'react-d3-tree';

export default function TreeView() {
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Helper to convert flat array into D3 hierarchical JSON format
  const buildTree = (users) => {
    // 1. Create a map of all nodes
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

    // 2. Build the tree by assigning children to their referrers
    const roots = [];
    users.forEach(user => {
      if (user.referrerAddress && nodeMap[user.referrerAddress]) {
        nodeMap[user.referrerAddress].children.push(nodeMap[user.walletAddress]);
      } else {
        roots.push(nodeMap[user.walletAddress]);
      }
    });

    // If there's multiple roots, wrap them in a master 'Company' node
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
    <div className="space-y-6 h-screen flex flex-col">
      <div>
        <h1 className="text-3xl font-bold">Unilevel Tree View</h1>
        <p className="text-gray-400">Interactive animated view of the MLM hierarchy. Scroll to zoom, click and drag to pan.</p>
      </div>
      
      <div className="bg-gray-900 flex-1 rounded-xl border border-gray-800 overflow-hidden relative min-h-[600px]">
        {loading ? (
          <div className="p-6">Loading tree...</div>
        ) : treeData ? (
          <Tree 
            data={treeData} 
            orientation="vertical"
            pathFunc="step"
            translate={{ x: window.innerWidth / 3, y: 100 }}
            nodeSize={{ x: 200, y: 150 }}
            renderCustomNodeElement={({ nodeDatum, toggleNode }) => (
              <g>
                <circle r="20" fill="#3b82f6" onClick={toggleNode} className="cursor-pointer" />
                <text 
                  style={{ fill: '#ffffff', fontSize: '14px' }}
                  x="25" y="-5" 
                  className="shadow-black drop-shadow-md"
                >
                  {nodeDatum.name}
                </text>
                {nodeDatum.attributes?.Partners !== undefined && (
                  <text 
                    style={{ fill: '#9ca3af', fontSize: '12px' }}
                    x="25" y="15"
                  >
                    Partners: {nodeDatum.attributes.Partners}
                  </text>
                )}
              </g>
            )}
          />
        ) : (
          <div className="p-6 text-gray-500">No users found in the system.</div>
        )}
      </div>
    </div>
  );
}
