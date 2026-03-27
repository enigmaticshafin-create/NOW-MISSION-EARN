import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Settings as SettingsIcon, Bell, Shield, Moon, Sun, Smartphone, Globe, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const sections = [
    {
      title: 'Preferences',
      items: [
        { name: 'Dark Mode', icon: theme === 'dark' ? Moon : Sun, action: toggleTheme, value: theme === 'dark' ? 'On' : 'Off' },
        { name: 'Language', icon: Globe, value: 'English' },
      ]
    },
    {
      title: 'Security',
      items: [
        { name: 'Two-Factor Auth', icon: Shield, value: 'Disabled' },
        { name: 'Notifications', icon: Bell, value: 'Enabled' },
      ]
    },
    {
      title: 'App Info',
      items: [
        { name: 'Version', icon: Smartphone, value: '1.0.0' },
      ]
    }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8 pt-8 pb-20 px-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
          <SettingsIcon className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight italic uppercase">Settings</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Manage your app experience</p>
        </div>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">{section.title}</h3>
            <div className={cn(
              "rounded-[2rem] border overflow-hidden",
              theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
            )}>
              {section.items.map((item, idx) => (
                <button 
                  key={item.name}
                  onClick={item.action}
                  className={cn(
                    "w-full flex items-center justify-between p-5 hover:bg-slate-500/5 transition-all text-left",
                    idx !== section.items.length - 1 && "border-b",
                    theme === 'dark' ? "border-[#303456]" : "border-slate-100"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      theme === 'dark' ? "bg-[#252841]" : "bg-slate-50"
                    )}>
                      <item.icon className="w-5 h-5 text-pink-500" />
                    </div>
                    <span className="text-sm font-bold">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{item.value}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        <button 
          onClick={() => signOut(auth)}
          className="w-full flex items-center justify-center gap-3 p-5 rounded-[2rem] border border-rose-500/20 bg-rose-500/5 text-rose-500 font-black uppercase text-xs tracking-widest hover:bg-rose-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Log out from all devices
        </button>
      </div>
    </div>
  );
}
