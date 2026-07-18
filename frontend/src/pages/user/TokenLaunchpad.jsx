import React, { useState } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { parseEther } from 'ethers';

export default function TokenLaunchpad() {
  const { account, signer } = useWeb3();
  const [amountEth, setAmountEth] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');

  // Mock ABI for launchpad buy
  const buyLaunchpadTokensAbi = ["function buyLaunchpadTokens(address referrer) external payable"];
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000"; // Placeholder

  const handleBuy = async () => {
    if (!amountEth || isNaN(amountEth) || parseFloat(amountEth) <= 0) {
      alert("Please enter a valid ETH amount");
      return;
    }
    
    try {
      setLoading(true);
      setTxHash('');
      
      // In a real scenario, extract ref from local storage or URL if not registered
      const referrer = localStorage.getItem("referrer") || account; // Mock fallback
      
      const { Contract } = await import('ethers');
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
    <div className="max-w-2xl mx-auto mt-10">
      <div className="bg-[#13131a] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
        <div className="p-8 text-center bg-gradient-to-b from-green-900/20 to-transparent border-b border-gray-800">
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 mb-2">
            OXI Token Presale
          </h1>
          <p className="text-gray-400">Join the future of DeFi. Buy tokens to participate in the ecosystem.</p>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Current Price:</span>
            <span className="font-bold text-green-400">1 OXI = 0.0001 ETH</span>
          </div>
          
          <div>
            <label className="block text-gray-400 mb-2 text-sm font-semibold">Amount to Invest (ETH)</label>
            <div className="relative">
              <input 
                type="number" 
                value={amountEth}
                onChange={(e) => setAmountEth(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 pl-12 text-white font-mono text-lg focus:outline-none focus:border-green-500 transition-colors"
                placeholder="0.1"
                min="0"
                step="0.01"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Ξ</span>
            </div>
          </div>
          
          <div className="bg-gray-900/50 p-4 rounded-lg flex justify-between items-center border border-gray-800/50">
            <span className="text-gray-400 text-sm">You will receive approx:</span>
            <span className="text-2xl font-bold text-white">
              {amountEth && !isNaN(amountEth) ? (parseFloat(amountEth) / 0.0001).toLocaleString() : '0'} <span className="text-green-500 text-sm">OXI</span>
            </span>
          </div>

          <button 
            onClick={handleBuy}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform active:scale-95 ${loading ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:shadow-[0_0_25px_rgba(16,185,129,0.7)]'}`}
          >
            {loading ? 'Processing Transaction...' : 'Buy OXI Tokens'}
          </button>
          
          {txHash && (
            <div className="mt-4 text-center text-sm">
              <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                View Transaction on Explorer
              </a>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-gray-500 text-sm">Every purchase contributes to the MLM reward pool. Refer friends to earn up to 5 levels deep!</p>
      </div>
    </div>
  );
}
