import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { CONTRACT_ADDRESS } from "../utils/contract";
import { 
  Activity, 
  ShieldAlert, 
  Sparkles, 
  HelpCircle, 
  Users, 
  TrendingUp, 
  Wallet, 
  CircleDollarSign, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Coins, 
  ArrowRight, 
  Search, 
  Copy, 
  Check 
} from "lucide-react";

export default function Login() {
  const { 
    account, 
    token, 
    user, 
    connectAndLogin, 
    executeRegistration, 
    isConnecting, 
    error, 
    fetchUserProfile,
    enterPreviewMode 
  } = useWeb3();

  const [referrer, setReferrer] = useState("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState(null);
  
  const [previewInput, setPreviewInput] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const [platformStats, setPlatformStats] = useState({ totalUsers: 0, totalVolume: 0, volume24h: 0, users24h: 0 });
  const [copied, setCopied] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://oxidex-api.onrender.com";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/platform/stats`);
        const result = await res.json();
        if (result.success) {
          setPlatformStats(result.data);
        }
      } catch (err) {
        console.error("Error fetching platform stats:", err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!referrer || !ethAddressRegex.test(referrer.trim())) {
      setRegError("Please enter a valid 40-character Ethereum address (starting with 0x) for your sponsor.");
      return;
    }

    setIsRegistering(true);
    setRegError(null);

    try {
      const success = await executeRegistration(referrer);
      if (success) {
        alert("Registration successful! Welcome to OxideX.");
        setTimeout(async () => {
          await fetchUserProfile(account);
        }, 1000);
      } else {
        throw new Error("Transaction failed or was rejected.");
      }
    } catch (err) {
      console.error(err);
      setRegError(err.message || "Registration failed. Verify your balance and sponsor address.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handlePreviewSubmit = async (e) => {
    e.preventDefault();
    const query = previewInput.trim();
    if (!query) return;

    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    const numberRegex = /^\d+$/;

    if (!ethAddressRegex.test(query) && !numberRegex.test(query)) {
      alert("Please enter a valid user ID (number) or Ethereum wallet address (0x...)");
      return;
    }

    setPreviewLoading(true);
    const success = await enterPreviewMode(query);
    setPreviewLoading(false);
  };

  const handleCopyContract = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-grid-pattern text-slate-100 font-sans relative overflow-x-hidden pb-16 selection:bg-brand-500/30">
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[140px] pointer-events-none animate-float" />
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] bg-fuchsia-500/10 rounded-full blur-[140px] pointer-events-none animate-float-reverse" />
      
      <header className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-900/60 relative z-20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-fuchsia-500 flex items-center justify-center font-bold text-lg text-white shadow-glow animate-pulse">
            ⚡
          </div>
          <div>
            <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-fuchsia-400 to-amber-400 tracking-tight">
              OXIDEX
            </h1>
            <span className="text-[9px] text-slate-500 font-semibold tracking-widest uppercase block mt-[-3px]">
              Decentralized Matrix
            </span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-6 bg-slate-900/40 border border-slate-800/80 px-6 py-3 rounded-2xl backdrop-blur-md">
          <div className="text-center md:text-left">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Members</span>
            <span className="text-md font-extrabold text-slate-100 flex items-center justify-center md:justify-start gap-1">
              <Users className="w-3.5 h-3.5 text-brand-400" />
              {platformStats.totalUsers.toLocaleString()}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-800 hidden sm:block" />
          <div className="text-center md:text-left">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Joined 24h</span>
            <span className="text-md font-extrabold text-emerald-400 flex items-center justify-center md:justify-start gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              +{platformStats.users24h}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-800 hidden sm:block" />
          <div className="text-center md:text-left">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Volume</span>
            <span className="text-md font-extrabold text-amber-400 flex items-center justify-center md:justify-start gap-1">
              <CircleDollarSign className="w-3.5 h-3.5 text-amber-400" />
              {parseFloat(platformStats.totalVolume).toFixed(2)} ETH
            </span>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 mt-16 md:mt-24 relative z-20 text-center flex flex-col items-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full text-xs font-semibold text-brand-400 uppercase tracking-widest mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>100% Autonomous & P2P Smart Contract</span>
        </div>
        <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight max-w-4xl">
          The Future of Decentralized <br className="hidden md:block"/>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-fuchsia-400 to-amber-400">
            Matrix Marketing
          </span>
        </h2>
        <p className="text-slate-400 text-sm md:text-lg max-w-2xl mt-6 leading-relaxed">
          OXIDEX is a community-driven smart contract program deployed on-chain. Built with transparency, automatic spillover mechanics, and zero administrative intervention.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          <div className="glass-panel p-8 rounded-3xl border-slate-900 shadow-glow flex flex-col justify-between h-full min-h-[350px]">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-extrabold tracking-tight text-brand-300">
                  Secure Wallet Access
                </h3>
                <span className="px-2 py-0.5 bg-brand-500/20 text-[10px] text-brand-400 font-bold uppercase rounded border border-brand-500/20">
                  Web3 Connect
                </span>
              </div>

              {!account || !token ? (
                <div className="space-y-5">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    No username, password, or email registration required. Simply link your Web3 wallet and authorize securely using a cryptographic message signature.
                  </p>
                  
                  {error && (
                    <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl flex items-start space-x-2 text-red-300 text-xs">
                      <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    onClick={connectAndLogin}
                    disabled={isConnecting}
                    className="w-full py-4 rounded-xl font-bold glow-btn text-white disabled:opacity-50 flex items-center justify-center space-x-2 text-sm shadow-lg border border-brand-400/20"
                  >
                    {isConnecting ? (
                      <span>Connecting Wallet...</span>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" />
                        <span>Connect Web3 Wallet</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {user && !user.onChainId ? (
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 text-center">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                          Unregistered Address
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Activate Level 1 for both x3 and x4 programs (Total 0.05 ETH cost).
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Sponsor Wallet Address</label>
                        <input
                          type="text"
                          value={referrer}
                          onChange={(e) => setReferrer(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-brand-500 rounded-xl text-xs font-mono text-slate-200 outline-none transition"
                          placeholder="0x..."
                          required
                        />
                      </div>

                      {regError && (
                        <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-red-300 text-xs font-mono">
                          {regError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isRegistering}
                        className="w-full py-3.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 shadow-glow-gold text-slate-950 text-xs transition duration-200 flex items-center justify-center space-x-2 border border-amber-400/30"
                      >
                        {isRegistering ? (
                          <span>Activating Account...</span>
                        ) : (
                          <span>Register & Pay 0.05 ETH</span>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-4 text-center">
                      <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl">
                        <span className="text-emerald-400 text-sm font-semibold flex items-center justify-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" /> Wallet Verified
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">
                          {account.slice(0, 14)}...{account.slice(-12)}
                        </p>
                      </div>
                      <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3.5 rounded-xl font-bold bg-brand-500 hover:bg-brand-600 text-white text-xs transition shadow-glow flex items-center justify-center space-x-2"
                      >
                        <span>Go to Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-900/60 flex items-center justify-center space-x-1.5 text-[9px] text-slate-500">
              <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
              <span>Supports Metamask, TrustWallet, and other Web3 browsers.</span>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-3xl border-slate-900 shadow-glow flex flex-col justify-between h-full min-h-[350px]">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-extrabold tracking-tight text-amber-400">
                  View-Only Preview Mode
                </h3>
                <span className="px-2 py-0.5 bg-amber-500/20 text-[10px] text-amber-400 font-bold uppercase rounded border border-amber-500/20">
                  Read Only
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Inspect any member's current matrix level, total revenue, partners structure, and live transaction statistics. No signature or wallet connection is required to preview accounts.
              </p>

              <form onSubmit={handlePreviewSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase">User ID or Wallet Address</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={previewInput}
                      onChange={(e) => setPreviewInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 bg-slate-950 border border-slate-900 focus:border-amber-500 rounded-xl text-xs text-slate-200 outline-none transition font-mono"
                      placeholder="e.g. 1 or 0x90f7..."
                      required
                    />
                    <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-[15px]" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={previewLoading}
                  className="w-full py-4 rounded-xl font-bold bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs transition border border-slate-800 hover:border-amber-500/20 flex items-center justify-center space-x-2"
                >
                  {previewLoading ? (
                    <span>Searching Blockchain...</span>
                  ) : (
                    <>
                      <span>Enter Preview Mode</span>
                      <ArrowRight className="w-4 h-4 text-amber-400" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-900/60 text-center text-[10px] text-slate-500">
              Enter User ID <span className="text-amber-400 font-bold">1</span> to view the platform creator's master matrix setup.
            </div>
          </div>

        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 mt-28 relative z-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight">
            How OXIDEX Matrices Work
          </h2>
          <p className="text-slate-500 text-xs uppercase tracking-widest mt-2 font-bold">
            Two dynamic spillover programs designed for scaling
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-panel p-8 rounded-3xl border-slate-900 shadow-glow relative overflow-hidden group">
            <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-brand-500/5 rounded-full blur-xl group-hover:bg-brand-500/10 transition-all duration-500" />
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-brand-500/10 rounded-2xl text-brand-400 border border-brand-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-100">
                OXIDEX x3 Matrix
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              A 1-row matrix containing 3 slots. Highly dynamic and suited for active sponsors. The first 2 referrals pay 100% directly to your personal wallet. The 3rd slot automatically reinvests/recycles your position to clear the board, sending the payment to your upline.
            </p>
            <div className="flex items-center justify-center space-x-6 bg-slate-950/60 p-6 rounded-2xl border border-slate-900">
              <div className="w-12 h-12 rounded-full bg-brand-500/20 border-2 border-brand-500 flex items-center justify-center text-[10px] font-bold text-brand-300">
                Lvl 1
              </div>
              <span className="text-slate-700">→</span>
              <div className="flex space-x-3">
                <div className="w-8 h-8 rounded-full bg-brand-500/10 border-2 border-brand-500 flex items-center justify-center text-[8px] font-bold text-brand-300">
                  P1
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-500/10 border-2 border-brand-500 flex items-center justify-center text-[8px] font-bold text-brand-300">
                  P2
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-500">
                  Rec
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-3xl border-slate-900 shadow-glow relative overflow-hidden group">
            <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all duration-500" />
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-100">
                OXIDEX x4 Matrix
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              A 2-row matrix containing 6 slots (2 on row 1, 4 on row 2). Perfect for spillovers and passive network structures. Payments from row 1 pass to your upline. For row 2, the first 3 placements pay 100% directly to you, while the 6th placement recycles your matrix.
            </p>
            <div className="flex items-center justify-center space-x-6 bg-slate-950/60 p-6 rounded-2xl border border-slate-900">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-[10px] font-bold text-amber-300">
                Lvl 1
              </div>
              <span className="text-slate-700">→</span>
              <div className="flex flex-col space-y-2">
                <div className="flex justify-center space-x-4">
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[7px] text-slate-400">
                    F1
                  </div>
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[7px] text-slate-400">
                    F2
                  </div>
                </div>
                <div className="flex justify-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500 flex items-center justify-center text-[7px] text-amber-300">
                    S1
                  </div>
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500 flex items-center justify-center text-[7px] text-amber-300">
                    S2
                  </div>
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500 flex items-center justify-center text-[7px] text-amber-300">
                    S3
                  </div>
                  <div className="w-6 h-6 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-[7px] text-slate-600">
                    Rec
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 mt-28 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl border-slate-900/60 hover:border-brand-500/20 transition-all duration-300">
            <ShieldCheck className="w-8 h-8 text-brand-400 mb-4" />
            <h4 className="font-extrabold text-sm mb-2 uppercase tracking-wide">Autonomous</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Self-executing logic running directly on EVM. Built, sealed, and operational forever with zero administrative capability to pause or rewrite the algorithm.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-slate-900/60 hover:border-brand-500/20 transition-all duration-300">
            <Coins className="w-8 h-8 text-fuchsia-400 mb-4" />
            <h4 className="font-extrabold text-sm mb-2 uppercase tracking-wide">P2P Payments</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              No platform balances or intermediate wallets. All entry fees and level upgrades are automatically routed instantly to upline member wallets peer-to-peer.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-slate-900/60 hover:border-brand-500/20 transition-all duration-300">
            <Cpu className="w-8 h-8 text-amber-400 mb-4" />
            <h4 className="font-extrabold text-sm mb-2 uppercase tracking-wide">Immutable</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Deployments cannot be hacked, altered, or deleted. Your network structures and earnings metrics are permanently baked into public block records.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-slate-900/60 hover:border-brand-500/20 transition-all duration-300">
            <Activity className="w-8 h-8 text-emerald-400 mb-4" />
            <h4 className="font-extrabold text-sm mb-2 uppercase tracking-wide">Transparent</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              All transactions, registration uplines, overflow cycles, and contract operations can be verified independently using standard blockchain explorers.
            </p>
          </div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 mt-28 pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-6 relative z-20 text-slate-500 text-xs">
        <div>
          <span>© 2026 OXIDEX Decentralized Matrix. Operational and Open Source.</span>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-900/40 border border-slate-900 px-4 py-2 rounded-xl backdrop-blur-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Contract:</span>
          <span className="font-mono text-[10px] text-slate-300">
            {CONTRACT_ADDRESS.slice(0, 8)}...{CONTRACT_ADDRESS.slice(-6)}
          </span>
          <button 
            onClick={handleCopyContract} 
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
            title="Copy Smart Contract Address"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </footer>
    </div>
  );
}
