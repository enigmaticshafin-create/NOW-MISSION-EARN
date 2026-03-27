import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, limit, getDocs, runTransaction } from 'firebase/firestore';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, UserPlus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

export function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const referralCode = searchParams.get('ref') || '';

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
        // New user - MUST go through Register flow
        await signOut(auth);
        const params = new URLSearchParams();
        if (referralCode) params.set('referBy', referralCode);
        navigate(`/register?${params.toString()}`);
        return;
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
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/5 rounded-full blur-3xl -ml-16 -mb-16" />

        <div className="text-center space-y-4 relative z-10">
          <div className="w-20 h-20 bg-pink-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-pink-500/20">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter italic uppercase">
              NOW <span className="text-pink-500">MISSION</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Agent Access Point</p>
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          {referralCode ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl text-center space-y-3">
              <UserPlus className="w-10 h-10 text-emerald-500 mx-auto" />
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Referral Link Active</p>
                <p className="text-xl font-black text-emerald-500 tracking-widest italic">{referralCode}</p>
              </div>
            </div>
          ) : (
            <div className="bg-pink-500/5 border border-pink-500/10 p-4 rounded-2xl text-center">
              <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-1">Notice</p>
              <p className="text-[11px] text-slate-500 font-medium">
                New agents must use a referral link to join. Existing agents can sign in as usual.
              </p>
            </div>
          )}

          <button 
            type="button" 
            onClick={handleGoogleLogin} 
            disabled={loading}
            className={cn(
              "w-full py-6 rounded-3xl font-black transition-all flex items-center justify-center gap-4 border-2 uppercase tracking-widest text-sm shadow-xl active:scale-95 disabled:opacity-50",
              theme === 'dark' ? "bg-[#0a0b14] border-[#303456] hover:bg-[#303456] text-white" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-900"
            )}
          >
            <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
            {loading ? 'Processing...' : 'Sign in with Google'}
          </button>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold uppercase tracking-tight">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <button 
            type="button" 
            onClick={() => navigate('/')} 
            className="w-full text-slate-500 hover:text-pink-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 pt-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
