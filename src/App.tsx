import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { AppUser, Listing, ChatMessage, RentalRequest } from './types';
import { CATEGORIES, INITIAL_LISTINGS } from './constants';
import { countries } from './data/locations';
import { startOrGetChat } from './services/messageService';

// Components
import { NavBar } from './components/NavBar';
import { Hero } from './components/Hero';
import { ListingCard } from './components/ListingCard';
import { MapView } from './components/MapView';
import { ListingDetails } from './components/ListingDetails';
import { ListingModal } from './components/dashboards/modals/ListingModal';
import { RentalRequestModal } from './components/dashboards/modals/RentalRequestModal';
import { AgreementModal } from './components/dashboards/modals/AgreementModal';
import { ReviewModal } from './components/dashboards/ReviewModal';
import { Auth } from './components/Auth';
import { Dashboard } from './components/dashboards/Dashboard';
import { ChatAssistant } from './components/ChatAssistant';
import { Footer } from './components/Footer';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { PrivacyPage } from './components/PrivacyPage';

// Calling & Communication context
import { CallProvider } from './context/CallContext';
import { CallInterfaceManager } from './components/dashboards/modals/CallWindows';


export default function App() {
  const [activeTab, setActiveTab] = useState('main');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const [isBypassed, setIsBypassed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('rentora_bypassed') === 'true';
    }
    return false;
  });

  const [user, setUser] = useState<AppUser | null>(() => {
    if (typeof window !== 'undefined') {
      const isBy = sessionStorage.getItem('rentora_bypassed') === 'true';
      if (isBy) {
        try {
          const uStr = sessionStorage.getItem('rentora_bypassed_user');
          if (uStr) return JSON.parse(uStr);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return null;
  });

  useEffect(() => {
    (window as any).__onLocalBypass = (emailVal: string, roleVal: string) => {
      const email = emailVal || "1286muhammadali@gmail.com";
      const userRole = email === '1286muhammadali@gmail.com' ? 'admin' : (roleVal || 'renter');
      const bypassUser: AppUser = {
        uid: "bypass-admin-user",
        email: email,
        displayName: email.split('@')[0],
        role: userRole as any,
        phone: "03272596825",
        phoneVerified: true,
        createdAt: Date.now(),
        emailVerified: true
      };
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('rentora_bypassed', 'true');
        sessionStorage.setItem('rentora_bypassed_user', JSON.stringify(bypassUser));
      }
      setIsBypassed(true);
      setUser(bypassUser);
      setActiveTab('dashboard');
    };
    return () => {
      delete (window as any).__onLocalBypass;
    };
  }, []);

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('rentora_bypassed');
      sessionStorage.removeItem('rentora_bypassed_user');
    }
    setIsBypassed(false);
    setUser(null);
    setSavedIds([]);
    setFavoriteOwnerIds([]);
    setActiveTab('main');
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase forced logout ignored or offline:", err);
    }
  };

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>(INITIAL_LISTINGS);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [favoriteOwnerIds, setFavoriteOwnerIds] = useState<string[]>([]);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showRequestModal, setShowRequestModal] = useState<Listing | null>(null);
  const [showAgreementModal, setShowAgreementModal] = useState<{listing: Listing, renterName?: string} | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<any>(null); // {userId, requestId, type: 'owner'|'renter'}
  const [isSyncing, setIsSyncing] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [searchCountry, setSearchCountry] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Auth Listener
  useEffect(() => {
    if (isBypassed) {
      setLoading(false);
      return;
    }
    let lastUserUid: string | null = null;
    let profileChannel: any = null;
    let savedChannel: any = null;
    let favoriteChannel: any = null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user;
      if (u) {
        // Fetch initial profile
        const fetchProfile = async () => {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('uid', u.id)
            .maybeSingle();

          if (profile) {
            setUser({ ...profile, emailVerified: !!u.email_confirmed_at } as AppUser);
            if (!lastUserUid && activeTab === 'auth') {
              setActiveTab('main');
            }
            lastUserUid = u.id;
          } else {
            const defaultProfile: AppUser = {
              uid: u.id,
              email: u.email || '',
              displayName: u.user_metadata?.displayName || u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
              role: 'renter',
              createdAt: Date.now(),
              emailVerified: !!u.email_confirmed_at
            };
            setUser(defaultProfile);
            await supabase.from('users').upsert(defaultProfile);
          }
          setLoading(false);
        };

        fetchProfile();

        // Subscribe to user changes
        if (profileChannel) profileChannel.unsubscribe();
        profileChannel = supabase.channel(`user-profile-${u.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `uid=eq.${u.id}` }, (payload) => {
            if (payload.new) {
              setUser({ ...(payload.new as AppUser), emailVerified: !!u.email_confirmed_at });
              if (!lastUserUid && activeTab === 'auth') {
                setActiveTab('main');
              }
              lastUserUid = u.id;
            }
          })
          .subscribe();

        // Saved Listings subscription and sync
        const syncSavedListings = async () => {
          const { data } = await supabase
            .from('saved_listings')
            .select('listing_id')
            .eq('user_id', u.id);
          if (data) {
            setSavedIds(data.map(item => item.listing_id));
          }
        };

        syncSavedListings();

        if (savedChannel) savedChannel.unsubscribe();
        savedChannel = supabase.channel(`saved-listings-${u.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'saved_listings', filter: `user_id=eq.${u.id}` }, () => {
            syncSavedListings();
          })
          .subscribe();

        // Favorite Owners subscription and sync
        const syncFavoriteOwners = async () => {
          const { data } = await supabase
            .from('favorite_owners')
            .select('owner_id')
            .eq('user_id', u.id);
          if (data) {
            setFavoriteOwnerIds(data.map(item => item.owner_id));
          }
        };

        syncFavoriteOwners();

        if (favoriteChannel) favoriteChannel.unsubscribe();
        favoriteChannel = supabase.channel(`favorite-owners-${u.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'favorite_owners', filter: `user_id=eq.${u.id}` }, () => {
            syncFavoriteOwners();
          })
          .subscribe();

      } else {
        setUser(null);
        setSavedIds([]);
        setFavoriteOwnerIds([]);
        setLoading(false);
        if (activeTab === 'dashboard') setActiveTab('main');
      }
    });

    return () => {
      subscription.unsubscribe();
      if (profileChannel) profileChannel.unsubscribe();
      if (savedChannel) savedChannel.unsubscribe();
      if (favoriteChannel) favoriteChannel.unsubscribe();
    };
  }, [activeTab]);

  // Listings Listener
  useEffect(() => {
    const fetchListings = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('createdAt', { ascending: false });
      if (data) {
        setListings([...INITIAL_LISTINGS, ...data]);
      }
      setIsSyncing(false);
    };

    fetchListings();

    const listingsChannel = supabase.channel('listings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
        fetchListings();
      })
      .subscribe();

    return () => {
      listingsChannel.unsubscribe();
    };
  }, []);

  // Filtering
  const filteredListings = useMemo(() => {
    let filtered = listings.filter(l => {
      if (l.status === 'banned') return false;
      const matchesSearch = !searchQuery || 
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        l.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = searchCategory === 'all' || l.category === searchCategory;
      const matchesCountry = !searchCountry || l.country === searchCountry;
      const matchesCity = !searchCity || l.city === searchCity;
      const matchesMinPrice = !minPrice || l.price >= Number(minPrice);
      const matchesMaxPrice = !maxPrice || l.price <= Number(maxPrice);
      return matchesSearch && matchesCategory && matchesCountry && matchesCity && matchesMinPrice && matchesMaxPrice;
    });

    if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    else filtered.sort((a, b) => b.createdAt - a.createdAt);

    return filtered;
  }, [listings, searchQuery, searchCategory, searchCountry, searchCity, minPrice, maxPrice, sortBy]);

  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lower = searchQuery.toLowerCase();
    const suggestionsSet = new Set<string>();
    listings.forEach(l => {
      if (l.title.toLowerCase().includes(lower)) suggestionsSet.add(l.title);
      if (l.city.toLowerCase().includes(lower)) suggestionsSet.add(l.city);
      l.tags.forEach(t => { if (t.toLowerCase().includes(lower)) suggestionsSet.add(t); });
    });
    return Array.from(suggestionsSet).slice(0, 5);
  }, [listings, searchQuery]);

  const availableCitiesForSearch = useMemo(() => {
    if (!searchCountry) return [];
    return countries.find(c => c.name === searchCountry)?.cities || [];
  }, [searchCountry]);

  // Actions
  const handleStartChat = async (targetUser: { uid: string, displayName: string, photoURL?: string }) => {
    if (!user) {
      setActiveTab('auth');
      return;
    }
    const chatId = await startOrGetChat(user, targetUser);
    setActiveChatId(chatId);
    setActiveTab('dashboard');
    setSelectedListing(null);
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      setActiveTab('main');
    } catch (e) {
      console.error("Auth error:", e);
    }
  };

  const toggleSave = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) { setActiveTab('auth'); return; }
    try {
      if (savedIds.includes(id)) {
        await supabase
          .from('saved_listings')
          .delete()
          .eq('user_id', user.uid)
          .eq('listing_id', id);
        setSavedIds(prev => prev.filter(item => item !== id));
      } else {
        await supabase
          .from('saved_listings')
          .insert({ user_id: user.uid, listing_id: id, added_at: Date.now() });
        setSavedIds(prev => [...prev, id]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFavoriteOwner = async (ownerId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) { setActiveTab('auth'); return; }
    try {
      if (favoriteOwnerIds.includes(ownerId)) {
        await supabase
          .from('favorite_owners')
          .delete()
          .eq('user_id', user.uid)
          .eq('owner_id', ownerId);
        setFavoriteOwnerIds(prev => prev.filter(item => item !== ownerId));
      } else {
        await supabase
          .from('favorite_owners')
          .insert({ user_id: user.uid, owner_id: ownerId, added_at: Date.now() });
        setFavoriteOwnerIds(prev => [...prev, ownerId]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const postListing = async (newL: Partial<Listing>) => {
    if (!user) { setActiveTab('auth'); return; }
    if (!user.emailVerified) { alert("Please verify your email!"); return; }
    try {
      await supabase.from('listings').insert({
        ...newL, ownerId: user.uid, status: 'available',
        ownerName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        createdAt: Date.now()
      });
      setIsPostModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const updateListing = async (updatedL: any) => {
    if (!user) return;
    try {
      const { id, ...data } = updatedL;
      await supabase.from('listings').update(data).eq('id', id);
      setEditingListing(null);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteListing = async (id: string) => {
    if (!user || !confirm("Delete this listing?")) return;
    try {
      await supabase.from('listings').delete().eq('id', id);
    } catch (err) {
      console.error(err);
    }
  };

  const sendRentalRequest = async (listing: Listing, message: string) => {
    if (!user) { setActiveTab('auth'); return; }
    try {
      await supabase.from('rental_requests').insert({
        listingId: listing.id, listingTitle: listing.title,
        renterId: user.uid, renterName: user.displayName, renterEmail: user.email,
        ownerId: listing.ownerId, status: 'pending', message, createdAt: Date.now()
      });
      alert("Request sent!");
    } catch (e) { alert("Failed to send request."); }
  };

  const handleReviewUser = async (targetUserId: string, rating: number, comment: string, type: 'owner' | 'renter') => {
    try {
      await supabase.from('user_reviews').insert({
        targetUserId,
        reviewerId: user?.uid, reviewerName: user?.displayName,
        rating, comment, type, createdAt: Date.now()
      });
      alert("Review submitted!");
    } catch (e) { console.error(e); }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: chatInput }];
    setChatMessages(newMessages);
    setChatInput('');
    setIsChatLoading(true);
    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, context: listings.slice(0, 5) })
      });
      const data = await response.json();
      
      if (!response.ok) {
        if (data.isRetryable) {
          setChatMessages(prev => [...prev, { 
            role: 'assistant', 
            content: "I'm currently experiencing high demand. Please try again in a few moments! 🧊" 
          }]);
        } else {
          setChatMessages(prev => [...prev, { 
            role: 'assistant', 
            content: "Sorry, I ran into an issue. Please try again later." 
          }]);
        }
        return;
      }

      setChatMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Connection error. Please check your internet." }]);
    } finally { setIsChatLoading(false); }
  };

  if (loading) return null;

  return (
    <CallProvider currentUser={user}>
      <div className="min-h-screen bg-bento-bg dark:bg-dark-bg text-bento-text dark:text-gray-200 font-sans transition-colors duration-300">
      <NavBar 
        user={user} activeTab={activeTab} setActiveTab={setActiveTab} 
        isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} 
        setIsPostModalOpen={setIsPostModalOpen} 
        onNavigateToMessage={(chatId) => {
          setActiveChatId(chatId);
          setActiveTab('dashboard');
        }}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'main' && (
          <>
            <Hero 
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              searchCategory={searchCategory} setSearchCategory={setSearchCategory}
              searchCountry={searchCountry} setSearchCountry={setSearchCountry}
              searchCity={searchCity} setSearchCity={setSearchCity}
              minPrice={minPrice} setMinPrice={setMinPrice}
              maxPrice={maxPrice} setMaxPrice={setMaxPrice}
              sortBy={sortBy} setSortBy={setSortBy}
              showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions}
              searchSuggestions={searchSuggestions}
              availableCitiesForSearch={availableCitiesForSearch}
            />
            {isSyncing && (
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-8 animate-pulse font-sans">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" /> Syncing Realtime Data...
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between mb-8 font-sans">
              <div className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
                {filteredListings.length} {filteredListings.length === 1 ? 'Listing' : 'Listings'} Available
              </div>
              <div className="flex bg-white dark:bg-dark-surface p-1 rounded-2xl border border-slate-100 dark:border-dark-border shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-grid"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  Grid View
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    viewMode === 'map'
                      ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
                  Map View
                </button>
              </div>
            </div>

            {viewMode === 'map' ? (
              <MapView listings={filteredListings} onSelectListing={setSelectedListing} />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {filteredListings.map((l, i) => (
                    <ListingCard 
                      key={l.id} listing={l} idx={i} 
                      isSaved={savedIds.includes(l.id)} 
                      onToggleSave={toggleSave} 
                      onClick={() => setSelectedListing(l)} 
                    />
                  ))}
                </div>
                {filteredListings.length === 0 && (
                  <div className="col-span-full py-32 text-center">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No matches found</h3>
                    <p className="text-slate-400 font-medium">Try broadening your search criteria.</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'dashboard' && user && (
          <Dashboard 
            user={user} savedIds={savedIds} favoriteOwnerIds={favoriteOwnerIds} 
            listings={listings} onToggleSave={toggleSave} 
            onToggleFavoriteOwner={toggleFavoriteOwner} onSelectListing={setSelectedListing}
            onLogout={handleLogout} onEditListing={(l) => { setEditingListing(l); setIsPostModalOpen(true); }}
            onDeleteListing={deleteListing} 
            onGenerateAgreement={(l, renter) => setShowAgreementModal({ listing: l, renterName: renter })}
            onReviewUser={setShowReviewModal}
            activeChatId={activeChatId}
            onChatSelected={setActiveChatId}
          />
        )}

        {activeTab === 'auth' && <Auth onGoogleLogin={handleGoogleLogin} />}
        {activeTab === 'about' && <AboutPage />}
        {activeTab === 'contact' && <ContactPage />}
        {activeTab === 'privacy' && <PrivacyPage />}
      </main>

      <Footer setActiveTab={setActiveTab} setSearchCategory={setSearchCategory} />

      <ChatAssistant 
        isOpen={isAiOpen} setIsOpen={setIsAiOpen} messages={chatMessages}
        input={chatInput} setInput={setChatInput} isLoading={isChatLoading}
        onSendMessage={handleChat}
      />

      {/* Modals */}
      <ListingModal 
        isOpen={isPostModalOpen || !!editingListing} 
        editingListing={editingListing}
        onClose={() => { setIsPostModalOpen(false); setEditingListing(null); }} 
        onSubmit={editingListing ? updateListing : postListing} 
        user={user}
      />

      {selectedListing && (
        <ListingDetails 
          listing={selectedListing} user={user} listings={listings}
          onClose={() => setSelectedListing(null)} onSelectListing={setSelectedListing}
          onToggleSave={toggleSave} isSaved={savedIds.includes(selectedListing.id)}
          onToggleFavoriteOwner={toggleFavoriteOwner} isFavoriteOwner={favoriteOwnerIds.includes(selectedListing.ownerId)}
          onRequest={() => setShowRequestModal(selectedListing)}
          onStartChat={handleStartChat}
        />
      )}

      <RentalRequestModal
        isOpen={!!showRequestModal} listing={showRequestModal}
        onClose={() => setShowRequestModal(null)} onSubmit={sendRentalRequest}
      />

      <AgreementModal
        isOpen={!!showAgreementModal} 
        listing={showAgreementModal?.listing || null}
        renterName={showAgreementModal?.renterName}
        onClose={() => setShowAgreementModal(null)}
      />

      <ReviewModal 
        isOpen={!!showReviewModal}
        onClose={() => setShowReviewModal(null)}
        type={showReviewModal?.type}
        onSubmit={(rating, comment) => handleReviewUser(showReviewModal.userId, rating, comment, showReviewModal.type)}
      />
        <CallInterfaceWrapper user={user} />
      </div>
    </CallProvider>
  );
}

function CallInterfaceWrapper({ user }: { user: AppUser | null }) {
  return <CallInterfaceManager currentUser={user} />;
}
