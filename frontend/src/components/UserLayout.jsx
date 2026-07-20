import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { Menu, X, LogOut } from 'lucide-react';

export default function UserLayout({ children }) {
  const location = useLocation();
  const { account, logout, isViewOnly, exitPreviewMode, activeUser } = useWeb3();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', path: '/user' },
    { name: 'Token Launchpad', path: '/user/launchpad' },
    { name: 'Staking Vault', path: '/user/staking' },
    { name: 'Market Analytics', path: '/user/market' },
    { name: 'Buy Crypto (Fiat)', path: '/user/buy' },
    { name: 'History & Statements', path: '/user/history' },
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
      
      {}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-900/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-50">
        <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-sky-500">
          OXI Launchpad
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-300">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-zinc-900/50 backdrop-blur-xl border-r border-white/5 
        transform transition-transform duration-300 ease-in-out flex flex-col pt-16 md:pt-4 p-4
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="text-2xl font-bold mb-8 hidden md:block bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-sky-500">
          OXI Launchpad
        </div>
        
        <nav className="flex-1 space-y-2 mt-4 md:mt-0">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.path}
                to={link.path} 
                onClick={() => setMobileMenuOpen(false)}
                className={`block p-3 rounded-xl transition-all duration-300 ${
                  isActive 
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                  : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
                }`}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>
        
        <div className="mt-auto pt-4 border-t border-white/5 space-y-3">
          <p className="text-xs text-blue-500/60 truncate font-mono bg-blue-500/5 p-2 rounded-lg border border-blue-500/10">
            {isViewOnly ? `Preview: ${account}` : account}
          </p>
          <button 
            onClick={isViewOnly ? exitPreviewMode : logout}
            className="w-full flex items-center justify-center space-x-2 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all duration-300 text-sm font-bold"
          >
            <LogOut size={16} />
            <span>{isViewOnly ? 'Exit Preview' : 'Disconnect'}</span>
          </button>
        </div>
      </aside>

      {}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-6 p-4 md:p-10 bg-gradient-to-br from-zinc-950 via-zinc-900/20 to-black">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
