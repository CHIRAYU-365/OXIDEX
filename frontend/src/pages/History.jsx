import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { History as HistoryIcon, ArrowUpRight, ArrowDownLeft, RefreshCw, Layers } from "lucide-react";

export default function History() {
  const { activeAccount } = useWeb3();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://oxidex-api.onrender.com";

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/users/${activeAccount}/history`);
        const data = await res.json();
        if (data.success) {
          setHistory(data.data);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };

    if (activeAccount) fetchHistory();
  }, [activeAccount, backendUrl]);

  const getEventIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "registration":
      case "upgrade":
        return <ArrowUpRight className="w-5 h-5 text-amber-400" />;
      case "earning":
        return <ArrowDownLeft className="w-5 h-5 text-emerald-400" />;
      case "reinvest":
        return <RefreshCw className="w-5 h-5 text-brand-400" />;
      default:
        return <Layers className="w-5 h-5 text-slate-400" />;
    }
  };

  const getEventColor = (type) => {
    switch (type?.toLowerCase()) {
      case "registration":
      case "upgrade":
        return "bg-amber-500/10 border-amber-500/20 text-amber-300";
      case "earning":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";
      case "reinvest":
        return "bg-brand-500/10 border-brand-500/20 text-brand-300";
      default:
        return "bg-slate-800 border-slate-700 text-slate-300";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-fuchsia-500/20 rounded-xl text-fuchsia-400">
          <HistoryIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100">Activity History</h1>
          <p className="text-sm text-slate-400">Recent transactions and earnings</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <HistoryIcon className="w-12 h-12 mb-4 opacity-20" />
            <p>No activity found yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {history.map((item, idx) => {
              const isEarning = item.recordType === "earning";
              const title = isEarning ? "Earning Received" : item.eventType;
              const programStr = item.program ? item.program.toUpperCase() : "N/A";
              
              return (
                <div key={idx} className="p-5 hover:bg-slate-900/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl border ${getEventColor(title)}`}>
                      {getEventIcon(title)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200">{title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        {item.program && item.level && (
                          <span className="font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                            {programStr} Lvl {item.level}
                          </span>
                        )}
                        <span>{new Date(item.date).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                    <span className={`font-black text-lg ${isEarning ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {isEarning ? "+" : ""}{parseFloat(item.amount).toFixed(3)} ETH
                    </span>
                    <a 
                      href={`https://etherscan.io/tx/${item.txHash}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[10px] font-mono text-brand-400 hover:text-brand-300 mt-1"
                    >
                      {item.txHash.slice(0, 10)}...{item.txHash.slice(-8)}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
