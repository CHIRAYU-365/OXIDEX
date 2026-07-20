import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../utils/contract';

// ERC20 minimum ABI to get balance
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)"
];

export default function UserDashboard() {
  const { account, user } = useWeb3();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [oxiBalance, setOxiBalance] = useState("0.00");

  
  const referralLink = `${window.location.origin}${window.location.pathname}#/?ref=${account}`;

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}/api/users/${account}/partners`);
        const data = await res.json();
        if (data.success) {
          setPartners(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch partners", err);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchOxiBalance = async () => {
      if (!window.ethereum) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const tokenAddress = await contract.launchpadToken();
        
        if (tokenAddress && tokenAddress !== ethers.ZeroAddress) {
          const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
          const bal = await tokenContract.balanceOf(account);
          setOxiBalance(ethers.formatEther(bal));
        }
      } catch (err) {
        console.error("Failed to fetch OXI balance:", err);
      }
    };

    if (account) {
      fetchPartners();
      fetchOxiBalance();
    }
  }, [account]);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    alert('Referral link copied!');
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-blue-500/20 pb-6 mb-10">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-sky-500 pb-2">
            Dashboard Overview
          </h1>
          <p className="text-gray-400 mt-2 text-base">Track your revenue and network growth.</p>
        </div>
        <a 
          href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 text-gray-300 hover:text-blue-400 px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(99,102,241,0)] hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] flex items-center gap-2"
        >
          View Smart Contract <span className="text-lg">↗</span>
        </a>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="group bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.05)] hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-sky-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h2 className="text-gray-400 font-semibold mb-3 uppercase tracking-wider text-sm">Total Revenue</h2>
          <p className="text-4xl font-black text-white group-hover:scale-105 transform origin-left transition-transform duration-500">
            {user?.totalEarnings ? parseFloat(user.totalEarnings).toFixed(4) : "0.0000"} <span className="text-base text-blue-400/50 font-normal">ETH</span>
          </p>
        </div>
        
        <div className="group bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.05)] hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-blue-400 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h2 className="text-gray-400 font-semibold mb-3 uppercase tracking-wider text-sm">OXI Tokens</h2>
          <p className="text-4xl font-black text-white group-hover:scale-105 transform origin-left transition-transform duration-500">
            {parseFloat(oxiBalance).toFixed(2)} <span className="text-base text-sky-400/50 font-normal">OXI</span>
          </p>
        </div>

        <div className="group bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.05)] hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h2 className="text-gray-400 font-semibold mb-3 uppercase tracking-wider text-sm">Direct Partners</h2>
          <p className="text-4xl font-black text-white group-hover:scale-105 transform origin-left transition-transform duration-500">
            {user?.partnersCount || 0}
          </p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.05)]">
        <h2 className="text-2xl font-black mb-6 text-white tracking-tight">Your Referral Link</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            readOnly 
            value={referralLink} 
            className="flex-1 bg-black/50 border border-white/10 rounded-xl p-4 text-base text-gray-300 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
          <button 
            onClick={copyLink}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider py-4 px-8 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] active:scale-95"
          >
            Copy Link
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-5 font-medium">Share this link to invite direct partners to the Launchpad and earn multi-level commissions!</p>
      </div>

      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.05)]">
        <h2 className="text-2xl font-black mb-6 text-white tracking-tight">Direct Partners List</h2>
        {loading ? (
          <p className="text-blue-400/60 animate-pulse text-base">Loading network data...</p>
        ) : partners.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5">
                  <th className="p-5 text-gray-400 font-bold uppercase tracking-wider text-xs border-b border-white/5">Wallet Address</th>
                  <th className="p-5 text-gray-400 font-bold uppercase tracking-wider text-xs border-b border-white/5">Joined Date</th>
                  <th className="p-5 text-gray-400 font-bold uppercase tracking-wider text-xs border-b border-white/5 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {partners.map(p => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-5 font-mono text-sm text-sky-400/80 group-hover:text-sky-400 transition-colors">
                      {p.walletAddress}
                    </td>
                    <td className="p-5 text-gray-400 text-sm">{new Date(p.registeredAt).toLocaleDateString()}</td>
                    <td className="p-5 font-mono text-right font-bold text-sm text-gray-200">
                      {p.revenueGenerated ? parseFloat(p.revenueGenerated).toFixed(4) : "0.0000"} <span className="text-xs text-gray-500 font-normal">ETH</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-black/30 rounded-xl border border-white/5 border-dashed">
            <p className="text-gray-500 text-base">You don't have any direct partners yet. Share your referral link to start building your network!</p>
          </div>
        )}
      </div>
    </div>
  );
}
