import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { 
  Wallet as WalletIcon, 
  Briefcase, 
  Users, 
  Smartphone, 
  Mail, 
  Send, 
  Facebook, 
  Instagram, 
  Megaphone,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function Wallet() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const walletItems = [
    { name: 'Total Earnings', value: profile?.totalEarned || 0, icon: WalletIcon, color: 'bg-pink-500' },
    { name: 'Total Jobs Earnings', value: profile?.jobEarnings || 0, icon: Briefcase, color: 'bg-emerald-500' },
    { name: 'Invite wallet', value: profile?.inviteEarnings || 0, icon: Users, color: 'bg-blue-500' },
    { name: 'Salary Wallet', value: profile?.salaryEarnings || 0, icon: Smartphone, color: 'bg-indigo-500' },
    { name: 'Gmail income', value: profile?.gmailEarnings || 0, icon: Mail, color: 'bg-red-500' },
    { name: 'Telegram Income', value: profile?.telegramEarnings || 0, icon: Send, color: 'bg-sky-500' },
    { name: 'Facebook Income', value: profile?.facebookEarnings || 0, icon: Facebook, color: 'bg-blue-600' },
    { name: 'Instagram Income', value: profile?.instagramEarnings || 0, icon: Instagram, color: 'bg-pink-600' },
    { name: 'Total Marketing Wallet', value: profile?.marketingEarnings || 0, icon: Megaphone, color: 'bg-amber-500' },
    { name: 'Ads wallet', value: profile?.adsEarnings || 0, icon: Smartphone, color: 'bg-purple-500' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
          <WalletIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight italic uppercase">My Wallet</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Manage your earnings and funds</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => navigate('/deposit')}
          className="bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
        >
          <ArrowDownCircle className="w-5 h-5" /> Deposit
        </button>
        <button 
          onClick={() => navigate('/withdraw')}
          className="bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
        >
          <ArrowUpCircle className="w-5 h-5" /> Withdraw
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {walletItems.map((item) => (
          <div 
            key={item.name}
            className={cn(
              "rounded-3xl p-4 border flex flex-col items-center text-center gap-2 transition-all",
              theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
            )}
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg", item.color)}>
              <item.icon className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">BDT</p>
              <p className="text-xl font-black tracking-tight">{item.value.toFixed(2)}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-tight">{item.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
