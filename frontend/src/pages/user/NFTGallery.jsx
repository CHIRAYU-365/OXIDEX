import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { ethers } from 'ethers';
import { ERC20_ABI, CONTRACT_ADDRESS, CONTRACT_ABI, OXI_TOKEN_ADDRESS, OXI_NFT_ADDRESS } from '../../utils/contract';

const NFT_CONTRACT_ADDRESS = OXI_NFT_ADDRESS;

const NFT_ABI = [
  "function mint() external",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)"
];

export default function NFTGallery() {
  const { account, provider, isPreviewMode } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nftBalance, setNftBalance] = useState(0);
  const [oxiBalance, setOxiBalance] = useState('0');
  
  const fetchBalances = async () => {
    const activeProvider = provider || (window.ethereum ? new ethers.BrowserProvider(window.ethereum) : null);
    if (!activeProvider || !account || isPreviewMode) return;
    try {
      let tokenAddr = OXI_TOKEN_ADDRESS;
      try {
        const baseContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, activeProvider);
        const fetchedToken = await baseContract.launchpadToken();
        if (fetchedToken && fetchedToken !== ethers.ZeroAddress) {
          tokenAddr = fetchedToken;
        }
      } catch (e) {
        console.warn("Could not query launchpadToken, using default OXI address:", e);
      }
      
      const tokenContract = new ethers.Contract(tokenAddr, ERC20_ABI, activeProvider);
      const bal = await tokenContract.balanceOf(account);
      setOxiBalance(ethers.formatEther(bal));
      
      if (NFT_CONTRACT_ADDRESS && NFT_CONTRACT_ADDRESS !== ethers.ZeroAddress) {
        const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, activeProvider);
        const nftBal = await nftContract.balanceOf(account);
        setNftBalance(Number(nftBal));
      }
    } catch (err) {
      console.error("Error fetching balances:", err);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [provider, account, isPreviewMode]);

  const handleMint = async () => {
    if (isPreviewMode) {
      setError("Connect wallet to mint your VIP Pass");
      return;
    }

    if (nftBalance >= 1) {
      setError("VIP Pass already issued to your address! Each person is limited to exactly 1 VIP Pass.");
      return;
    }
    
    if (NFT_CONTRACT_ADDRESS === ethers.ZeroAddress || NFT_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      setError("NFT Contract has not been deployed yet. Please ask the administrator to deploy OxideXNFT.sol");
      return;
    }
    
    if (parseFloat(oxiBalance) < 1000) {
      setError("Insufficient OXI balance. You need 1000 OXI to mint a VIP pass.");
      return;
    }

    setLoading(true);
    setError('');
    try {
      const signer = await provider.getSigner();
      
      let tokenAddr = OXI_TOKEN_ADDRESS;
      try {
        const baseContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const fetchedToken = await baseContract.launchpadToken();
        if (fetchedToken && fetchedToken !== ethers.ZeroAddress) {
          tokenAddr = fetchedToken;
        }
      } catch (e) {
        console.warn("Using default OXI token address for mint approval");
      }

      const tokenContract = new ethers.Contract(tokenAddr, ERC20_ABI, signer);
      
      const mintCostWei = ethers.parseEther("1000");
      
      // Approve 1000 OXI
      const allowance = await tokenContract.allowance(account, NFT_CONTRACT_ADDRESS);
      if (allowance < mintCostWei) {
        const txApprove = await tokenContract.approve(NFT_CONTRACT_ADDRESS, mintCostWei);
        await txApprove.wait();
      }
      
      // Mint NFT
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
      const txMint = await nftContract.mint();
      await txMint.wait();
      
      await fetchBalances();
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-blue-500/20 pb-6 mb-10">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-sky-500 pb-2">
            VIP NFT Gallery
          </h1>
          <p className="text-gray-400 mt-2 text-base">Mint an exclusive VIP Pass to boost your Staking APR by 2x!</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 px-4 py-2 rounded-xl flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
          <span className="text-xs font-bold font-mono text-blue-300 uppercase tracking-wider">
            Strict Limit: 1 Pass Per Wallet
          </span>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-950/50 border border-red-500/30 text-red-400 rounded-xl text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Mint Section */}
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.05)] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-sky-500"></div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-black text-white">Mint VIP Pass</h2>
              {nftBalance >= 1 && (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase rounded-full">
                  1/1 Issued
                </span>
              )}
            </div>
            <p className="text-gray-400 mb-6">Burn 1000 OXI tokens to mint the exclusive OxideX VIP Pass. Holding this NFT in your wallet permanently doubles your Staking Yield!</p>
            
            <div className="bg-black/50 p-6 rounded-2xl border border-white/5 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Mint Price</span>
                <span className="text-white font-bold font-mono">1,000 OXI</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Your Balance</span>
                <span className="text-blue-400 font-bold font-mono">{parseFloat(oxiBalance).toFixed(2)} OXI</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Issuance Limit</span>
                <span className="text-amber-300 font-bold font-mono">1 Pass / Address</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleMint}
            disabled={loading || nftBalance >= 1}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-lg transition-all transform active:scale-95 ${
              nftBalance >= 1
              ? 'bg-emerald-950/60 text-emerald-400 cursor-not-allowed border border-emerald-500/30 shadow-none'
              : loading 
              ? 'bg-zinc-800 text-gray-500 cursor-not-allowed border border-white/5' 
              : 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] border border-blue-400/50'
            }`}
          >
            {nftBalance >= 1 ? 'VIP Pass Issued (1/1 Max Limit)' : loading ? 'Processing...' : 'Mint VIP Pass'}
          </button>
        </div>

        {}
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.05)]">
          <h2 className="text-2xl font-black text-white mb-6">Your Collection</h2>
          
          {nftBalance > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: nftBalance }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-gradient-to-br from-blue-900/40 to-black border border-blue-500/30 shadow-[0_0_30px_rgba(99,102,241,0.1)] flex flex-col items-center justify-center p-6 group hover:border-blue-400/50 transition-all duration-300">
                  <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                  </div>
                  <h3 className="font-bold text-white text-lg">VIP Pass</h3>
                  <span className="text-blue-400 text-xs font-mono mt-1">2x Staking Boost</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/10 rounded-2xl">
              <svg className="w-12 h-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <p className="text-gray-400 font-medium">You don't own any VIP Passes yet.</p>
              <p className="text-gray-500 text-sm mt-2">Mint one to unlock 2x Staking APR!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
