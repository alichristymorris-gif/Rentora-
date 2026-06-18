import React from 'react';
import { Search, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { countries } from '../data/locations';
import { CATEGORIES } from '../constants';
import { cn } from '../lib/utils';

interface HeroProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchCategory: string;
  setSearchCategory: (cat: string) => void;
  searchCountry: string;
  setSearchCountry: (country: string) => void;
  searchCity: string;
  setSearchCity: (city: string) => void;
  minPrice: string;
  setMinPrice: (p: string) => void;
  maxPrice: string;
  setMaxPrice: (p: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  searchSuggestions: string[];
  availableCitiesForSearch: string[];
}

export function Hero({
  searchQuery,
  setSearchQuery,
  searchCategory,
  setSearchCategory,
  searchCountry,
  setSearchCountry,
  searchCity,
  setSearchCity,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  sortBy,
  setSortBy,
  showSuggestions,
  setShowSuggestions,
  searchSuggestions,
  availableCitiesForSearch
}: HeroProps) {
  return (
    <header className="mb-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold tracking-widest uppercase mb-4 dark:bg-blue-900/20 dark:border-blue-900/30">
          Worldwide Rental Market
        </span>
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter leading-tight text-slate-900 dark:text-white">
          Rent <span className="text-blue-600">Anything,</span> Anywhere.
        </h1>
        <p className="text-bento-muted dark:text-dark-muted text-lg font-medium">
          Global marketplace for homes, cars, offices, and equipment.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-dark-surface border border-bento-border dark:border-dark-border p-2 rounded-3xl shadow-sm flex flex-col md:flex-row gap-2 relative transition-colors">
          <div className="flex-1 flex items-center gap-2 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent focus-within:border-blue-500/20 transition-all relative">
            <Search size={18} className="text-bento-muted dark:text-dark-muted" />
            <input 
              type="text" 
              placeholder="Search by name, city or keyword..."
              className="w-full bg-transparent border-none py-4 text-sm outline-none text-slate-900 dark:text-white font-medium"
              value={searchQuery}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <AnimatePresence>
              {showSuggestions && searchSuggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-surface border border-bento-border dark:border-dark-border rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  {searchSuggestions.map((s, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        setSearchQuery(s);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors border-b border-slate-50 dark:border-dark-border last:border-0"
                    >
                      <Search size={14} className="text-slate-300" />
                      <span className="font-medium text-slate-700 dark:text-gray-300">{s}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex gap-2 h-14 md:h-auto">
            <select 
              className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-dark-border px-4 rounded-2xl text-sm outline-none min-w-[140px] focus:border-blue-500/20 transition-all font-medium text-slate-700 dark:text-gray-300"
              value={searchCountry}
              onChange={(e) => {
                setSearchCountry(e.target.value);
                setSearchCity('');
              }}
            >
              <option value="">All Countries</option>
              {countries.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
            </select>

            <select 
              className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-dark-border px-4 rounded-2xl text-sm outline-none min-w-[140px] focus:border-blue-500/20 transition-all disabled:opacity-50 font-medium text-slate-700 dark:text-gray-300"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              disabled={!searchCountry}
            >
              <option value="">All Cities</option>
              {availableCitiesForSearch.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
          <button 
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95"
          >
            Search
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-dark-surface border border-bento-border dark:border-dark-border px-3 py-2 rounded-xl transition-colors">
              <DollarSign size={14} className="text-slate-400 dark:text-dark-muted" />
              <input 
                type="number" 
                placeholder="Min Price" 
                className="w-20 bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-white"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span className="text-slate-300">—</span>
              <input 
                type="number" 
                placeholder="Max Price" 
                className="w-20 bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-white"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            
            {(minPrice || maxPrice) && (
              <button 
                onClick={() => {setMinPrice(''); setMaxPrice('');}}
                className="text-[10px] uppercase font-black text-blue-600 hover:underline"
              >
                Clear Price
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-black text-slate-400 dark:text-dark-muted tracking-widest hidden sm:inline">Sort By:</span>
            <select 
              className="bg-white dark:bg-dark-surface border border-bento-border dark:border-dark-border px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-white outline-none focus:border-blue-500/20"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto py-6 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button 
            key={cat.id}
            onClick={() => setSearchCategory(cat.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl border whitespace-nowrap transition-all text-xs font-bold",
              searchCategory === cat.id 
                ? "bg-slate-900 dark:bg-blue-600 border-slate-900 dark:border-blue-600 text-white" 
                : "bg-white dark:bg-dark-surface border-bento-border dark:border-dark-border text-bento-muted dark:text-dark-muted hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400"
            )}
          >
            <cat.icon size={14} />
            {cat.name}
          </button>
        ))}
      </div>
    </header>
  );
}
