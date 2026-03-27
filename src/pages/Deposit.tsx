import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, doc, getDoc, writeBatch, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { 
  ArrowDownCircle, 
  CheckCircle2, 
  Clock, 
  X, 
  ChevronRight, 
  ShieldCheck, 
  Upload,
  AlertCircle,
  Copy,
  Wallet,
  Smartphone,
  CreditCard,
  Banknote
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function Deposit() {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentNumber, setPaymentNumber] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<any>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, 'settings', 'payment');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPaymentSettings(docSnap.data());
      }
    };
    fetchSettings();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const copyNumber = () => {
    const number = paymentSettings[method] || '';
    navigator.clipboard.writeText(number);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!amount || !transactionId || !paymentNumber || !screenshot) {
      alert('Please fill all fields and upload a screenshot.');
      return;
    }

    setIsSubmitting(true);
    try {
      const storageRef = ref(storage, `deposits/${user.uid}/${Date.now()}_${screenshot.name}`);
      await uploadBytes(storageRef, screenshot);
      const screenshotUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'deposits'), {
        userId: user.uid,
        userName: profile?.userName || 'Anonymous',
        userSequentialId: profile?.userId || 'N/A',
        method,
        amount: parseFloat(amount),
        transactionId,
        paymentNumber,
        screenshot: screenshotUrl,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      });

      alert('Deposit request submitted successfully! Admin will review it soon.');
      navigate('/');
    } catch (error) {
      console.error('Error submitting deposit:', error);
      alert('Failed to submit deposit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
          <ArrowDownCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight italic uppercase">Deposit Funds</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Add balance to your wallet</p>
        </div>
      </div>

      <div className={cn(
        "rounded-[2.5rem] p-8 border space-y-8",
        theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
      )}>
        {/* Step 1: Select Method */}
        <div className="space-y-4">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Select Payment Method</label>
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
                    ? "border-blue-500 bg-blue-500/5" 
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

        {/* Step 2: Payment Details */}
        <div className={cn(
          "p-6 rounded-3xl border space-y-4",
          theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Send Money to</p>
              <p className="text-xl font-black tracking-tight text-blue-500">{paymentSettings[method] || 'Loading...'}</p>
            </div>
            <button 
              onClick={copyNumber}
              className={cn(
                "p-3 rounded-xl transition-all",
                copySuccess ? "bg-green-500 text-white" : "bg-blue-500 text-white"
              )}
            >
              {copySuccess ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-blue-500 leading-relaxed italic">
              দয়া করে উপরের নাম্বারে "Send Money" করুন। পেমেন্ট সম্পন্ন হলে নিচের তথ্যগুলো পূরণ করুন।
            </p>
          </div>
        </div>

        {/* Step 3: Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Amount (BDT)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={cn(
                  "w-full p-4 rounded-2xl border focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold",
                  theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-white border-slate-200"
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Your Number</label>
              <input
                type="text"
                value={paymentNumber}
                onChange={(e) => setPaymentNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                className={cn(
                  "w-full p-4 rounded-2xl border focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold",
                  theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-white border-slate-200"
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Transaction ID</label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter Transaction ID"
              className={cn(
                "w-full p-4 rounded-2xl border focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold",
                theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-white border-slate-200"
              )}
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Upload Screenshot</label>
            <div className="relative group">
              <input
                type="file"
                id="screenshot-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <label
                htmlFor="screenshot-upload"
                className={cn(
                  "flex flex-col items-center justify-center gap-3 p-8 rounded-3xl border-2 border-dashed cursor-pointer transition-all",
                  theme === 'dark' 
                    ? "bg-[#0a0b14] border-[#303456] hover:border-blue-500/50" 
                    : "bg-slate-50 border-slate-200 hover:border-blue-500/50",
                  screenshot && "border-blue-500 bg-blue-500/5"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                  screenshot ? "bg-blue-500" : "bg-slate-500/20"
                )}>
                  {screenshot ? <CheckCircle2 className="w-6 h-6 text-white" /> : <Upload className="w-6 h-6 text-blue-500" />}
                </div>
                <div className="text-center">
                  <p className="text-sm font-black uppercase tracking-widest">
                    {screenshot ? "Screenshot Selected" : "Upload Payment Proof"}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 mt-1">
                    {screenshot ? `1 Item Selected` : "PNG, JPG up to 5MB"}
                  </p>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Submit Deposit <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
