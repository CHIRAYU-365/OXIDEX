import React, { useState } from 'react';

export default function MarketAnalytics() {
  const [symbol, setSymbol] = useState("BINANCE:ETHUSDT");

  const popularPairs = [
    { name: "ETH/USDT", symbol: "BINANCE:ETHUSDT" },
    { name: "BTC/USDT", symbol: "BINANCE:BTCUSDT" },
    { name: "SOL/USDT", symbol: "BINANCE:SOLUSDT" },
    { name: "BNB/USDT", symbol: "BINANCE:BNBUSDT" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-amber-500/20 pb-4">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-600 pb-2">
            Market Analytics
          </h1>
          <p className="text-gray-400 mt-1">Real-time cryptocurrency charts and technical analysis.</p>
        </div>
        <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto hide-scrollbar">
          {popularPairs.map(pair => (
            <button
              key={pair.symbol}
              onClick={() => setSymbol(pair.symbol)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                symbol === pair.symbol 
                ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]" 
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {pair.name}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[700px] w-full bg-black rounded-2xl border border-amber-500/20 overflow-hidden relative shadow-[0_0_30px_rgba(245,158,11,0.05)]">
        {/* Placeholder Loading state before iframe loads */}
        <div className="absolute inset-0 flex items-center justify-center -z-10 bg-zinc-950">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
        </div>
        
        <iframe
          src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_123&symbol=${encodeURIComponent(symbol)}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en`}
          width="100%"
          height="100%"
          frameBorder="0"
          allowTransparency="true"
          scrolling="no"
          allowFullScreen
          title="TradingView Chart"
          className="w-full h-full"
        ></iframe>
      </div>
    </div>
  );
}
