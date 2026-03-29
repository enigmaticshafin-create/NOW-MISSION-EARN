import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { UserProfile, LevelConfig } from '../types';
import { 
  Users, 
  User as UserIcon,
  Mail,
  ShieldCheck, 
  ShieldAlert,
  TrendingUp,
  Award,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function MyTeam() {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const [referrals, setReferrals] = useState<UserProfile[]>([]);
  const [levelConfigs, setLevelConfigs] = useState<LevelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.userId) return;

      try {
        // Fetch referrals
        const referralsQuery = query(
          collection(db, 'users'), 
          where('referredBy', '==', profile.userId)
        );
        const referralsSnap = await getDocs(referralsQuery);
        const referralsData = referralsSnap.docs.map(doc => doc.data() as UserProfile);
        setReferrals(referralsData);

        // Fetch level configs
        const levelQuery = query(collection(db, 'levelConfigs'), orderBy('minReferrals', 'asc'));
        const levelSnap = await getDocs(levelQuery);
        const levelData = levelSnap.docs.map(doc => doc.data() as LevelConfig);
        setLevelConfigs(levelData);
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.userId]);

  const getCurrentLevel = () => {
    if (!levelConfigs.length) return { level: 0, name: 'Beginner' };
    
    const activeCount = referrals.filter(r => r.status === 'active').length;
    let currentLevel = levelConfigs[0];
    
    for (const config of levelConfigs) {
      if (activeCount >= config.minReferrals) {
        currentLevel = config;
      } else {
        break;
      }
    }
    
    return currentLevel;
  };

  const filteredReferrals = referrals.filter(ref => 
    ref.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.userId.includes(searchTerm)
  );

  const stats = [
    { name: 'Total Referrals', value: referrals.filter(r => r.status === 'active').length, icon: Users, color: 'bg-blue-500' },
    { name: 'Active Members', value: referrals.filter(r => r.status === 'active').length, icon: ShieldCheck, color: 'bg-emerald-500' },
    { name: 'Team Sales', value: `BDT ${referrals.reduce((acc, curr) => acc + (curr.totalEarned || 0), 0).toFixed(2)}`, icon: TrendingUp, color: 'bg-pink-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  const currentLevel = getCurrentLevel();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header & Level Card */}
      <div className={cn(
        "rounded-[2.5rem] p-8 border relative overflow-hidden",
        theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
      )}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight italic uppercase">My Team</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Build your network</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center gap-2">
                <Award className="w-4 h-4 text-pink-500" />
                <span className="text-xs font-black uppercase tracking-widest text-pink-500">Level {currentLevel.level}: {currentLevel.name}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.name} className="text-center space-y-1">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2", stat.color)}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-lg font-black tracking-tight">{stat.value}</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter leading-tight">{stat.name}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text"
            placeholder="Search by username or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full pl-12 pr-4 py-4 rounded-2xl border focus:ring-2 focus:ring-pink-500 transition-all text-sm font-bold",
              theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
            )}
          />
        </div>
        <button className={cn(
          "px-6 py-4 rounded-2xl border flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest",
          theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
        )}>
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Team List */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest px-2">Team Members</h3>
        <div className="grid gap-4">
          {filteredReferrals.map((member) => (
            <div 
              key={member.userId}
              className={cn(
                "rounded-3xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:scale-[1.01]",
                theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                  theme === 'dark' ? "bg-[#252841]" : "bg-slate-100"
                )}>
                  <UserIcon className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-black text-lg tracking-tight">{member.firstName} {member.lastName}</h4>
                    <span className="text-[10px] font-black bg-slate-500/10 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest">ID: {member.userId}</span>
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                      member.status === 'active' 
                        ? "bg-emerald-500/10 text-emerald-500" 
                        : "bg-rose-500/10 text-rose-500"
                    )}>
                      {member.status || 'inactive'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                      <UserIcon className="w-3 h-3" />
                      {member.userName}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold tracking-widest">
                      <Mail className="w-3 h-3" />
                      {member.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Sales: BDT {(member.totalEarned || 0).toFixed(2)}</span>
                    <div className="w-1 h-1 bg-slate-500 rounded-full" />
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Level {member.level || 1}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className={cn(
                  "px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2",
                  member.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>
                  {member.status === 'active' ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                  {member.status === 'active' ? 'Active' : 'Non-active'}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          ))}

          {filteredReferrals.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest">No team members found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
