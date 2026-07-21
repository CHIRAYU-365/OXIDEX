import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { Menu, X, LogOut } from 'lucide-react';

export default function UserLayout({ children }) {
  const location = useLocation();
  const { account, logout, isViewOnly, exitPreviewMode, activeUser } = useWeb3();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // In spectator mode, restrict navigation to only Referral stats
  const navLinks = isViewOnly 
    ? [{ name: 'Referral Dashboard', path: '/user' }]
    : [
        { name: 'Dashboard', path: '/user' },
        { name: 'Token Launchpad', path: '/user/launchpad' },
        { name: 'Staking Vault', path: '/user/staking' },
        { name: 'Market Analytics', path: '/user/market' },
        { name: 'Buy Crypto (Fiat)', path: '/user/buy' },
        { name: 'History & Statements', path: '/user/history' },
        { name: 'VIP NFT Gallery', path: '/user/nft' },
      ];

  if (activeUser?.isBanned) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-lg w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-rose-600"></div>
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Account Suspended</h1>
          <p className="text-red-400 mb-8 font-mono text-sm leading-relaxed">
            Your access to the OXIDEX platform has been revoked by an administrator. 
            You can no longer access the dashboard or interact with the smart contract interface.
          </p>
          <div className="space-y-4">
            <div className="bg-black/50 rounded-xl p-4 border border-white/5 font-mono text-xs text-gray-500 break-all text-left">
              Wallet: {activeUser.walletAddress}
            </div>
            <button 
              onClick={isViewOnly ? exitPreviewMode : logout}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-xl transition-colors tracking-wide uppercase text-sm"
            >
              {isViewOnly ? 'Exit Preview Mode' : 'Disconnect Wallet'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-gray-200 font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-900/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-50">
        <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-500">
          OXI Referral Portal
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-300">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-zinc-900/60 backdrop-blur-2xl border-r border-white/10 
        transform transition-transform duration-300 ease-in-out flex flex-col pt-16 md:pt-4 p-4
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="mb-6 hidden md:block">
          <div className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500">
            OXIDEX
          </div>
          <p className="text-[10px] uppercase tracking-widest text-amber-500/70 font-semibold mt-0.5">
            {isViewOnly ? 'Spectator Portal' : 'Partner Network'}
          </p>
        </div>
        
        <nav className="flex-1 space-y-2 mt-4 md:mt-0">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.path}
                to={link.path} 
                onClick={() => setMobileMenuOpen(false)}
                className={`block p-3 rounded-xl font-semibold transition-all duration-300 ${
                  isActive 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
                  : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
                }`}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>

        {isViewOnly && (
          <div className="my-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase bg-amber-400 text-slate-950 rounded mb-1 tracking-wider">
              Spectator Mode
            </span>
            <p className="text-[11px] text-amber-200/80 leading-snug">
              Viewing referral link, partner count & earnings.
            </p>
          </div>
        )}
        
        <div className="mt-auto pt-4 border-t border-white/10 space-y-3">
          <p className="text-xs text-amber-400/80 truncate font-mono bg-amber-500/5 p-2 rounded-lg border border-amber-500/20">
            {isViewOnly ? `Spectator: ${account}` : account}
          </p>
          <button 
            onClick={isViewOnly ? exitPreviewMode : logout}
            className="w-full flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all duration-300 text-sm font-bold shadow-sm"
          >
            <LogOut size={16} />
            <span>{isViewOnly ? 'Exit Spectator Mode' : 'Disconnect'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-20 md:pt-8 p-6 md:p-10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
        {isViewOnly && (
          <div className="max-w-7xl mx-auto mb-6 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
            <div className="flex items-center space-x-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                👁
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-amber-300 uppercase tracking-wider">
                  Spectator Spectrum Active
                </h4>
                <p className="text-xs text-amber-200/70 font-mono">
                  Inspecting stats for address: <span className="text-white font-bold">{account}</span>
                </p>
              </div>
            </div>
            <button
              onClick={exitPreviewMode}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            >
              Exit Spectator
            </button>
          </div>
        )}

        <div className="max-w-7xl mx-auto pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}
