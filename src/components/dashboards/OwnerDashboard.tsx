import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  LogOut, 
  ShieldCheck, 
  Calendar, 
  Star, 
  Globe, 
  Eye, 
  MousePointer2, 
  Edit2, 
  Trash2, 
  FileText,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AppUser, Listing, RentalRequest } from '../../types';
import { TrustScore } from '../ui/TrustScore';
import { useUserReviews } from '../../hooks/useUserReviews';
import { ADMIN_EMAILS, CATEGORIES } from '../../constants';
import { cn } from '../../lib/utils';
import { MessagingArea } from '../../lib/MessagingArea';

interface OwnerDashboardProps {
  user: AppUser;
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
  onLogout: () => void;
  onEditListing: (listing: Listing) => void;
  onDeleteListing: (id: string) => void;
  onGenerateAgreement: (listing: Listing, renterName?: string) => void;
  onReviewRenter: (userId: string, requestId: string) => void;
  activeChatId?: string | null;
}

export function OwnerDashboard({ 
  user, 
  listings, 
  onSelectListing, 
  onLogout, 
  onEditListing, 
  onDeleteListing, 
  onGenerateAgreement, 
  onReviewRenter,
  activeChatId
}: OwnerDashboardProps) {
  const [activeView, setActiveView] = useState<'dashboard' | 'messages'>(activeChatId ? 'messages' : 'dashboard');
  const [receivedRequests, setReceivedRequests] = useState<RentalRequest[]>([]);
  const { reviews: receivedReviews, averageRating } = useUserReviews(user.uid);

  useEffect(() => {
    let requestsChannel: any = null;

    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('rentalRequests')
        .select('*')
        .eq('ownerId', user.uid)
        .order('createdAt', { ascending: false });
      if (!error && data) {
        setReceivedRequests(data as RentalRequest[]);
      }
    };

    fetchRequests();

    requestsChannel = supabase.channel(`owner-requests-${user.uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rentalRequests', filter: `ownerId=eq.${user.uid}` }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      if (requestsChannel) requestsChannel.unsubscribe();
    };
  }, [user.uid]);

  const handleRequestStatus = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      await supabase.from('rentalRequests').update({ status }).eq('id', requestId);
    } catch (e) {
      console.error("Error updating request:", e);
    }
  };

  const isAdmin = ADMIN_EMAILS.includes(user.email);
  const myOwnListings = isAdmin 
    ? listings 
    : listings.filter((l) => l.ownerId === user.uid);

  const analytics = useMemo(() => {
    return {
      totalListings: myOwnListings.length,
      totalViews: myOwnListings.reduce((acc, l) => acc + (l.views || 0), 0),
      totalClicks: myOwnListings.reduce((acc, l) => acc + (l.clicks || 0), 0),
      totalSaved: myOwnListings.reduce((acc, l) => acc + (l.savedCount || 0), 0),
    };
  }, [myOwnListings]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-dark-surface border border-bento-border dark:border-dark-border p-8 rounded-[40px] shadow-sm gap-6 transition-colors">
        <div className="flex items-center gap-6">
          <div className="relative">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-20 h-20 rounded-[28px] object-cover border-2 border-slate-100 dark:border-dark-border" />
            ) : (
              <div className="w-20 h-20 bg-slate-900 rounded-[28px] flex items-center justify-center text-4xl font-black text-white italic">
                {(user.displayName || user.email || 'U').charAt(0)}
              </div>
            )}
            {user.emailVerified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full border-2 border-white dark:border-dark-surface shadow-lg" title="Verified Account">
                <ShieldCheck size={14} />
              </div>
            )}
            {isAdmin && (
              <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-lg border-2 border-white shadow-xl rotate-12">
                ADMIN
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white capitalize">{user.displayName}</h2>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-dark-muted text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">Host</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs font-bold text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-300" />
                <span className="uppercase tracking-wide">Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span className="text-slate-900 dark:text-white">{averageRating > 0 ? averageRating.toFixed(1) : 'New'}</span>
                <span className="text-slate-300 font-medium">({receivedReviews.length} reviews)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe size={14} className="text-slate-300" />
                <span className="uppercase tracking-wide">{analytics.totalListings} Listings</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <TrustScore score={receivedReviews.length > 0 ? averageRating * 2 : 9.0} />
          <button onClick={onLogout} className="text-red-600 text-sm font-black flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 px-6 py-3 rounded-2xl transition-all border border-transparent hover:border-red-100">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-dark-surface p-1.5 rounded-2xl border border-bento-border dark:border-dark-border w-fit transition-colors">
        {[
          { id: 'dashboard', label: 'Monitor', icon: Globe },
          { id: 'messages', label: 'Messages', icon: MessageSquare }
        ].map(tab => (
           <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap",
              activeView === tab.id 
                ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xl shadow-slate-900/10" 
                : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeView === 'messages' ? (
        <MessagingArea user={user} initialChatId={activeChatId || undefined} />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'My Listings', value: analytics.totalListings, color: 'text-slate-900 dark:text-white' },
              { label: 'Total Views', value: analytics.totalViews, color: 'text-blue-600' },
              { label: 'Contact Clicks', value: analytics.totalClicks, color: 'text-emerald-500' },
              { label: 'Total Saves', value: analytics.totalSaved, color: 'text-red-500' }
            ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-dark-surface border border-bento-border dark:border-dark-border p-8 rounded-[40px] text-center shadow-sm hover:translate-y-[-2px] transition-all">
                <div className={cn("text-4xl md:text-5xl font-black mb-2 tracking-tighter", stat.color)}>{stat.value}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <section className="lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Globe size={24} className="text-blue-600" />
                  Manage Inventory
                </h3>
              </div>
              {myOwnListings.length > 0 ? (
                <div className="space-y-4">
                  {myOwnListings.map((l) => (
                    <div 
                      key={l.id}
                      className="bg-white dark:bg-dark-surface border border-bento-border dark:border-dark-border rounded-3xl p-5 flex items-center gap-4 transition-all hover:shadow-md group"
                    >
                      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl shrink-0 overflow-hidden relative">
                        {l.images && l.images[0] ? (
                          <img src={l.images[0]} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          CATEGORIES.find(c => c.id === l.category)?.name.charAt(0) || '📦'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate">{l.title}</h4>
                          {l.status && l.status !== 'available' && (
                            <span className="text-[8px] font-black bg-slate-900 dark:bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase">
                              {l.status}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span>{l.currency} {l.price.toLocaleString()}</span>
                          <span className="text-blue-600 flex items-center gap-1"><Eye size={12}/> {l.views || 0}</span>
                          <span className="text-emerald-500 flex items-center gap-1"><MousePointer2 size={12}/> {l.clicks || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => onGenerateAgreement(l)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100 dark:border-emerald-800 shadow-sm"
                        >
                          <FileText size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Agreement</span>
                        </button>
                        <button 
                          onClick={() => onEditListing(l)}
                          className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-all shadow-sm"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => onDeleteListing(l.id)}
                          className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button 
                          onClick={() => onSelectListing(l)}
                          className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-dark-border rounded-[40px] p-12 text-center">
                   <Plus size={40} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                   <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">No listings yet</h4>
                   <p className="text-slate-400 text-sm font-medium mb-8">Start by adding your first item to the marketplace.</p>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center gap-2 mb-8">
                <Star size={24} className="text-amber-500" />
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Recent Inquiries</h3>
              </div>
              <div className="space-y-4">
                {receivedRequests.length > 0 ? (
                  receivedRequests.map((req) => (
                    <div key={req.id} className="bg-white dark:bg-dark-surface border border-bento-border dark:border-dark-border p-6 rounded-3xl shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 font-black">
                            {req.renterName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm">{req.renterName}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{req.listingTitle}</div>
                          </div>
                        </div>
                        <span className={cn(
                          "text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest",
                          req.status === 'pending' ? "bg-amber-100 text-amber-600" :
                          req.status === 'accepted' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                        )}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-dark-muted mb-6 line-clamp-2 italic">"{req.message}"</p>
                      <div className="flex gap-2">
                        {req.status === 'pending' ? (
                          <>
                            <button 
                              onClick={() => handleRequestStatus(req.id, 'accepted')}
                              className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => handleRequestStatus(req.id, 'rejected')}
                              className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-400 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all"
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <div className="flex gap-2 w-full">
                            <button 
                              onClick={() => {
                                const l = listings.find(listing => listing.id === req.listingId);
                                if (l) onGenerateAgreement(l, req.renterName);
                              }}
                              className="flex-[2] bg-emerald-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-xl shadow-emerald-500/20 border-2 border-emerald-500"
                            >
                              <FileText size={14} />
                              Generate Agreement
                            </button>
                            <button 
                              onClick={() => onReviewRenter(req.renterId, req.id)}
                              className="flex-1 bg-slate-900 dark:bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-slate-900/10"
                            >
                              Rate
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900 p-10 rounded-3xl text-center border border-slate-100 dark:border-dark-border">
                    <Star size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No inquiries yet</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </motion.div>
  );
}
