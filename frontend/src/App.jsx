import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useWeb3 } from "./context/Web3Context";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MatrixProgram from "./pages/MatrixProgram";
import Layout from "./components/Layout";
import Partners from "./pages/Partners";
import History from "./pages/History";
import AffiliateHub from "./pages/AffiliateHub";
import Leaderboard from "./pages/Leaderboard";
import FiatOnRamp from "./pages/FiatOnRamp";

function AuthenticatedRoutes() {
  const { account, token, user, isViewOnly } = useWeb3();

  if (!isViewOnly) {
    if (!account || !token) {
      return <Login />;
    }

    // Verify if the user is sponsored (registered on-chain)
    if (!user || !user.onChainId) {
      return <Login />;
    }
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/history" element={<History />} />
        <Route path="/matrix/:program/:level" element={<MatrixProgram />} />
        <Route path="/affiliate" element={<AffiliateHub />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/buy-crypto" element={<FiatOnRamp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <Router>
      <AuthenticatedRoutes />
    </Router>
  );
}
