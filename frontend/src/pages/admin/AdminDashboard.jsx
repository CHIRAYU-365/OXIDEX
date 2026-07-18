import React, { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalVolume: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}/api/platform/stats`);
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
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-500 pb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-400 mt-2">Platform overview and volume statistics.</p>
      </div>
      
      {loading ? (
        <div className="flex animate-pulse space-x-6">
          <div className="flex-1 h-32 bg-white/5 rounded-xl border border-white/5"></div>
          <div className="flex-1 h-32 bg-white/5 rounded-xl border border-white/5"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="group bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h2 className="text-gray-400 font-semibold mb-2 uppercase tracking-wider text-sm">Total Affiliation</h2>
            <p className="text-5xl font-black text-white group-hover:scale-105 transform origin-left transition-transform duration-500">
              {stats.totalUsers} <span className="text-lg text-amber-500/50 font-normal">users</span>
            </p>
          </div>
          
          <div className="group bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-400 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h2 className="text-gray-400 font-semibold mb-2 uppercase tracking-wider text-sm">Total Volume</h2>
            <p className="text-5xl font-black text-white group-hover:scale-105 transform origin-left transition-transform duration-500">
              {parseFloat(stats.totalVolume).toFixed(4)} <span className="text-lg text-amber-500/50 font-normal">ETH</span>
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
