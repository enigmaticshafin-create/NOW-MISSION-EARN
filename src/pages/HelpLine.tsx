import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { HelpCircle, Mail, Send, Phone, MessageSquare, ExternalLink, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function HelpLine() {
  const { theme } = useTheme();

  const channels = [
    { name: 'Telegram Support', icon: Send, value: '@nowmissionearn_support', color: 'bg-sky-500' },
    { name: 'Email Support', icon: Mail, value: 'support@nowmissionearn.com', color: 'bg-red-500' },
    { name: 'WhatsApp Support', icon: MessageSquare, value: '+880 17XXXXXXXX', color: 'bg-emerald-500' },
    { name: 'Phone Support', icon: Phone, value: '+880 17XXXXXXXX', color: 'bg-blue-600' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8 pt-8 pb-20 px-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
          <HelpCircle className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight italic uppercase">HelpLine</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">We're here to help you 24/7</p>
        </div>
      </div>

      <div className="grid gap-4">
        {channels.map((channel) => (
          <div 
            key={channel.name}
            className={cn(
              "rounded-3xl p-6 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:scale-[1.01]",
              theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", channel.color)}>
                <channel.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-black text-lg tracking-tight">{channel.name}</h4>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{channel.value}</p>
              </div>
            </div>
            <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-pink-500 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-pink-500/20 hover:scale-105 transition-all">
              Contact Now <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className={cn(
        "rounded-[2.5rem] p-8 border space-y-4 text-center",
        theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
      )}>
        <h3 className="text-xl font-black tracking-tight italic uppercase">Frequently Asked Questions</h3>
        <p className="text-slate-500 text-sm font-medium">Check our FAQ section for quick answers to common questions.</p>
        <button className="bg-slate-500/10 text-slate-500 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-500/20 transition-all flex items-center justify-center gap-2 mx-auto">
          View FAQ <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
