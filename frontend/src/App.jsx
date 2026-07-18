import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useWeb3 } from "./context/Web3Context";
import Login from "./pages/Login";

import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TreeView from "./pages/admin/TreeView";
import CommissionSettings from "./pages/admin/CommissionSettings";

import UserLayout from "./components/UserLayout";
import UserDashboard from "./pages/user/UserDashboard";
import TokenLaunchpad from "./pages/user/TokenLaunchpad";
import TransactionHistory from "./pages/user/TransactionHistory";
import SmartContractView from "./pages/user/SmartContractView";

function AdminRoutes() {
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
        <Route path="/history" element={<TransactionHistory />} />
        <Route path="/contract" element={<SmartContractView />} />
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
