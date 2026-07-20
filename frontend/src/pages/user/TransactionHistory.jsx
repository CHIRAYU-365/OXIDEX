import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../../context/Web3Context';

export default function TransactionHistory() {
  const { account } = useWeb3();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}/api/users/${account}/history`);
        const data = await res.json();
        if (data.success) {
          setHistory(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };
    if (account) fetchHistory();
  }, [account]);

  const downloadPDF = () => {
    window.open(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}/api/users/${account}/statement/pdf`, '_blank');
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-blue-500/20 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-sky-500 pb-2">
            History & Statements
          </h1>
          <p className="text-gray-400 mt-2">View all your transactions, token purchases, and commission payouts.</p>
        </div>
        <button 
          onClick={downloadPDF}
          className="bg-zinc-800 hover:bg-zinc-700 text-blue-400 border border-blue-500/30 hover:border-blue-400/60 font-semibold py-3 px-6 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all flex items-center gap-3 whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF Statement
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
        {loading ? (
          <p className="text-blue-500/60 animate-pulse text-center py-10">Loading history data...</p>
        ) : history.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-gray-400 border-b border-white/5 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold text-right">Amount</th>
                  <th className="p-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((record, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-gray-400 whitespace-nowrap">{new Date(record.date).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        record.recordType === 'earning' 
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                        : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      }`}>
                        {record.recordType.toUpperCase()}
                      </span>
                    </td>
                    <td className={`p-4 font-mono text-right whitespace-nowrap font-medium ${record.recordType === 'earning' ? 'text-blue-400' : 'text-gray-300'}`}>
                      {record.recordType === 'earning' ? `+${record.amount} ETH` : `${record.amount || record.tokensAmount || '-'} ETH`}
                    </td>
                    <td className="p-4 text-sm text-gray-400 font-mono truncate max-w-xs md:max-w-md">
                      {record.recordType === 'earning' ? `From: ${record.fromAddress} (Lvl ${record.level})` : `Tx: ${record.txHash}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-black/30 rounded-xl border border-white/5 border-dashed">
            <p className="text-gray-500">No transactions found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
