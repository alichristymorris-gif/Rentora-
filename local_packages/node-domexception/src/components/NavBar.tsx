import React from 'react';
import { Plus, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { Logo } from './ui/Logo';
import { AppUser } from '../types';
import { cn } from '../lib/utils';
import { NotificationCenter } from './NotificationCenter';

interface NavBarProps {
  user: AppUser | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  setIsPostModalOpen: (open: boolean) => void;
  onNavigateToMessage?: (chatId: string) => void;
}

export function NavBar({ 
  user, 
  activeTab, 
  setActiveTab, 
  isDarkMode, 
  setIsDarkMode, 
  setIsPostModalOpen,
  onNavigateToMessage
}: NavBarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-xl border-b border-bento-border dark:border-dark-border px-4 md:px-8 flex items-center justify-between h-20 transition-colors duration-300">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('main')}>
        <Logo />
        <div className="flex flex-col -gap-1">
          <span className="text-xl font-black font-syne text-slate-900 dark:text-white leading-none tracking-tighter">
            RENTORA<span className="text-blue-600">.</span>
          </span>
          <span className="text-[8px] font-black uppercase text-blue-600 tracking-[0.2em] leading-none">Global Marketplace</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <button onClick={() => setActiveTab('main')} className={cn("text-hover text-sm font-medium transition-colors", activeTab === 'main' ? "text-blue-600" : "text-bento-muted dark:text-dark-muted")}>Home</button>
        <button 
          onClick={() => {
            if (user) setActiveTab('dashboard');
            else setActiveTab('auth');
          }} 
          className={cn("text-hover text-sm font-medium transition-colors", activeTab === 'dashboard' ? "text-blue-600" : "text-bento-muted dark:text-dark-muted")}
        >
          Dashboard
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {user && <NotificationCenter userId={user.uid} onNavigateToMessage={onNavigateToMessage} />}
        
        {/* Theme Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2.5 rounded-xl border border-bento-border dark:border-dark-border text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-90"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button 
          onClick={() => setIsPostModalOpen(true)}
          className="flex items-center gap-2 bg-slate-900 dark:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-95"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Post Listing</span>
        </button>
        {user && (
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="md:hidden flex items-center justify-center w-10 h-10 bg-white border border-bento-border text-slate-900 rounded-xl hover:bg-slate-50 transition-all font-bold"
            title="Dashboard"
          >
            <LayoutDashboard size={20} />
          </button>
        )}
        {user ? (
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 bg-white dark:bg-dark-surface border border-bento-border dark:border-dark-border px-3 py-1.5 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center font-bold text-xs uppercase text-white">
              {(user.displayName || user.email || '?').charAt(0)}
            </div>
            <span className="text-xs font-medium hidden sm:inline dark:text-white">{user.displayName || user.email}</span>
          </div>
        ) : (
          <button 
            onClick={() => setActiveTab('auth')}
            className="text-slate-900 dark:text-white bg-white dark:bg-dark-surface border border-bento-border dark:border-dark-border px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
