import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db, auth } from '../firebase';
import { doc, updateDoc, collection, query, where, onSnapshot, orderBy, addDoc, runTransaction, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User, Mail, Phone, Hash, Link as LinkIcon, Copy, CheckCircle2, Wallet, ArrowUpCircle, History, Settings, X, ArrowUpRight, AlertCircle, Camera, Loader2, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { storage } from '../firebase';
import { Withdrawal, MissionSubmission } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export const Profile: React.FC = () => {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    phoneNumber: profile?.phoneNumber || '',
    email: profile?.email || '',
    photoURL: profile?.photoURL || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [submissions, setSubmissions] = useState<MissionSubmission[]>([]);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | ''>('');
  const [paymentNumber, setPaymentNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [referralCount, setReferralCount] = useState(0);

  useEffect(() => {
    if (!user || !profile?.userId) return;

    const rQ = query(collection(db, 'users'), where('referredBy', '==', profile.userId), where('status', '==', 'active'));
    const unsubReferrals = onSnapshot(rQ, (snap) => {
      setReferralCount(snap.size);
    }, (error) => {
      console.error("Error fetching referral count:", error);
    });

    return () => unsubReferrals();
  }, [user, profile?.userId]);

  useEffect(() => {
    if (!user) return;

    const wQ = query(
      collection(db, 'withdrawals'), 
      where('userId', '==', user.uid),
      orderBy('requestedAt', 'desc')
    );
    const unsubWithdrawals = onSnapshot(wQ, (snap) => {
      setWithdrawals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal)));
    }, (error) => {
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, 'withdrawals');
      }
    });

    const sQ = query(
      collection(db, 'missionSubmissions'), 
      where('userId', '==', user.uid),
      orderBy('submittedAt', 'desc')
    );
    const unsubSubmissions = onSnapshot(sQ, (snap) => {
      setSubmissions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MissionSubmission)));
    }, (error) => {
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, 'missionSubmissions');
      }
    });

    return () => {
      unsubWithdrawals();
      unsubSubmissions();
    };
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        photoURL: formData.photoURL,
      });
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, photoURL: url }));
      await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
      setMessage({ type: 'success', text: 'Photo uploaded successfully!' });
    } catch (error) {
      console.error('Error uploading photo:', error);
      setMessage({ type: 'error', text: 'Failed to upload photo.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = parseFloat(amount);
    
    if (!profile || withdrawAmount <= 0 || withdrawAmount > profile.balance) {
      setMessage({ type: 'error', text: 'Invalid amount or insufficient balance.' });
      return;
    }

    if (!method || !paymentNumber) {
      setMessage({ type: 'error', text: 'Please select a method and enter your number.' });
      return;
    }

    setSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', auth.currentUser!.uid);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists()) throw new Error("User not found");
        const currentBalance = userDoc.data().balance || 0;
        
        if (currentBalance < withdrawAmount) throw new Error("Insufficient balance");

        const withdrawalRef = doc(collection(db, 'withdrawals'));
        transaction.set(withdrawalRef, {
          userId: auth.currentUser?.uid,
          userName: profile?.userName || 'Anonymous',
          userSequentialId: profile?.userId || 'N/A',
          amount: withdrawAmount,
          method: method,
          paymentNumber: paymentNumber,
          status: 'pending',
          requestedAt: new Date().toISOString(),
        });

        transaction.update(userRef, { balance: increment(-withdrawAmount) });
      });

      setMessage({ type: 'success', text: 'Withdrawal request submitted!' });
      setAmount('');
      setMethod('');
      setPaymentNumber('');
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      setMessage({ type: 'error', text: error.message || 'Failed to submit request.' });
    } finally {
      setSubmitting(false);
    }
  };

  const baseUrl = window.location.origin.includes('localhost') ? window.location.origin : 'https://now-mission-earn.vercel.app';
  const referralLink = `${baseUrl}/register?referBy=${profile?.referralCode ? profile.referralCode : (profile?.userId ? profile.userId : '')}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const totalEarnedCalculated = submissions
    .filter(s => s.status === 'approved')
    .reduce((acc, s) => acc + (s.reward || 0), 0);

  const pendingEarned = submissions
    .filter(s => s.status === 'pending')
    .reduce((acc, s) => acc + (s.reward || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Profile Header */}
      <div className={cn(
        "rounded-[2.5rem] p-8 border relative overflow-hidden",
        theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
      )}>
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 bg-pink-500 rounded-[2rem] flex items-center justify-center shadow-xl shadow-pink-500/20 overflow-hidden">
              {formData.photoURL ? (
                <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform border-4 border-[#1a1c2e]">
              <Camera className="w-4 h-4 text-white" />
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} />
            </label>
          </div>
          <div className="text-center sm:text-left space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-3xl font-black tracking-tight italic">
                {profile?.firstName} {profile?.lastName}
              </h2>
              <span className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-500 text-[10px] font-black uppercase tracking-widest w-fit mx-auto sm:mx-0">
                ID: {profile?.userId || 'N/A'}
              </span>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">@{profile?.userName}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                profile?.status === 'active' ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
              )}>
                {profile?.status || 'Pending'}
              </span>
              <span className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-500 text-[10px] font-black uppercase tracking-widest">
                {profile?.role}
              </span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/5 rounded-full blur-3xl -mr-24 -mt-24" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={cn(
          "rounded-3xl p-6 border space-y-2",
          theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
        )}>
          <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center mb-4">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Current Balance</p>
          <h3 className="text-3xl font-black text-pink-500">${profile?.balance.toFixed(2)}</h3>
        </div>

        <div className={cn(
          "rounded-3xl p-6 border space-y-2",
          theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
        )}>
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mb-4">
            <ArrowUpCircle className="w-5 h-5 text-white" />
          </div>
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Total Earned</p>
          <h3 className="text-3xl font-black text-green-500">${totalEarnedCalculated.toFixed(2)}</h3>
        </div>

        <div className={cn(
          "rounded-3xl p-6 border space-y-2",
          theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
        )}>
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center mb-4">
            <History className="w-5 h-5 text-white" />
          </div>
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Pending</p>
          <h3 className="text-3xl font-black text-amber-500">${pendingEarned.toFixed(2)}</h3>
        </div>

        <div className={cn(
          "rounded-3xl p-6 border space-y-2",
          theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
        )}>
          <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center mb-4">
            <ArrowUpRight className="w-5 h-5 text-white" />
          </div>
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Total Withdraw</p>
          <h3 className="text-3xl font-black text-rose-500">${(profile?.totalWithdraw || 0).toFixed(2)}</h3>
        </div>

        <div className={cn(
          "rounded-3xl p-6 border space-y-2",
          theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
        )}>
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-white" />
          </div>
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Total Referrals</p>
          <h3 className="text-3xl font-black text-blue-500">{referralCount}</h3>
        </div>
      </div>

      {/* Referral Section */}
      <div className={cn(
        "rounded-[2.5rem] p-8 border space-y-6",
        theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
      )}>
        <div className="flex items-center gap-3">
          <LinkIcon className="w-6 h-6 text-pink-500" />
          <h3 className="text-lg font-black uppercase tracking-widest italic">Referral Program</h3>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Your Referral Code</label>
            <div className={cn(
              "p-4 rounded-2xl border flex items-center justify-between font-mono font-bold text-lg",
              theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
            )}>
              {profile?.referralCode}
              <Hash className="w-5 h-5 text-slate-500" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Referral Link</label>
            <div className={cn(
              "p-4 rounded-2xl border flex items-center gap-2",
              theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
            )}>
              <input 
                type="text" 
                readOnly 
                value={referralLink}
                className="bg-transparent border-none focus:ring-0 text-sm font-bold flex-1 truncate"
              />
              <button 
                onClick={copyReferralLink}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  copySuccess ? "bg-green-500 text-white" : "bg-pink-500 text-white"
                )}
              >
                {copySuccess ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Withdrawal Form */}
        <div className={cn(
          "rounded-[2.5rem] p-8 border space-y-6",
          theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
        )}>
          <div className="flex items-center gap-3">
            <ArrowUpRight className="w-6 h-6 text-pink-500" />
            <h3 className="text-lg font-black uppercase tracking-widest italic">Request Payout</h3>
          </div>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Amount to Withdraw</label>
              <input 
                type="number" 
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={cn(
                  "w-full rounded-2xl p-4 text-sm font-bold border transition-all",
                  theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                )}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {(['bKash', 'Nagad', 'Rocket'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={cn(
                      "py-3 rounded-xl font-black uppercase text-[10px] tracking-widest border transition-all",
                      method === m 
                        ? "bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-500/20" 
                        : theme === 'dark' ? "bg-[#0a0b14] border-[#303456] text-slate-500" : "bg-slate-50 border-slate-200 text-slate-500"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Your Account Number</label>
              <input 
                type="text" 
                value={paymentNumber}
                onChange={(e) => setPaymentNumber(e.target.value)}
                placeholder="Enter your number..."
                className={cn(
                  "w-full rounded-2xl p-4 text-sm font-bold border transition-all",
                  theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                )}
                required
              />
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-pink-500 text-white py-4 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
              {submitting ? 'Processing...' : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* Recent History */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <History className="w-6 h-6 text-pink-500" />
            <h3 className="text-lg font-black uppercase tracking-widest italic">Recent Activity</h3>
          </div>
          
          <div className="space-y-4">
            {withdrawals.length === 0 && submissions.length === 0 && (
              <div className={cn(
                "text-center py-12 rounded-[2.5rem] border border-dashed text-sm font-bold uppercase tracking-widest",
                theme === 'dark' ? "bg-[#1a1c2e] border-[#303456] text-slate-500" : "bg-white border-slate-200 text-slate-400"
              )}>
                No activity yet.
              </div>
            )}
            
            {withdrawals.map(w => (
              <div key={w.id} className={cn(
                "rounded-3xl p-4 border flex justify-between items-center transition-all",
                theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center border",
                    theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                  )}>
                    <ArrowUpRight className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="font-black text-sm uppercase tracking-tight">Withdrawal</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(w.requestedAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-rose-500">-${w.amount.toFixed(2)}</div>
                  <div className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    w.status === 'pending' ? "text-amber-500" :
                    w.status === 'completed' ? "text-emerald-500" : "text-rose-500"
                  )}>{w.status}</div>
                </div>
              </div>
            ))}

            {submissions.map(s => (
              <div key={s.id} className={cn(
                "rounded-3xl p-4 border flex justify-between items-center transition-all",
                theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center border",
                    theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                  )}>
                    <CheckCircle2 className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <div className="font-black text-sm uppercase tracking-tight">Mission Reward</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(s.submittedAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-emerald-500">Pending</div>
                  <div className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    s.status === 'pending' ? "text-amber-500" :
                    s.status === 'approved' ? "text-emerald-500" : "text-rose-500"
                  )}>{s.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className={cn(
        "rounded-[2.5rem] p-8 border space-y-6",
        theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-pink-500" />
            <h3 className="text-lg font-black uppercase tracking-widest italic">Account Settings</h3>
          </div>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="text-pink-500 font-bold text-sm hover:underline"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">First Name</label>
              <input 
                type="text"
                disabled={!isEditing}
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className={cn(
                  "w-full rounded-2xl p-4 text-sm font-bold border transition-all",
                  theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200",
                  !isEditing && "opacity-50"
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Last Name</label>
              <input 
                type="text"
                disabled={!isEditing}
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className={cn(
                  "w-full rounded-2xl p-4 text-sm font-bold border transition-all",
                  theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200",
                  !isEditing && "opacity-50"
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="email"
                  disabled={!isEditing}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={cn(
                    "w-full rounded-2xl p-4 pl-12 text-sm font-bold border transition-all",
                    theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200",
                    !isEditing && "opacity-50"
                  )}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="tel"
                  disabled={!isEditing}
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  className={cn(
                    "w-full rounded-2xl p-4 pl-12 text-sm font-bold border transition-all",
                    theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200",
                    !isEditing && "opacity-50"
                  )}
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <button 
              type="submit"
              disabled={isSaving}
              className="w-full bg-pink-500 text-white py-4 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          )}
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
};
