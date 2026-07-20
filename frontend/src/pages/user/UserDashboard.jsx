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
        
        if (tokenAddress && tokenAddress !== ethers.constants.AddressZero) {
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-amber-500/20 pb-4">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-500 pb-2">
            Dashboard Overview
          </h1>
          <p className="text-gray-400 mt-2">Track your revenue and network growth.</p>
        </div>
        <a 
          href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 text-gray-300 hover:text-amber-500 px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(245,158,11,0)] hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center gap-2"
        >
          View Smart Contract <span className="text-lg">↗</span>
        </a>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h2 className="text-gray-400 font-semibold mb-2 uppercase tracking-wider text-sm">Total Revenue</h2>
          <p className="text-4xl font-black text-white group-hover:scale-105 transform origin-left transition-transform duration-500">
            {user?.totalEarnings ? parseFloat(user.totalEarnings).toFixed(4) : "0.0000"} <span className="text-sm text-amber-500/50 font-normal">ETH</span>
          </p>
        </div>
        
        <div className="group bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-400 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h2 className="text-gray-400 font-semibold mb-2 uppercase tracking-wider text-sm">OXI Tokens</h2>
          <p className="text-4xl font-black text-white group-hover:scale-105 transform origin-left transition-transform duration-500">
            {parseFloat(oxiBalance).toFixed(2)} <span className="text-sm text-orange-500/50 font-normal">OXI</span>
          </p>
        </div>

        <div className="group bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-yellow-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h2 className="text-gray-400 font-semibold mb-2 uppercase tracking-wider text-sm">Direct Partners</h2>
          <p className="text-4xl font-black text-white group-hover:scale-105 transform origin-left transition-transform duration-500">
            {user?.partnersCount || 0}
          </p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
        <h2 className="text-2xl font-bold mb-4 text-white">Your Referral Link</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            readOnly 
            value={referralLink} 
            className="flex-1 bg-black/50 border border-white/10 rounded-xl p-4 text-gray-300 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
          <button 
            onClick={copyLink}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]"
          >
            Copy Link
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-4">Share this link to invite direct partners to the Launchpad and earn multi-level commissions!</p>
      </div>

      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
        <h2 className="text-2xl font-bold mb-6 text-white">Direct Partners List</h2>
        {loading ? (
          <p className="text-amber-500/60 animate-pulse">Loading network data...</p>
        ) : partners.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-gray-400 border-b border-white/5">
                  <th className="p-4 font-semibold">Wallet Address</th>
                  <th className="p-4 font-semibold">Joined Date</th>
                  <th className="p-4 font-semibold text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {partners.map(p => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 font-mono text-sm text-amber-400/80 group-hover:text-amber-400 transition-colors">
                      {p.walletAddress}
                    </td>
                    <td className="p-4 text-gray-400">{new Date(p.registeredAt).toLocaleDateString()}</td>
                    <td className="p-4 text-gray-200 font-mono text-right">
                      {p.totalEarnings ? parseFloat(p.totalEarnings).toFixed(4) : "0.00"} ETH
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-black/30 rounded-xl border border-white/5 border-dashed">
            <p className="text-gray-500">You have no direct partners yet. Start referring!</p>
          </div>
        )}
      </div>
    </div>
  );
}
