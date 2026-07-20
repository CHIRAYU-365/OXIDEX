import React, { useState } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { parseEther } from 'ethers';

export default function TokenLaunchpad() {
  const { account } = useWeb3();
  const [amountEth, setAmountEth] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');

  // Mock ABI for launchpad buy
  const buyLaunchpadTokensAbi = ["function buyLaunchpadTokens(address referrer) external payable"];
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "0x98A6F0671Bf68f36A1ee414D2A043b228a79df8C";

  const handleBuy = async () => {
    if (!amountEth || isNaN(amountEth) || parseFloat(amountEth) <= 0) {
      alert("Please enter a valid ETH amount");
      return;
    }
    
    try {
      setLoading(true);
      setTxHash('');
      
      const referrer = localStorage.getItem("referrer") || account; 
      
      const { Contract, BrowserProvider } = await import('ethers');
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, buyLaunchpadTokensAbi, signer);
      
      const tx = await contract.buyLaunchpadTokens(referrer, { value: parseEther(amountEth) });
      await tx.wait();
      
      setTxHash(tx.hash);
      alert('Tokens purchased successfully!');
    } catch (error) {
      console.error("Buy error", error);
      alert('Transaction failed. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-blue-500/20 pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-sky-500 mb-2 tracking-tight">
            OXI Token Presale
          </h1>
          <p className="text-gray-400 text-sm md:text-base">Join the future of decentralized finance. Secure your tokens today.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(37,99,235,0.05)] overflow-hidden">
        
        <div className="p-6 md:p-8 space-y-8">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400 font-semibold uppercase tracking-wider">Current Price</span>
            <span className="font-bold text-blue-400 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
              1 OXI = 0.0001 ETH
            </span>
          </div>
          
          <div>
            <label className="block text-gray-400 mb-3 text-sm font-semibold uppercase tracking-wider">Amount to Invest (ETH)</label>
            <div className="relative group">
              <input 
                type="number" 
                value={amountEth}
                onChange={(e) => setAmountEth(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 pl-12 text-white font-mono text-xl focus:outline-none focus:border-blue-500/50 transition-colors group-hover:border-white/20 shadow-inner"
                placeholder="0.1"
                min="0"
                step="0.01"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 font-bold text-xl">Ξ</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500/10 to-sky-500/5 p-6 rounded-xl flex justify-between items-center border border-blue-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
            <span className="text-gray-300 text-sm font-semibold uppercase tracking-wider">You will receive approx:</span>
            <span className="text-3xl font-black text-white">
              {amountEth && !isNaN(amountEth) ? (parseFloat(amountEth) / 0.0001).toLocaleString() : '0'} 
              <span className="text-blue-500 text-sm ml-2 font-bold uppercase tracking-widest">OXI</span>
            </span>
          </div>

          <button 
            onClick={handleBuy}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-lg transition-all transform active:scale-95 ${
              loading 
              ? 'bg-zinc-800 text-gray-500 cursor-not-allowed border border-white/5' 
              : 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] border border-blue-400/50'
            }`}
          >
            {loading ? 'Processing Transaction...' : 'Buy OXI Tokens'}
          </button>
          
          {txHash && (
            <div className="mt-4 text-center">
              <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:underline transition-colors text-sm font-semibold bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
                <span>View Transaction on Etherscan</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center px-4">
        <p className="text-gray-500 text-sm font-medium">Every purchase contributes to the MLM reward pool. Refer friends to earn commissions up to 6 levels deep!</p>
      </div>
    </div>
  );
}
