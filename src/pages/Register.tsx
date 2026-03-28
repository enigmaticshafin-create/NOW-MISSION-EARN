import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, limit, getDocs, runTransaction } from 'firebase/firestore';
import { User, Mail, Phone, Hash, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import { Logo } from '../components/Logo';

export function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [referBy, setReferBy] = useState(searchParams.get('referBy') || searchParams.get('ref') || '');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    userName: '',
    phoneNumber: '',
    email: '',
    address: '',
  });

  const [referrerUserId, setReferrerUserId] = useState<string | null>(null);

  const checkReferrer = async () => {
    if (!referBy) {
      setError("Referrer ID is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // CEO email bypass
      if (referBy === "enigmaticshafin@gmail.com") {
        setReferrerUserId("00000001");
        setStep(2);
        setLoading(false);
        return;
      }

      // Check referral_lookup collection (publicly readable)
      const lookupDoc = await getDoc(doc(db, 'referral_lookup', referBy));
      
      if (!lookupDoc.exists()) {
        setError("Invalid Referrer ID. Please check and try again.");
      } else {
        const data = lookupDoc.data();
        setReferrerUserId(data?.userId || referBy);
        setStep(2);
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialReferBy = searchParams.get('referBy') || searchParams.get('ref');
    if (initialReferBy && step === 1) {
      checkReferrer();
    }
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if profile exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create profile with sequential ID
        const counterRef = doc(db, 'counters', 'users');
        const nextId = await runTransaction(db, async (transaction) => {
          const counterDoc = await transaction.get(counterRef);
          let count = 1;
          if (counterDoc.exists()) {
            count = counterDoc.data().count + 1;
          }
          transaction.set(counterRef, { count });
          return count;
        });

        const formattedId = nextId.toString().padStart(8, '0');
        const isCeo = user.email === "enigmaticshafin@gmail.com";
        const myReferralCode = formattedId;

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          userId: formattedId,
          userName: formData.userName || user.email?.split('@')[0] || 'user',
          firstName: formData.firstName || user.displayName?.split(' ')[0] || '',
          lastName: formData.lastName || user.displayName?.split(' ')[1] || '',
          phoneNumber: formData.phoneNumber || '',
          photoURL: user.photoURL || '',
          address: formData.address || '',
          balance: 0,
          totalEarned: 0,
          jobEarnings: 0,
          inviteEarnings: 0,
          salaryEarnings: 0,
          gmailEarnings: 0,
          telegramEarnings: 0,
          facebookEarnings: 0,
          instagramEarnings: 0,
          marketingEarnings: 0,
          adsEarnings: 0,
          totalWithdraw: 0,
          referrals: 0,
          level: 1,
          role: isCeo ? 'ceo' : 'user',
          referralCode: myReferralCode,
          referredBy: referrerUserId || referBy,
          status: 'active',
          createdAt: new Date().toISOString(),
        });

        // Add to referral_lookup for public verification
        await setDoc(doc(db, 'referral_lookup', myReferralCode), {
          uid: user.uid,
          userName: formData.userName || user.email?.split('@')[0] || 'user',
          userId: formattedId
        });
      }
      
      navigate('/');
    } catch (err: any) {
      setError(err.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center p-4 transition-colors duration-500",
      theme === 'dark' ? "bg-[#0a0b14] text-white" : "bg-slate-50 text-slate-900"
    )}>
      <div className={cn(
        "max-w-md w-full rounded-[3rem] p-10 shadow-2xl border transition-all duration-500 space-y-8 relative overflow-hidden",
        theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
      )}>
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
          <div 
            className="h-full bg-pink-500 transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="text-center space-y-2">
          <Logo size="lg" className="justify-center mb-6" theme={theme} />
          <h2 className="text-3xl font-black tracking-tight italic uppercase">Join the Mission</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
            {step === 1 ? "Verify Referrer" : step === 2 ? "Complete Profile" : "Final Step"}
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-500 text-sm font-bold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Referrer ID</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  value={referBy}
                  onChange={(e) => setReferBy(e.target.value)}
                  readOnly={!!searchParams.get('referBy')}
                  placeholder="Enter Referrer ID"
                  className={cn(
                    "w-full rounded-2xl p-4 pl-12 text-sm font-bold border transition-all",
                    theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                  )}
                />
              </div>
            </div>
            <div className="space-y-3">
              <button 
                onClick={checkReferrer}
                disabled={loading}
                className="w-full bg-pink-500 text-white py-4 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? "Checking..." : "Verify Referrer"}
              </button>
              <button 
                onClick={() => {
                  setReferBy('');
                  setStep(2);
                }}
                disabled={loading}
                className="w-full bg-transparent text-slate-500 py-2 rounded-xl font-bold uppercase tracking-widest text-xs hover:text-pink-500 transition-all"
              >
                Skip Referrer
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">First Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className={cn(
                    "w-full rounded-2xl p-4 text-sm font-bold border transition-all",
                    theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Last Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className={cn(
                    "w-full rounded-2xl p-4 text-sm font-bold border transition-all",
                    theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                  )}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Username</label>
              <input 
                type="text" 
                required
                value={formData.userName}
                onChange={(e) => setFormData({...formData, userName: e.target.value})}
                className={cn(
                  "w-full rounded-2xl p-4 text-sm font-bold border transition-all",
                  theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Personal Number</label>
              <input 
                type="tel" 
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                className={cn(
                  "w-full rounded-2xl p-4 text-sm font-bold border transition-all",
                  theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Address</label>
              <textarea 
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className={cn(
                  "w-full rounded-2xl p-4 text-sm font-bold border transition-all min-h-[80px] resize-none",
                  theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                )}
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-pink-500 text-white py-4 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Continue <ArrowRight className="inline w-4 h-4 ml-2" />
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="p-6 rounded-[2rem] bg-pink-500/5 border border-pink-500/10 space-y-4">
              <div className="flex items-center gap-3 text-pink-500">
                <CheckCircle2 className="w-6 h-6" />
                <span className="font-black uppercase tracking-widest text-sm">Profile Ready</span>
              </div>
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                Your profile information has been saved. Now, connect your Google account to complete the registration.
              </p>
            </div>
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white text-slate-900 py-4 rounded-3xl font-black uppercase tracking-widest shadow-xl border border-slate-200 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  Login with Google
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
