import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Facebook, Send, Instagram, Mail, CheckCircle2, AlertCircle, Loader2, ChevronRight, ShieldCheck, Copy, Play, X as CloseIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { db, auth } from '../firebase';
import { collection, addDoc, doc, getDoc, runTransaction, increment } from 'firebase/firestore';
import { SocialSellSettings } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface SellPageProps {
  type: 'Facebook' | 'Telegram' | 'Instagram' | 'Gmail';
}

export default function SellPage({ type }: SellPageProps) {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [settings, setSettings] = useState<SocialSellSettings | null>(null);
  
  const [showVideo, setShowVideo] = useState(false);
  
  // Specific fields based on type
  const [form, setForm] = useState({
    email: '',
    password: '',
    twoFactor: '',
    name: '',
    username: '',
  });
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'socialSell'));
        if (snap.exists()) {
          const data = snap.data() as SocialSellSettings;
          setSettings(data);
          
          // Determine the correct password for this platform
          let platformPassword = data.adminPassword || '';
          if (type === 'Facebook' && data.facebookPassword) platformPassword = data.facebookPassword;
          if (type === 'Instagram' && data.instagramPassword) platformPassword = data.instagramPassword;
          if (type === 'Gmail' && data.gmailPassword) platformPassword = data.gmailPassword;
          if (type === 'Telegram' && data.telegramPassword) platformPassword = data.telegramPassword;

          setForm(prev => ({ ...prev, password: platformPassword }));
        }
      } catch (error) {
        console.error('Error fetching social sell settings:', error);
      }
    };
    fetchSettings();
  }, [type]);

  const icons = {
    Facebook: Facebook,
    Telegram: Send,
    Instagram: Instagram,
    Gmail: Mail
  };

  const colors = {
    Facebook: 'bg-blue-600',
    Telegram: 'bg-sky-500',
    Instagram: 'bg-pink-600',
    Gmail: 'bg-red-500'
  };

  const Icon = icons[type];

  const currentPrice = settings ? (
    type === 'Facebook' ? settings.facebookPrice :
    type === 'Instagram' ? settings.instagramPrice :
    type === 'Gmail' ? settings.gmailPrice :
    settings.telegramPrice
  ) : 0;

  const isEnabled = settings ? (
    type === 'Facebook' ? settings.facebookEnabled :
    type === 'Instagram' ? settings.instagramEnabled :
    type === 'Gmail' ? settings.gmailEnabled :
    settings.telegramEnabled
  ) : true;

  const disabledReason = settings ? (
    type === 'Facebook' ? settings.facebookDisabledReason :
    type === 'Instagram' ? settings.instagramDisabledReason :
    type === 'Gmail' ? settings.gmailDisabledReason :
    settings.telegramDisabledReason
  ) : '';

  const videoUrl = settings ? (
    type === 'Facebook' ? settings.facebookVideoUrl :
    type === 'Instagram' ? settings.instagramVideoUrl :
    type === 'Gmail' ? settings.gmailVideoUrl :
    settings.telegramVideoUrl
  ) : '';

  const currentPlatformPassword = settings ? (
    (type === 'Facebook' && settings.facebookPassword) ? settings.facebookPassword :
    (type === 'Instagram' && settings.instagramPassword) ? settings.instagramPassword :
    (type === 'Gmail' && settings.gmailPassword) ? settings.gmailPassword :
    (type === 'Telegram' && settings.telegramPassword) ? settings.telegramPassword :
    settings.adminPassword
  ) : '';

  if (profile?.status !== 'active') {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center space-y-6 px-4 pt-8 pb-20">
        <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <ShieldCheck className="w-12 h-12 text-rose-500" />
        </div>
        <h2 className="text-3xl font-black tracking-tight italic uppercase">Account Inactive</h2>
        <p className={cn(
          "text-lg font-bold leading-relaxed",
          theme === 'dark' ? "text-slate-400" : "text-slate-600"
        )}>
          আপনার অ্যাকাউন্টটি একটিভ নয়! কাজ করার জন্য আপনার অ্যাকাউন্ট একটিভ করুন ধন্যবাদ!!
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-rose-500 text-white px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:scale-105 transition-all"
        >
          Go to Dashboard to Activate
        </button>
      </div>
    );
  }

  if (!isEnabled) {
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
          "rounded-[2.5rem] p-12 border text-center space-y-6",
          theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
        )}>
          <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black italic uppercase tracking-tight">Temporarily <span className="text-rose-500">Unavailable</span></h3>
            <p className="text-slate-500 font-medium">{disabledReason || `${type} selling is currently off.`}</p>
          </div>
          <button 
            onClick={() => window.history.back()}
            className="w-full bg-slate-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-slate-500/20 uppercase tracking-widest text-xs"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const isAdmin = ['admin', 'moderator', 'ceo'].includes(profile.role);
      const status = isAdmin ? 'approved' : 'pending';
      
      const submissionData: any = {
        userId: user.uid,
        userName: profile.userName || user.displayName || user.email?.split('@')[0] || 'User',
        userSequentialId: profile.userId || '000000',
        type,
        platform: type,
        price: currentPrice || 0,
        status,
        submittedAt: new Date().toISOString()
      };

      if (type === 'Facebook' || type === 'Instagram') {
        submissionData.email = form.email || '';
        submissionData.password = form.password || '';
        submissionData.twoFactor = form.twoFactor || '';
      } else if (type === 'Gmail') {
        submissionData.email = form.email || '';
        submissionData.password = form.password || '';
      }

      if (isAdmin) {
        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await transaction.get(userRef);
          
          if (!userSnap.exists()) throw new Error("User profile not found");
          
          const newSellRef = doc(collection(db, 'socialSells'));
          transaction.set(newSellRef, submissionData);
          
          const price = currentPrice || 0;
          let balanceField = '';
          let earningsField = '';
          
          switch(type) {
            case 'Facebook': balanceField = 'facebookBalance'; earningsField = 'facebookEarnings'; break;
            case 'Instagram': balanceField = 'instagramBalance'; earningsField = 'instagramEarnings'; break;
            case 'Telegram': balanceField = 'telegramBalance'; earningsField = 'telegramEarnings'; break;
            case 'Gmail': balanceField = 'gmailBalance'; earningsField = 'gmailEarnings'; break;
          }
          
          const updates: any = {
            balance: increment(price),
            totalEarned: increment(price)
          };
          
          if (balanceField) updates[balanceField] = increment(price);
          if (earningsField) updates[earningsField] = increment(price);
          
          transaction.update(userRef, updates);
        });
        setMessage({ type: 'success', text: 'Admin submission auto-approved and balance updated!' });
      } else {
        await addDoc(collection(db, 'socialSells'), submissionData);
        setMessage({ type: 'success', text: 'Your sell request has been submitted for review! (আপনার বিক্রয় অনুরোধটি পর্যালোচনার জন্য জমা দেওয়া হয়েছে!)' });
      }
      // Determine the correct password for this platform to reset form correctly
      let platformPassword = settings?.adminPassword || '';
      if (type === 'Facebook' && settings?.facebookPassword) platformPassword = settings.facebookPassword;
      if (type === 'Instagram' && settings?.instagramPassword) platformPassword = settings.instagramPassword;
      if (type === 'Gmail' && settings?.gmailPassword) platformPassword = settings.gmailPassword;
      if (type === 'Telegram' && settings?.telegramPassword) platformPassword = settings.telegramPassword;

      setForm({
        email: '',
        password: platformPassword,
        twoFactor: '',
        name: '',
        username: '',
      });
    } catch (error) {
      console.error('Error submitting sell request:', error);
      try {
        handleFirestoreError(error, OperationType.WRITE, 'socialSells');
      } catch (detailedError: any) {
        const errorData = JSON.parse(detailedError.message);
        setMessage({ 
          type: 'error', 
          text: `Submission failed: ${errorData.error}. Please contact support.` 
        });
        return;
      }
      setMessage({ type: 'error', text: 'Failed to submit request. Please try again. (অনুরোধ জমা দিতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।)' });
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
          <div className="flex-1">
            <h2 className="text-3xl font-black tracking-tight italic uppercase">{type} Sell</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Price: <span className="text-pink-500">{currentPrice} BDT</span></p>
          </div>
          {videoUrl && (
            <button 
              onClick={() => setShowVideo(true)}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-all">
                <Play className="w-6 h-6 text-white fill-current" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Tutorial</span>
            </button>
          )}
        </div>

        {showVideo && videoUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
              <button 
                onClick={() => setShowVideo(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-rose-500 text-white rounded-full transition-all"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
              <iframe 
                src={videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') 
                  ? `https://www.youtube.com/embed/${videoUrl.split('v=')[1]?.split('&')[0] || videoUrl.split('/').pop()}`
                  : videoUrl
                }
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>
        )}

      <div className={cn(
        "rounded-[2.5rem] p-8 border space-y-6",
        theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
      )}>
        {currentPlatformPassword && (
          <div className="p-6 rounded-3xl bg-pink-500/5 border border-pink-500/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Required Password</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(currentPlatformPassword);
                  setMessage({ type: 'success', text: 'Password copied!' });
                }}
                className="flex items-center gap-2 text-pink-500 hover:scale-105 transition-all"
              >
                <Copy className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Copy</span>
              </button>
            </div>
            <div className="text-2xl font-black tracking-tight text-pink-500">{currentPlatformPassword}</div>
            <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">
              * এই পাসওয়ার্ডটি ব্যবহার করে আপনার অ্যাকাউন্টটি সেটআপ করুন। অন্য কোনো পাসওয়ার্ড গ্রহণ করা হবে না।
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Gmail/Email</label>
              <input 
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Enter your Gmail"
                className={cn(
                  "w-full px-6 py-4 rounded-2xl border focus:ring-2 focus:ring-pink-500 transition-all text-sm font-bold",
                  theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                )}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Password (Automatic)</label>
              <input 
                value={form.password}
                readOnly
                className={cn(
                  "w-full px-6 py-4 rounded-2xl border transition-all text-sm font-bold opacity-70 cursor-not-allowed",
                  theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                )}
                required
              />
            </div>

            {(type === 'Facebook' || type === 'Instagram') && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">2FA Code</label>
                <input 
                  value={form.twoFactor}
                  onChange={(e) => setForm({ ...form, twoFactor: e.target.value })}
                  placeholder="Enter 2FA Code"
                  className={cn(
                    "w-full px-6 py-4 rounded-2xl border focus:ring-2 focus:ring-pink-500 transition-all text-sm font-bold",
                    theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                  )}
                  required
                />
              </div>
            )}
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
