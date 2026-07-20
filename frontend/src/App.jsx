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
        <Route path="*" element={<Navigate to="/user" replace />} />
      </Routes>
    </UserLayout>
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
      <AuthenticatedRoutes />
    </Router>
  );
}
