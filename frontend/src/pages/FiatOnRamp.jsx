import React from 'react';
import { FiCreditCard, FiLock, FiZap } from 'react-icons/fi';

const FiatOnRamp = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pt-8 mb-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400 drop-shadow-sm flex items-center justify-center gap-3">
          <FiCreditCard className="text-sky-400" /> Buy Crypto Instantly
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          Purchase ETH securely with your Credit Card, Apple Pay, or Bank Transfer to start earning on OXIDEX.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Features Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-sky-500/20">
            <FiLock className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Bank-Grade Security</h3>
            <p className="text-gray-400 text-sm">Your payment data is fully encrypted and processed by industry-leading providers like MoonPay and Transak.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-sky-500/20">
            <FiZap className="w-8 h-8 text-sky-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Instant Delivery</h3>
            <p className="text-gray-400 text-sm">ETH is deposited directly into your connected Web3 wallet in minutes, ready for use in the OXIDEX Matrix.</p>
          </div>
        </div>

        {/* Iframe / Widget Container */}
        <div className="md:col-span-2 glass-panel p-2 rounded-3xl border border-sky-500/30 shadow-[0_0_30px_rgba(14,165,233,0.15)] flex justify-center items-center min-h-[500px] relative overflow-hidden bg-[#010308]">
           {/* Decorative Background mimicking an iframe blur */}
           <div className="absolute inset-0 flex flex-col justify-center items-center opacity-10">
              <FiCreditCard className="w-64 h-64 text-sky-500" />
           </div>
           
           <div className="relative z-10 text-center space-y-6 p-8 glass-panel border border-sky-500/20 rounded-2xl max-w-md w-full">
             <h2 className="text-2xl font-bold text-white">Fiat On-Ramp Ready</h2>
             <p className="text-gray-400 text-sm">
               In the live production environment, the active MoonPay widget will render here, pre-populated with your connected wallet address.
             </p>
             <button 
               onClick={() => window.open('https://www.moonpay.com/buy?currencyCode=ETH', '_blank')}
               className="glow-btn w-full py-4 px-6 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2"
             >
               <FiCreditCard /> Launch MoonPay 
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FiatOnRamp;
