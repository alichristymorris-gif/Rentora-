import React from 'react';
import { cn } from '../../lib/utils';

export const Logo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <div className={cn("relative flex items-center justify-center", className)}>
    <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      {/* Background shape for the entire R silhouette */}
      <path 
        d="M10 30 C10 15 25 15 40 15 H65 C85 15 90 35 90 50 C90 65 80 75 65 75 L85 95 H68 L48 76 L28 95 H10 V30" 
        fill="url(#logoGradient)" 
      />
      
      {/* Upper white cutout that defines the R loop */}
      <path 
        d="M28 32 H60 C72 32 72 45 60 45 H30 C28 45 28 40 28 32" 
        fill="white" 
      />
      
      {/* House shape forming the lower-left section of the R */}
      <path 
        d="M10 65 L48 45 L85 75" 
        fill="none" 
        stroke="white" 
        strokeWidth="6" 
        strokeLinecap="round" 
      />
      
      {/* The house's 2x2 window grid */}
      <rect x="35" y="72" width="7" height="7" fill="white" rx="1.5" />
      <rect x="46" y="72" width="7" height="7" fill="white" rx="1.5" />
      <rect x="35" y="83" width="7" height="7" fill="white" rx="1.5" />
      <rect x="46" y="83" width="7" height="7" fill="white" rx="1.5" />
    </svg>
  </div>
);
