import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme } from '../context/ThemeContext';
import { UserProfile } from '../types';
import { 
  Trophy, 
  Users, 
  ArrowUpCircle, 
  Crown, 
  Medal,
  ChevronRight,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Leaderboard() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'referrers' | 'withdrawers'>('referrers');
  const [topReferrers, setTopReferrers] = useState<UserProfile[]>([]);
  const [topWithdrawers, setTopWithdrawers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch top referrers
        const referrersQuery = query(
          collection(db, 'users'), 
          orderBy('referralCount', 'desc'), 
          limit(20)
        );
        const referrersSnap = await getDocs(referrersQuery);
        const referrersData = referrersSnap.docs.map(doc => doc.data() as UserProfile);
        setTopReferrers(referrersData);

        // Fetch top withdrawers
        const withdrawersQuery = query(
          collection(db, 'users'), 
          orderBy('totalWithdrawn', 'desc'), 
          limit(20)
        );
        const withdrawersSnap = await getDocs(withdrawersQuery);
        const withdrawersData = withdrawersSnap.docs.map(doc => doc.data() as UserProfile);
        setTopWithdrawers(withdrawersData);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-8 h-8 text-yellow-400" />;
      case 1: return <Medal className="w-7 h-7 text-slate-300" />;
      case 2: return <Medal className="w-6 h-6 text-amber-600" />;
      default: return <span className="text-lg font-black text-slate-500">#{index + 1}</span>;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return "from-yellow-400/20 to-yellow-400/5 border-yellow-400/30";
      case 1: return "from-slate-300/20 to-slate-300/5 border-slate-300/30";
      case 2: return "from-amber-600/20 to-amber-600/5 border-amber-600/30";
      default: return theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200";
    }
  };

  const currentData = activeTab === 'referrers' ? topReferrers : topWithdrawers;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-pink-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-pink-500/30 rotate-12">
          <Trophy className="w-10 h-10 text-white -rotate-12" />
        </div>
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter italic uppercase">Leaderboard</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">Top Performers of the Month</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={cn(
        "p-2 rounded-3xl border flex gap-2",
        theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
      )}>
        <button 
          onClick={() => setActiveTab('referrers')}
          className={cn(
            "flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            activeTab === 'referrers' 
              ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20" 
              : "text-slate-500 hover:bg-slate-500/5"
          )}
        >
          <Users className="w-4 h-4" /> Top Referrers
        </button>
        <button 
          onClick={() => setActiveTab('withdrawers')}
          className={cn(
            "flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            activeTab === 'withdrawers' 
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
              : "text-slate-500 hover:bg-slate-500/5"
          )}
        >
          <ArrowUpCircle className="w-4 h-4" /> Top Withdrawers
        </button>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 items-end gap-4 pt-12">
        {/* 2nd Place */}
        {currentData[1] && (
          <div className="space-y-4 text-center">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-3xl bg-slate-300 flex items-center justify-center rotate-6 shadow-xl">
                <Medal className="w-10 h-10 text-white -rotate-6" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-slate-900 rounded-full flex items-center justify-center font-black text-xs border-2 border-slate-300">2</div>
            </div>
            <div className="space-y-1">
              <p className="font-black text-sm truncate px-2">{currentData[1].userName}</p>
              <p className="text-xs font-bold text-slate-500">
                {activeTab === 'referrers' ? `${currentData[1].referrals} Ref` : `BDT ${currentData[1].totalWithdraw?.toFixed(0)}`}
              </p>
            </div>
          </div>
        )}

        {/* 1st Place */}
        {currentData[0] && (
          <div className="space-y-4 text-center -mt-8">
            <div className="relative inline-block">
              <div className="w-28 h-28 rounded-[2.5rem] bg-yellow-400 flex items-center justify-center -rotate-6 shadow-2xl shadow-yellow-400/30">
                <Crown className="w-14 h-14 text-white rotate-6" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-slate-900 rounded-full flex items-center justify-center font-black text-sm border-4 border-yellow-400">1</div>
            </div>
            <div className="space-y-1">
              <p className="font-black text-lg truncate px-2">{currentData[0].userName}</p>
              <p className="text-sm font-black text-pink-500">
                {activeTab === 'referrers' ? `${currentData[0].referrals} Referrals` : `BDT ${currentData[0].totalWithdraw?.toFixed(0)}`}
              </p>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {currentData[2] && (
          <div className="space-y-4 text-center">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-3xl bg-amber-600 flex items-center justify-center -rotate-12 shadow-xl">
                <Medal className="w-10 h-10 text-white rotate-12" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-slate-900 rounded-full flex items-center justify-center font-black text-xs border-2 border-amber-600">3</div>
            </div>
            <div className="space-y-1">
              <p className="font-black text-sm truncate px-2">{currentData[2].userName}</p>
              <p className="text-xs font-bold text-slate-500">
                {activeTab === 'referrers' ? `${currentData[2].referrals} Ref` : `BDT ${currentData[2].totalWithdraw?.toFixed(0)}`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* List View */}
      <div className="space-y-4">
        {currentData.slice(3).map((player, index) => (
          <div 
            key={player.userId}
            className={cn(
              "rounded-3xl p-5 border flex items-center justify-between gap-4 transition-all hover:scale-[1.01]",
              theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
            )}
          >
            <div className="flex items-center gap-6">
              <div className="w-10 h-10 rounded-2xl bg-slate-500/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-black text-slate-500">#{index + 4}</span>
              </div>
              <div>
                <h4 className="font-black text-lg tracking-tight">{player.userName}</h4>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID: {player.userId}</p>
              </div>
            </div>

            <div className="text-right space-y-1">
              <p className={cn(
                "text-lg font-black tracking-tight",
                activeTab === 'referrers' ? "text-pink-500" : "text-emerald-500"
              )}>
                {activeTab === 'referrers' ? player.referrals : `BDT ${player.totalWithdraw?.toFixed(0)}`}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {activeTab === 'referrers' ? 'Referrals' : 'Withdrawn'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
