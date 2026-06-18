import React from 'react';

export const TrustScore = ({ score }: { score: number }) => {
  const percentage = Math.round(score * 10); // scale 0-10
  const color = percentage > 80 ? '#10b981' : percentage > 60 ? '#3b82f6' : '#f59e0b';
  
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-slate-800" />
          <circle 
            cx="32" cy="32" r="28" stroke={color} strokeWidth="4" fill="transparent" 
            strokeDasharray={2 * Math.PI * 28} 
            strokeDashoffset={2 * Math.PI * 28 * (1 - percentage / 100)} 
            strokeLinecap="round" 
          />
        </svg>
        <span className="absolute text-sm font-black text-slate-900 dark:text-white">{percentage}%</span>
      </div>
      <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Trust Score</span>
    </div>
  );
};
