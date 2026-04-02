import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { 
  Wallet as WalletIcon, 
  Briefcase, 
  Users, 
  Smartphone, 
  Send, 
  Facebook, 
  Instagram, 
  Mail,
  Megaphone,
  ArrowDownCircle,
  ArrowUpCircle,
  Copy,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Upload,
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  X,
  Clock,
  XCircle,
  Zap,
  Bell,
  MoreVertical,
  Play
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, addDoc, doc, getDoc, updateDoc, setDoc, onSnapshot, orderBy, writeBatch, runTransaction, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError } from '../firebase';
import { Mission, MissionSubmission, PaymentSettings, DynamicSettings, ActivationRequest } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: user?.uid,
        email: user?.email,
        emailVerified: user?.emailVerified,
        isAnonymous: user?.isAnonymous,
        tenantId: user?.tenantId,
        providerInfo: user?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };
  const [missions, setMissions] = useState<Mission[]>([]);
  const [submissions, setSubmissions] = useState<MissionSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationMethod, setActivationMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const isActivatingRef = useRef(false);

  // Sync ref with state
  useEffect(() => {
    isActivatingRef.current = isActivating;
  }, [isActivating]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [dynamicSettings, setDynamicSettings] = useState<DynamicSettings | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [pendingSells, setPendingSells] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLearnIncomeModal, setShowLearnIncomeModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [latestActivationRequest, setLatestActivationRequest] = useState<ActivationRequest | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Listen to user's latest activation request
    const q = query(
      collection(db, 'activationRequests'),
      where('userId', '==', user.uid),
      orderBy('submittedAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setLatestActivationRequest({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ActivationRequest);
      } else {
        setLatestActivationRequest(null);
      }
    }, (error) => {
      console.error("Error listening to activation requests:", error);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    // Listen to dynamic settings
    const unsubscribe = onSnapshot(doc(db, 'dynamicSettings', 'main'), (doc) => {
      if (doc.exists()) {
        setDynamicSettings(doc.data() as DynamicSettings);
      }
    }, (error) => {
      console.error("Error listening to dynamic settings:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Listen to user's pending social sells for the 24h alert
    const q = query(
      collection(db, 'socialSells'), 
      where('userId', '==', user.uid),
      where('status', '==', 'pending')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sells = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingSells(sells);
    });

    // Listen to user's notifications
    const notifQ = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeNotif = onSnapshot(notifQ, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
    });

    return () => {
      unsubscribe();
      unsubscribeNotif();
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const hasOldPendingSells = pendingSells.some(sell => {
    if (!sell.submittedAt) return false;
    const submittedDate = new Date(sell.submittedAt);
    const now = new Date();
    const diffInHours = (now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60);
    return diffInHours >= 24;
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const missionsQuery = query(collection(db, 'missions'), where('status', '==', 'active'));
        const missionsSnap = await getDocs(missionsQuery);
        const missionsData = missionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission));
        setMissions(missionsData);

        const submissionsQuery = query(collection(db, 'missionSubmissions'), where('userId', '==', user.uid));
        const submissionsSnap = await getDocs(submissionsQuery);
        const submissionsData = submissionsSnap.docs.map(doc => doc.data() as MissionSubmission);
        setSubmissions(submissionsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'paymentNumbers'), (snapshot) => {
      if (snapshot.exists()) {
        setPaymentSettings(snapshot.data() as PaymentSettings);
      }
    }, (error) => {
      console.error("Error listening to activation settings:", error);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fixAdminProfile = async () => {
      if (user?.email === "enigmaticshafin@gmail.com" && profile) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const updates: any = {};
          
          // Ensure admin has a userId
          if (!profile.userId || profile.userId.length < 8) {
            updates.userId = "00000001";
          }

          // Ensure role is CEO
          if (profile.role !== 'ceo') {
            updates.role = 'ceo';
          }
          
          // Change referralCode from "ADMIN" to userId if it's "ADMIN" or missing
          if (!profile.referralCode || profile.referralCode === "ADMIN" || profile.referralCode.length < 8) {
            updates.referralCode = updates.userId || profile.userId || "00000001";
          }
          
          if (Object.keys(updates).length > 0) {
            await updateDoc(userRef, updates);
          }

          const currentUserId = profile.userId || "00000001";

          // Ensure referral_lookup exists for the userId
          const lookupRef = doc(db, 'referral_lookup', currentUserId);
          const lookupSnap = await getDoc(lookupRef);
          if (!lookupSnap.exists()) {
            await setDoc(lookupRef, {
              uid: user.uid,
              userName: profile.userName || "admin",
              userId: currentUserId
            });
          }

          // Keep "ADMIN" as an alias for backward compatibility
          const adminAliasRef = doc(db, 'referral_lookup', "ADMIN");
          const adminAliasSnap = await getDoc(adminAliasRef);
          if (!adminAliasSnap.exists()) {
            await setDoc(adminAliasRef, {
              uid: user.uid,
              userName: profile.userName || "admin",
              userId: currentUserId
            });
          }
        } catch (error) {
          console.error("Error fixing admin profile:", error);
        }
      }
    };
    fixAdminProfile();
  }, [user, profile?.userId, profile?.referralCode]);

  const copyReferralLink = () => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/register?referBy=${profile?.referralCode ? profile.referralCode : (profile?.userId ? profile.userId : '')}`;
    navigator.clipboard.writeText(link);
    setMessage({ type: 'success', text: 'রেফারেল লিঙ্ক ক্লিপবোর্ডে কপি করা হয়েছে!' });
  };

  const handleActivationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setMessage({ type: 'error', text: 'দয়া করে লগইন করুন।' });
      return;
    }

    if (!profile) {
      setMessage({ type: 'error', text: 'আপনার প্রোফাইল লোড হচ্ছে, দয়া করে একটু অপেক্ষা করুন।' });
      return;
    }

    if (isActivatingRef.current) {
      console.log('Activation already in progress, ignoring click.');
      return;
    }

    const trimmedSender = senderNumber.trim();
    const trimmedTrx = transactionId.trim();

    if (!trimmedSender || !trimmedTrx) {
      setMessage({ type: 'error', text: 'দয়া করে সব প্রয়োজনীয় তথ্য পূরণ করুন।' });
      return;
    }

    if (!paymentSettings) {
      setMessage({ type: 'error', text: 'পেমেন্ট সেটিংস লোড হয়নি। দয়া করে কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন।' });
      return;
    }

    console.log('Starting activation submission...');
    isActivatingRef.current = true;
    setIsActivating(true);
    setMessage(null);

    // Safety timeout to reset the button if it hangs for more than 30 seconds
    const safetyTimeout = setTimeout(() => {
      if (isActivatingRef.current) {
        console.warn('Activation submission timed out.');
        isActivatingRef.current = false;
        setIsActivating(false);
        setMessage({ type: 'error', text: 'সাবমিশন টাইমআউট হয়েছে। দয়া করে ইন্টারনেট চেক করে আবার চেষ্টা করুন।' });
      }
    }, 30000);

    try {
      const activationData = {
        userId: user.uid,
        userName: profile.userName || user.displayName || 'Unknown',
        userSequentialId: profile.userId || 'Unknown',
        userEmail: profile.email || user.email || 'Unknown',
        method: activationMethod === 'bkash' ? 'bKash' : activationMethod === 'nagad' ? 'Nagad' : 'Rocket',
        senderNumber: trimmedSender,
        paymentNumber: activationMethod === 'bkash' ? paymentSettings.bKash :
                       activationMethod === 'nagad' ? paymentSettings.Nagad :
                       paymentSettings.Rocket,
        amount: paymentSettings.activationFee || 20,
        transactionId: trimmedTrx,
        screenshot: '',
        status: 'pending',
        submittedAt: new Date().toISOString()
      };

      console.log('Saving activation request to Firestore using transaction...');
      try {
        await runTransaction(db, async (transaction) => {
          const activationRef = doc(collection(db, 'activationRequests'));
          const userRef = doc(db, 'users', user.uid);
          const usedTxRef = doc(db, 'usedTransactionIds', trimmedTrx);
          
          // Check if transaction ID is already used in the transaction
          const usedTxSnap = await transaction.get(usedTxRef);
          if (usedTxSnap.exists()) {
            throw new Error('এই ট্রানজেকশন আইডিটি ইতিমধ্যে ব্যবহার করা হয়েছে।');
          }

          transaction.set(activationRef, activationData);
          transaction.update(userRef, {
            status: 'pending'
          });
          transaction.set(usedTxRef, {
            usedAt: new Date().toISOString(),
            userId: user.uid,
            userName: profile.userName || user.displayName || 'Unknown',
            type: 'activation'
          });
        });
        console.log('Activation request saved and user status updated.');
      } catch (error: any) {
        console.error('Firestore transaction failed:', error);
        if (error.message === 'এই ট্রানজেকশন আইডিটি ইতিমধ্যে ব্যবহার করা হয়েছে।') {
          throw error;
        }
        handleFirestoreError(error, OperationType.WRITE, 'activationRequests/users');
      }

      clearTimeout(safetyTimeout);
      setMessage({ type: 'success', text: 'অ্যাক্টিভেশন রিকোয়েস্ট সফলভাবে জমা দেওয়া হয়েছে!' });
      setTransactionId('');
      setSenderNumber('');
      
      // Close modal after a short delay
      setTimeout(() => {
        setShowActivationModal(false);
      }, 2000);
      
      // If user is admin/ceo, they might want to go to admin panel to approve
      if (profile && (profile.role === 'admin' || profile.role === 'ceo')) {
        setTimeout(() => {
          navigate('/admin?tab=activations');
        }, 3000);
      }
    } catch (error: any) {
      clearTimeout(safetyTimeout);
      console.error('Error submitting activation:', error);
      let errorMsg = 'অ্যাক্টিভেশন রিকোয়েস্ট জমা দিতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।';
      
      try {
        const parsedError = JSON.parse(error.message);
        if (parsedError.error.includes('permission-denied')) {
          errorMsg = 'অনুমতি নেই। দয়া করে নিশ্চিত করুন যে আপনার পেমেন্ট ডিটেইলস সঠিক এবং আবার চেষ্টা করুন।';
        } else {
          errorMsg = parsedError.error;
        }
      } catch (e) {
        errorMsg = error.message || errorMsg;
      }
      
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsActivating(false);
      isActivatingRef.current = false;
      console.log('Activation submission process finished.');
    }
  };

  const socialSellItems = [
    { name: 'Facebook', icon: Facebook, color: 'bg-blue-600', path: '/facebook-sell' },
    { name: 'Instagram', icon: Instagram, color: 'bg-pink-600', path: '/instagram-sell' },
    { name: 'Gmail', icon: Mail, color: 'bg-red-500', path: '/gmail-sell' },
    { name: 'Telegram', icon: Send, color: 'bg-sky-500', path: '/telegram-sell' },
  ];

  const telegramLinks = [
    { name: 'Join Telegram Group', icon: Send, color: 'bg-sky-500', url: dynamicSettings?.telegramGroup || '#' },
    { name: 'Join Telegram Channel', icon: Send, color: 'bg-sky-500', url: dynamicSettings?.telegramChannel || '#' },
    { name: 'Join Private Support', icon: Send, color: 'bg-sky-500', url: dynamicSettings?.telegramSupport || '#' },
    { name: 'Join meeting Group', icon: Send, color: 'bg-sky-500', url: dynamicSettings?.meetingGroup || '#' },
  ];

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      {/* User ID & Profile Header */}
      <div className={cn(
        "rounded-[2rem] p-8 border flex flex-col sm:flex-row items-center justify-between gap-6",
        theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
      )}>
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight italic">
              Welcome, {profile?.firstName || 'User'}!
            </h2>
            <p className="text-pink-500 font-black text-sm uppercase tracking-widest">
              Your User ID: {profile?.userId || 'N/A'}
            </p>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
              অ্যাকাউন্ট স্ট্যাটাস: <span className={profile?.status === 'active' ? "text-green-500" : profile?.status === 'pending' ? "text-amber-500" : "text-rose-500"}>
                {profile?.status === 'active' ? 'একটিভ' : profile?.status === 'pending' ? 'পেন্ডিং' : 'ইন-একটিভ'}
              </span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-4 bg-slate-500/10 text-slate-500 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-slate-500/5 hover:scale-[1.02] transition-all"
            >
              <MoreVertical className="w-6 h-6" />
            </button>
            
            {showMenu && (
              <div className={cn(
                "absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2",
                theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
              )}>
                <button 
                  onClick={() => {
                    setShowLearnIncomeModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-6 py-4 text-left flex items-center gap-3 hover:bg-pink-500/10 transition-colors"
                >
                  <div className="w-8 h-8 bg-pink-500/10 rounded-lg flex items-center justify-center">
                    <Play className="w-4 h-4 text-pink-500" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">Learn Here How to Income</span>
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => setShowNotifications(true)}
            className="relative p-4 bg-pink-500/10 text-pink-500 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-pink-500/5 hover:scale-[1.02] transition-all"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-[#1a1c2e]">
                {unreadCount}
              </span>
            )}
          </button>
          {(profile?.role === 'admin' || profile?.role === 'ceo') && (
            <button 
              onClick={() => navigate('/admin?tab=quicksetup')}
              className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-[1.02] transition-all"
            >
              <Zap className="w-5 h-5" />
              Price
            </button>
          )}
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={cn(
          "rounded-[2rem] p-8 border flex items-center gap-6",
          theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
        )}>
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <WalletIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">মোট ব্যালেন্স</p>
            <h3 className="text-3xl font-black tracking-tight italic">BDT {profile?.balance || 0}</h3>
          </div>
        </div>

        <div className={cn(
          "rounded-[2rem] p-8 border flex items-center gap-6",
          theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
        )}>
          <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">রেফারেল ইনকাম</p>
            <h3 className="text-3xl font-black tracking-tight italic">BDT {profile?.inviteEarnings || 0}</h3>
          </div>
        </div>

        <div className={cn(
          "rounded-[2rem] p-8 border flex items-center gap-6",
          theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
        )}>
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Facebook className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">ফেসবুক ইনকাম</p>
            <h3 className="text-3xl font-black tracking-tight italic">BDT {profile?.facebookBalance || 0}</h3>
          </div>
        </div>

        <div className={cn(
          "rounded-[2rem] p-8 border flex items-center gap-6",
          theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
        )}>
          <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-600/20">
            <Instagram className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">ইনস্টাগ্রাম ইনকাম</p>
            <h3 className="text-3xl font-black tracking-tight italic">BDT {profile?.instagramBalance || 0}</h3>
          </div>
        </div>

        <div className={cn(
          "rounded-[2rem] p-8 border flex items-center gap-6",
          theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
        )}>
          <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Send className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">টেলিগ্রাম ইনকাম</p>
            <h3 className="text-3xl font-black tracking-tight italic">BDT {profile?.telegramBalance || 0}</h3>
          </div>
        </div>
      </div>

      {/* 24h Pending Alert */}
      {hasOldPendingSells && (
        <div className={cn(
          "rounded-[2rem] p-6 border flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse",
          theme === 'dark' ? "bg-rose-500/10 border-rose-500/20" : "bg-rose-50 border-rose-200"
        )}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-black uppercase tracking-tight text-rose-500">পেন্ডিং রিকোয়েস্ট অ্যালার্ট</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">যদি ২৪ ঘণ্টার মধ্যে কোনো কিছু অ্যাপ্রুভ না হয়, তবে আমাদের সাথে যোগাযোগ করুন।</p>
            </div>
          </div>
          <a 
            href={dynamicSettings?.telegramSupport || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-rose-500 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-500/20 hover:scale-[1.02] transition-all"
          >
            সাপোর্টে যোগাযোগ করুন
          </a>
        </div>
      )}

      {/* Social Sell Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {socialSellItems.map((item) => (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className={cn(
              "rounded-[2rem] p-8 border flex flex-col items-center gap-6 transition-all hover:scale-[1.02]",
              theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
            )}
          >
            <div className={cn("w-20 h-20 rounded-full flex items-center justify-center shadow-lg", item.color)}>
              <item.icon className="w-10 h-10 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight uppercase">{item.name}</span>
          </button>
        ))}
      </div>

      {/* Activation Alert */}
      {profile?.status !== 'active' && (
        <div className={cn(
          "rounded-[2rem] p-10 border text-center space-y-6",
          theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
        )}>
          <div className="space-y-4">
            <h3 className="text-xl font-black tracking-tight italic">
              {profile?.status === 'pending' 
                ? "আপনার অ্যাকাউন্টটি পেন্ডিং আছে! এডমিন আপনার পেমেন্ট ভেরিফাই করার পর একটিভ করে দিবে। ধন্যবাদ!!"
                : "আপনার অ্যাকাউন্টটি একটিভ নয়! কাজ করার জন্য আপনার অ্যাকাউন্ট একটিভ করুন ধন্যবাদ!!"}
            </h3>
            
            {profile?.status === 'inactive' && latestActivationRequest?.status === 'rejected' && (
              <div className={cn(
                "p-4 rounded-2xl border text-left space-y-2",
                theme === 'dark' ? "bg-rose-500/10 border-rose-500/20" : "bg-rose-50 border-rose-200"
              )}>
                <p className="text-xs font-black uppercase tracking-widest text-rose-500">রিজেকশন কারণ:</p>
                <p className="text-sm font-bold">{latestActivationRequest.rejectionReason || 'Invalid payment details.'}</p>
                <p className="text-[10px] font-medium text-slate-500 italic">দয়া করে সঠিক তথ্য দিয়ে আবার চেষ্টা করুন।</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => setShowActivationModal(true)}
            disabled={profile?.status === 'pending'}
            className={cn(
              "px-12 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg transition-all",
              profile?.status === 'pending'
                ? "bg-amber-500/20 text-amber-500 cursor-not-allowed"
                : "bg-blue-600 text-white shadow-blue-600/20 hover:scale-[1.02]"
            )}
          >
            {profile?.status === 'pending' ? 'অনুমোদনের অপেক্ষায়' : (profile?.status === 'inactive' && latestActivationRequest?.status === 'rejected' ? 'আবার চেষ্টা করুন' : 'এখানে ক্লিক করুন')}
          </button>
        </div>
      )}

      {/* User ID and Referral Link Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={cn(
          "rounded-[2rem] p-10 border text-center space-y-6",
          theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
        )}>
          <h3 className="text-2xl font-black tracking-tight uppercase">Your User ID</h3>
          <div className="text-4xl font-black text-pink-500 tracking-widest">
            {profile?.userId || '--------'}
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Use this ID for referrals</p>
        </div>

        <div className={cn(
          "rounded-[2rem] p-10 border text-center space-y-6",
          theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
        )}>
          <h3 className="text-2xl font-black tracking-tight uppercase">Your Refer Link</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className={cn(
              "p-4 rounded-2xl border transition-all",
              theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
            )}>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Referrals</p>
              <p className="text-2xl font-black text-pink-500 tracking-tight italic">{profile?.referrals || 0}</p>
            </div>
            <div className={cn(
              "p-4 rounded-2xl border transition-all",
              theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
            )}>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Referral Earnings</p>
              <p className="text-2xl font-black text-pink-500 tracking-tight italic">BDT {profile?.inviteEarnings || 0}</p>
            </div>
          </div>

          <div className="relative">
            <input 
              type="text" 
              readOnly 
              value={`${window.location.origin}/register?referBy=${profile?.referralCode ? profile.referralCode : (profile?.userId ? profile.userId : '')}`}
              className={cn(
                "w-full px-6 py-4 rounded-xl border font-bold text-center text-sm",
                theme === 'dark' ? "bg-[#0a0b14] border-[#303456] text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
              )}
            />
          </div>
          <button 
            onClick={copyReferralLink}
            className="w-full bg-pink-500 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Copy className="w-5 h-5" />
            Copy Link
          </button>
        </div>
      </div>

      {/* Telegram Links Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {telegramLinks.map((item) => (
          <a
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "rounded-[2rem] p-8 border flex flex-col items-center gap-6 transition-all hover:scale-[1.02]",
              theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
            )}
          >
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center shadow-lg", item.color)}>
              <item.icon className="w-8 h-8 text-white" />
            </div>
            <span className="text-sm font-black tracking-tight uppercase text-center">{item.name}</span>
          </a>
        ))}
      </div>

      {/* Welcome Section */}
      <div className={cn(
        "rounded-[2rem] p-12 border text-center space-y-6",
        theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
      )}>
        <h2 className="text-3xl font-black tracking-tight italic uppercase">{dynamicSettings?.welcomeTitle || "Welcome to our website"}</h2>
        <p className={cn(
          "text-lg font-medium leading-relaxed max-w-4xl mx-auto whitespace-pre-wrap",
          theme === 'dark' ? "text-slate-400" : "text-slate-600"
        )}>
          {dynamicSettings?.welcomeText || "নিভৃত আঁধারে ল্যাপটপের নীলচে আলোয় যখন তুমি একা জেগে থাকো, তখন আসলে তোমার চারপাশ ঘিরে স্বপ্নরা ডানা মেলে। পৃথিবীর মানুষ তোমার সেই দীর্ঘ অপেক্ষার প্রহর দেখে না, তারা জানে না পর্দার আড়ালে লুকিয়ে থাকা তোমার ক্লান্ত চোখের ত্যাগের আখ্যান। কিন্তু বিশ্বাস হারিও না; তোমার ধৈর্যের প্রতিটি মুহূর্ত আর মেধার একেকটি নিপুণ ‘ক্লিক’ নিঃশব্দে বুনে চলেছে আগামীর নতুন এক রূপকথা। আজকের এই নিভৃত পরিশ্রমই একদিন বদলে দেবে তোমার পুরো পৃথিবী।"}
        </p>
        <p className="text-pink-500 font-black uppercase tracking-widest">_ {dynamicSettings?.quoteAuthor || "Shoaiba Islam"}</p>
      </div>

      {/* Footer */}
      <footer className={cn(
        "rounded-[2.5rem] p-12 border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12",
        theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
      )}>
        <div className="space-y-6">
          <h4 className="text-xl font-black tracking-tight uppercase">About Our website</h4>
          <p className="text-sm font-medium text-slate-500 leading-relaxed">
            {dynamicSettings?.footerQuote || "This should be used to tell a story and include any friend you might receive money and service for your teams."}
          </p>
        </div>

        <div className="space-y-6">
          <h4 className="text-xl font-black tracking-tight uppercase">Quick Links</h4>
          <ul className="space-y-3 text-sm font-bold text-slate-500">
            <li><button onClick={() => navigate('/')} className="hover:text-pink-500 transition-colors">Home</button></li>
            <li><button onClick={() => navigate('/my-jobs')} className="hover:text-pink-500 transition-colors">Jobs</button></li>
            <li><button onClick={() => navigate('/gmail-sell')} className="hover:text-pink-500 transition-colors">Gmail Sell</button></li>
            <li><button onClick={() => navigate('/facebook-sell')} className="hover:text-pink-500 transition-colors">Facebook Sell</button></li>
            <li><button onClick={() => navigate('/instagram-sell')} className="hover:text-pink-500 transition-colors">Instagram</button></li>
            <li><button onClick={() => navigate('/telegram-sell')} className="hover:text-pink-500 transition-colors">TextNow</button></li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-xl font-black tracking-tight uppercase">Helps</h4>
          <ul className="space-y-3 text-sm font-bold text-slate-500">
            <li><button className="hover:text-pink-500 transition-colors">About Us</button></li>
            <li><button className="hover:text-pink-500 transition-colors">Partners</button></li>
            <li><button className="hover:text-pink-500 transition-colors">Career</button></li>
            <li><button className="hover:text-pink-500 transition-colors">Reviews</button></li>
            <li><button className="hover:text-pink-500 transition-colors">Terms & Conditions</button></li>
            <li><button onClick={() => navigate('/helpline')} className="hover:text-pink-500 transition-colors">Helps</button></li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-xl font-black tracking-tight uppercase">Newsletter</h4>
          <p className="text-sm font-medium text-slate-500">Follow us</p>
          <div className="flex gap-4">
            <button className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center hover:bg-pink-500 hover:text-white transition-all"><Facebook className="w-5 h-5" /></button>
            <button className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center hover:bg-pink-500 hover:text-white transition-all"><Linkedin className="w-5 h-5" /></button>
            <button className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center hover:bg-pink-500 hover:text-white transition-all"><Instagram className="w-5 h-5" /></button>
            <button className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center hover:bg-pink-500 hover:text-white transition-all"><Github className="w-5 h-5" /></button>
          </div>
          <p className="text-sm font-medium text-slate-500">Subscribe with your email and get loads of news directly to your inbox.</p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className={cn(
                "flex-1 px-4 py-3 rounded-xl border text-sm font-bold",
                theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
              )}
            />
            <button className="bg-blue-600 text-white p-3 rounded-xl shadow-lg shadow-blue-600/20 hover:scale-105 transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </footer>

      <div className="text-center text-xs font-bold text-slate-500 pb-8">
        © {new Date().getFullYear()} All Rights Reserved — {dynamicSettings?.footerText || "Digital Mobile"}
      </div>

      {/* Activation Modal */}
      {showActivationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className={cn(
            "w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 my-auto",
            "max-h-[90vh] overflow-y-auto custom-scrollbar",
            theme === 'dark' ? "bg-[#1a1c2e] border border-[#303456]" : "bg-white"
          )}>
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black tracking-tight italic uppercase">অ্যাকাউন্ট একটিভ করুন</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">কাজ শুরু করতে অ্যাক্টিভেশন ফি প্রদান করুন</p>
                </div>
                <button onClick={() => setShowActivationModal(false)} className="p-2 hover:bg-slate-500/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className={cn(
                "p-4 rounded-2xl border space-y-2",
                theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
              )}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black uppercase tracking-widest text-pink-500">অ্যাক্টিভেশন ফি: BDT {paymentSettings?.activationFee || 20}</p>
                  <button 
                    onClick={() => {
                      const fee = (paymentSettings?.activationFee || 20).toString();
                      navigator.clipboard.writeText(fee);
                      setMessage({ type: 'success', text: 'পরিমাণ কপি করা হয়েছে!' });
                    }}
                    className="p-2 bg-pink-500/10 text-pink-500 rounded-lg hover:bg-pink-500 hover:text-white transition-all"
                    title="Copy Amount"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs font-bold text-slate-500">দয়া করে নিচের যেকোনো একটি নম্বরে সঠিক পরিমাণ টাকা পাঠান।</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['bkash', 'nagad', 'rocket'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setActivationMethod(method)}
                    className={cn(
                      "py-3 rounded-xl font-black uppercase text-[10px] tracking-widest border transition-all",
                      activationMethod === method 
                        ? "bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-500/20" 
                        : theme === 'dark' ? "bg-[#0a0b14] border-[#303456] text-slate-500" : "bg-slate-50 border-slate-200 text-slate-500"
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>

              <div className={cn(
                "p-4 rounded-2xl border text-center relative group",
                theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
              )}>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">টাকা পাঠান এই নম্বরে</p>
                <div className="flex items-center justify-center gap-3 mt-1">
                  <p className="text-xl font-black tracking-widest">
                    {activationMethod === 'bkash' ? paymentSettings?.bKash :
                     activationMethod === 'nagad' ? paymentSettings?.Nagad :
                     paymentSettings?.Rocket}
                  </p>
                  <button 
                    onClick={() => {
                      const num = activationMethod === 'bkash' ? paymentSettings?.bKash :
                                 activationMethod === 'nagad' ? paymentSettings?.Nagad :
                                 paymentSettings?.Rocket;
                      if (num) {
                        navigator.clipboard.writeText(num);
                        setMessage({ type: 'success', text: 'নম্বর কপি করা হয়েছে!' });
                      }
                    }}
                    className="p-2 bg-pink-500/10 text-pink-500 rounded-lg hover:bg-pink-500 hover:text-white transition-all"
                    title="Copy Number"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleActivationSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">প্রেরক মোবাইল নম্বর</label>
                  <input 
                    type="text"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="আপনার মোবাইল নম্বর লিখুন"
                    className={cn(
                      "w-full px-6 py-4 rounded-2xl border focus:ring-2 focus:ring-pink-500 transition-all text-sm font-bold",
                      theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                    )}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">ট্রানজেকশন আইডি</label>
                  <input 
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="TRX ID লিখুন"
                    className={cn(
                      "w-full px-6 py-4 rounded-2xl border focus:ring-2 focus:ring-pink-500 transition-all text-sm font-bold",
                      theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                    )}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isActivating || !transactionId}
                  className="w-full bg-pink-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isActivating ? 'জমা দেওয়া হচ্ছে...' : 'অ্যাক্টিভেশন জমা দিন'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
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
      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNotifications(false)} />
          <div className={cn(
            "relative w-full max-w-xl rounded-[2.5rem] p-8 border shadow-2xl animate-in zoom-in-95 duration-200",
            theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
          )}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight italic uppercase">Notifications</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stay updated with your account activity</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNotifications(false)}
                className="p-2 hover:bg-slate-500/10 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-slate-500/5 rounded-full flex items-center justify-center mx-auto">
                    <Bell className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest text-slate-400 italic">No notifications yet</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-2">
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] font-black uppercase tracking-widest text-pink-500 hover:underline"
                    >
                      Mark all as read
                    </button>
                  </div>
                  {notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={cn(
                        "p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden",
                        notif.read 
                          ? theme === 'dark' ? "bg-slate-500/5 border-slate-500/10" : "bg-slate-50 border-slate-100"
                          : theme === 'dark' ? "bg-pink-500/5 border-pink-500/20 shadow-lg shadow-pink-500/5" : "bg-pink-50 border-pink-100 shadow-lg shadow-pink-500/5"
                      )}
                    >
                      {!notif.read && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-pink-500" />
                      )}
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <h4 className={cn(
                            "font-black text-lg tracking-tight italic",
                            notif.read ? "text-slate-500" : "text-pink-500"
                          )}>{notif.title}</h4>
                          <p className={cn(
                            "text-sm font-medium leading-relaxed",
                            theme === 'dark' ? "text-slate-400" : "text-slate-600"
                          )}>{notif.message}</p>
                          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">
                            {new Date(notif.createdAt).toLocaleString()}
                          </div>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 bg-pink-500 rounded-full shrink-0 mt-2 animate-pulse" />
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Learn Income Modal */}
      {showLearnIncomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowLearnIncomeModal(false)} />
          <div className={cn(
            "relative w-full max-w-3xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300",
            theme === 'dark' ? "bg-[#1a1c2e] border border-[#303456]" : "bg-white"
          )}>
            <div className="p-6 border-b border-slate-500/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center">
                  <Play className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight italic uppercase">Learn How to Income</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Watch the tutorial to get started</p>
                </div>
              </div>
              <button onClick={() => setShowLearnIncomeModal(false)} className="p-2 hover:bg-slate-500/10 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            
            <div className="aspect-video bg-black">
              {dynamicSettings?.youtubeVideoUrl ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={dynamicSettings.youtubeVideoUrl.includes('watch?v=') 
                    ? dynamicSettings.youtubeVideoUrl.replace('watch?v=', 'embed/') 
                    : dynamicSettings.youtubeVideoUrl}
                  title="Learn How to Income"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                  <AlertCircle className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-black uppercase tracking-widest italic">No video tutorial available yet</p>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-500/5">
              <p className="text-xs font-bold text-slate-500 text-center uppercase tracking-widest">
                Follow the instructions in the video carefully to maximize your earnings.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
