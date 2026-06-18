import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { AppUser, Listing } from '../../types';
import { AdminDashboard } from './AdminDashboard';
import { OwnerDashboard } from './OwnerDashboard';
import { RenterDashboard } from './RenterDashboard';

interface DashboardProps {
  user: AppUser | null;
  savedIds: string[];
  favoriteOwnerIds: string[];
  listings: Listing[];
  onToggleSave: (id: string, e?: React.MouseEvent) => void;
  onToggleFavoriteOwner: (ownerId: string, e?: React.MouseEvent) => void;
  onSelectListing: (listing: Listing) => void;
  onLogout: () => void;
  onEditListing: (listing: Listing) => void;
  onDeleteListing: (id: string) => void;
  onGenerateAgreement: (listing: Listing, renterName?: string) => void;
  onReviewUser: (config: any) => void;
  activeChatId: string | null;
  onChatSelected: (chatId: string) => void;
}

export function Dashboard({ 
  user, 
  savedIds, 
  favoriteOwnerIds, 
  listings, 
  onToggleSave, 
  onToggleFavoriteOwner, 
  onSelectListing, 
  onLogout, 
  onEditListing, 
  onDeleteListing, 
  onGenerateAgreement, 
  onReviewUser,
  activeChatId,
  onChatSelected
}: DashboardProps) {
  if (!user) return null;

  if (user.role === 'admin') {
    return (
      <AdminDashboard 
        user={user} 
        onLogout={onLogout} 
        listings={listings} 
        onSelectListing={onSelectListing} 
      />
    );
  }

  if (user.role === 'owner') {
    return (
      <OwnerDashboard 
        user={user} 
        listings={listings} 
        onSelectListing={onSelectListing} 
        onLogout={onLogout} 
        onEditListing={onEditListing} 
        onDeleteListing={onDeleteListing}
        onGenerateAgreement={onGenerateAgreement}
        onReviewRenter={(userId: string, requestId: string) => onReviewUser({ userId, requestId, type: 'renter' })}
        activeChatId={activeChatId}
      />
    );
  }

  return (
    <RenterDashboard 
      user={user} 
      savedIds={savedIds} 
      favoriteOwnerIds={favoriteOwnerIds}
      listings={listings} 
      onToggleSave={onToggleSave} 
      onToggleFavoriteOwner={onToggleFavoriteOwner}
      onSelectListing={onSelectListing} 
      onLogout={onLogout} 
      onReviewOwner={(userId: string, requestId: string) => onReviewUser({ userId, requestId, type: 'owner' })}
      onGenerateAgreement={onGenerateAgreement}
      activeChatId={activeChatId}
    />
  );
}
