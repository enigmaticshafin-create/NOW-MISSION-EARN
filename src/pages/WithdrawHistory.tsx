import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { Withdrawal } from '../types';
import { 
  History, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle,
  Calendar,
  DollarSign,
  Smartphone,
  ArrowUpCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function WithdrawHistory() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, 'withdrawals'), 
          where('userId', '==', user.uid),
          orderBy('submittedAt', 'desc')
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal));
        setWithdrawals(data);
      } catch (error) {
        console.error('Error fetching withdrawal history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const stats = [
    { name: 'Total Requests', value: withdrawals.length, icon: History, color: 'bg-blue-500' },
    { name: 'Completed', value: withdrawals.filter(w => w.status === 'completed').length, icon: CheckCircle2, color: 'bg-emerald-500' },
    { name: 'Rejected', value: withdrawals.filter(w => w.status === 'rejected').length, icon: XCircle, color: 'bg-rose-500' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
          <ArrowUpCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight italic uppercase">উত্তোলন ইতিহাস</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">আপনার সকল উইথড্র রিকোয়েস্ট ট্র্যাক করুন</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div 
            key={stat.name}
            className={cn(
              "rounded-3xl p-4 border flex flex-col items-center text-center gap-2",
              theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
            )}
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg", stat.color)}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xl font-black tracking-tight">{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-tight">{stat.name}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {withdrawals.map((withdrawal) => (
          <div 
            key={withdrawal.id}
            className={cn(
              "rounded-3xl p-6 border transition-all hover:scale-[1.01]",
              theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    withdrawal.method === 'bkash' ? "bg-pink-500" :
                    withdrawal.method === 'nagad' ? "bg-orange-500" : "bg-purple-600"
                  )}>
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg tracking-tight uppercase">{withdrawal.method}</h4>
                    <p className="text-xs font-bold text-slate-500 tracking-widest">{withdrawal.paymentNumber}</p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ml-2",
                    withdrawal.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                    withdrawal.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" :
                    "bg-rose-500/10 text-rose-500"
                  )}>
                    {withdrawal.status === 'pending' ? <Clock className="w-3 h-3" /> :
                     withdrawal.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> :
                     <XCircle className="w-3 h-3" />}
                    {withdrawal.status}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(withdrawal.submittedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <DollarSign className="w-3.5 h-3.5" />
                    BDT {withdrawal.amount.toFixed(2)}
                  </div>
                </div>
              </div>

              {withdrawal.status === 'rejected' && withdrawal.rejectionReason && (
                <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-start gap-3 max-w-xs">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-rose-500/80 italic">
                    Rejection Reason: {withdrawal.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {withdrawals.length === 0 && (
          <div className="text-center py-20">
            <History className="w-16 h-16 text-slate-400 mx-auto mb-6" />
            <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest">No Withdrawal History Found</h3>
            <p className="text-sm font-bold text-slate-400 mt-2">Your withdrawal requests will appear here once submitted.</p>
          </div>
        )}
      </div>
    </div>
  );
}
