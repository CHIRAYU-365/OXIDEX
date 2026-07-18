import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../utils/contract';

export default function CommissionSettings() {
  const [levels, setLevels] = useState([
    { level: 1, percentage: 10 },
    { level: 2, percentage: 5 },
    { level: 3, percentage: 3 },
    { level: 4, percentage: 2 },
    { level: 5, percentage: 1 },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCommissions = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}/api/admin/commissions`);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setLevels(data.data.map(d => ({ level: d.level, percentage: d.commissionBps / 100 })));
        }
      } catch (err) {
        console.error("Failed to fetch commissions", err);
      }
    };
    fetchCommissions();
  }, []);

  const handleUpdate = (level, val) => {
    setLevels(levels.map(l => l.level === level ? { ...l, percentage: parseFloat(val) || 0 } : l));
  };

  const addLevel = () => {
    if (levels.length >= 6) {
      alert("Maximum of 6 levels allowed by smart contract default.");
      return;
    }
    setLevels([...levels, { level: levels.length + 1, percentage: 0 }]);
  };

  const removeLevel = (level) => {
    setLevels(levels.filter(l => l.level !== level));
  };

  const totalPercentage = levels.reduce((acc, l) => acc + (l.percentage || 0), 0);
  const isValid = totalPercentage <= 100;

  const saveSettings = async () => {
    if (!isValid) {
      alert("Total commission cannot exceed 100%");
      return;
    }

    try {
      setLoading(true);
      
      // 1. Update Smart Contract (Web3)
      if (!window.ethereum) throw new Error("MetaMask not found. Cannot update smart contract.");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Save each level to the contract sequentially (user will sign for each, or we do a batch if we updated the contract, but here we do sequentially)
      alert("Please confirm the MetaMask transactions to save these levels on-chain.");
      for (const l of levels) {
        const bps = Math.floor(l.percentage * 100);
        console.log(`Setting level ${l.level} to ${bps} bps on-chain`);
        const tx = await contract.setCommission(l.level, bps);
        await tx.wait();
      }

      // 2. Sync with Backend Database
      const payload = {
        levels: levels.map(l => ({ level: l.level, commissionBps: Math.floor(l.percentage * 100) }))
      };
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}/api/admin/commissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        alert('Commissions successfully synced on-chain and in database!');
      } else {
        alert('Saved on-chain, but failed to sync database.');
      }
    } catch (err) {
      console.error(err);
      alert(`Error saving settings: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Commission Settings</h1>
      <p className="text-gray-400">Define the percentage of ETH distributed to each level in the Unilevel tree. Must be additive and not exceed 100%.</p>
      
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-lg relative">
        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
          <span className="text-lg font-semibold text-white">Total Allocated:</span>
          <span className={`text-xl font-bold ${isValid ? 'text-green-400' : 'text-red-500'}`}>
            {totalPercentage.toFixed(2)}% / 100%
          </span>
        </div>

        {levels.map((lvl) => (
          <div key={lvl.level} className="flex justify-between items-center mb-4">
            <span className="text-gray-300 font-semibold w-24">Level {lvl.level}</span>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <input 
                type="number" 
                min="0"
                max="100"
                step="0.1"
                value={lvl.percentage}
                onChange={(e) => handleUpdate(lvl.level, e.target.value)}
                className="w-24 bg-gray-900 border border-gray-600 rounded p-2 text-white text-right focus:border-blue-500 focus:outline-none"
              />
              <span className="text-gray-400 font-mono w-6">%</span>
              {lvl.level > 5 && (
                <button onClick={() => removeLevel(lvl.level)} className="text-red-400 hover:text-red-300 ml-2 font-bold text-lg">×</button>
              )}
            </div>
          </div>
        ))}
        
        {levels.length < 6 && (
          <button 
            onClick={addLevel}
            className="w-full mt-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2 rounded transition-colors text-sm border border-dashed border-gray-500"
          >
            + Add Level {levels.length + 1}
          </button>
        )}

        <button 
          onClick={saveSettings}
          disabled={loading || !isValid}
          className={`w-full mt-6 font-bold py-3 rounded transition-colors ${
            !isValid ? 'bg-red-900/50 text-red-500 cursor-not-allowed border border-red-800' 
            : loading ? 'bg-blue-800 text-gray-300 cursor-wait' 
            : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {loading ? 'Confirming in MetaMask...' : !isValid ? 'Exceeds 100% Limit' : 'Save Changes to Blockchain'}
        </button>
      </div>
    </div>
  );
}
