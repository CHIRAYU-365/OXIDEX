import React, { useState, useEffect, Suspense, lazy } from "react";
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useWeb3 } from "./context/Web3Context";
import Login from "./pages/Login";

const AdminLayout = lazy(() => import("./components/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const TreeView = lazy(() => import("./pages/admin/TreeView"));
const CommissionSettings = lazy(() => import("./pages/admin/CommissionSettings"));

const UserLayout = lazy(() => import("./components/UserLayout"));
const UserDashboard = lazy(() => import("./pages/user/UserDashboard"));
const TokenLaunchpad = lazy(() => import("./pages/user/TokenLaunchpad"));
const TransactionHistory = lazy(() => import("./pages/user/TransactionHistory"));
const SmartContractView = lazy(() => import("./pages/user/SmartContractView"));
const StakingDashboard = lazy(() => import("./pages/user/StakingDashboard"));
const MarketAnalytics = lazy(() => import("./pages/user/MarketAnalytics"));
const FiatOnramp = lazy(() => import("./pages/user/FiatOnramp"));

function PageTransition({ children }) {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionText, setTransitionText] = useState("Decrypting Cipher...");

  useEffect(() => {
    setIsTransitioning(true);
    
    const path = location.pathname;
    if (path.includes("launchpad")) setTransitionText("Minting Smart Contract...");
    else if (path.includes("contract")) setTransitionText("Establishing Secure Node...");
    else if (path.includes("history")) setTransitionText("Syncing On-Chain Ledger...");
    else if (path.includes("tree")) setTransitionText("Indexing Network Topology...");
    else if (path.includes("market")) setTransitionText("Initializing Trading Engine...");
    else if (path.includes("buy")) setTransitionText("Securing Fiat Gateway...");
    else if (path.includes("admin")) setTransitionText("Verifying Administrative Cryptography...");
    else setTransitionText("Decrypting Wallet Signature...");

    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 5500);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {isTransitioning && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-md">
          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute w-24 h-24 border-4 border-emerald-500/20 rounded-full"></div>
            <div className="absolute w-24 h-24 border-4 border-t-emerald-400 border-r-emerald-400 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <div className="absolute w-16 h-16 border-4 border-brand-500/20 rounded-full"></div>
            <div className="absolute w-16 h-16 border-4 border-b-brand-400 border-l-brand-400 border-t-transparent border-r-transparent rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
            <div className="w-8 h-8 bg-gradient-to-tr from-brand-400 to-emerald-400 rounded-full animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.8)]"></div>
          </div>
          <h2 className="text-lg font-mono text-emerald-400 font-bold uppercase tracking-[0.2em] animate-pulse text-center px-4">
            {transitionText}
          </h2>
          <div className="mt-6 flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}></div>
            ))}
          </div>
        </div>
      )}
      {children}
    </>
  );
}

function AdminRoutes() {
  const [isUnlocked, setIsUnlocked] = useState(sessionStorage.getItem("adminUnlocked") === "true");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleUnlock = (e) => {
    e.preventDefault();
    if (pin.toLowerCase() === "a1b2") {
      sessionStorage.setItem("adminUnlocked", "true");
      setIsUnlocked(true);
    } else {
      setError("Invalid Administrative PIN");
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(245,158,11,0.05)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Admin Access</h2>
          <p className="text-gray-400 text-sm mb-6">Enter the master PIN to continue.</p>
          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(""); }}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-center tracking-[0.3em] font-mono text-white focus:outline-none focus:border-amber-500/50 transition-colors"
              placeholder="••••"
              maxLength={4}
              autoFocus
            />
            {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
            <button type="submit" className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg text-sm uppercase tracking-widest">
              Unlock Terminal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-t-emerald-500 border-r-transparent border-b-emerald-500 border-l-transparent rounded-full animate-spin"></div></div>}>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/tree" element={<TreeView />} />
          <Route path="/commissions" element={<CommissionSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminLayout>
    </Suspense>
  );
}

function UserRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-t-emerald-500 border-r-transparent border-b-emerald-500 border-l-transparent rounded-full animate-spin"></div></div>}>
      <UserLayout>
        <Routes>
          <Route path="/" element={<UserDashboard />} />
          <Route path="/launchpad" element={<TokenLaunchpad />} />
          <Route path="/staking" element={<StakingDashboard />} />
          <Route path="/market" element={<MarketAnalytics />} />
          <Route path="/buy" element={<FiatOnramp />} />
          <Route path="/history" element={<TransactionHistory />} />
          <Route path="/contract" element={<SmartContractView />} />
          <Route path="*" element={<Navigate to="/user" replace />} />
        </Routes>
      </UserLayout>
    </Suspense>
  );
}

function AuthenticatedRoutes() {
  const { account, token, isViewOnly } = useWeb3();

  if (!isViewOnly) {
    if (!account || !token) {
      return <Login />;
    }
  }

  return (
    <Routes>
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/user/*" element={<UserRoutes />} />
      <Route path="*" element={<Navigate to="/user" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <PageTransition>
        <AuthenticatedRoutes />
      </PageTransition>
    </Router>
  );
}
