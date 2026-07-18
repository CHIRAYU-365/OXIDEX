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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-white">History & Statements</h1>
        <button 
          onClick={downloadPDF}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded shadow flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download PDF Statement
        </button>
      </div>

      <div className="bg-[#13131a] p-6 rounded-xl border border-gray-800 shadow-xl">
        {loading ? (
          <p className="text-gray-400">Loading history...</p>
        ) : history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record, i) => (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                    <td className="p-3 text-gray-300">{new Date(record.date).toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${record.recordType === 'earning' ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'}`}>
                        {record.recordType.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-white">
                      {record.recordType === 'earning' ? `+${record.amount} ETH` : `${record.amount || record.tokensAmount || '-'} ETH`}
                    </td>
                    <td className="p-3 text-sm text-gray-400 font-mono truncate max-w-xs">
                      {record.recordType === 'earning' ? `From: ${record.fromAddress} (Lvl ${record.level})` : `Tx: ${record.txHash}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">No transactions found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
