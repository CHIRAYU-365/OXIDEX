import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';

export default function UserLayout({ children }) {
  const location = useLocation();
  const { account } = useWeb3();

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-gray-200">
      {/* Sidebar */}
      <aside className="w-64 bg-[#13131a] p-4 hidden md:flex flex-col border-r border-gray-800">
        <div className="text-2xl font-bold mb-8 text-green-400 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
          OXI Launchpad
        </div>
        <nav className="flex-1 space-y-2">
          <Link to="/user" className={`block p-3 rounded transition-colors ${location.pathname === '/user' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'hover:bg-gray-800'}`}>
            Dashboard
          </Link>
          <Link to="/user/launchpad" className={`block p-3 rounded transition-colors ${location.pathname === '/user/launchpad' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'hover:bg-gray-800'}`}>
            Token Launchpad
          </Link>
          <Link to="/user/history" className={`block p-3 rounded transition-colors ${location.pathname === '/user/history' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'hover:bg-gray-800'}`}>
            History & Statements
          </Link>
          <Link to="/user/contract" className={`block p-3 rounded transition-colors ${location.pathname === '/user/contract' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'hover:bg-gray-800'}`}>
            Smart Contract
          </Link>
        </nav>
        <div className="mt-auto pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 truncate">Wallet: {account}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
