import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Mail, Facebook, Send, Instagram, Upload, CheckCircle2, AlertCircle, Loader2, ChevronRight, Copy, RefreshCw, ShieldCheck, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { db, storage } from '../firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { SocialSellSettings } from '../types';

interface SellPageProps {
  type: 'Gmail' | 'Facebook' | 'Telegram' | 'Instagram';
}

export default function SellPage({ type }: SellPageProps) {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [settings, setSettings] = useState<SocialSellSettings | null>(null);
  
  // Specific fields based on type
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    twoFactor: '',
    gmail: '',
    price: '',
    description: ''
  });
  
  const [screenshot, setScreenshot] = useState<File | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'socialSell'));
        if (snap.exists()) {
          setSettings(snap.data() as SocialSellSettings);
        }
      } catch (error) {
        console.error('Error fetching social sell settings:', error);
      }
    };
    fetchSettings();
  }, []);

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

  const currentPrice = settings ? (
    type === 'Gmail' ? settings.gmailPrice :
    type === 'Facebook' ? settings.facebookPrice :
    type === 'Instagram' ? settings.instagramPrice :
    settings.telegramPrice
  ) : 0;

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

  const adminPassword = settings ? (
    type === 'Gmail' ? settings.gmailPassword :
    type === 'Facebook' ? settings.facebookPassword :
    type === 'Instagram' ? settings.instagramPassword :
    settings.telegramPassword
  ) : '';

  const generatePassword = () => {
    if (adminPassword) {
      setForm({ ...form, password: adminPassword });
    } else {
      setMessage({ type: 'error', text: 'অ্যাডমিন এই প্ল্যাটফর্মের জন্য কোনো ডিফল্ট পাসওয়ার্ড সেট করেননি।' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'ক্লিপবোর্ডে কপি করা হয়েছে!' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const submissionData: any = {
        userId: user.uid,
        userName: profile.userName,
        userSequentialId: profile.userId,
        type,
        platform: type, // Add platform for AdminPanel compatibility
        price: currentPrice,
        description: form.description,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };

      if (type === 'Facebook' || type === 'Instagram') {
        submissionData.name = form.name;
        submissionData.idName = form.name; // Add idName for AdminPanel compatibility
        submissionData.username = form.username;
        submissionData.email = form.email;
        submissionData.password = form.password;
        submissionData.twoFactor = form.twoFactor;
      } else if (type === 'Gmail') {
        submissionData.gmail = form.gmail;
        submissionData.email = form.gmail; // Add email for AdminPanel compatibility
        submissionData.password = form.password;
      }

      await addDoc(collection(db, 'socialSells'), submissionData);

      setMessage({ type: 'success', text: 'Your sell request has been submitted for review! (আপনার বিক্রয় অনুরোধটি পর্যালোচনার জন্য জমা দেওয়া হয়েছে!)' });
      setForm({
        name: '',
        username: '',
        email: '',
        password: '',
        twoFactor: '',
        gmail: '',
        price: '',
        description: ''
      });
      setScreenshot(null);
    } catch (error) {
      console.error('Error submitting sell request:', error);
      setMessage({ type: 'error', text: 'Failed to submit request. Please try again. (অনুরোধ জমা দিতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।)' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (type === 'Telegram') {
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
          <div className="w-20 h-20 bg-sky-500/10 rounded-3xl flex items-center justify-center mx-auto">
            <Send className="w-10 h-10 text-sky-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black italic uppercase tracking-tight">Temporarily <span className="text-sky-500">Unavailable</span></h3>
            <p className="text-slate-500 font-medium">Telegram selling will resume in a few days. Please check back later.</p>
          </div>
          <button 
            onClick={() => window.history.back()}
            className="w-full bg-sky-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-sky-500/20 uppercase tracking-widest text-xs"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pt-8 pb-20 px-4">
      <div className="flex items-center gap-4">
        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg", colors[type])}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight italic uppercase">{type} Sell</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Price: <span className="text-pink-500">{currentPrice} BDT</span></p>
        </div>
      </div>

      {/* Password Generation Section at the Top */}
      <div className={cn(
        "p-6 rounded-3xl border space-y-4",
        theme === 'dark' ? "bg-pink-500/5 border-pink-500/20" : "bg-pink-50 border-pink-100"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-pink-500 italic">Password Management</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Generate a strong password for your account</p>
          </div>
          <button 
            type="button"
            onClick={generatePassword}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-pink-500/20 hover:scale-105 transition-all"
          >
            <RefreshCw className="w-3 h-3" />
            SET PASSWORD
          </button>
        </div>
        {form.password && (
          <div className={cn(
            "p-3 rounded-xl border flex items-center justify-between gap-3",
            theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-white border-slate-200"
          )}>
            <code className="text-sm font-mono font-bold text-pink-500">{form.password}</code>
            <button 
              type="button"
              onClick={() => copyToClipboard(form.password)}
              className="p-2 hover:bg-pink-500/10 rounded-lg text-pink-500 transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {settings?.approvalMessage && (
        <div className={cn(
          "p-6 rounded-3xl border flex items-start gap-4",
          theme === 'dark' ? "bg-blue-500/5 border-blue-500/20" : "bg-blue-50 border-blue-100"
        )}>
          <AlertCircle className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
          <div className="space-y-1">
            <p className={cn(
              "text-sm font-bold leading-relaxed",
              theme === 'dark' ? "text-blue-200" : "text-blue-900"
            )}>
              {settings.approvalMessage}
            </p>
            {settings.telegramSupport && (
              <a 
                href={settings.telegramSupport}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-500 hover:underline mt-2"
              >
                <MessageCircle className="w-3 h-3" />
                Contact Support on Telegram
              </a>
            )}
          </div>
        </div>
      )}

      <div className={cn(
        "rounded-[2.5rem] p-8 border space-y-6",
        theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
      )}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {(type === 'Facebook' || type === 'Instagram') && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">{type} ID Name</label>
                  <input 
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className={cn(
                      "w-full px-6 py-4 rounded-2xl border focus:ring-2 focus:ring-pink-500 transition-all text-sm font-bold",
                      theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                    )}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">{type} ID Username</label>
                  <input 
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="e.g. johndoe123"
                    className={cn(
                      "w-full px-6 py-4 rounded-2xl border focus:ring-2 focus:ring-pink-500 transition-all text-sm font-bold",
                      theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                    )}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Email Address</label>
                  <input 
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. john@example.com"
                    className={cn(
                      "w-full px-6 py-4 rounded-2xl border focus:ring-2 focus:ring-pink-500 transition-all text-sm font-bold",
                      theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                    )}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Password</label>
                  <input 
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter password"
                    className={cn(
                      "w-full px-6 py-4 rounded-2xl border focus:ring-2 focus:ring-pink-500 transition-all text-sm font-bold",
                      theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                    )}
                    required
                    readOnly={!!adminPassword}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">2FA Code (Optional)</label>
                <input 
                  value={form.twoFactor}
                  onChange={(e) => setForm({ ...form, twoFactor: e.target.value })}
                  placeholder="Enter 2FA backup codes or secret"
                  className={cn(
                    "w-full px-6 py-4 rounded-2xl border focus:ring-2 focus:ring-pink-500 transition-all text-sm font-bold",
                    theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                  )}
                />
              </div>
            </>
          )}

          {type === 'Gmail' && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Gmail Address</label>
                <input 
                  type="email"
                  value={form.gmail}
                  onChange={(e) => setForm({ ...form, gmail: e.target.value })}
                  placeholder="e.g. example@gmail.com"
                  className={cn(
                    "w-full px-6 py-4 rounded-2xl border focus:ring-2 focus:ring-pink-500 transition-all text-sm font-bold",
                    theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                  )}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                  <span className="text-[9px] font-bold text-pink-500 italic">Password must be strong</span>
                </div>
                <input 
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter strong password"
                  className={cn(
                    "w-full px-6 py-4 rounded-2xl border focus:ring-2 focus:ring-pink-500 transition-all text-sm font-bold",
                    theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                  )}
                  required
                  readOnly={!!adminPassword}
                />
              </div>
            </>
          )}

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
