import React, { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalVolume: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/platform/stats');
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      {loading ? (
        <p>Loading stats...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-gray-400 font-semibold mb-2">Total Affiliation (Users)</h2>
            <p className="text-4xl font-bold text-white">{stats.totalUsers}</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-gray-400 font-semibold mb-2">Total Volume (ETH)</h2>
            <p className="text-4xl font-bold text-white">{parseFloat(stats.totalVolume).toFixed(4)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
