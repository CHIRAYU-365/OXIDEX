import React, { useEffect, useState } from 'react';

export default function TreeView() {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/admin/tree');
        const data = await res.json();
        if (data.success) {
          setTreeData(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch tree", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, []);

  // Basic representation of tree nodes
  const renderNode = (user, users) => {
    const children = users.filter(u => u.referrerAddress === user.walletAddress);
    return (
      <div key={user.walletAddress} className="ml-6 mt-2">
        <div className="flex items-center gap-2 text-sm bg-gray-800 p-2 rounded border border-gray-700">
          <span className="font-mono text-blue-400">{user.walletAddress.substring(0,6)}...{user.walletAddress.substring(38)}</span>
          <span className="text-xs text-gray-400">(Partners: {user.partnersCount})</span>
        </div>
        {children.length > 0 && (
          <div className="border-l border-gray-700 ml-4 pl-2 mt-2">
            {children.map(child => renderNode(child, users))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Unilevel Tree View</h1>
      <p className="text-gray-400">Complete view of the MLM hierarchy.</p>
      
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 overflow-x-auto min-h-[500px]">
        {loading ? (
          <p>Loading tree...</p>
        ) : treeData.length > 0 ? (
          // Find root nodes (no referrer or referrer not in list)
          treeData
            .filter(u => !u.referrerAddress || !treeData.find(t => t.walletAddress === u.referrerAddress))
            .map(root => renderNode(root, treeData))
        ) : (
          <p className="text-gray-500">No users found in the system.</p>
        )}
      </div>
    </div>
  );
}
