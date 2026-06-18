import React from 'react';
import { Logo } from './ui/Logo';
import { CATEGORIES } from '../constants';

interface FooterProps {
  setActiveTab: (tab: string) => void;
  setSearchCategory: (cat: string) => void;
}

export function Footer({ setActiveTab, setSearchCategory }: FooterProps) {
  return (
    <footer className="bg-white dark:bg-dark-surface border-t border-bento-border dark:border-dark-border pt-16 pb-8 px-4 md:px-8 mt-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="text-xl font-bold font-syne text-slate-900 dark:text-white">Rentora<span className="text-blue-600">.</span></span>
          </div>
          <p className="text-sm text-slate-400 dark:text-dark-muted font-medium leading-relaxed">
            Global marketplace for all your rental needs. Rooms, cars, offices, and more.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6">Marketplace</h4>
          <ul className="space-y-4">
            {CATEGORIES.slice(1, 5).map(c => (
              <li key={c.id}>
                <button onClick={() => {setSearchCategory(c.id); setActiveTab('main'); window.scrollTo(0,0)}} className="text-sm text-slate-400 hover:text-blue-600 transition-colors font-medium cursor-pointer">{c.name}</button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6">Company</h4>
          <ul className="space-y-4">
            <li><button onClick={() => {setActiveTab('about'); window.scrollTo(0,0)}} className="text-sm text-slate-400 hover:text-blue-600 transition-colors font-medium">About Us</button></li>
            <li><button onClick={() => {setActiveTab('contact'); window.scrollTo(0,0)}} className="text-sm text-slate-400 hover:text-blue-600 transition-colors font-medium">Contact</button></li>
            <li><button className="text-sm text-slate-400 hover:text-blue-600 transition-colors font-medium">Careers</button></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6">Support</h4>
          <ul className="space-y-4">
            <li><button onClick={() => {setActiveTab('privacy'); window.scrollTo(0,0)}} className="text-sm text-slate-400 hover:text-blue-600 transition-colors font-medium">Privacy Policy</button></li>
            <li><button className="text-sm text-slate-400 hover:text-blue-600 transition-colors font-medium">Terms of Service</button></li>
            <li><button className="text-sm text-slate-400 hover:text-blue-600 transition-colors font-medium">Help Center</button></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-slate-50 dark:border-dark-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-dark-muted">
        <div>© 2026 Rentora Global Inc.</div>
        <div className="flex gap-8">
          <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors">Twitter</span>
          <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors">Instagram</span>
          <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors">LinkedIn</span>
        </div>
      </div>
    </footer>
  );
}
