import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { useWeb3 } from "../context/Web3Context";
import { Wallet, Menu, HelpCircle } from "lucide-react";

export default function Layout({ children }) {
  const { account, activeAccount, activeUser, isViewOnly, exitPreviewMode } = useWeb3();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 bg-grid-pattern relative pb-20">
        {isViewOnly && (
          <div className="bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 px-6 py-2.5 text-center text-xs font-black flex flex-col sm:flex-row items-center justify-center gap-2 relative z-50 shadow-md">
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 flex-shrink-0" />
              VIEW-ONLY PREVIEW MODE: Viewing User #{activeUser?.onChainId || "Unreg"} ({activeAccount.slice(0, 6)}...{activeAccount.slice(-4)}). Activations disabled.
            </span>
            <button 
              onClick={exitPreviewMode}
              className="px-3 py-1 bg-slate-950 text-amber-400 hover:bg-slate-900 rounded-lg text-[10px] font-black uppercase transition border border-amber-500/20"
            >
              Exit Preview
            </button>
          </div>
        )}

        <header className="sticky top-0 z-30 glass-panel border-b border-slate-900 px-6 py-4 flex items-center justify-between lg:justify-end backdrop-blur-md">
          <button 
            className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-4">
            {account ? (
              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold text-slate-350">
                <Wallet className="w-4 h-4 text-brand-400" />
                <span>
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold text-amber-400 font-mono">
                <span>Preview Session</span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
