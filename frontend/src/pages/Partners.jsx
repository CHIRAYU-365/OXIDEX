import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { Users, Link as LinkIcon, ExternalLink, CalendarDays } from "lucide-react";

export default function Partners() {
  const { activeAccount, activeUser } = useWeb3();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://oxidex-api.onrender.com";

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/users/${activeAccount}/partners`);
        const data = await res.json();
        if (data.success) {
          setPartners(data.data);
        }
      } catch (err) {
        console.error("Error fetching partners:", err);
      } finally {
        setLoading(false);
      }
    };

    if (activeAccount) fetchPartners();
  }, [activeAccount, backendUrl]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-brand-500/20 rounded-xl text-brand-400">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100">My Partners</h1>
          <p className="text-sm text-slate-400">Track your direct referrals and team growth</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border-slate-900 shadow-glow">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Direct Partners</h3>
          <p className="text-4xl font-black text-brand-400">{activeUser?.partnersCount || 0}</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl border-slate-900 shadow-glow">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Team Size</h3>
          <p className="text-4xl font-black text-fuchsia-400">{activeUser?.partnersCount || 0} <span className="text-sm font-medium text-slate-500 ml-2">(Level 1 only)</span></p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border-slate-900 overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-900 flex justify-between items-center bg-slate-900/20">
          <h2 className="font-bold text-lg">Direct Referral List</h2>
          <span className="px-3 py-1 bg-brand-500/10 text-brand-400 text-xs font-bold rounded-lg border border-brand-500/20">
            {partners.length} Found
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs uppercase bg-slate-900/50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold tracking-widest">Partner ID</th>
                <th className="px-6 py-4 font-bold tracking-widest">Wallet Address</th>
                <th className="px-6 py-4 font-bold tracking-widest">Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center">Loading partners...</td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No partners found yet.</p>
                  </td>
                </tr>
              ) : (
                partners.map((p) => (
                  <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-900/30 transition">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-200 bg-slate-800 px-2.5 py-1 rounded-md">
                        #{p.onChainId}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-brand-400 hover:text-brand-300">
                      <a href={`https://etherscan.io/address/${p.walletAddress}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
                        {p.walletAddress.slice(0, 6)}...{p.walletAddress.slice(-4)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-slate-600" />
                      {new Date(p.registeredAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
