import React, { useState, useEffect } from 'react';
import { FiAward, FiTrendingUp, FiUsers } from 'react-icons/fi';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Leaderboard = () => {
  const [topEarners, setTopEarners] = useState([]);
  const [topRecruiters, setTopRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        const [earnersRes, recruitersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/analytics/top-earners`),
          axios.get(`${API_BASE_URL}/analytics/top-recruiters`)
        ]);
        setTopEarners(earnersRes.data.data || []);
        setTopRecruiters(recruitersRes.data.data || []);
      } catch (error) {
        console.error("Error fetching leaderboards:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboards();
  }, []);

  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pt-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400 drop-shadow-sm flex items-center justify-center gap-3">
          <FiAward className="text-sky-400" /> Global Leaderboard
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          The most elite earners and network builders on the OXIDEX protocol.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Earners */}
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <div className="flex items-center space-x-3 mb-6">
            <FiTrendingUp className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl font-bold text-white">Top Earners</h2>
          </div>
          <div className="space-y-4">
            {topEarners.length === 0 && <p className="text-gray-500 text-center py-4">No data yet.</p>}
            {topEarners.map((user, idx) => (
              <div key={user.walletAddress} className="flex items-center justify-between p-4 rounded-xl bg-[#050b14] border border-gray-800">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium">ID: {user.onChainId}</p>
                    <p className="text-xs text-gray-500 font-mono">{shortenAddress(user.walletAddress)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-bold">{user.totalEarnings} ETH</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Recruiters */}
        <div className="glass-panel p-6 rounded-2xl border border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]">
          <div className="flex items-center space-x-3 mb-6">
            <FiUsers className="w-6 h-6 text-sky-400" />
            <h2 className="text-2xl font-bold text-white">Top Recruiters</h2>
          </div>
          <div className="space-y-4">
            {topRecruiters.length === 0 && <p className="text-gray-500 text-center py-4">No data yet.</p>}
            {topRecruiters.map((user, idx) => (
              <div key={user.walletAddress} className="flex items-center justify-between p-4 rounded-xl bg-[#050b14] border border-gray-800">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium">ID: {user.onChainId}</p>
                    <p className="text-xs text-gray-500 font-mono">{shortenAddress(user.walletAddress)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sky-400 font-bold">{user.partnersCount} Partners</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
