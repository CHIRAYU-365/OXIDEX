import React, { useState } from 'react';
import { useWeb3 } from '../../context/Web3Context';

export default function FiatOnramp() {
  const { account } = useWeb3();
  const [provider, setProvider] = useState('global');

  // Transak for Global (Cards, Apple Pay, etc)
  const walletParamTransak = account ? `&walletAddress=${account}` : '';
  const transakUrl = `https://global.transak.com/?cryptoCurrencyList=ETH,USDT&defaultCryptoCurrency=ETH&networks=ethereum,sepolia&themeColor=f59e0b${walletParamTransak}`;

  // Onramp.money for India/Emerging Markets (UPI, IMPS, etc)
  const walletParamOnramp = account ? `&walletAddress=${account}` : '';
  const onrampUrl = `https://onramp.money/main/buy/?appId=1&coinCode=eth&network=erc20&theme=dark${walletParamOnramp}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 tracking-tight pb-2">
          Buy Crypto with Fiat
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Need ETH to buy OXI tokens or pay for gas? Use your credit card, debit card, or UPI to instantly buy ETH directly into your connected wallet.
        </p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="bg-black/50 p-1.5 rounded-2xl border border-white/5 inline-flex">
          <button 
            onClick={() => setProvider('global')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${provider === 'global' ? 'bg-amber-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Global (Cards / Apple Pay)
          </button>
          <button 
            onClick={() => setProvider('india')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${provider === 'india' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            India / Asia (UPI / IMPS)
          </button>
        </div>
      </div>

      <div className="bg-black/50 border border-white/10 p-2 rounded-[2rem] shadow-[0_0_50px_rgba(245,158,11,0.1)] mx-auto max-w-md relative overflow-hidden">
        {/* Loading Spinner underneath iframe */}
        <div className="absolute inset-0 flex flex-col items-center justify-center -z-10">
          <div className={`w-8 h-8 border-4 rounded-full animate-spin mb-4 ${provider === 'global' ? 'border-amber-500/20 border-t-amber-500' : 'border-blue-500/20 border-t-blue-500'}`}></div>
          <span className={`${provider === 'global' ? 'text-amber-500/50' : 'text-blue-500/50'} text-sm font-mono animate-pulse`}>Initializing Secure Gateway...</span>
        </div>

        <iframe 
          src={provider === 'global' ? transakUrl : onrampUrl} 
          width="100%" 
          height="650px" 
          frameBorder="0"
          className="rounded-[1.5rem] w-full bg-transparent"
          title="Fiat Onramp"
          allow="camera;microphone;fullscreen;payment"
        ></iframe>
      </div>
      
      <div className="text-center text-xs text-gray-500 max-w-lg mx-auto pb-8">
        <p>Payments are securely processed by {provider === 'global' ? 'Transak' : 'Onramp.money'}. OXIDEX does not store your payment or personal information.</p>
      </div>
    </div>
  );
}
