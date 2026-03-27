import React from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  theme?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ className, iconOnly = false, theme = 'dark' }) => {
  return (
    <div className={cn("flex items-center gap-3 group select-none", className)}>
      {/* Icon Part */}
      <div className="relative">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12 shadow-lg",
          theme === 'dark' ? "bg-gradient-to-br from-pink-500 to-rose-600 shadow-pink-500/20" : "bg-pink-500 shadow-pink-500/10"
        )}>
          <TrendingUp className="w-6 h-6 text-white" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0a0b14] flex items-center justify-center">
            <DollarSign className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
        {/* Glow effect for futuristic feel */}
        <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Text Part */}
      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span className={cn(
              "text-xl font-black italic tracking-tighter uppercase",
              theme === 'dark' ? "text-white" : "text-slate-900"
            )}>
              NOW
            </span>
            <span className="text-xl font-black italic tracking-tighter uppercase text-pink-500">
              MISSION
            </span>
          </div>
          <span className={cn(
            "text-[10px] font-black uppercase tracking-[0.3em] ml-0.5",
            theme === 'dark' ? "text-slate-500" : "text-slate-400"
          )}>
            EARN
          </span>
        </div>
      )}
    </div>
  );
};
