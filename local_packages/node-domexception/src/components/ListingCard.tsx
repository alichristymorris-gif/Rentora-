import React from 'react';
import { motion } from 'motion/react';
import { Heart, MapPin } from 'lucide-react';
import { Listing } from '../types';
import { CATEGORIES } from '../constants';
import { cn } from '../lib/utils';

interface ListingCardProps {
  listing: Listing;
  idx: number;
  isSaved: boolean;
  onToggleSave: (id: string, e?: React.MouseEvent) => void;
  onClick: () => void;
}

export function ListingCard({ listing, idx, isSaved, onToggleSave, onClick }: ListingCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.05 }}
      layout
      onClick={onClick}
      className="group relative bg-white dark:bg-dark-surface border border-bento-border dark:border-dark-border rounded-3xl overflow-hidden cursor-pointer hover:border-blue-500/30 transition-all hover:translate-y-[-4px] shadow-sm hover:shadow-xl"
    >
      <div className="h-48 bg-slate-50 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden">
        {listing.images && listing.images.length > 0 ? (
           <img 
            src={listing.images[0]} 
            alt={listing.title} 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://placehold.co/600x400?text=${listing.category}`;
            }}
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 opacity-20" />
            <div className="text-4xl text-slate-300 group-hover:scale-110 transition-transform duration-500">
              {CATEGORIES.find(c => c.id === listing.category)?.name.charAt(0) || '📦'}
            </div>
          </>
        )}
        
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="flex gap-2">
            {listing.isNew && <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tighter">New</span>}
            {listing.isHot && <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tighter">Hot</span>}
          </div>
          {listing.status && listing.status !== 'available' && (
            <span className={cn(
              "text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest w-fit",
              listing.status === 'rented' ? "bg-red-500 text-white" : "bg-amber-500 text-white"
            )}>
              {listing.status}
            </span>
          )}
        </div>
        
        <button 
          onClick={(e) => onToggleSave(listing.id, e)}
          className={cn(
            "absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center transition-all backdrop-blur-md",
            isSaved ? "bg-red-500 text-white" : "bg-white/80 dark:bg-black/50 text-slate-400 dark:text-gray-300 hover:text-red-500 border border-slate-100 dark:border-white/10"
          )}
        >
          <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
        </button>

        <div className="absolute bottom-4 left-4 bg-white/80 dark:bg-black/50 backdrop-blur-md text-slate-900 dark:text-white border border-white/20 text-[10px] px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
          <span>{listing.flag}</span>
          <span className="font-bold">{listing.city}</span>
        </div>
      </div>

      <div className="p-5">
        <div className="text-[10px] uppercase font-bold tracking-widest text-blue-600 mb-1.5">{listing.category}</div>
        <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 mb-2 group-hover:text-blue-600 transition-colors uppercase">{listing.title}</h3>
        <div className="flex items-center gap-1.5 text-[11px] text-bento-muted dark:text-dark-muted font-medium mb-5">
          <MapPin size={12} className="text-slate-400 dark:text-dark-muted" />
          {listing.city}, {listing.country}
        </div>
        <div className="flex items-center justify-between border-t border-slate-50 dark:border-dark-border pt-4">
          <div className="text-slate-900 dark:text-white font-black text-lg tracking-tight">
            {listing.currency} {listing.price.toLocaleString()} <span className="text-[11px] text-bento-muted dark:text-dark-muted font-medium ml-1">/ {listing.period.replace('per ', '')}</span>
          </div>
          <button className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all">
            Details
          </button>
        </div>
      </div>
    </motion.div>
  );
}
