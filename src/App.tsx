import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Timer } from './components/Timer';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { AdminPanel } from './pages/AdminPanel';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import MyJobs from './pages/MyJobs';
import MyTeam from './pages/MyTeam';
import Leaderboard from './pages/Leaderboard';
import MyJobsHistory from './pages/MyJobsHistory';
import GiftCode from './pages/GiftCode';
import TeamLeader from './pages/TeamLeader';
import SellPage from './pages/SellPage';
import Settings from './pages/Settings';
import HelpLine from './pages/HelpLine';
import Wallet from './pages/Wallet';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import { Landing } from './pages/Landing';
import { Logo } from './components/Logo';
import { useAuth } from './hooks/useAuth';
import { auth, db } from './firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { DynamicSettings } from './types';
import { 
  LayoutDashboard, 
  Gift, 
  Briefcase, 
  History, 
  Users, 
  UserCheck, 
  Trophy, 
  Wallet as WalletIcon, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Mail, 
  Facebook, 
  Send, 
  Instagram, 
  User, 
  Settings as SettingsIcon, 
  HelpCircle, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon,
  Copy,
  ShieldCheck,
  Eye,
  ListTodo,
  Landmark,
  Award,
  Settings as LucideSettings
} from 'lucide-react';
import { cn } from './lib/utils';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dynamicSettings, setDynamicSettings] = useState<DynamicSettings | null>(null);
  const location = useLocation();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'dynamicSettings', 'main'));
        if (snap.exists()) {
          setDynamicSettings(snap.data() as DynamicSettings);
        }
      } catch (error) {
        console.error('Error fetching dynamic settings:', error);
      }
    };
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const navItems = [
    { group: 'Main', items: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
      { name: 'Use GiftCode', icon: Gift, path: '/giftcode' },
    ]},
    { group: 'Jobs', items: [
      { name: 'My Job', icon: Briefcase, path: '/my-jobs' },
      { name: 'My Job History', icon: History, path: '/history' },
    ]},
    { group: 'Team', items: [
      { name: 'My Team', icon: Users, path: '/my-team' },
      { name: 'Team Leader', icon: UserCheck, path: '/team-leader' },
      { name: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
    ]},
    { group: 'Payments', items: [
      { name: 'Wallet', icon: WalletIcon, path: '/wallet' },
      { name: 'Deposit', icon: ArrowDownCircle, path: '/deposit' },
      { name: 'Withdraw', icon: ArrowUpCircle, path: '/withdraw' },
    ]},
    { group: 'Sell', items: [
      { name: 'Gmail Sell', icon: Mail, path: '/gmail-sell' },
      { name: 'Facebook Sell', icon: Facebook, path: '/facebook-sell' },
      { name: 'Telegram Sell', icon: Send, path: '/telegram-sell' },
      { name: 'Instagram Sell', icon: Instagram, path: '/instagram-sell' },
    ]},
    { group: 'Account', items: [
      { name: 'Update Profile', icon: User, path: '/profile' },
      { name: 'Setting', icon: SettingsIcon, path: '/settings' },
      { name: 'HelpLine', icon: HelpCircle, path: '/helpline' },
    ]},
  ];

  const Sidebar = () => (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:translate-x-0",
        theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200",
        "border-r",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between border-b border-slate-800/50">
            <Link to="/" onClick={() => setIsSidebarOpen(false)}>
              <Logo theme={theme} size="sm" />
            </Link>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-pink-500 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {navItems.map((group) => (
              <div key={group.group} className="space-y-2">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">
                  {group.group}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all",
                        location.pathname === item.path 
                          ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20" 
                          : cn(
                              "text-slate-400 hover:text-white",
                              theme === 'dark' ? "hover:bg-[#252841]" : "hover:bg-slate-100 hover:text-slate-900"
                            )
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            
            {(profile?.role === 'admin' || profile?.role === 'moderator' || profile?.role === 'ceo') && (
              <div className="space-y-2 pt-4 border-t border-[#303456]">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">
                  {profile?.role === 'ceo' ? 'CEO' : 'Admin'}
                </h3>
                <Link
                  to="/admin"
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all",
                    location.pathname === '/admin' 
                      ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20" 
                      : cn(
                          "text-slate-400 hover:text-white",
                          theme === 'dark' ? "hover:bg-[#252841]" : "hover:bg-slate-100 hover:text-slate-900"
                        )
                  )}
                >
                  <ShieldCheck className="w-4 h-4" />
                  {profile?.role === 'ceo' ? 'CEO Panel' : 'Admin Panel'}
                </Link>
              </div>
            )}

            {user && (
              <button 
                onClick={() => signOut(auth)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div 
      className={cn(
        "min-h-screen transition-colors duration-300 relative",
        theme === 'dark' ? "bg-[#0a0b14] text-white" : "bg-slate-50 text-slate-900"
      )}
      style={dynamicSettings?.backgroundImageUrl ? {
        backgroundImage: `url(${dynamicSettings.backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : {}}
    >
      {dynamicSettings?.backgroundImageUrl && (
        <div className={cn(
          "fixed inset-0 pointer-events-none",
          theme === 'dark' ? "bg-black/60" : "bg-white/40"
        )} />
      )}
      {user && <Sidebar />}
      
      <div className={cn(
        "transition-all duration-300",
        user ? "lg:pl-64" : ""
      )}>
        {/* Header */}
        <header className={cn(
          "sticky top-0 z-40 h-16 border-b flex items-center justify-between px-4 lg:px-8",
          theme === 'dark' ? "bg-[#0a0b14]/80 border-[#303456]" : "bg-white/80 border-slate-200",
          "backdrop-blur-md"
        )}>
          <div className="flex items-center gap-4">
            {user && (
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-400">
                <Menu className="w-6 h-6" />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2">
              <Logo theme={theme} />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <Link 
                to="/" 
                className="hidden sm:flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
              >
                <ListTodo className="w-3 h-3" />
                Now Mission
              </Link>
            )}
            <Timer />
            {user && (profile?.role === 'admin' || profile?.role === 'moderator' || profile?.role === 'ceo') && (
              <Link 
                to="/admin" 
                className="hidden sm:flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-pink-500/20 hover:scale-105 transition-all"
              >
                <ShieldCheck className="w-3 h-3" />
                {profile.role === 'ceo' ? 'CEO Panel' : profile.role === 'admin' ? 'Admin Panel' : 'Moderator Panel'}
              </Link>
            )}
            <button 
              onClick={toggleTheme}
              className={cn(
                "p-2 rounded-xl transition-all",
                theme === 'dark' ? "bg-[#252841] text-amber-400" : "bg-slate-100 text-indigo-600"
              )}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {!user && (
              <div className="flex items-center gap-2 ml-2">
                <Link 
                  to="/login" 
                  className="bg-pink-500/10 text-pink-500 px-4 py-2 rounded-xl font-bold text-xs hover:bg-pink-500/20 transition-all"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-pink-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-pink-500/20 hover:scale-105 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user && (profile?.role === 'admin' || profile?.role === 'moderator' || profile?.role === 'ceo') ? <AdminPanel /> : <Navigate to="/" />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
            <Route path="/my-jobs" element={user ? <MyJobs /> : <Navigate to="/login" />} />
            <Route path="/my-team" element={user ? <MyTeam /> : <Navigate to="/login" />} />
            <Route path="/team-leader" element={user ? <TeamLeader /> : <Navigate to="/login" />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/history" element={user ? <MyJobsHistory /> : <Navigate to="/login" />} />
            <Route path="/giftcode" element={user ? <GiftCode /> : <Navigate to="/login" />} />
            <Route path="/wallet" element={user ? <Wallet /> : <Navigate to="/login" />} />
            <Route path="/deposit" element={user ? <Deposit /> : <Navigate to="/login" />} />
            <Route path="/withdraw" element={user ? <Withdraw /> : <Navigate to="/login" />} />
            <Route path="/facebook-sell" element={user ? <SellPage type="Facebook" /> : <Navigate to="/login" />} />
            <Route path="/telegram-sell" element={user ? <SellPage type="Telegram" /> : <Navigate to="/login" />} />
            <Route path="/instagram-sell" element={user ? <SellPage type="Instagram" /> : <Navigate to="/login" />} />
            <Route path="/gmail-sell" element={user ? <SellPage type="Gmail" /> : <Navigate to="/login" />} />
            <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
            <Route path="/helpline" element={user ? <HelpLine /> : <Navigate to="/login" />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Router>
          <AppContent />
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
