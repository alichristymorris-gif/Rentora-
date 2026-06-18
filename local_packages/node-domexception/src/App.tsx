import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  setDoc,
  deleteDoc,
  addDoc,
  where
} from 'firebase/firestore';
import { auth, db, googleProvider } from './lib/firebase';
import { handleFirestoreError } from './services/firebaseUtils';
import { OperationType, AppUser, Listing, ChatMessage, RentalRequest } from './types';
import { CATEGORIES, INITIAL_LISTINGS } from './constants';
import { countries } from './data/locations';
import { startOrGetChat } from './services/messageService';

// Components
import { NavBar } from './components/NavBar';
import { Hero } from './components/Hero';
import { ListingCard } from './components/ListingCard';
import { ListingDetails } from './components/ListingDetails';
import { ListingModal } from './components/modals/ListingModal';
import { RentalRequestModal } from './components/modals/RentalRequestModal';
import { AgreementModal } from './components/modals/AgreementModal';
import { ReviewModal } from './components/modals/ReviewModal';
import { Auth } from './components/Auth';
import { Dashboard } from './components/dashboards/Dashboard';
import { ChatAssistant } from './components/ChatAssistant';
import { Footer } from './components/Footer';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { PrivacyPage } from './components/PrivacyPage';

// Calling & Communication context
import { CallProvider } from './context/CallContext';
import { CallInterfaceManager } from './components/modals/CallWindows';


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

  const [user, setUser] = useState<AppUser | null>(null);
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

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Auth Listener
  useEffect(() => {
    let lastUserUid: string | null = null;
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const userDoc = doc(db, 'users', u.uid);
        onSnapshot(userDoc, (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as AppUser;
            setUser({ ...profile, emailVerified: u.emailVerified });
            if (!lastUserUid && activeTab === 'auth') {
              setActiveTab('main');
            }
            lastUserUid = u.uid;
          } else {
            const defaultProfile: AppUser = {
              uid: u.uid,
              email: u.email || '',
              displayName: u.displayName || u.email?.split('@')[0] || 'User',
              role: 'renter',
              createdAt: Date.now(),
              emailVerified: u.emailVerified
            };
            setUser(defaultProfile);
            setDoc(userDoc, defaultProfile, { merge: true });
          }
          setLoading(false);
        });

        // Saved IDs
        const savedPath = `users/${u.uid}/savedListings`;
        onSnapshot(query(collection(db, savedPath)), (snapshot) => {
          setSavedIds(snapshot.docs.map(doc => doc.id));
        }, (err) => handleFirestoreError(err, OperationType.LIST, savedPath));

        // Favorite Owners
        const favoritesPath = `users/${u.uid}/favoriteOwners`;
        onSnapshot(query(collection(db, favoritesPath)), (snapshot) => {
          setFavoriteOwnerIds(snapshot.docs.map(doc => doc.id));
        }, (err) => handleFirestoreError(err, OperationType.LIST, favoritesPath));
      } else {
        setUser(null);
        setSavedIds([]);
        setFavoriteOwnerIds([]);
        setLoading(false);
        if (activeTab === 'dashboard') setActiveTab('main');
      }
    });
    return () => unsub();
  }, [activeTab]);

  // Listings Listener
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'listings'), orderBy('createdAt', 'desc')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
      setListings([...INITIAL_LISTINGS, ...data]);
      setIsSyncing(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'listings');
      setIsSyncing(false);
    });
    return () => unsub();
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
      await signInWithPopup(auth, googleProvider);
      setActiveTab('main');
    } catch (e) {
      console.error("Auth error:", e);
    }
  };

  const toggleSave = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) { setActiveTab('auth'); return; }
    const path = `users/${user.uid}/savedListings`;
    try {
      if (savedIds.includes(id)) await deleteDoc(doc(db, path, id));
      else await setDoc(doc(db, path, id), { addedAt: Date.now() });
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, path); }
  };

  const toggleFavoriteOwner = async (ownerId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) { setActiveTab('auth'); return; }
    const path = `users/${user.uid}/favoriteOwners`;
    try {
      if (favoriteOwnerIds.includes(ownerId)) await deleteDoc(doc(db, path, ownerId));
      else await setDoc(doc(db, path, ownerId), { addedAt: Date.now() });
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, path); }
  };

  const postListing = async (newL: Partial<Listing>) => {
    if (!user) { setActiveTab('auth'); return; }
    if (!user.emailVerified) { alert("Please verify your email!"); return; }
    try {
      await addDoc(collection(db, 'listings'), {
        ...newL, ownerId: user.uid, status: 'available',
        ownerName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        createdAt: Date.now()
      });
      setIsPostModalOpen(false);
    } catch (err) { handleFirestoreError(err, OperationType.CREATE, 'listings'); }
  };

  const updateListing = async (updatedL: any) => {
    if (!user) return;
    try {
      const { id, ...data } = updatedL;
      await setDoc(doc(db, 'listings', id), data, { merge: true });
      setEditingListing(null);
    } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `listings/${updatedL.id}`); }
  };

  const deleteListing = async (id: string) => {
    if (!user || !confirm("Delete this listing?")) return;
    try { await deleteDoc(doc(db, 'listings', id)); }
    catch (err) { handleFirestoreError(err, OperationType.DELETE, `listings/${id}`); }
  };

  const sendRentalRequest = async (listing: Listing, message: string) => {
    if (!user) { setActiveTab('auth'); return; }
    try {
      await addDoc(collection(db, 'rentalRequests'), {
        listingId: listing.id, listingTitle: listing.title,
        renterId: user.uid, renterName: user.displayName, renterEmail: user.email,
        ownerId: listing.ownerId, status: 'pending', message, createdAt: Date.now()
      });
      alert("Request sent!");
    } catch (e) { alert("Failed to send request."); }
  };

  const handleReviewUser = async (targetUserId: string, rating: number, comment: string, type: 'owner' | 'renter') => {
    try {
      await addDoc(collection(db, `users/${targetUserId}/reviews`), {
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
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-8 animate-pulse">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" /> Syncing Realtime Data...
              </div>
            )}
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

        {activeTab === 'dashboard' && user && (
          <Dashboard 
            user={user} savedIds={savedIds} favoriteOwnerIds={favoriteOwnerIds} 
            listings={listings} onToggleSave={toggleSave} 
            onToggleFavoriteOwner={toggleFavoriteOwner} onSelectListing={setSelectedListing}
            onLogout={() => auth.signOut()} onEditListing={(l) => { setEditingListing(l); setIsPostModalOpen(true); }}
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
