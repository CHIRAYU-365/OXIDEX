import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { Menu, X, LogOut } from 'lucide-react';

export default function AdminLayout({ children }) {
  const location = useLocation();
  const { account, logout, isViewOnly, exitPreviewMode } = useWeb3();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Unilevel Tree', path: '/admin/tree' },
    { name: 'Commissions', path: '/admin/commissions' },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-gray-200 font-sans">
      
      {}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-900/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-50">
        <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-500">
          OXIDEX Admin
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
        <div className="text-2xl font-bold mb-8 hidden md:block bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-500">
          OXIDEX Admin
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
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                  : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
                }`}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>
        
        <div className="mt-auto pt-4 border-t border-white/5 space-y-3">
          <p className="text-xs text-amber-500/60 truncate font-mono bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
            {isViewOnly ? `Preview: ${account}` : `Admin: ${account}`}
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
      <main className="flex-1 overflow-y-auto pt-20 md:pt-12 p-6 md:p-12 bg-gradient-to-br from-zinc-950 via-zinc-900/20 to-black">
        <div className="max-w-7xl mx-auto pt-4 pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}
