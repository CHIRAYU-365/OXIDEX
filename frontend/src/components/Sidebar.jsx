import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { LayoutDashboard, Users, History, LogOut, ExternalLink } from "lucide-react";
import { CONTRACT_ADDRESS } from "../utils/contract";

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { isViewOnly, exitPreviewMode, logout, activeUser } = useWeb3();
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: "Partners", path: "/partners", icon: <Users className="w-5 h-5" /> },
    { name: "History", path: "/history", icon: <History className="w-5 h-5" /> },
  ];

  const handleLogout = () => {
    if (isViewOnly) exitPreviewMode();
    else logout();
  };

  return (
    <>
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-950 border-r border-slate-900 z-50 flex flex-col transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="h-20 flex items-center px-6 border-b border-slate-900">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-fuchsia-500 flex items-center justify-center font-bold text-lg text-white shadow-glow mr-3">
            ⚡
          </div>
          <div>
            <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-fuchsia-400">
              OXIDEX
            </h1>
            <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase block mt-[-2px]">
              ID: {activeUser?.onChainId || "Preview"}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                  isActive 
                    ? "bg-brand-500/10 text-brand-400 border border-brand-500/20" 
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                {item.icon}
                <span className="font-bold text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-900">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 mb-4">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Smart Contract</h4>
            <a 
              href={`https://etherscan.io/address/${CONTRACT_ADDRESS}`} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-between text-xs text-brand-400 hover:text-brand-300 transition"
            >
              <span className="font-mono">{CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-bold text-sm">{isViewOnly ? "Exit Preview" : "Log Out"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
