import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { UserProfile } from '../types';
import { 
  UserCheck, 
  User as UserIcon,
  ShieldCheck, 
  ShieldAlert,
  TrendingUp,
  ChevronRight,
  Search,
  Filter,
  Users,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function TeamLeader() {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const [teamLeaders, setTeamLeaders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserTeam, setSelectedUserTeam] = useState<UserProfile[]>([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);

  const handleViewTeam = async (user: UserProfile) => {
    setViewingUser(user);
    try {
      const q = query(collection(db, 'users'), where('referredBy', '==', user.userId));
      const snap = await getDocs(q);
      const team = snap.docs.map(doc => doc.data() as UserProfile);
      setSelectedUserTeam(team);
      setShowTeamModal(true);
    } catch (error) {
      console.error("View team error:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users who have a high referral count (e.g., > 10) or specific role
        const leadersQuery = query(
          collection(db, 'users'), 
          where('referrals', '>=', 10),
          orderBy('referrals', 'desc')
        );
        const leadersSnap = await getDocs(leadersQuery);
        const leadersData = leadersSnap.docs.map(doc => doc.data() as UserProfile);
        setTeamLeaders(leadersData);
      } catch (error) {
        console.error('Error fetching team leaders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredLeaders = teamLeaders.filter(leader => 
    leader.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leader.userId.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
          <UserCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight italic uppercase">Team Leaders</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Connect with our top performers</p>
        </div>
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

      {/* Leaders List */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest px-2">Top Team Leaders</h3>
        <div className="grid gap-4">
          {filteredLeaders.map((leader) => (
            <div 
              key={leader.userId}
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
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-lg tracking-tight">{leader.userName}</h4>
                    <span className="text-[10px] font-black bg-pink-500/10 text-pink-500 px-2 py-0.5 rounded-full uppercase tracking-widest">Leader</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                      <Users className="w-3 h-3" /> {leader.referrals || 0} Team Members
                    </span>
                    <div className="w-1 h-1 bg-slate-500 rounded-full" />
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> BDT {(leader.totalEarned || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <button 
                  onClick={() => handleViewTeam(leader)}
                  className="px-4 py-2 bg-pink-500/10 text-pink-500 rounded-full text-xs font-black uppercase tracking-widest hover:bg-pink-500 hover:text-white transition-all"
                >
                  View Team
                </button>
                <div className={cn(
                  "px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2",
                  leader.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>
                  {leader.status === 'active' ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                  {leader.status === 'active' ? 'Active' : 'Inactive'}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          ))}

          {filteredLeaders.length === 0 && (
            <div className="text-center py-12">
              <UserCheck className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest">No team leaders found</p>
            </div>
          )}
        </div>
      </div>

      {/* Team Modal */}
      {showTeamModal && viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTeamModal(false)} />
          <div className={cn(
            "relative w-full max-w-2xl rounded-[2.5rem] p-8 border shadow-2xl animate-in zoom-in-95 duration-200",
            theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
          )}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight italic uppercase">{viewingUser.userName}'s Team</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Members: {selectedUserTeam.length}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTeamModal(false)}
                className="p-2 hover:bg-slate-500/10 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {selectedUserTeam.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm font-black uppercase tracking-widest text-slate-400 italic">No team members yet</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {selectedUserTeam.map(member => (
                    <div 
                      key={member.uid}
                      className={cn(
                        "p-4 rounded-2xl border flex items-center justify-between",
                        theme === 'dark' ? "bg-slate-500/5 border-slate-500/10" : "bg-slate-50 border-slate-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-500/10 rounded-xl flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-black text-sm">{member.userName}</p>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID: {member.userId} | {member.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-pink-500">BDT {(member.totalEarned || 0).toFixed(2)}</p>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Earnings</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
