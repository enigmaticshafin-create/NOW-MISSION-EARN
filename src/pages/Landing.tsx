import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import { LogIn, UserPlus, CheckCircle2, ArrowRight, ShieldCheck, Zap, TrendingUp } from 'lucide-react';

import { Logo } from '../components/Logo';

export function Landing() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const features = [
    { icon: ShieldCheck, title: "Secure Platform", desc: "Your data and earnings are protected with enterprise-grade security." },
    { icon: Zap, title: "Fast Payouts", desc: "Withdraw your earnings quickly via bKash, Nagad, or Rocket." },
    { icon: TrendingUp, title: "Daily Missions", desc: "New missions every day to keep your earnings growing." }
  ];

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500",
      theme === 'dark' ? "bg-[#0a0b14] text-white" : "bg-slate-50 text-slate-900"
    )}>
      <div className="max-w-4xl w-full space-y-12 relative">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl -ml-32 -mb-32 animate-pulse" />

        <div className="text-center space-y-8 relative z-10">
          <div className="flex justify-center">
            <Logo className="scale-150" theme={theme} />
          </div>
          <div className="bg-pink-500/10 border border-pink-500/20 rounded-2xl p-4 max-w-md mx-auto">
            <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest leading-relaxed">
              Note: You must have an account to activate your earning potential. Create your profile first, then activate it from your dashboard.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <button 
            onClick={() => navigate('/login')}
            className={cn(
              "group relative overflow-hidden rounded-[2.5rem] p-8 text-left transition-all hover:scale-[1.02] active:scale-95 border",
              theme === 'dark' ? "bg-[#1a1c2e] border-[#303456] hover:border-pink-500/50" : "bg-white border-slate-200 hover:border-pink-500/50"
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center">
                <LogIn className="w-6 h-6 text-pink-500" />
              </div>
              <ArrowRight className="w-6 h-6 text-slate-400 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-2xl font-black uppercase italic mb-2">Login</h3>
            <p className="text-slate-500 text-sm font-bold">Access your agent dashboard and continue your missions.</p>
          </button>

          <button 
            onClick={() => navigate('/register')}
            className={cn(
              "group relative overflow-hidden rounded-[2.5rem] p-8 text-left transition-all hover:scale-[1.02] active:scale-95 border",
              theme === 'dark' ? "bg-[#1a1c2e] border-[#303456] hover:border-pink-500/50" : "bg-white border-slate-200 hover:border-pink-500/50"
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-6 h-6 text-slate-400 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-2xl font-black uppercase italic mb-2">Sign Up</h3>
            <p className="text-slate-500 text-sm font-bold">Create a new account, join a team, and start earning today.</p>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 relative z-10">
          {features.map((f, i) => (
            <div key={i} className="text-center space-y-3">
              <div className="w-10 h-10 bg-pink-500/5 rounded-full flex items-center justify-center mx-auto">
                <f.icon className="w-5 h-5 text-pink-500" />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest">{f.title}</h4>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center pt-8 relative z-10">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            By continuing, you agree to our <span className="text-pink-500">Terms of Service</span> and <span className="text-pink-500">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
