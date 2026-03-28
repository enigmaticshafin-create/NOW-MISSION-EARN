import React from 'react';
import { Target, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ 
  className, 
  iconOnly = false, 
  theme = 'dark',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: { icon: "w-8 h-8", main: "w-5 h-5", sub: "w-2 h-2", text: "text-lg", subtext: "text-[8px]" },
    md: { icon: "w-10 h-10", main: "w-6 h-6", sub: "w-2.5 h-2.5", text: "text-xl", subtext: "text-[10px]" },
    lg: { icon: "w-16 h-16", main: "w-10 h-10", sub: "w-4 h-4", text: "text-3xl", subtext: "text-sm" }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={cn("flex items-center gap-3 group select-none", className)}>
      {/* Icon Part */}
      <div className="relative">
        <div className={cn(
          currentSize.icon,
          "rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg relative overflow-hidden",
          theme === 'dark' 
            ? "bg-gradient-to-br from-pink-500 via-rose-600 to-purple-700 shadow-pink-500/20" 
            : "bg-pink-500 shadow-pink-500/10"
        )}>
          {/* Animated background shine */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          <Target className={cn(currentSize.main, "text-white relative z-10")} />
          
          <div className={cn(
            "absolute -top-1 -right-1 rounded-full border-2 flex items-center justify-center z-20",
            currentSize.sub,
            theme === 'dark' ? "bg-emerald-500 border-[#0a0b14]" : "bg-emerald-500 border-white"
          )}>
            <Zap className="w-full h-full p-0.5 text-white fill-white" />
          </div>
        </div>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-pink-500/30 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Text Part */}
      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span className={cn(
              currentSize.text,
              "font-black italic tracking-tighter uppercase",
              theme === 'dark' ? "text-white" : "text-slate-900"
            )}>
              NOW
            </span>
            <span className={cn(
              currentSize.text,
              "font-black italic tracking-tighter uppercase text-pink-500"
            )}>
              MISSION
            </span>
          </div>
          <span className={cn(
            currentSize.subtext,
            "font-black uppercase tracking-[0.4em] ml-0.5",
            theme === 'dark' ? "text-slate-500" : "text-slate-400"
          )}>
            EARN
          </span>
        </div>
      )}
    </div>
  );
};
