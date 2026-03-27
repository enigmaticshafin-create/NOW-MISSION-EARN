import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Mail, Facebook, Send, Instagram, Upload, CheckCircle2, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { db, storage } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface SellPageProps {
  type: 'Gmail' | 'Facebook' | 'Telegram' | 'Instagram';
}

export default function SellPage({ type }: SellPageProps) {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [form, setForm] = useState({
    accountDetails: '',
    price: '',
    description: ''
  });
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const icons = {
    Gmail: Mail,
    Facebook: Facebook,
    Telegram: Send,
    Instagram: Instagram
  };

  const colors = {
    Gmail: 'bg-red-500',
    Facebook: 'bg-blue-600',
    Telegram: 'bg-sky-500',
    Instagram: 'bg-pink-600'
  };

  const Icon = icons[type];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      let screenshotUrl = '';
      if (screenshot) {
        const storageRef = ref(storage, `sell_requests/${user.uid}/${Date.now()}_${screenshot.name}`);
        await uploadBytes(storageRef, screenshot);
        screenshotUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'sellRequests'), {
        userId: user.uid,
        userName: profile.userName,
        userSequentialId: profile.userId,
        type,
        accountDetails: form.accountDetails,
        price: parseFloat(form.price),
        description: form.description,
        screenshot: screenshotUrl,
        status: 'pending',
        submittedAt: new Date().toISOString()
      });

      setMessage({ type: 'success', text: 'Your sell request has been submitted for review!' });
      setForm({ accountDetails: '', price: '', description: '' });
      setScreenshot(null);
    } catch (error) {
      console.error('Error submitting sell request:', error);
      setMessage({ type: 'error', text: 'Failed to submit request. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pt-8 pb-20 px-4">
      <div className="flex items-center gap-4">
        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg", colors[type])}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight italic uppercase">{type} Sell</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Submit your account for sale</p>
        </div>
      </div>

      <div className={cn(
        "rounded-[2.5rem] p-8 border space-y-6",
        theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
      )}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Account Details (Email/Username & Password)</label>
            <textarea 
              value={form.accountDetails}
              onChange={(e) => setForm({ ...form, accountDetails: e.target.value })}
              placeholder="Enter account credentials..."
              className={cn(
                "w-full px-6 py-4 rounded-2xl border focus:ring-2 focus:ring-pink-500 transition-all text-sm font-bold min-h-[100px]",
                theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
              )}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Asking Price (BDT)</label>
              <input 
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="500"
                className={cn(
                  "w-full px-6 py-4 rounded-2xl border focus:ring-2 focus:ring-pink-500 transition-all text-sm font-bold",
                  theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                )}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Account Screenshot</label>
              <label className={cn(
                "flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all",
                theme === 'dark' ? "bg-[#0a0b14] border-[#303456] hover:border-pink-500" : "bg-slate-50 border-slate-200 hover:border-pink-500"
              )}>
                <Upload className="w-5 h-5 text-pink-500" />
                <span className="text-xs font-bold text-slate-500 truncate">
                  {screenshot ? screenshot.name : 'Upload Proof'}
                </span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)} 
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Additional Description</label>
            <textarea 
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Any other details about the account..."
              className={cn(
                "w-full px-6 py-4 rounded-2xl border focus:ring-2 focus:ring-pink-500 transition-all text-sm font-bold min-h-[80px]",
                theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
              )}
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
            disabled={isSubmitting}
            className="w-full bg-pink-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>Submit for Sale <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
