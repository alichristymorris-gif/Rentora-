import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Listing, AppUser } from '../types';

export const sendRentalRequest = async (user: AppUser, listing: Listing, message: string) => {
  try {
    await addDoc(collection(db, 'rentalRequests'), {
      listingId: listing.id,
      listingTitle: listing.title,
      renterId: user.uid,
      renterName: user.displayName,
      renterEmail: user.email,
      ownerId: listing.ownerId,
      status: 'pending',
      message,
      createdAt: Date.now()
    });
  } catch (e) {
    console.error("Error sending request:", e);
    throw e;
  }
};

export const updateRequestStatus = async (requestId: string, status: 'accepted' | 'rejected') => {
  try {
    await setDoc(doc(db, 'rentalRequests', requestId), { status }, { merge: true });
  } catch (e) {
    console.error("Error updating request:", e);
    throw e;
  }
};

export const submitReview = async (userId: string, targetUserId: string, rating: number, comment: string, type: 'owner' | 'renter', reviewerName: string) => {
  try {
    const reviewPath = `users/${targetUserId}/reviews`;
    await addDoc(collection(db, reviewPath), {
      reviewerId: userId,
      reviewerName: reviewerName,
      rating,
      comment,
      type,
      createdAt: Date.now()
    });
  } catch (e) {
    console.error("Error submitting review:", e);
    throw e;
  }
};
