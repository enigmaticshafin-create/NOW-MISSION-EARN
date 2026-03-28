import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Mail, Facebook, Send, Instagram, Upload, CheckCircle2, AlertCircle, Loader2, ChevronRight, Copy, RefreshCw } from 'lucide-react';
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

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm({ ...form, password });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

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

      const submissionData: any = {
        userId: user.uid,
        userName: profile.userName,
        userSequentialId: profile.userId,
        type,
        price: parseFloat(form.price),
        description: form.description,
        screenshot: screenshotUrl,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };

      if (type === 'Facebook' || type === 'Instagram') {
        submissionData.name = form.name;
        submissionData.username = form.username;
        submissionData.email = form.email;
        submissionData.password = form.password;
        submissionData.twoFactor = form.twoFactor;
      } else if (type === 'Gmail') {
        submissionData.gmail = form.gmail;
        submissionData.password = form.password;
      }

      await addDoc(collection(db, 'socialSells'), submissionData);

      setMessage({ type: 'success', text: 'Your sell request has been submitted for review!' });
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
      setMessage({ type: 'error', text: 'Failed to submit request. Please try again.' });
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
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Submit your account for sale</p>
        </div>
      </div>

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
                <div className="relative">
                  <input 
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter strong password"
                    className={cn(
                      "w-full px-6 py-4 rounded-2xl border focus:ring-2 focus:ring-pink-500 transition-all text-sm font-bold pr-24",
                      theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                    )}
                    required
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button 
                      type="button"
                      onClick={generatePassword}
                      className="p-2 hover:bg-pink-500/10 rounded-xl text-pink-500 transition-colors"
                      title="Generate Password"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => copyToClipboard(form.password)}
                      className="p-2 hover:bg-pink-500/10 rounded-xl text-pink-500 transition-colors"
                      title="Copy Password"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

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
