import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { 
  Wallet as WalletIcon, 
  Briefcase, 
  Users, 
  Smartphone, 
  Mail, 
  Send, 
  Facebook, 
  Instagram, 
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
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, addDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Mission, MissionSubmission, PaymentSettings } from '../types';

export function Dashboard() {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [submissions, setSubmissions] = useState<MissionSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationMethod, setActivationMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const missionsQuery = query(collection(db, 'missions'), where('status', '==', 'active'));
        const missionsSnap = await getDocs(missionsQuery);
        const missionsData = missionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission));
        setMissions(missionsData);

        const settingsDoc = await getDoc(doc(db, 'settings', 'paymentNumbers'));
        if (settingsDoc.exists()) {
          setPaymentSettings(settingsDoc.data() as PaymentSettings);
        }

        if (user) {
          const submissionsQuery = query(collection(db, 'missionSubmissions'), where('userId', '==', user.uid));
          const submissionsSnap = await getDocs(submissionsQuery);
          const submissionsData = submissionsSnap.docs.map(doc => doc.data() as MissionSubmission);
          setSubmissions(submissionsData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?referBy=${profile?.userId}`;
    navigator.clipboard.writeText(link);
    alert('Referral link copied to clipboard!');
  };

  const handleActivationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setIsActivating(true);
    try {
      let screenshotUrl = '';
      if (screenshot) {
        const storageRef = ref(storage, `activations/${user.uid}/${Date.now()}_${screenshot.name}`);
        await uploadBytes(storageRef, screenshot);
        screenshotUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'activationRequests'), {
        userId: user.uid,
        userName: profile.userName,
        userSequentialId: profile.userId,
        userEmail: profile.email,
        method: activationMethod === 'bkash' ? 'bKash' : activationMethod === 'nagad' ? 'Nagad' : 'Rocket',
        senderNumber,
        paymentNumber: activationMethod === 'bkash' ? paymentSettings?.bKash :
                       activationMethod === 'nagad' ? paymentSettings?.Nagad :
                       paymentSettings?.Rocket,
        amount: paymentSettings?.activationFee || 20,
        transactionId,
        screenshot: screenshotUrl,
        status: 'pending',
        submittedAt: new Date().toISOString()
      });

      alert('Activation request submitted successfully! Please wait for admin approval.');
      setShowActivationModal(false);
    } catch (error) {
      console.error('Error submitting activation:', error);
      alert('Failed to submit activation request. Please try again.');
    } finally {
      setIsActivating(false);
    }
  };

  const socialSellItems = [
    { name: 'Facebook', icon: Facebook, color: 'bg-blue-600', path: '/facebook-sell' },
    { name: 'Gmail', icon: Mail, color: 'bg-red-500', path: '/gmail-sell' },
    { name: 'Instagram', icon: Instagram, color: 'bg-pink-600', path: '/instagram-sell' },
    { name: 'Telegram', icon: Send, color: 'bg-sky-500', path: '/telegram-sell' },
  ];

  const telegramLinks = [
    { name: 'Join Telegram Group', icon: Send, color: 'bg-sky-500', url: '#' },
    { name: 'Join Telegram Channel', icon: Send, color: 'bg-sky-500', url: '#' },
    { name: 'Join Private Support', icon: Send, color: 'bg-sky-500', url: '#' },
    { name: 'Join meeting Group', icon: Send, color: 'bg-sky-500', url: '#' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
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
          <h3 className="text-xl font-black tracking-tight italic">
            আপনার অ্যাকাউন্টটি একটিভ নয়! কাজ করার জন্য আপনার অ্যাকাউন্ট একটিভ করুন ধন্যবাদ!!
          </h3>
          <button 
            onClick={() => setShowActivationModal(true)}
            className="bg-blue-600 text-white px-12 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-[1.02] transition-all"
          >
            Click here
          </button>
        </div>
      )}

      {/* Referral Link Section */}
      <div className={cn(
        "rounded-[2rem] p-10 border text-center space-y-6",
        theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
      )}>
        <h3 className="text-2xl font-black tracking-tight uppercase">Your Refer Link</h3>
        <div className="relative max-w-3xl mx-auto">
          <input 
            type="text" 
            readOnly 
            value={`${window.location.origin}/register?referBy=${profile?.userId}`}
            className={cn(
              "w-full px-6 py-4 rounded-xl border font-bold text-center text-sm",
              theme === 'dark' ? "bg-[#0a0b14] border-[#303456] text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
            )}
          />
        </div>
        <button 
          onClick={copyReferralLink}
          className="bg-blue-600 text-white px-12 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-[1.02] transition-all"
        >
          Copy Link
        </button>
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
        <h2 className="text-3xl font-black tracking-tight italic uppercase">Welcome to our website</h2>
        <p className={cn(
          "text-lg font-medium leading-relaxed max-w-4xl mx-auto",
          theme === 'dark' ? "text-slate-400" : "text-slate-600"
        )}>
          নিভৃত আঁধারে ল্যাপটপের নীলচে আলোয় যখন তুমি একা জেগে থাকো, তখন আসলে তোমার চারপাশ ঘিরে স্বপ্নরা ডানা মেলে। পৃথিবীর মানুষ তোমার সেই দীর্ঘ অপেক্ষার প্রহর দেখে না, তারা জানে না পর্দার আড়ালে লুকিয়ে থাকা তোমার ক্লান্ত চোখের ত্যাগের আখ্যান। কিন্তু বিশ্বাস হারিও না; তোমার ধৈর্যের প্রতিটি মুহূর্ত আর মেধার একেকটি নিপুণ ‘ক্লিক’ নিঃশব্দে বুনে চলেছে আগামীর নতুন এক রূপকথা। আজকের এই নিভৃত পরিশ্রমই একদিন বদলে দেবে তোমার পুরো পৃথিবী।
        </p>
        <p className="text-pink-500 font-black uppercase tracking-widest">_ Shoaiba Islam</p>
      </div>

      {/* Footer */}
      <footer className={cn(
        "rounded-[2.5rem] p-12 border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12",
        theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
      )}>
        <div className="space-y-6">
          <h4 className="text-xl font-black tracking-tight uppercase">About Our website</h4>
          <p className="text-sm font-medium text-slate-500 leading-relaxed">
            This should be used to tell a story and include any friend you might receive money and service for your teams.
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
        © 2026 All Rights Reserved — Digital Nova
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
                  <h3 className="text-2xl font-black tracking-tight italic uppercase">Activate Account</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Pay activation fee to start working</p>
                </div>
                <button onClick={() => setShowActivationModal(false)} className="p-2 hover:bg-slate-500/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className={cn(
                "p-4 rounded-2xl border space-y-2",
                theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
              )}>
                <p className="text-sm font-black uppercase tracking-widest text-pink-500">Activation Fee: BDT {paymentSettings?.activationFee || 20}</p>
                <p className="text-xs font-bold text-slate-500">Please send the exact amount to one of our numbers below.</p>
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
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Send Money to</p>
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
                        alert('Number copied!');
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
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Sender Mobile Number</label>
                  <input 
                    type="text"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="Enter your mobile number"
                    className={cn(
                      "w-full px-6 py-4 rounded-2xl border focus:ring-2 focus:ring-pink-500 transition-all text-sm font-bold",
                      theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                    )}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Transaction ID</label>
                  <input 
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter TRX ID"
                    className={cn(
                      "w-full px-6 py-4 rounded-2xl border focus:ring-2 focus:ring-pink-500 transition-all text-sm font-bold",
                      theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                    )}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Payment Screenshot</label>
                  <label className={cn(
                    "flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all",
                    theme === 'dark' ? "bg-[#0a0b14] border-[#303456] hover:border-pink-500" : "bg-slate-50 border-slate-200 hover:border-pink-500"
                  )}>
                    <Upload className="w-5 h-5 text-pink-500" />
                    <span className="text-xs font-bold text-slate-500 truncate">
                      {screenshot ? screenshot.name : 'Upload Screenshot'}
                    </span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => setScreenshot(e.target.files?.[0] || null)} 
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isActivating || !transactionId}
                  className="w-full bg-pink-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isActivating ? 'Submitting...' : 'Submit Activation'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
