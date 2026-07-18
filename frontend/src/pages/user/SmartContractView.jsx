import React from 'react';

export default function SmartContractView() {
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "0x98A6F0671Bf68f36A1ee414D2A043b228a79df8C";
  
  const contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OxideXBase {
    // Unilevel MLM & Launchpad Logic
    mapping(address => address) public referrers;
    mapping(uint8 => uint256) public levelCommissions;
    
    // Transparent distribution logic
    function distributeCommission(address user, uint256 amount) internal {
        address currentReferrer = referrers[user];
        for (uint8 i = 1; i <= 6; i++) {
            if (currentReferrer == address(0)) break;
            
            uint256 percentage = levelCommissions[i];
            if (percentage > 0) {
                uint256 payout = (amount * percentage) / 10000;
                payable(currentReferrer).transfer(payout);
            }
            currentReferrer = referrers[currentReferrer];
        }
    }
    
    // ... rest of contract
}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-500 pb-2">
            Smart Contract
          </h1>
          <p className="text-gray-400 mt-2">100% transparent and immutable blockchain logic.</p>
        </div>
        <a 
          href={`https://sepolia.etherscan.io/address/${contractAddress}`}
          target="_blank"
          rel="noreferrer"
          className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/30 hover:border-amber-400/60 font-semibold py-3 px-6 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all flex items-center gap-2 whitespace-nowrap"
        >
          View on Explorer
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
      </div>

      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
        <div className="mb-8">
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3">Deployed Contract Address</p>
          <div className="flex items-center bg-black/50 p-4 rounded-xl border border-white/5 shadow-inner">
            <p className="font-mono text-amber-400 select-all text-sm md:text-base break-all">
              {contractAddress}
            </p>
          </div>
        </div>
        
        <div>
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3">Verified Contract Source Code</p>
          <div className="bg-black/80 rounded-xl p-6 overflow-x-auto border border-white/10 shadow-inner relative group">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50 group-hover:bg-amber-400 transition-colors"></div>
            <pre className="text-sm font-mono text-gray-300 leading-relaxed">
              <code>{contractCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
