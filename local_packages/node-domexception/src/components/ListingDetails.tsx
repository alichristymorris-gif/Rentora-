import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, MapPin, Eye, Star, Flag, Heart, MessageCircle } from 'lucide-react';
import { Listing, AppUser } from '../types';
import { TrustScore } from './ui/TrustScore';
import { useUserReviews } from '../hooks/useUserReviews';
import { CATEGORIES } from '../constants';
import { cn } from '../lib/utils';
import { ReportModal } from './modals/ReportModal';

interface ListingDetailsProps {
  listing: Listing;
  user: AppUser | null;
  listings: Listing[];
  onClose: () => void;
  onSelectListing: (listing: Listing) => void;
  onToggleSave: (id: string, e?: React.MouseEvent) => void;
  isSaved: boolean;
  onToggleFavoriteOwner: (ownerId: string, e?: React.MouseEvent) => void;
  isFavoriteOwner: boolean;
  onRequest: () => void;
  onStartChat: (owner: { uid: string, displayName: string, photoURL?: string }) => void;
}

export function ListingDetails({ 
  listing, 
  user, 
  listings, 
  onClose, 
  onSelectListing, 
  onToggleSave, 
  isSaved, 
  onToggleFavoriteOwner, 
  isFavoriteOwner, 
  onRequest,
  onStartChat
}: ListingDetailsProps) {
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const { reviews: ownerReviews, averageRating } = useUserReviews(listing.ownerId);

  const images = listing.images && listing.images.length > 0 ? listing.images : [];
  const similarListings = listings
    .filter(l => l.category === listing.category && l.id !== listing.id)
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 overflow-y-auto pt-20 pb-10">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <motion.div 
        layoutId={listing.id}
        className="relative bg-white dark:bg-dark-surface border border-bento-border dark:border-dark-border w-full max-w-6xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col lg:flex-row h-auto lg:h-[85vh] transition-colors"
      >
        <button onClick={onClose} className="absolute top-6 right-6 z-20 w-12 h-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-900 dark:text-white border border-slate-100 dark:border-dark-border shadow-sm hover:bg-white transition-all">
          <X size={24} />
        </button>

        {/* Left: Gallery */}
        <div className="lg:w-3/5 bg-slate-50 dark:bg-slate-900 flex flex-col relative p-0 overflow-hidden border-r border-slate-50 dark:border-dark-border">
          <div className="flex-1 relative group bg-slate-100 dark:bg-slate-900">
            {images.length > 0 ? (
              <img 
                src={images[activeImgIdx]} 
                alt={listing.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <span className="text-[160px] opacity-20 filter grayscale">{CATEGORIES.find(c => c.id === listing.category)?.name.charAt(0) || '📦'}</span>
              </div>
            )}
            
            <div className="absolute top-8 left-8 flex flex-col gap-3">
              {listing.status && listing.status !== 'available' && (
                <span className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl",
                  listing.status === 'rented' ? "bg-red-600 text-white" : "bg-amber-500 text-white"
                )}>
                  {listing.status}
                </span>
              )}
              <div className="px-4 py-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl shadow-xl flex items-center gap-2 border border-white/20">
                <span className="text-lg">{listing.flag}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{listing.city}</span>
              </div>
            </div>

            {images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/20 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20">
                {images.map((_: any, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImgIdx(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      activeImgIdx === i ? "bg-white w-6" : "bg-white/40 hover:bg-white/60"
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="p-4 bg-white dark:bg-dark-surface flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-50 dark:border-dark-border">
              {images.map((img: string, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImgIdx(idx)}
                  className={cn(
                    "w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all shadow-sm",
                    activeImgIdx === idx ? "border-blue-600 scale-105" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="lg:w-2/5 flex flex-col h-full bg-white dark:bg-dark-surface">
          <div className="flex-1 overflow-y-auto no-scrollbar p-8 lg:p-12">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-600">{listing.category}</div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsReportModalOpen(true)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all border border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Report Listing"
                  >
                    <Flag size={20} />
                  </button>
                  <button 
                    onClick={(e) => onToggleSave(listing.id, e)}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all border",
                      isSaved ? "bg-red-50 border-red-100 text-red-500" : "bg-slate-50 border-slate-100 text-slate-400 hover:text-red-500"
                    )}
                  >
                    <Heart size={20} fill={isSaved ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] mb-4">{listing.title}</h2>
              <div className="flex items-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-widest">
                <div className="flex items-center gap-1.5"><MapPin size={14} /> {listing.city}, {listing.country}</div>
                <div className="w-1 h-1 bg-slate-200 rounded-full" />
                <div className="flex items-center gap-1.5"><Eye size={14} /> {listing.views || 0} Views</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-10">
              {listing.tags.map((tag: string) => (
                <span key={tag} className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-dark-border rounded-xl text-[10px] font-black text-slate-400 dark:text-dark-muted uppercase tracking-widest">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="space-y-12 mb-12">
              <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-dark-border">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[10px] uppercase font-black text-slate-900 dark:text-white tracking-widest">About this rental</h3>
                  <div className="flex items-center gap-1 text-amber-500 font-black text-xs">
                    <Star size={14} fill="currentColor" /> {averageRating > 0 ? averageRating.toFixed(1) : 'New'}
                  </div>
                </div>
                <p className="text-slate-600 dark:text-dark-muted leading-relaxed font-medium text-sm mb-8">{listing.description}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-dark-border transition-all cursor-pointer group"
                    onClick={() => onToggleFavoriteOwner(listing.ownerId)}
                  >
                    <div className="text-[9px] uppercase font-black text-slate-400 mb-2">Listed By</div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900 dark:bg-blue-600 rounded-xl flex items-center justify-center text-sm text-white font-black group-hover:scale-105 transition-transform">
                        {listing.ownerName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 dark:text-white text-sm truncate">{listing.ownerName}</div>
                        <div className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase">
                          <Star size={10} fill={isFavoriteOwner ? "currentColor" : "none"} /> {isFavoriteOwner ? 'Favorite' : 'Follow'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-dark-border">
                    <div className="text-[9px] uppercase font-black text-slate-400 mb-2">Trust Score</div>
                    <div className="flex flex-col items-center">
                       <TrustScore score={ownerReviews.length > 0 ? averageRating * 2 : 9.0} />
                    </div>
                  </div>
                </div>
              </div>

              {similarListings.length > 0 && (
                <div>
                  <h3 className="text-[10px] uppercase font-black text-slate-900 dark:text-white tracking-widest mb-6">Similar Listings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {similarListings.map((l: any) => (
                      <div 
                        key={l.id} 
                        onClick={() => onSelectListing(l)}
                        className="bg-slate-50 dark:bg-slate-900 rounded-2xl overflow-hidden cursor-pointer group border border-transparent hover:border-blue-500/30 transition-all shadow-sm"
                      >
                        <div className="aspect-[4/3] relative overflow-hidden">
                          <img src={l.images[0]} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                        </div>
                        <div className="p-3">
                          <h4 className="text-[10px] font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{l.title}</h4>
                          <span className="text-[9px] font-bold text-blue-600">{l.currency} {l.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-8 lg:p-10 border-t border-slate-50 dark:border-dark-border bg-white dark:bg-dark-surface/50 backdrop-blur-md">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Rental Period</div>
                <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                  {listing.currency} {listing.price.toLocaleString()}
                  <span className="text-sm text-slate-400 dark:text-dark-muted font-bold ml-2">/ {listing.period.replace('per ', '')}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Availability</div>
                <div className={cn(
                  "text-xs font-black uppercase flex items-center justify-end gap-1.5",
                  listing.status === 'available' ? "text-emerald-500" : "text-amber-500"
                )}>
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", listing.status === 'available' ? "bg-emerald-500" : "bg-amber-500")} />
                  {listing.status || 'Available'}
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => onStartChat({ uid: listing.ownerId, displayName: listing.ownerName })}
                className="w-16 h-16 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-dark-border text-slate-900 dark:text-white rounded-[24px] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm"
                title="Message Owner"
              >
                <MessageCircle size={24} />
              </button>
              <button 
                onClick={onRequest}
                disabled={listing.status !== 'available'}
                className="flex-1 bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-[24px] font-black shadow-2xl shadow-slate-900/10 active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50 disabled:grayscale"
              >
                Request to Rent
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        targetType="listing" 
        targetId={listing.id} 
        targetName={listing.title} 
      />
    </div>
  );
}
