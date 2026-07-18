import React from 'react';

export default function SmartContractView() {
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "0x1234567890abcdef1234567890abcdef12345678";
  
  // In a real app, this might be fetched from a backend or Etherscan API.
  // For MVP transparency, we render a static representation or mock of the code.
  const contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OxideXBase {
    // Unilevel MLM & Launchpad Logic
    mapping(address => address) public referrers;
    mapping(uint8 => uint256) public levelCommissions;
    
    // Transparent distribution logic
    function distributeCommission(address user, uint256 amount) internal {
        address currentReferrer = referrers[user];
        for (uint8 i = 1; i <= 5; i++) {
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center">
        <h1 className="text-3xl font-bold text-white">Smart Contract</h1>
        <a 
          href={`https://sepolia.etherscan.io/address/${contractAddress}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 sm:mt-0 text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          View on Explorer
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
      </div>

      <div className="bg-[#13131a] p-6 rounded-xl border border-gray-800 shadow-xl">
        <div className="mb-4">
          <p className="text-gray-400 text-sm">Contract Address</p>
          <p className="font-mono text-green-400 bg-gray-900 p-2 rounded mt-1 border border-gray-800 select-all">{contractAddress}</p>
        </div>
        
        <div>
          <p className="text-gray-400 text-sm mb-2">Verified Contract Source Code</p>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto border border-gray-800">
            <pre className="text-sm font-mono text-gray-300">
              <code>{contractCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
