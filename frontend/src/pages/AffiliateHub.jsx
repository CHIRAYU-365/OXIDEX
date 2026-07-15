import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { FiCopy, FiCheckCircle, FiUsers, FiTrendingUp } from 'react-icons/fi';

const AffiliateHub = () => {
  const { activeUser, activeAccount } = useWeb3();
  const [copied, setCopied] = useState(false);

  const refLink = `${window.location.origin}/register?ref=${activeUser?.onChainId || activeAccount}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pt-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400 drop-shadow-sm">
          Affiliate Hub
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          Invite friends and build your network. Earn instant ETH rewards directly to your wallet for every successful referral.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stats Panel */}
        <div className="glass-panel p-8 rounded-2xl border border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400">
              <FiUsers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Total Partners</h3>
              <p className="text-3xl font-bold text-white">{activeUser?.partnersCount || 0}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FiTrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Network Earnings</h3>
              <p className="text-3xl font-bold text-white">{activeUser?.totalEarnings || '0.00'} ETH</p>
            </div>
          </div>
        </div>

        {/* Referral Link Panel */}
        <div className="glass-panel p-8 rounded-2xl border border-sky-500/20 flex flex-col justify-center shadow-[0_0_15px_rgba(14,165,233,0.1)]">
          <h2 className="text-xl font-bold text-white mb-4">Your Referral Link</h2>
          <div className="flex items-center space-x-3">
            <div className="flex-1 bg-[#050b14] border border-gray-800 rounded-xl p-4 font-mono text-sm text-sky-300 truncate selection:bg-sky-500/30">
              {refLink}
            </div>
            <button
              onClick={handleCopy}
              className="glow-btn p-4 rounded-xl flex items-center justify-center transition-all min-w-[64px]"
              title="Copy to clipboard"
            >
              {copied ? <FiCheckCircle className="w-5 h-5 text-white" /> : <FiCopy className="w-5 h-5 text-white" />}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Share this link to automatically set yourself as the inviter.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AffiliateHub;
