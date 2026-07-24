import React, { useState } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useWeb3 } from "./context/Web3Context";
import Login from "./pages/Login";

import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TreeView from "./pages/admin/TreeView";
import CommissionSettings from "./pages/admin/CommissionSettings";

import UserLayout from "./components/UserLayout";
import UserDashboard from "./pages/user/UserDashboard";
import TransactionHistory from "./pages/user/TransactionHistory";
import StakingDashboard from "./pages/user/StakingDashboard";
import MarketAnalytics from "./pages/user/MarketAnalytics";
import FiatOnramp from "./pages/user/FiatOnramp";
import TokenLaunchpad from "./pages/user/TokenLaunchpad";
import NFTGallery from "./pages/user/NFTGallery";

function AdminRoutes() {
  const [isUnlocked, setIsUnlocked] = useState(sessionStorage.getItem("adminUnlocked") === "true");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleUnlock = (e) => {
    e.preventDefault();
    const inputPin = pin.toLowerCase().trim();
    if (inputPin === "a1b2" || inputPin === "123456789") {
      sessionStorage.setItem("adminUnlocked", "true");
      sessionStorage.setItem("adminPin", inputPin);
      setIsUnlocked(true);
    } else {
      setError("Invalid Administrative PIN");
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Admin Access</h2>
          <p className="text-zinc-400 text-sm mb-6">Enter the master PIN to continue.</p>
          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(""); }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-center tracking-[0.3em] font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="••••"
              maxLength={4}
              autoFocus
            />
            {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
            <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black py-3 px-4 rounded-xl transition-all shadow-lg text-xs uppercase tracking-widest">
              Unlock Terminal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/tree" element={<TreeView />} />
        <Route path="/commissions" element={<CommissionSettings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
}

function UserRoutes() {
  return (
    <UserLayout>
      <Routes>
        <Route path="/" element={<UserDashboard />} />
        <Route path="/launchpad" element={<TokenLaunchpad />} />
        <Route path="/staking" element={<StakingDashboard />} />
        <Route path="/market" element={<MarketAnalytics />} />
        <Route path="/buy" element={<FiatOnramp />} />
        <Route path="/history" element={<TransactionHistory />} />
        <Route path="/nft" element={<NFTGallery />} />
        <Route path="*" element={<Navigate to="/user" replace />} />
      </Routes>
    </UserLayout>
  );
}

function MainAppRoutes() {
  const { account, token, isViewOnly } = useWeb3();
  const isAdminUnlocked = sessionStorage.getItem("adminUnlocked") === "true";

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin/*"
        element={isAdminUnlocked ? <AdminRoutes /> : <Login />}
      />
      <Route
        path="/user/*"
        element={isViewOnly || (account && token) ? <UserRoutes /> : <Login />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <MainAppRoutes />
    </Router>
  );
}
