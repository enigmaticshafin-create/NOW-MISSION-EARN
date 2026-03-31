import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, doc, getDoc, writeBatch, where, increment } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { 
  ArrowUpCircle, 
  CheckCircle2, 
  Clock, 
  X, 
  ChevronRight, 
  ShieldCheck, 
  AlertCircle,
  Wallet,
  Smartphone,
  CreditCard,
  Banknote,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function Withdraw() {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [amount, setAmount] = useState('');
  const [paymentNumber, setPaymentNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawSettings, setWithdrawSettings] = useState<any>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, 'settings', 'withdraw');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setWithdrawSettings(docSnap.data());
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    const withdrawAmount = parseFloat(amount);
    const minWithdraw = withdrawSettings.minWithdraw || 110;
    const maxWithdraw = withdrawSettings.maxWithdraw || 120000;

    if (!amount || !paymentNumber) {
      setMessage({ type: 'error', text: 'অনুগ্রহ করে সব ঘর পূরণ করুন।' });
      return;
    }

    if (withdrawAmount < minWithdraw) {
      setMessage({ type: 'error', text: `সর্বনিম্ন উইথড্র পরিমাণ হলো BDT ${minWithdraw}` });
      return;
    }

    if (withdrawAmount > maxWithdraw) {
      setMessage({ type: 'error', text: `সর্বোচ্চ উইথড্র পরিমাণ হলো BDT ${maxWithdraw}` });
      return;
    }

    if (withdrawAmount > (profile.balance || 0)) {
      setMessage({ type: 'error', text: 'আপনার ব্যালেন্স পর্যাপ্ত নয়।' });
      return;
    }

    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);

      // 1. Create withdrawal request
      const requestRef = doc(collection(db, 'withdrawals'));
      batch.set(requestRef, {
        userId: user.uid,
        userName: profile.userName || 'Anonymous',
        userSequentialId: profile.userId || 'N/A',
        method,
        amount: withdrawAmount,
        paymentNumber,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      });

      // 2. Deduct balance (optimistic)
      const userRef = doc(db, 'users', user.uid);
      batch.update(userRef, {
        balance: increment(-withdrawAmount)
      });

      await batch.commit();

      setMessage({ type: 'success', text: 'উইথড্র রিকোয়েস্ট সফলভাবে জমা দেওয়া হয়েছে! এডমিন শীঘ্রই এটি পর্যালোচনা করবেন।' });
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      setMessage({ type: 'error', text: 'উইথড্র রিকোয়েস্ট জমা দিতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
          <ArrowUpCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight italic uppercase">টাকা উত্তোলন</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">আপনার উপার্জন করা টাকা তুলুন</p>
        </div>
      </div>

      {/* Balance Card */}
      <div className={cn(
        "rounded-[2.5rem] p-8 border relative overflow-hidden",
        theme === 'dark' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-100"
      )}>
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">বর্তমান ব্যালেন্স</p>
            <h3 className="text-4xl font-black tracking-tight text-emerald-600 italic">BDT {(profile?.balance || 0).toFixed(2)}</h3>
          </div>
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <Wallet className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-3xl -mr-32 -mt-32" />
      </div>

      <div className={cn(
        "rounded-[2.5rem] p-8 border space-y-8",
        theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
      )}>
        {/* Step 1: Select Method */}
        <div className="space-y-4">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">উত্তোলন পদ্ধতি নির্বাচন করুন</label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'bkash', name: 'bKash', color: 'bg-pink-500' },
              { id: 'nagad', name: 'Nagad', color: 'bg-orange-500' },
              { id: 'rocket', name: 'Rocket', color: 'bg-purple-600' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id as any)}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                  method === m.id 
                    ? "border-emerald-500 bg-emerald-500/5" 
                    : "border-transparent bg-slate-500/5"
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", m.color)}>
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">পরিমাণ (BDT)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={cn(
                  "w-full p-4 rounded-2xl border focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-bold",
                  theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-white border-slate-200"
                )}
              />
              <div className="flex items-center gap-1 px-2">
                <Info className="w-3 h-3 text-slate-500" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                  সর্বনিম্ন: BDT {withdrawSettings.minWithdraw || 110} • সর্বোচ্চ: BDT {withdrawSettings.maxWithdraw || 120000}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">আপনার নাম্বার</label>
              <input
                type="text"
                value={paymentNumber}
                onChange={(e) => setPaymentNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                className={cn(
                  "w-full p-4 rounded-2xl border focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-bold",
                  theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-white border-slate-200"
                )}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-emerald-500 leading-relaxed italic">
              উইথড্র রিকোয়েস্ট দেওয়ার ২৪-৪৮ ঘণ্টার মধ্যে আপনার পেমেন্ট সম্পন্ন করা হবে। দয়া করে সঠিক নাম্বার প্রদান করুন।
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>উইথড্র রিকোয়েস্ট পাঠান <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
        </form>
      </div>
      {/* Toast Message */}
      {message && (
        <div className={cn(
          "fixed bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-[100]",
          message.type === 'success' ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        )}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-2 opacity-50 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
