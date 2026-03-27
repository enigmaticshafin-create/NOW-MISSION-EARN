import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, increment, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { Gift, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { GiftCode as GiftCodeType } from '../types';

export default function GiftCode() {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !code.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const q = query(collection(db, 'giftCodes'), where('code', '==', code.trim().toUpperCase()));
      const snap = await getDocs(q);

      if (snap.empty) {
        setMessage({ type: 'error', text: 'Invalid gift code!' });
        return;
      }

      const giftDoc = snap.docs[0];
      const giftData = giftDoc.data() as GiftCodeType;

      if (giftData.status !== 'active') {
        setMessage({ type: 'error', text: 'This code is no longer active.' });
        return;
      }

      if (giftData.usedBy?.includes(user.uid)) {
        setMessage({ type: 'error', text: 'You have already used this code.' });
        return;
      }

      if (giftData.usageLimit && giftData.usedCount >= giftData.usageLimit) {
        setMessage({ type: 'error', text: 'This code has reached its usage limit.' });
        return;
      }

      // Update user balance and gift code usage
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        totalEarned: increment(giftData.amount),
        jobEarnings: increment(giftData.amount) // Adding to job earnings as a general bucket
      });

      await updateDoc(giftDoc.ref, {
        usedCount: increment(1),
        usedBy: arrayUnion(user.uid)
      });

      setMessage({ type: 'success', text: `Successfully redeemed BDT ${giftData.amount.toFixed(2)}!` });
      setCode('');
    } catch (error) {
      console.error('Error redeeming gift code:', error);
      setMessage({ type: 'error', text: 'Failed to redeem code. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8 pt-12 pb-20 px-4">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-pink-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-pink-500/20">
          <Gift className="w-10 h-10 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight italic uppercase">Use Gift Code</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Enter your code to claim rewards</p>
        </div>
      </div>

      <div className={cn(
        "rounded-[2.5rem] p-8 border space-y-6",
        theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
      )}>
        <form onSubmit={handleRedeem} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Gift Code</label>
            <input 
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ENTER-CODE-HERE"
              className={cn(
                "w-full px-6 py-4 rounded-2xl border focus:ring-2 focus:ring-pink-500 transition-all text-center font-black tracking-widest uppercase",
                theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
              )}
              required
            />
          </div>

          {message && (
            <div className={cn(
              "p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2",
              message.type === 'success' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
            )}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          <button 
            type="submit"
            disabled={isSubmitting || !code.trim()}
            className="w-full bg-pink-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Redeeming...</span>
              </div>
            ) : 'Redeem Code'}
          </button>
        </form>

        <div className={cn(
          "p-4 rounded-2xl border italic text-[10px] font-bold text-center",
          theme === 'dark' ? "bg-[#0a0b14] border-[#303456] text-slate-500" : "bg-slate-50 border-slate-200 text-slate-400"
        )}>
          "উপহার কোড ব্যবহার করে আপনার আয় বৃদ্ধি করুন। নতুন কোড পেতে আমাদের টেলিগ্রাম গ্রুপে যুক্ত থাকুন।"
        </div>
      </div>
    </div>
  );
}
