import React, { useEffect, useState } from 'react';
import { getAdminHeaders } from '../../utils/adminApi';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalVolume: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRes = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://oxidex-api.onrender.com'}/api/platform/stats`);
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
        }

        const usersRes = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://oxidex-api.onrender.com'}/api/admin/users`, {
          headers: getAdminHeaders(),
        });
        const usersData = await usersRes.json();
        if (usersData.success) {
          setUsers(usersData.data);
        }
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleToggleBan = async (walletAddress, isCurrentlyBanned) => {
    try {
      const endpoint = isCurrentlyBanned ? 'unban' : 'ban';
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://oxidex-api.onrender.com'}/api/admin/users/${walletAddress}/${endpoint}`, {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => 
          u.walletAddress === walletAddress ? { ...u, isBanned: !isCurrentlyBanned } : u
        ));
      } else {
        alert(data.error || 'Failed to update user status');
      }
    } catch (err) {
      console.error('Failed to toggle ban status', err);
      alert('Error communicating with server');
    }
  };

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

      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
        <h2 className="text-2xl font-bold mb-6 text-white">Recent Users (Latest 200)</h2>
        {loading ? (
          <p className="text-amber-500/60 animate-pulse">Loading users...</p>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-gray-400 border-b border-white/5">
                  <th className="p-4 font-semibold">Wallet Address</th>
                  <th className="p-4 font-semibold">Sponsor</th>
                  <th className="p-4 font-semibold">Partners</th>
                  <th className="p-4 font-semibold text-right">Revenue</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 font-mono text-sm text-amber-400/80 group-hover:text-amber-400 transition-colors">
                      {u.walletAddress}
                    </td>
                    <td className="p-4 font-mono text-sm text-gray-500 truncate max-w-[150px]">
                      {u.referrerAddress ? u.referrerAddress : 'Genesis'}
                    </td>
                    <td className="p-4 text-gray-300 font-bold">{u.partnersCount}</td>
                    <td className="p-4 text-emerald-400 font-mono font-bold text-right">
                      {u.totalEarnings ? parseFloat(u.totalEarnings).toFixed(4) : "0.00"} ETH
                    </td>
                    <td className="p-4 text-center">
                      {u.isBanned ? (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold border border-red-500/30">Suspended</span>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold border border-emerald-500/30">Active</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleBan(u.walletAddress, u.isBanned)}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                          u.isBanned 
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20' 
                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
                        }`}
                      >
                        {u.isBanned ? 'Grant Access' : 'Revoke Access'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-black/30 rounded-xl border border-white/5 border-dashed">
            <p className="text-gray-500">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
