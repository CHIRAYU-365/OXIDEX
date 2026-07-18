import React, { useEffect, useState } from 'react';

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
    // Try to fetch from backend
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

  const saveSettings = async () => {
    try {
      setLoading(true);
      const payload = {
        levels: levels.map(l => ({ level: l.level, commissionBps: parseInt(l.percentage * 100) }))
      };
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}/api/admin/commissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert('Commissions updated successfully!');
      } else {
        alert('Failed to update commissions.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Commission Settings</h1>
      <p className="text-gray-400">Define the percentage of tokens/ETH distributed to each level in the Unilevel tree.</p>
      
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-lg">
        {levels.map((lvl) => (
          <div key={lvl.level} className="flex justify-between items-center mb-4">
            <span className="text-gray-300 font-semibold">Level {lvl.level}</span>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={lvl.percentage}
                onChange={(e) => handleUpdate(lvl.level, e.target.value)}
                className="w-20 bg-gray-900 border border-gray-600 rounded p-2 text-white text-right focus:border-blue-500 focus:outline-none"
              />
              <span className="text-gray-400">%</span>
            </div>
          </div>
        ))}
        
        <button 
          onClick={saveSettings}
          disabled={loading}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition-colors"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
