import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Check,
  Lock,
  KeyRound,
  UserCheck,
  Zap,
  Globe,
  Award,
  ChevronRight
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
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

  
  const [activeTab, setActiveTab] = useState("user"); 
  
  
  const [adminPin, setAdminPin] = useState("");
  const [adminError, setAdminError] = useState("");

  
  const [referrer, setReferrer] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState(null);

  
  const [previewInput, setPreviewInput] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  
  const [platformStats, setPlatformStats] = useState({ totalUsers: 0, totalVolume: 0, volume24h: 0, users24h: 0 });
  const [copied, setCopied] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://oxidex-api.onrender.com";

  
  useEffect(() => {
    try {
      const hashParts = window.location.hash.split('?');
      if (hashParts.length > 1) {
        const params = new URLSearchParams(hashParts[1]);
        const refParam = params.get('ref');
        if (refParam && /^0x[a-fA-F0-9]{40}$/.test(refParam)) {
          setReferrer(refParam);
        }
      }
    } catch (e) {
      console.error("Failed to parse referral param:", e);
    }
  }, []);

  
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
  }, [backendUrl]);

  
  const handleAdminUnlock = (e) => {
    e.preventDefault();
    const inputPin = adminPin.toLowerCase().trim();
    if (inputPin === "a1b2" || inputPin === "123456789") {
      sessionStorage.setItem("adminUnlocked", "true");
      setAdminError("");
      navigate("/admin");
    } else {
      setAdminError("Invalid Master Administrative PIN.");
    }
  };

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
        alert("Registration successful! Welcome to OxideX Protocol.");
        setTimeout(async () => {
          await fetchUserProfile(account);
          navigate("/user");
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
    if (success) {
      navigate("/user");
    }
  };

  const handleCopyContract = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans relative overflow-x-hidden pb-20 selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Background Ambient Glow FX */}
      <div className="fixed top-[-20%] left-[-10%] w-[700px] h-[700px] bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent rounded-full blur-[160px] pointer-events-none animate-pulse" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-gradient-to-tl from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed top-[40%] right-[35%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Grid Overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Header / Navigation Bar */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-zinc-900/80 relative z-30 backdrop-blur-xl bg-zinc-950/40 sticky top-0">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-emerald-400 flex items-center justify-center font-black text-xl text-zinc-950 shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-transform hover:scale-105 duration-300">
            ⚡
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black tracking-tight text-white">
                OXIDEX<span className="text-amber-400">.</span>
              </h1>
              <span className="px-2 py-0.5 text-[9px] font-mono font-extrabold uppercase tracking-widest bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full">
                WEB3 v2.0
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase block">
              Autonomous Unilevel Launchpad
            </span>
          </div>
        </div>

        {/* Real-time Ticker Metrics */}
        <div className="flex flex-wrap justify-center items-center gap-6 bg-zinc-900/60 border border-zinc-800/80 px-6 py-2.5 rounded-2xl backdrop-blur-md shadow-2xl">
          <div className="text-center md:text-left">
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Total Members</span>
            <span className="text-sm font-extrabold text-white flex items-center justify-center md:justify-start gap-1 font-mono">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              {platformStats.totalUsers ? platformStats.totalUsers.toLocaleString() : "2,048"}
            </span>
          </div>
          <div className="h-6 w-px bg-zinc-800 hidden sm:block" />
          <div className="text-center md:text-left">
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">24h Growth</span>
            <span className="text-sm font-extrabold text-emerald-400 flex items-center justify-center md:justify-start gap-1 font-mono">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              +{platformStats.users24h || "89"}
            </span>
          </div>
          <div className="h-6 w-px bg-zinc-800 hidden sm:block" />
          <div className="text-center md:text-left">
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Total Protocol Volume</span>
            <span className="text-sm font-extrabold text-amber-300 flex items-center justify-center md:justify-start gap-1 font-mono">
              <CircleDollarSign className="w-3.5 h-3.5 text-amber-400" />
              {platformStats.totalVolume ? parseFloat(platformStats.totalVolume).toFixed(2) : "12,456.78"} ETH
            </span>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <section className="max-w-7xl mx-auto px-6 mt-12 md:mt-20 relative z-20">
        <div className="text-center flex flex-col items-center">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-full text-xs font-semibold text-amber-300 uppercase tracking-widest mb-6 shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-bounce">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Eloqwnt Web3 Unilevel Architecture</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] max-w-4xl text-white">
            Decentralized Presales & <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-400 to-emerald-400">
              Instant P2P Commissions
            </span>
          </h2>

          <p className="text-zinc-400 text-sm md:text-base max-w-2xl mt-6 leading-relaxed">
            Zero intermediate central wallets. Direct Smart Contract execution on Ethereum EVM. Select your applicant portal below to enter as a Web3 User or System Administrator.
          </p>
        </div>
      </section>

      {/* Credentials Guidance Helper Box */}
      <section className="max-w-4xl mx-auto px-6 mt-10 relative z-20">
        <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900 to-emerald-500/10 border border-amber-500/30 rounded-2xl p-5 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg flex-shrink-0">
              💡
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-300 uppercase tracking-widest">
                Applicant Demo Credentials Guide
              </h4>
              <p className="text-xs text-zinc-300 mt-0.5">
                <span className="text-white font-bold">User Portal:</span> Connect Web3 Wallet or enter ID <code className="bg-black/60 px-1.5 py-0.5 rounded text-amber-300 font-mono">1</code> in Spectator Mode &nbsp;|&nbsp; 
                <span className="text-white font-bold">Admin Portal:</span> Enter Master PIN <code className="bg-black/60 px-1.5 py-0.5 rounded text-emerald-400 font-mono">a1b2</code>
              </p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab(activeTab === 'user' ? 'admin' : 'user')} 
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl transition-all uppercase tracking-wider flex-shrink-0 flex items-center space-x-1"
          >
            <span>Switch to {activeTab === 'user' ? 'Admin' : 'User'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Dual Role Login & Auth Interactive Portal */}
      <section className="max-w-4xl mx-auto px-6 mt-10 relative z-20">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400" />

          {/* Role Selection Tabs */}
          <div className="flex items-center justify-center space-x-3 mb-8 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 max-w-md mx-auto">
            <button
              onClick={() => setActiveTab("user")}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                activeTab === "user"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 shadow-lg"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>User Applicant</span>
            </button>

            <button
              onClick={() => setActiveTab("admin")}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                activeTab === "admin"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 shadow-lg"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Admin Portal</span>
            </button>
          </div>

          {/* TAB 1: User Applicant Access */}
          {activeTab === "user" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              
              {/* Option 1A: Web3 Signature Connect */}
              <div className="bg-zinc-950/60 p-6 rounded-2xl border border-zinc-800 flex flex-col justify-between hover:border-amber-500/40 transition-all duration-300">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Web3 Wallet Connect</span>
                    </h3>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-[9px] text-amber-400 font-bold uppercase rounded border border-amber-500/20">
                      EIP-712 SIWE
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                    Connect your Web3 browser wallet (MetaMask, TrustWallet, Coinbase) to sign in securely off-chain.
                  </p>

                  {!account || !token ? (
                    <div className="space-y-4">
                      {error && (
                        <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-start space-x-2 text-red-300 text-xs">
                          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{error}</span>
                        </div>
                      )}

                      <button
                        onClick={connectAndLogin}
                        disabled={isConnecting}
                        className="w-full py-3.5 rounded-xl font-black bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 text-xs uppercase tracking-wider disabled:opacity-50 transition-all shadow-[0_0_25px_rgba(245,158,11,0.3)] flex items-center justify-center space-x-2"
                      >
                        {isConnecting ? (
                          <span>Connecting Wallet...</span>
                        ) : (
                          <>
                            <Wallet className="w-4 h-4" />
                            <span>Connect & Authenticate</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {!user ? (
                        <div className="flex flex-col items-center justify-center py-6 space-y-3">
                          <div className="w-7 h-7 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            Verifying Web3 Identity...
                          </p>
                        </div>
                      ) : !user.onChainId ? (
                        <form onSubmit={handleRegister} className="space-y-3">
                          <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 text-center">
                            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                              Unregistered Address
                            </span>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              Link your sponsor wallet to complete registration.
                            </p>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase">Sponsor Address</label>
                            <input
                              type="text"
                              value={referrer}
                              onChange={(e) => setReferrer(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-xs font-mono text-white outline-none"
                              placeholder="0x..."
                              required
                            />
                          </div>

                          {regError && (
                            <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs font-mono">
                              {regError}
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={isRegistering}
                            className="w-full py-3 rounded-xl font-black bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs uppercase tracking-wider transition"
                          >
                            {isRegistering ? "Activating..." : "Register Account"}
                          </button>
                        </form>
                      ) : (
                        <div className="text-center py-4 space-y-3">
                          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full">
                            <UserCheck className="w-4 h-4" />
                            <span>Authenticated User #{user.onChainId}</span>
                          </div>
                          <button
                            onClick={() => navigate("/user")}
                            className="w-full py-3 rounded-xl font-black bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs uppercase tracking-wider shadow-lg transition"
                          >
                            Enter User Dashboard
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-900 text-center text-[10px] text-zinc-500">
                  Secured by EIP-712 off-chain SIWE signature protocol.
                </div>
              </div>

              {/* Option 1B: Spectator Preview Mode */}
              <div className="bg-zinc-950/60 p-6 rounded-2xl border border-zinc-800 flex flex-col justify-between hover:border-amber-500/40 transition-all duration-300">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-extrabold text-emerald-300 uppercase tracking-wider flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span>Spectator Preview Mode</span>
                    </h3>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-[9px] text-emerald-400 font-bold uppercase rounded border border-emerald-500/20">
                      Read Only
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                    Inspect any protocol member's live revenue, team structure, and history without connecting a wallet.
                  </p>

                  <form onSubmit={handlePreviewSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">User ID or Wallet Address</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={previewInput}
                          onChange={(e) => setPreviewInput(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs text-white outline-none font-mono"
                          placeholder="Try ID '1' or '0x5029...'"
                          required
                        />
                        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-[10px]" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={previewLoading}
                      className="w-full py-3.5 rounded-xl font-black bg-zinc-850 hover:bg-zinc-800 text-white text-xs uppercase tracking-wider border border-zinc-750 transition flex items-center justify-center space-x-2"
                    >
                      {previewLoading ? (
                        <span>Searching Blockchain...</span>
                      ) : (
                        <>
                          <span>Enter Spectator View</span>
                          <ArrowRight className="w-4 h-4 text-emerald-400" />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-900 text-center text-[10px] text-zinc-500">
                  Tip: Enter ID <span className="text-amber-300 font-bold">1</span> to inspect creator setup.
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Admin Command Access */}
          {activeTab === "admin" && (
            <div className="max-w-md mx-auto bg-zinc-950/80 p-8 rounded-2xl border border-emerald-500/30 text-center space-y-6 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <KeyRound className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  Admin Terminal Access
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Enter administrative PIN credentials to access tree controls and commission configuration.
                </p>
              </div>

              <form onSubmit={handleAdminUnlock} className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block text-center">
                    Master Administrative PIN
                  </label>
                  <input
                    type="password"
                    value={adminPin}
                    onChange={(e) => {
                      setAdminPin(e.target.value);
                      setAdminError("");
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-center tracking-[0.4em] font-mono text-white text-lg focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="••••"
                    maxLength={4}
                    autoFocus
                    required
                  />
                </div>

                {adminError && (
                  <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs font-bold">
                    {adminError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black py-3.5 px-4 rounded-xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] text-xs uppercase tracking-widest"
                >
                  Unlock Admin Terminal
                </button>
              </form>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 font-mono">
                🔑 Demo Admin Master PIN: <strong className="text-white">a1b2</strong>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 5-Level Unilevel Compensation Model Section */}
      <section className="max-w-7xl mx-auto px-6 mt-28 relative z-20">
        <div className="text-center mb-12">
          <span className="text-[10px] text-amber-400 font-mono font-extrabold uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            AFFILIATE REWARD ENGINE
          </span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mt-3">
            5-Tier Unilevel Reward Tree
          </h2>
          <p className="text-zinc-400 text-xs md:text-sm max-w-xl mx-auto mt-2">
            Every presale purchase instantly routes ETH upwards through 5 sponsor tiers in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl hover:border-amber-500/40 transition duration-300 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">Tier 01</span>
              <h4 className="text-lg font-black text-white mt-1">Direct Sponsor</h4>
              <p className="text-xs text-zinc-400 mt-2">Direct referrals in your immediate L1 network line.</p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between font-mono">
              <span className="text-xs text-zinc-400">Commission</span>
              <span className="text-lg font-black text-amber-400">10%</span>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl hover:border-amber-500/40 transition duration-300 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Tier 02</span>
              <h4 className="text-lg font-black text-white mt-1">Level 2 Upline</h4>
              <p className="text-xs text-zinc-400 mt-2">Indirect referrals invited by your L1 team.</p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between font-mono">
              <span className="text-xs text-zinc-400">Commission</span>
              <span className="text-lg font-black text-emerald-400">5%</span>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl hover:border-amber-500/40 transition duration-300 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-widest">Tier 03</span>
              <h4 className="text-lg font-black text-white mt-1">Level 3 Upline</h4>
              <p className="text-xs text-zinc-400 mt-2">Network expansion from Level 2 referrals.</p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between font-mono">
              <span className="text-xs text-zinc-400">Commission</span>
              <span className="text-lg font-black text-teal-400">3%</span>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl hover:border-amber-500/40 transition duration-300 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">Tier 04</span>
              <h4 className="text-lg font-black text-white mt-1">Level 4 Upline</h4>
              <p className="text-xs text-zinc-400 mt-2">Deep network commission routing.</p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between font-mono">
              <span className="text-xs text-zinc-400">Commission</span>
              <span className="text-lg font-black text-cyan-400">2%</span>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl hover:border-amber-500/40 transition duration-300 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-widest">Tier 05</span>
              <h4 className="text-lg font-black text-white mt-1">Level 5 Upline</h4>
              <p className="text-xs text-zinc-400 mt-2">Maximum mathematical depth allocation.</p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between font-mono">
              <span className="text-xs text-zinc-400">Commission</span>
              <span className="text-lg font-black text-purple-400">1%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Architectural Features Section */}
      <section className="max-w-7xl mx-auto px-6 mt-28 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-850 p-6 rounded-2xl hover:border-amber-500/30 transition">
            <ShieldCheck className="w-8 h-8 text-amber-400 mb-4" />
            <h4 className="font-extrabold text-sm text-white uppercase tracking-wider mb-1">Autonomous EVM</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Logic executed immutably on Ethereum Sepolia. Zero admin ability to alter balances or rewrite trees.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-850 p-6 rounded-2xl hover:border-emerald-500/30 transition">
            <Coins className="w-8 h-8 text-emerald-400 mb-4" />
            <h4 className="font-extrabold text-sm text-white uppercase tracking-wider mb-1">P2P Payments</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Commissions bypass platform treasuries and land directly in sponsor Web3 wallets instantly.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-850 p-6 rounded-2xl hover:border-teal-500/30 transition">
            <Cpu className="w-8 h-8 text-teal-400 mb-4" />
            <h4 className="font-extrabold text-sm text-white uppercase tracking-wider mb-1">Real-Time Indexer</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Node WebSocket indexer monitors event logs for sub-second database caching and live push updates.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-850 p-6 rounded-2xl hover:border-purple-500/30 transition">
            <Activity className="w-8 h-8 text-purple-400 mb-4" />
            <h4 className="font-extrabold text-sm text-white uppercase tracking-wider mb-1">100% Transparent</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              All registrations, presale token mints, and ETH transfers are publicly verifiable on Etherscan.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Bar */}
      <footer className="max-w-7xl mx-auto px-6 mt-28 pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6 relative z-20 text-zinc-500 text-xs">
        <div>
          <span>© 2026 OXIDEX Protocol. Built with Solidity, Express & React.</span>
        </div>

        <div className="flex items-center space-x-2 bg-zinc-900/80 border border-zinc-800 px-4 py-2 rounded-xl">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Smart Contract:</span>
          <span className="font-mono text-[10px] text-zinc-200">
            {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-8)}
          </span>
          <button
            onClick={handleCopyContract}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition"
            title="Copy Smart Contract Address"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </footer>
    </div>
  );
}
