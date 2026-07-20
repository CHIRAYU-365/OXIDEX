import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, ERC20_ABI } from '../../utils/contract';

export default function StakingDashboard() {
  const { account, provider, isPreviewMode } = useWeb3();
  const [activeTab, setActiveTab] = useState('stake');
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  
  const [oxiBalance, setOxiBalance] = useState('0');
  const [stakedBalance, setStakedBalance] = useState('0');
  const [pendingYield, setPendingYield] = useState('0');
  const [apr, setApr] = useState('50');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStakingData = async () => {
    const activeProvider = provider || (window.ethereum ? new ethers.BrowserProvider(window.ethereum) : null);
    if (!activeProvider || !account || isPreviewMode) return;
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, activeProvider);
      
      const aprRaw = await contract.rewardAPR();
      setApr(aprRaw.toString());

      const stakeData = await contract.stakers(account);
      setStakedBalance(ethers.formatEther(stakeData.amount));

      const yieldRaw = await contract.getPendingYield(account);
      setPendingYield(ethers.formatEther(yieldRaw));

      const tokenAddress = await contract.launchpadToken();
      if (tokenAddress && tokenAddress !== ethers.ZeroAddress) {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        const bal = await tokenContract.balanceOf(account);
        setOxiBalance(ethers.formatEther(bal));
      }
    } catch (err) {
      console.error("Error fetching staking data:", err);
    }
  };

  useEffect(() => {
    fetchStakingData();
    const interval = setInterval(fetchStakingData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [provider, account, isPreviewMode]);

  const handleAction = async (actionType) => {
    if (isPreviewMode) {
      setError("Connect wallet to interact with the staking vault");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      if (actionType === 'stake') {
        if (!stakeAmount || parseFloat(stakeAmount) <= 0) throw new Error("Enter valid amount");
        const tokenAddress = await contract.launchpadToken();
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        
        const amountWei = ethers.parseEther(stakeAmount.toString());
        
        const allowance = await tokenContract.allowance(account, CONTRACT_ADDRESS);
        if (allowance < amountWei) {
          const txApprove = await tokenContract.approve(CONTRACT_ADDRESS, ethers.MaxUint256);
          await txApprove.wait();
        }
        
        const tx = await contract.stake(amountWei);
        await tx.wait();
        setStakeAmount('');
        
      } else if (actionType === 'unstake') {
        if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) throw new Error("Enter valid amount");
        const amountWei = ethers.parseEther(unstakeAmount.toString());
        const tx = await contract.unstake(amountWei);
        await tx.wait();
        setUnstakeAmount('');
        
      } else if (actionType === 'harvest') {
        const tx = await contract.claimYield();
        await tx.wait();
      }
      
      await fetchStakingData();
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-blue-500/20 pb-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-500 tracking-tight pb-2">
            Staking Vault
          </h1>
          <p className="text-gray-400 max-w-2xl text-sm">
            Lock your OXI tokens in the decentralized vault to earn a compounding yield. Harvest your rewards at any time.
          </p>
        </div>
        <div className="bg-blue-950/40 border border-blue-500/20 px-6 py-3 rounded-2xl flex flex-col items-end shadow-[0_0_20px_rgba(245,158,11,0.1)]">
          <span className="text-blue-500 text-xs font-bold uppercase tracking-widest">Current APR</span>
          <span className="text-2xl font-black text-white">{apr}% <span className="text-sm text-blue-400">Yield</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
          <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Available to Stake</div>
          <div className="text-3xl font-mono text-white font-bold">{parseFloat(oxiBalance).toFixed(2)} <span className="text-sm text-blue-500">OXI</span></div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-900/40 to-black backdrop-blur-xl border border-blue-500/30 p-6 rounded-3xl shadow-[0_0_30px_rgba(245,158,11,0.05)] relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"></div>
          <div className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Total Staked</div>
          <div className="text-3xl font-mono text-white font-bold relative z-10">{parseFloat(stakedBalance).toFixed(2)} <span className="text-sm text-blue-500">OXI</span></div>
        </div>

        <div className="bg-gradient-to-br from-sky-900/40 to-black backdrop-blur-xl border border-sky-500/30 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-sky-500/20 rounded-full blur-2xl"></div>
          <div>
            <div className="text-sky-400 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Pending Yield</div>
            <div className="text-3xl font-mono text-white font-bold relative z-10">{parseFloat(pendingYield).toFixed(4)} <span className="text-sm text-sky-500">OXI</span></div>
          </div>
          <button 
            onClick={() => handleAction('harvest')}
            disabled={loading || parseFloat(pendingYield) <= 0}
            className="mt-4 w-full bg-sky-500 hover:bg-sky-400 text-black font-black uppercase text-sm py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(249,115,22,0.3)]"
          >
            {loading ? "Processing..." : "Harvest Yield"}
          </button>
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="flex space-x-2 mb-8 bg-black/50 p-1.5 rounded-2xl border border-white/5 w-fit">
          <button 
            onClick={() => setActiveTab('stake')}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'stake' ? 'bg-blue-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Stake
          </button>
          <button 
            onClick={() => setActiveTab('unstake')}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'unstake' ? 'bg-zinc-800 text-blue-500 shadow-lg border border-white/10' : 'text-gray-400 hover:text-white'}`}
          >
            Unstake
          </button>
        </div>

        {error && <div className="mb-6 p-4 bg-red-950/50 border border-red-500/30 text-red-400 rounded-xl text-sm">{error}</div>}

        {activeTab === 'stake' ? (
          <div className="space-y-6">
            <div>
              <label className="text-gray-400 text-xs font-bold uppercase tracking-widest ml-2 mb-2 block">Amount to Stake</label>
              <div className="relative">
                <input 
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-2xl font-mono text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                />
                <button 
                  onClick={() => setStakeAmount(oxiBalance)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1.5 rounded-lg"
                >
                  Max
                </button>
              </div>
            </div>
            <button 
              onClick={() => handleAction('stake')}
              disabled={loading || !stakeAmount || parseFloat(stakeAmount) <= 0}
              className="w-full bg-blue-500 hover:bg-blue-400 text-black font-black text-lg uppercase tracking-widest py-4 rounded-2xl transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)]"
            >
              {loading ? "Processing Transaction..." : "Stake Tokens"}
            </button>
            <p className="text-center text-xs text-gray-500">Staking requires a one-time token approval transaction before deposit.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="text-gray-400 text-xs font-bold uppercase tracking-widest ml-2 mb-2 block">Amount to Unstake</label>
              <div className="relative">
                <input 
                  type="number"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-2xl font-mono text-white focus:outline-none focus:border-zinc-500/50 transition-colors"
                />
                <button 
                  onClick={() => setUnstakeAmount(stakedBalance)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300 hover:text-white uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-lg"
                >
                  Max
                </button>
              </div>
            </div>
            <button 
              onClick={() => handleAction('unstake')}
              disabled={loading || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 font-black text-lg uppercase tracking-widest py-4 rounded-2xl transition-all disabled:opacity-50"
            >
              {loading ? "Processing Transaction..." : "Unstake Tokens"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
