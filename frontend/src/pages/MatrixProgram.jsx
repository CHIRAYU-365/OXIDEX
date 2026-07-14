import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { ArrowLeft, User, RefreshCw, HelpCircle } from "lucide-react";

export default function MatrixProgram() {
  const { program, level } = useParams();
  const { activeAccount, isViewOnly, activeUser, exitPreviewMode } = useWeb3();
  const [matrixData, setMatrixData] = useState(null);
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://oxidex-api.onrender.com";

  const fetchMatrixState = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/matrix/${activeAccount}/${program}/${level}`);
      const result = await res.json();
      if (result.success) {
        setMatrixData(result.data);
      }
    } catch (err) {
      console.error("Error fetching matrix state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeAccount) {
      fetchMatrixState();
    }
  }, [activeAccount, program, level]);

  const shortAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 5)}...${addr.slice(-3)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading matrix state...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/"
          className="flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800 hover:border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="text-right">
          <h1 className="text-2xl font-extrabold uppercase tracking-widest text-brand-400">
            {program.toUpperCase()} — Level {level}
          </h1>
          <span className="text-xs text-slate-500 font-bold uppercase block">
            Structure View
          </span>
        </div>
      </div>
        <div className="glass-panel p-6 rounded-2xl border-slate-900 flex justify-between items-center mb-12 shadow-glow">
          <div>
            <span className="text-xs text-slate-450 font-bold block uppercase tracking-wider">Current Upline</span>
            <span className="text-sm font-mono text-slate-300 font-bold">
              {matrixData?.currentReferrer
                ? shortAddress(matrixData.currentReferrer)
                : "Contract Owner (No Upline)"}
            </span>
          </div>
          <div className="flex items-center space-x-2 bg-brand-500/10 border border-brand-500/20 px-4 py-2 rounded-xl">
            <RefreshCw className="w-4 h-4 text-brand-400 animate-spin-slow" />
            <span className="text-xs text-brand-300 font-black">
              {matrixData?.reinvestCount || 0} Reinvests
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex flex-col items-center relative z-10 mb-16">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-600 to-fuchsia-600 flex items-center justify-center shadow-glow border-2 border-brand-400">
              <User className="w-8 h-8 text-white" />
            </div>
            <span className="mt-2 text-xs font-bold bg-slate-900 px-3.5 py-1 rounded-full border border-slate-800 text-slate-300 uppercase tracking-wide">
              {isViewOnly ? `User #${activeUser?.onChainId}` : "You (Owner)"}
            </span>
            <div className="absolute top-20 w-0.5 h-16 bg-slate-800 -z-10" />
          </div>

          {program === "x3" ? (
            <div className="flex justify-center space-x-12 w-full max-w-lg">
              {Array.from({ length: 3 }).map((_, idx) => {
                const partner = matrixData?.referrals?.[idx];
                return (
                  <div key={idx} className="flex flex-col items-center relative">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition duration-300 border-2 ${
                        partner
                          ? "bg-brand-500/20 border-brand-500 text-brand-300 shadow-glow animate-pulse"
                          : "border-dashed border-slate-700 bg-slate-950 text-slate-600"
                      }`}
                    >
                      <User className="w-6 h-6" />
                    </div>
                    <span className="mt-2 text-[10px] font-mono font-semibold text-slate-400">
                      {partner ? shortAddress(partner) : `Slot ${idx + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full space-y-16">
              <div className="flex justify-center space-x-32 w-full">
                {Array.from({ length: 2 }).map((_, idx) => {
                  const partner = matrixData?.firstLevel?.[idx];
                  return (
                    <div key={idx} className="flex flex-col items-center relative font-sans">
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition duration-300 ${
                          partner
                            ? "bg-brand-500/20 border-brand-500 text-brand-300 shadow-glow"
                            : "border-dashed border-slate-700 bg-slate-950 text-slate-600"
                        }`}
                      >
                        <User className="w-6 h-6" />
                      </div>
                      <span className="mt-2 text-[10px] font-mono font-semibold text-slate-400">
                        {partner ? shortAddress(partner) : `F-${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center space-x-8 w-full max-w-2xl mx-auto">
                {Array.from({ length: 4 }).map((_, idx) => {
                  const partner = matrixData?.secondLevel?.[idx];
                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition duration-300 ${
                          partner
                            ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-glow-gold"
                            : "border-dashed border-slate-700 bg-slate-950 text-slate-600"
                        }`}
                      >
                        <User className="w-5 h-5" />
                      </div>
                      <span className="mt-2 text-[9px] font-mono font-semibold text-slate-400">
                        {partner ? shortAddress(partner) : `S-${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
