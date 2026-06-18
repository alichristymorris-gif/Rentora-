import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  LogOut, 
  ShieldCheck, 
  Calendar, 
  Star, 
  Heart, 
  Search, 
  CheckCircle2, 
  Clock, 
  FileText,
  MessageSquare
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AppUser, Listing, RentalRequest } from '../../types';
import { ListingCard } from '../ListingCard';
import { TrustScore } from '../ui/TrustScore';
import { useUserReviews } from '../../hooks/useUserReviews';
import { cn } from '../../lib/utils';
import { MessagingArea } from '../MessagingArea';

interface RenterDashboardProps {
  user: AppUser;
  savedIds: string[];
  favoriteOwnerIds: string[];
  listings: Listing[];
  onToggleSave: (id: string, e?: React.MouseEvent) => void;
  onToggleFavoriteOwner: (ownerId: string, e?: React.MouseEvent) => void;
  onSelectListing: (listing: Listing) => void;
  onLogout: () => void;
  onReviewOwner: (userId: string, requestId: string) => void;
  onGenerateAgreement: (listing: Listing, renterName?: string) => void;
  activeChatId?: string | null;
}

export function RenterDashboard({ 
  user, 
  savedIds, 
  favoriteOwnerIds, 
  listings, 
  onToggleSave, 
  onToggleFavoriteOwner, 
  onSelectListing, 
  onLogout, 
  onReviewOwner,
  onGenerateAgreement,
  activeChatId
}: RenterDashboardProps) {
  const [activeTab, setActiveTab] = useState<'saved'|'history'|'favorites'|'messages'>(activeChatId ? 'messages' : 'saved');
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const { reviews: myReviews, averageRating } = useUserReviews(user.uid);

  useEffect(() => {
    const q = query(
      collection(db, 'rentalRequests'), 
      where('renterId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RentalRequest)));
    });
    return () => unsub();
  }, [user.uid]);

  const savedListings = listings.filter(l => savedIds.includes(l.id));
  const favoriteOwnersListings = listings.filter(l => favoriteOwnerIds.includes(l.ownerId));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-dark-surface border border-bento-border dark:border-dark-border p-8 rounded-[40px] shadow-sm gap-6 transition-colors">
        <div className="flex items-center gap-6">
          <div className="relative">
             {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-20 h-20 rounded-[28px] object-cover border-2 border-slate-100 dark:border-dark-border" />
            ) : (
              <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center text-4xl font-black text-white italic">
                {(user.displayName || user.email || 'U').charAt(0)}
              </div>
            )}
            {user.emailVerified && (
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-white dark:border-dark-surface shadow-lg">
                <ShieldCheck size={14} />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white capitalize">{user.displayName}</h2>
              <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">Renter</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs font-bold text-slate-400">
               <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                <span className="uppercase tracking-wide">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span className="text-slate-900 dark:text-white">{averageRating > 0 ? averageRating.toFixed(1) : 'New'}</span>
                <span className="text-slate-300 font-medium">({myReviews.length} reviews)</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <TrustScore score={myReviews.length > 0 ? averageRating * 2 : 9.0} />
          <button onClick={onLogout} className="text-red-600 text-sm font-black flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 px-6 py-3 rounded-2xl transition-all border border-transparent hover:border-red-100">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-dark-surface p-1.5 rounded-2xl border border-bento-border dark:border-dark-border w-fit transition-colors overflow-x-auto no-scrollbar max-w-full">
        {[
          { id: 'saved', label: 'Saved', icon: Heart },
          { id: 'history', label: 'History', icon: Clock },
          { id: 'favorites', label: 'Following', icon: Star },
          { id: 'messages', label: 'Messages', icon: MessageSquare }
        ].map(tab => (
           <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xl shadow-slate-900/10" 
                : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'messages' && <MessagingArea user={user} initialChatId={activeChatId || undefined} />}

      {activeTab === 'saved' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {savedListings.length > 0 ? savedListings.map((l, i) => (
            <ListingCard 
              key={l.id} 
              listing={l} 
              idx={i} 
              isSaved={true} 
              onToggleSave={onToggleSave} 
              onClick={() => onSelectListing(l)} 
            />
          )) : (
            <div className="col-span-full py-20 text-center bg-white dark:bg-dark-surface rounded-[40px] border border-bento-border dark:border-dark-border">
              <Heart size={40} className="mx-auto text-slate-100 dark:text-slate-800 mb-4" />
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No saved items found</p>
              <button 
                onClick={() => window.scrollTo(0,0)}
                className="mt-6 px-8 py-3 bg-slate-900 dark:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-xl shadow-slate-900/10"
              >
                Browse Marketplace
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'favorites' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {favoriteOwnersListings.length > 0 ? favoriteOwnersListings.map((l, i) => (
            <ListingCard 
              key={l.id} 
              listing={l} 
              idx={i} 
              isSaved={savedIds.includes(l.id)} 
              onToggleSave={onToggleSave} 
              onClick={() => onSelectListing(l)} 
            />
          )) : (
            <div className="col-span-full py-20 text-center bg-white dark:bg-dark-surface rounded-[40px] border border-bento-border dark:border-dark-border">
              <Star size={40} className="mx-auto text-slate-100 dark:text-slate-800 mb-4" />
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No followed hosts yet</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="max-w-4xl space-y-4">
          {requests.length > 0 ? requests.map((req) => (
             <div key={req.id} className="bg-white dark:bg-dark-surface border border-bento-border dark:border-dark-border p-8 rounded-[32px] flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-slate-300 dark:hover:border-slate-700">
                <div className="flex items-center gap-6">
                   <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                      req.status === 'accepted' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500" :
                      req.status === 'rejected' ? "bg-red-50 dark:bg-red-900/20 text-red-500" : "bg-amber-50 dark:bg-amber-900/20 text-amber-500"
                   )}>
                      {req.status === 'accepted' ? <CheckCircle2 size={24} /> : 
                       req.status === 'rejected' ? <Heart size={24} /> : <Clock size={24} />}
                   </div>
                   <div>
                      <h4 className="font-black text-slate-900 dark:text-white tracking-tight uppercase">{req.listingTitle}</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Status: {req.status}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   {req.status === 'accepted' && (
                      <>
                        <button 
                          onClick={() => {
                            const listing = listings.find(l => l.id === req.listingId);
                            if (listing) onGenerateAgreement(listing, user.displayName);
                          }}
                          className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 border-2 border-emerald-500 flex items-center gap-2"
                        >
                          <FileText size={14} /> View Agreement
                        </button>
                        <button 
                          onClick={() => onReviewOwner(req.ownerId, req.id)}
                          className="px-6 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                        >
                          Review host
                        </button>
                      </>
                   )}
                </div>
             </div>
          )) : (
            <div className="py-20 text-center bg-white dark:bg-dark-surface rounded-[40px] border border-bento-border dark:border-dark-border transition-colors">
              <Search size={40} className="mx-auto text-slate-100 dark:text-slate-800 mb-4" />
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No rental activity found</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
