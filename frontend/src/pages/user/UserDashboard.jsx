import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../../context/Web3Context';

export default function UserDashboard() {
  const { account, user } = useWeb3();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  const referralLink = `${window.location.origin}/#/register?ref=${account}`;

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/users/${account}/partners`);
        const data = await res.json();
        if (data.success) {
          setPartners(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch partners", err);
      } finally {
        setLoading(false);
      }
    };
    if (account) fetchPartners();
  }, [account]);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    alert('Referral link copied!');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
        Overview
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#13131a] p-6 rounded-xl border border-gray-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
          <h2 className="text-gray-400 font-semibold mb-2">Total Revenue</h2>
          <p className="text-4xl font-bold text-white">
            {user?.totalEarnings ? parseFloat(user.totalEarnings).toFixed(4) : "0.0000"} ETH
          </p>
        </div>
        
        <div className="bg-[#13131a] p-6 rounded-xl border border-gray-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
          <h2 className="text-gray-400 font-semibold mb-2">Direct Partners</h2>
          <p className="text-4xl font-bold text-white">{user?.partnersCount || 0}</p>
        </div>
      </div>

      <div className="bg-[#13131a] p-6 rounded-xl border border-gray-800 shadow-xl mt-6">
        <h2 className="text-xl font-bold mb-4 text-white">Your Referral Link</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            readOnly 
            value={referralLink} 
            className="flex-1 bg-gray-900 border border-gray-700 rounded p-3 text-gray-300 focus:outline-none"
          />
          <button 
            onClick={copyLink}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded transition-colors"
          >
            Copy Link
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-3">Share this link to invite direct partners to the Token Launchpad and earn commissions!</p>
      </div>

      <div className="bg-[#13131a] p-6 rounded-xl border border-gray-800 shadow-xl mt-6">
        <h2 className="text-xl font-bold mb-4 text-white">Direct Partners List</h2>
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : partners.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="p-3">Wallet Address</th>
                  <th className="p-3">Joined Date</th>
                  <th className="p-3">Revenue Gen</th>
                </tr>
              </thead>
              <tbody>
                {partners.map(p => (
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                    <td className="p-3 font-mono text-sm text-blue-400">{p.walletAddress}</td>
                    <td className="p-3 text-gray-300">{new Date(p.registeredAt).toLocaleDateString()}</td>
                    <td className="p-3 text-gray-300">{p.totalEarnings ? parseFloat(p.totalEarnings).toFixed(4) : "0.00"} ETH</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-6">You have no direct partners yet. Start referring!</p>
        )}
      </div>
    </div>
  );
}
