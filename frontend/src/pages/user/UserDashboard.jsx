import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { 
  Users, 
  TrendingUp, 
  Copy, 
  Check, 
  Share2, 
  QrCode, 
  Sparkles, 
  ExternalLink, 
  ShieldCheck, 
  Award,
  ArrowUpRight,
  Search,
  Zap,
  Globe
} from 'lucide-react';
import { CONTRACT_ADDRESS } from '../../utils/contract';

export default function UserDashboard() {
  const { account, user, isViewOnly } = useWeb3();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const referralLink = `${window.location.origin}${window.location.pathname}#/?ref=${account || '0x0000'}`;

  useEffect(() => {
    const fetchPartners = async () => {
      if (!account) return;
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://oxidex-api.onrender.com'}/api/users/${account}/partners`);
        const data = await res.json();
        if (data.success) {
          setPartners(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch partners", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPartners();
  }, [account]);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`Join me on OXIDEX Launchpad and start earning crypto rewards! Check out my referral link:`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const shareOnTelegram = () => {
    const text = encodeURIComponent(`Join me on OXIDEX Launchpad to earn rewards!`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, '_blank');
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`Join me on OXIDEX Launchpad: ${referralLink}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Filter partners based on search
  const filteredPartners = partners.filter(p => 
    p.walletAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEarnings = user?.totalEarnings ? parseFloat(user.totalEarnings).toFixed(4) : "0.0000";
  const partnersCount = user?.partnersCount || partners.length || 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Dynamic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-black p-8 border border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.08)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 font-extrabold text-[11px] uppercase tracking-widest rounded-full border border-amber-500/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Sparkles size={12} className="animate-pulse" />
                {isViewOnly ? 'Spectator View Spectrum' : 'Referral Overview'}
              </span>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 font-bold text-[11px] uppercase tracking-widest rounded-full border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck size={12} />
                Live On-Chain Data
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {isViewOnly ? 'Spectator Referral Portal' : 'Your Referral Network'}
            </h1>
            <p className="text-gray-400 mt-1.5 text-sm max-w-xl">
              Inspect referral link, total referred partners, and real-time revenue generated across your network.
            </p>
          </div>

          <a 
            href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group px-5 py-3 rounded-2xl bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 text-gray-300 hover:text-amber-400 font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shadow-lg"
          >
            <span>Verify Smart Contract</span>
            <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>

      {/* 2 Key Stats Cards: People Referred & Earnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: People Referred */}
        <div className="relative group bg-zinc-900/60 backdrop-blur-2xl p-7 rounded-3xl border border-white/10 hover:border-sky-500/40 shadow-[0_0_25px_rgba(14,165,233,0.05)] hover:shadow-[0_0_40px_rgba(14,165,233,0.15)] transition-all duration-500 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 to-blue-600 opacity-60 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform duration-300">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-gray-400 text-xs uppercase font-extrabold tracking-wider">People Referred</h3>
                <p className="text-sky-400 text-[11px] font-mono font-medium">Direct Network Partners</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 text-[10px] font-bold uppercase border border-sky-500/20">
              Level 1
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-5xl font-black text-white tracking-tight group-hover:text-sky-300 transition-colors">
                {partnersCount}
              </span>
              <span className="ml-2 text-sm text-gray-400 font-semibold">Members</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400 font-medium">Network Status</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Active Referral Tree
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Earnings Out of Them */}
        <div className="relative group bg-zinc-900/60 backdrop-blur-2xl p-7 rounded-3xl border border-white/10 hover:border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.05)] hover:shadow-[0_0_40px_rgba(245,158,11,0.15)] transition-all duration-500 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 opacity-60 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="text-gray-400 text-xs uppercase font-extrabold tracking-wider">Earnings From Network</h3>
                <p className="text-amber-400 text-[11px] font-mono font-medium">Accumulated Commission</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase border border-amber-500/20">
              ETH Rewards
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 tracking-tight">
                {totalEarnings}
              </span>
              <span className="ml-2 text-base text-amber-400/80 font-bold">ETH</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400 font-medium">Avg / Partner</div>
              <div className="text-xs font-bold text-amber-300 font-mono">
                {partnersCount > 0 ? (parseFloat(totalEarnings) / partnersCount).toFixed(4) : "0.0000"} ETH
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Focus Element 1: Referral Link Hero Box */}
      <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-black p-8 rounded-3xl border border-amber-500/30 shadow-[0_0_35px_rgba(245,158,11,0.12)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 mb-1">
              <Award size={18} />
              <h2 className="text-xl font-black uppercase tracking-wider text-white">Unique Referral Link</h2>
            </div>
            <p className="text-xs text-gray-400">
              Share this link to invite users to your referral tree and instantly collect multi-tier commissions.
            </p>
          </div>
          
          <button 
            onClick={() => setShowQR(!showQR)}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 flex items-center gap-2 transition-all"
          >
            <QrCode size={14} className="text-amber-400" />
            <span>{showQR ? 'Hide QR Code' : 'Show QR Code'}</span>
          </button>
        </div>

        {/* Input & Copy Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input 
              type="text" 
              readOnly 
              value={referralLink} 
              className="w-full bg-black/70 border border-amber-500/30 rounded-2xl py-4 px-5 pr-12 text-sm text-amber-200 font-mono focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              <Globe size={18} />
            </div>
          </div>
          <button 
            onClick={copyLink}
            className={`px-8 py-4 rounded-2xl font-black uppercase tracking-wider text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
              copied 
              ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-105' 
              : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.35)] active:scale-95'
            }`}
          >
            {copied ? (
              <>
                <Check size={16} />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy Referral Link</span>
              </>
            )}
          </button>
        </div>

        {/* QR Code Drawer */}
        {showQR && (
          <div className="mt-6 p-6 bg-black/60 rounded-2xl border border-amber-500/20 flex flex-col items-center justify-center animate-fadeIn">
            <div className="p-4 bg-white rounded-2xl shadow-2xl mb-3">
              {/* Generated QR visual matrix pattern */}
              <div className="w-36 h-36 bg-slate-950 p-2 rounded-xl flex flex-col items-center justify-center text-center">
                <QrCode size={100} className="text-amber-400" />
              </div>
            </div>
            <p className="text-xs font-mono text-amber-400/80 font-semibold">Scan with phone camera to join</p>
            <p className="text-[10px] text-gray-500 mt-1">Ref ID: {account?.substring(0, 10)}...</p>
          </div>
        )}

        {/* Quick Share Buttons */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Share2 size={14} className="text-amber-400" />
            Quick Share Link:
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={shareOnTwitter}
              className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Zap size={13} />
              Twitter / X
            </button>
            <button 
              onClick={shareOnTelegram}
              className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <SendIcon />
              Telegram
            </button>
            <button 
              onClick={shareOnWhatsApp}
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Main Focus Element 3: Referred People Breakdown Table */}
      <div className="bg-zinc-900/60 backdrop-blur-2xl p-7 rounded-3xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Direct Referred Partners</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-mono font-bold">
                {filteredPartners.length}
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Breakdown of wallets registered under your referral link and earnings generated from each.
            </p>
          </div>

          {partners.length > 0 && (
            <div className="relative w-full sm:w-64">
              <input 
                type="text" 
                placeholder="Search by address..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 pl-9 text-xs text-gray-200 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-amber-400/70 text-xs font-mono animate-pulse">Loading referral network data...</p>
          </div>
        ) : filteredPartners.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-4 text-amber-400 font-extrabold uppercase tracking-wider text-[11px]">Referred Partner Address</th>
                  <th className="p-4 text-amber-400 font-extrabold uppercase tracking-wider text-[11px]">Registration Date</th>
                  <th className="p-4 text-amber-400 font-extrabold uppercase tracking-wider text-[11px] text-right">Revenue Generated Out of Them</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPartners.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-amber-500/5 transition-colors group">
                    <td className="p-4 font-mono text-xs text-sky-400 group-hover:text-sky-300 font-medium">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-lg bg-sky-500/10 flex items-center justify-center text-[10px] text-sky-400 font-bold border border-sky-500/20">
                          #{idx + 1}
                        </span>
                        <span>{p.walletAddress}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400 text-xs font-mono">
                      {p.registeredAt ? new Date(p.registeredAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently'}
                    </td>
                    <td className="p-4 font-mono text-right font-bold text-xs text-amber-300">
                      <span className="px-3 py-1 bg-amber-500/10 rounded-xl border border-amber-500/20 inline-block">
                        +{p.revenueGenerated ? parseFloat(p.revenueGenerated).toFixed(4) : "0.0000"} ETH
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-black/40 rounded-2xl border border-white/5 border-dashed p-8">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 mx-auto mb-4 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Direct Partners Yet</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto mb-6">
              Share your referral link with colleagues and friends. Once they register using your link, they will appear here along with your earnings generated from them.
            </p>
            <button 
              onClick={copyLink}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg inline-flex items-center gap-2"
            >
              <Copy size={14} />
              <span>Copy Your Referral Link</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Minimal Telegram Send Icon Helper
function SendIcon() {
  return (
    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-3.65 2.45-3.77 2.53-.17.11-.33.17-.5.16-.16 0-.48-.09-.72-.16-.54-.18-1.06-.36-1.58-.55-.57-.2-.62-.43.12-.72 2.9-1.26 4.84-2.09 5.82-2.5 2.77-1.15 3.35-1.35 3.73-1.35.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
    </svg>
  );
}
