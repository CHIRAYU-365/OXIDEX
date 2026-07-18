import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';

export default function AdminLayout({ children }) {
  const location = useLocation();
  const { account } = useWeb3();

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 p-4 hidden md:flex flex-col">
        <div className="text-2xl font-bold mb-8 text-blue-400">OXIDEX Admin</div>
        <nav className="flex-1 space-y-2">
          <Link to="/admin" className={`block p-3 rounded ${location.pathname === '/admin' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            Dashboard
          </Link>
          <Link to="/admin/tree" className={`block p-3 rounded ${location.pathname === '/admin/tree' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            Unilevel Tree
          </Link>
          <Link to="/admin/commissions" className={`block p-3 rounded ${location.pathname === '/admin/commissions' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            Commissions
          </Link>
        </nav>
        <div className="mt-auto">
          <p className="text-xs text-gray-400 truncate">Admin: {account}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
