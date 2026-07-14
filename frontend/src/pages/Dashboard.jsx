import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { Link } from "react-router-dom";
import {
  Wallet,
  Users,
  CircleDollarSign,
  TrendingUp,
  LogOut,
  Bell,
  Lock,
  Unlock,
  Layers,
  ArrowRight,
  TrendingDown,
  ChevronRight,
  HelpCircle,
} from "lucide-react";

export default function Dashboard() {
  const { 
    account, 
    activeAccount,
    activeUser,
    isViewOnly,
    exitPreviewMode,
    socket, 
    logout, 
    executeBuyNewLevel, 
    fetchUserProfile 
  } = useWeb3();

  const [platformStats, setPlatformStats] = useState({ totalUsers: 0, totalVolume: 0, volume24h: 0, users24h: 0 });
  const [liveFeed, setLiveFeed] = useState([]);
  const [buyingStatus, setBuyingStatus] = useState({});

  const backendUrl = "http://localhost:5000";

  const fetchStats = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/platform/stats`);
      const result = await res.json();
      if (result.success) setPlatformStats(result.data);
    } catch (err) {
      console.error(err);
    }
  };

  const reloadDataConcurrently = async () => {
    try {
      await Promise.all([fetchStats(), fetchUserProfile()]);
    } catch (err) {
      console.error("Concurrent data load failed:", err);
    }
  };

  useEffect(() => {
    reloadDataConcurrently();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [activeAccount]);

  useEffect(() => {
    if (socket) {
      socket.on("ws:event", (eventData) => {
        setLiveFeed((prev) => [eventData, ...prev.slice(0, 15)]);
        reloadDataConcurrently();
      });

      if (account) {
        socket.on(`ws:earning:${account}`, (earning) => {
          alert(`🎉 You just earned ${earning.amount} ETH in ${earning.program.toUpperCase()} Level ${earning.level}!`);
          reloadDataConcurrently();
        });
      }

      return () => {
        socket.off("ws:event");
        if (account) {
          socket.off(`ws:earning:${account}`);
        }
      };
    }
  }, [socket, account]);

  const handleBuy = async (matrix, level) => {
    if (isViewOnly) return;
    const key = `${matrix}-${level}`;
    setBuyingStatus((prev) => ({ ...prev, [key]: true }));
    try {
      await executeBuyNewLevel(matrix, level);
      alert(`Level ${level} in ${matrix === 1 ? "x3" : "x4"} activated successfully!`);
      setTimeout(fetchUserProfile, 5000);
    } catch (err) {
      console.error(err);
      alert(err.message || "Upgrade transaction failed.");
    } finally {
      setBuyingStatus((prev) => ({ ...prev, [key]: false }));
    }
  };

  const calculateCost = (level) => {
    return 0.025 * Math.pow(2, level - 1);
  };

  return (
    <div className="space-y-8">
      {activeUser?.onChainId && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-glow">
          <div>
            <h2 className="text-lg font-extrabold text-slate-100">Personal Affiliate Link</h2>
            <p className="text-sm text-slate-400">Share this link to grow your team</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl">
            <span className="text-xs font-mono text-brand-400 truncate max-w-[200px] sm:max-w-xs">
              {window.location.origin}/?ref={activeUser.onChainId}
            </span>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/?ref=${activeUser.onChainId}`);
                alert("Affiliate link copied to clipboard!");
              }}
              className="p-1.5 bg-brand-500/20 hover:bg-brand-500/30 rounded-lg transition"
              title="Copy Affiliate Link"
            >
              <Layers className="w-4 h-4 text-brand-400" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border-slate-900 shadow-glow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-brand-400" /> Member Stats
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-900/50 p-3.5 rounded-xl border border-slate-900">
                <span className="text-xs text-slate-450">User ID</span>
                <span className="font-bold text-brand-400">#{activeUser?.onChainId || "Unregistered"}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/50 p-3.5 rounded-xl border border-slate-900">
                <span className="text-xs text-slate-455">Total Revenue</span>
                <span className="font-extrabold text-emerald-400">
                  {activeUser?.totalEarnings?.toFixed(3) || "0.000"} ETH
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/50 p-3.5 rounded-xl border border-slate-900">
                <span className="text-xs text-slate-450">Referred Partners</span>
                <span className="font-bold text-slate-200">{activeUser?.partnersCount || 0}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-slate-900">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" /> Platform Stats
            </h2>
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-slate-400">Total Participants</span>
                <span className="font-bold text-slate-200">{platformStats.totalUsers}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-slate-400">Total Volume</span>
                <span className="font-bold text-slate-200">
                  {parseFloat(platformStats.totalVolume).toFixed(2)} ETH
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-slate-400">Joined in 24h</span>
                <span className="font-bold text-emerald-400">+{platformStats.users24h}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">24h Transactions Vol</span>
                <span className="font-bold text-brand-400">
                  {parseFloat(platformStats.volume24h).toFixed(2)} ETH
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-slate-900 h-80 flex flex-col">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Bell className="w-4 h-4 text-brand-450 animate-pulse" />
              <span>Live Updates Feed</span>
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-[11px]">
              {liveFeed.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600 font-medium">
                  Waiting for blockchain events...
                </div>
              ) : (
                liveFeed.map((evt, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-900/40 border border-slate-900 rounded-lg flex flex-col space-y-1"
                  >
                    <div className="flex justify-between font-bold">
                      <span className="text-brand-400 capitalize">{evt.type}</span>
                      <span className="text-slate-500 font-mono text-[9px]">
                        {new Date(evt.data.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {evt.type === "registration" && (
                      <span className="text-slate-350">
                        User #{evt.data.userId} registered under #{evt.data.referrerId}
                      </span>
                    )}
                    {evt.type === "upgrade" && (
                      <span className="text-slate-350">
                        User activated {evt.data.program.toUpperCase()} Level {evt.data.level}
                      </span>
                    )}
                    {evt.type === "reinvest" && (
                      <span className="text-slate-350">
                        User reinvested {evt.data.program.toUpperCase()} Level {evt.data.level}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-10">
          <div>
            <div className="flex items-center space-x-2.5 mb-6">
              <Layers className="w-5 h-5 text-brand-400" />
              <h2 className="text-xl font-extrabold tracking-tight text-brand-300">
                x3 Matrix Program Levels
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 12 }, (_, i) => {
                const lvl = i + 1;
                const cost = calculateCost(lvl);
                const isActive = activeUser?.activeLevelsX3?.includes(lvl);
                const isBuyable = activeUser?.activeLevelsX3?.includes(lvl - 1) && !isActive;

                return (
                  <div
                    key={`x3-${lvl}`}
                    className={`glass-panel p-5 rounded-2xl flex flex-col justify-between border-slate-900 text-center relative transition duration-300 ${
                      isActive ? "border-brand-500/20 bg-brand-950/5 shadow-glow" : "hover:border-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lvl {lvl}</span>
                      {isActive ? (
                        <Unlock className="w-3.5 h-3.5 text-brand-400" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-700" />
                      )}
                    </div>
                    <div className="my-3">
                      <span className="text-xl font-black block text-slate-100">{cost.toFixed(3)}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">ETH</span>
                    </div>

                    <div className="flex justify-center space-x-1.5 my-3">
                      {[0, 1, 2].map(slotIdx => {
                        return (
                          <div 
                            key={slotIdx} 
                            className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-slate-800 border border-slate-700' : 'bg-slate-900 opacity-50'}`}
                          />
                        );
                      })}
                    </div>

                    {isActive ? (
                      <Link
                        to={`/matrix/x3/${lvl}`}
                        className="mt-3 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-brand-400 hover:text-brand-300 transition flex items-center justify-center gap-1 group"
                      >
                        <span>View Structure</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ) : isBuyable ? (
                      <button
                        onClick={() => handleBuy(1, lvl)}
                        disabled={isViewOnly || buyingStatus[`1-${lvl}`]}
                        className={`mt-3 py-2 px-3 rounded-xl text-[10px] font-bold shadow-glow transition ${
                          isViewOnly 
                            ? "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed"
                            : "bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50"
                        }`}
                      >
                        {isViewOnly ? "Locked (Preview)" : buyingStatus[`1-${lvl}`] ? "Purchasing..." : "Unlock"}
                      </button>
                    ) : (
                      <span className="mt-3 py-2 text-[10px] text-slate-700 font-bold uppercase tracking-widest">
                        Locked
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2.5 mb-6">
              <Layers className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-extrabold tracking-tight text-amber-400">
                x4 Matrix Program Levels
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 12 }, (_, i) => {
                const lvl = i + 1;
                const cost = calculateCost(lvl);
                const isActive = activeUser?.activeLevelsX4?.includes(lvl);
                const isBuyable = activeUser?.activeLevelsX4?.includes(lvl - 1) && !isActive;

                return (
                  <div
                    key={`x4-${lvl}`}
                    className={`glass-panel p-5 rounded-2xl flex flex-col justify-between border-slate-900 text-center relative transition duration-300 ${
                      isActive ? "border-amber-500/20 bg-amber-950/5 shadow-glow-gold" : "hover:border-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lvl {lvl}</span>
                      {isActive ? (
                        <Unlock className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-700" />
                      )}
                    </div>
                    <div className="my-3">
                      <span className="text-xl font-black block text-slate-100">{cost.toFixed(3)}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">ETH</span>
                    </div>

                    <div className="flex flex-col items-center space-y-1 my-3">
                      <div className="flex justify-center space-x-2">
                        {[0, 1].map(slotIdx => (
                          <div key={slotIdx} className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-900/40 border border-amber-800' : 'bg-slate-900 opacity-50'}`} />
                        ))}
                      </div>
                      <div className="flex justify-center space-x-1">
                        {[0, 1, 2, 3].map(slotIdx => (
                          <div key={slotIdx} className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-900/40 border border-amber-800' : 'bg-slate-900 opacity-50'}`} />
                        ))}
                      </div>
                    </div>

                    {isActive ? (
                      <Link
                        to={`/matrix/x4/${lvl}`}
                        className="mt-3 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition flex items-center justify-center gap-1 group"
                      >
                        <span>View Structure</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ) : isBuyable ? (
                      <button
                        onClick={() => handleBuy(2, lvl)}
                        disabled={isViewOnly || buyingStatus[`2-${lvl}`]}
                        className={`mt-3 py-2 px-3 rounded-xl text-[10px] font-bold shadow-glow-gold transition ${
                          isViewOnly 
                            ? "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed"
                            : "bg-amber-500 hover:bg-amber-600 text-slate-950 disabled:opacity-50"
                        }`}
                      >
                        {isViewOnly ? "Locked (Preview)" : buyingStatus[`2-${lvl}`] ? "Purchasing..." : "Unlock"}
                      </button>
                    ) : (
                      <span className="mt-3 py-2 text-[10px] text-slate-700 font-bold uppercase tracking-widest">
                        Locked
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
