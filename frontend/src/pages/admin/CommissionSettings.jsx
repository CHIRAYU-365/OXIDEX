import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../utils/contract';

export default function CommissionSettings() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCommissions = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://oxidex-api.onrender.com'}/api/admin/commissions`);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setLevels(data.data.map(d => ({ level: d.level, percentage: d.commissionBps / 100 })));
        } else {
          
          setLevels([
            { level: 1, percentage: 10 },
            { level: 2, percentage: 5 },
            { level: 3, percentage: 3 },
            { level: 4, percentage: 2 },
            { level: 5, percentage: 1 },
          ]);
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
      
      if (!window.ethereum) throw new Error("MetaMask not found. Cannot update smart contract.");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      alert("Please confirm the MetaMask transactions to save these levels on-chain.");
      
      
      for (const l of levels) {
        const bps = Math.floor(l.percentage * 100);
        const tx = await contract.setCommission(l.level, bps);
        await tx.wait();
      }
      
      
      const txMax = await contract.setMaxManualLevels(levels.length);
      await txMax.wait();

      const payload = {
        levels: levels.map(l => ({ level: l.level, commissionBps: Math.floor(l.percentage * 100) }))
      };
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://oxidex-api.onrender.com'}/api/admin/commissions`, {
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
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-500 pb-2">
          Hybrid Commission Settings
        </h1>
        <p className="text-gray-400 mt-2 max-w-3xl">
          Manually configure ETH distribution rates for specific levels. If a user is deeper than your manual configurations, the smart contract will automatically halve the previous level's percentage.
        </p>
      </div>
      
      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(245,158,11,0.05)] max-w-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
        
        <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
          <span className="text-sm font-semibold uppercase tracking-wider text-gray-400">Manually Allocated</span>
          <span className={`text-2xl font-black ${isValid ? 'text-amber-400' : 'text-red-500 bg-red-500/10 px-4 py-1 rounded-full border border-red-500/30'}`}>
            {totalPercentage.toFixed(2)}% <span className="text-lg text-gray-500 font-normal">/ 100%</span>
          </span>
        </div>

        <div className="space-y-4">
          {levels.map((lvl) => (
            <div key={lvl.level} className="flex justify-between items-center group p-3 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/5">
              <span className="text-gray-300 font-semibold uppercase tracking-widest text-sm w-24">Level {lvl.level}</span>
              <div className="flex items-center gap-3 flex-1 justify-end">
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  step="0.1"
                  value={lvl.percentage}
                  onChange={(e) => handleUpdate(lvl.level, e.target.value)}
                  className="w-28 bg-black/50 border border-white/10 rounded-lg p-3 text-white font-mono text-right focus:outline-none focus:border-amber-500/50 transition-colors"
                />
                <span className="text-gray-500 font-bold w-6">%</span>
                <button onClick={() => removeLevel(lvl.level)} className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ))}
          
          <div className="p-4 text-center border border-dashed border-emerald-500/30 rounded-xl bg-emerald-500/5 mt-4">
            <p className="text-emerald-400 text-sm font-bold">Level {levels.length + 1} and beyond are Auto-Generated</p>
            <p className="text-emerald-500/60 text-xs mt-1">(Values will halve dynamically from Level {levels.length})</p>
          </div>
        </div>
        
        <button 
          onClick={addLevel}
          className="w-full mt-6 bg-zinc-800/50 hover:bg-zinc-800 text-amber-500/80 hover:text-amber-400 font-semibold py-4 rounded-xl transition-all text-sm border border-dashed border-amber-500/30 hover:border-amber-500/60 flex items-center justify-center gap-2 uppercase tracking-widest"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Manual Level {levels.length + 1}
        </button>

        <button 
          onClick={saveSettings}
          disabled={loading || !isValid}
          className={`w-full mt-8 font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg ${
            !isValid ? 'bg-red-900/20 text-red-500/50 cursor-not-allowed border border-red-900/50' 
            : loading ? 'bg-zinc-800 text-amber-500/50 cursor-wait border border-zinc-700' 
            : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] border border-amber-500/50'
          }`}
        >
          {loading ? 'Confirming in MetaMask...' : !isValid ? 'Exceeds 100% Limit' : 'Save Changes On-Chain'}
        </button>
      </div>
    </div>
  );
}
