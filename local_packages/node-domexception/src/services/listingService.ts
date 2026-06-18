import { 
  collection, 
  addDoc, 
  setDoc, 
  doc, 
  deleteDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Listing, OperationType } from '../types';
import { handleFirestoreError } from './firebaseUtils';

export const createListing = async (listing: Partial<Listing>, userId: string, userName: string) => {
  try {
    const docRef = await addDoc(collection(db, 'listings'), {
      ...listing,
      ownerId: userId,
      ownerName: userName,
      status: 'available',
      createdAt: Date.now(),
      views: 0,
      clicks: 0,
      savedCount: 0
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'listings');
  }
};

export const updateListing = async (id: string, data: Partial<Listing>) => {
  try {
    await setDoc(doc(db, 'listings', id), data, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `listings/${id}`);
  }
};

export const deleteListing = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'listings', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `listings/${id}`);
  }
};

export const toggleSaveListing = async (userId: string, listingId: string, isSaved: boolean) => {
  const path = `users/${userId}/savedListings`;
  try {
    if (isSaved) {
      await deleteDoc(doc(db, path, listingId));
    } else {
      await setDoc(doc(db, path, listingId), { addedAt: Date.now() });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const toggleFavoriteOwner = async (userId: string, ownerId: string, isFavorite: boolean) => {
  const path = `users/${userId}/favoriteOwners`;
  try {
    if (isFavorite) {
      await deleteDoc(doc(db, path, ownerId));
    } else {
      await setDoc(doc(db, path, ownerId), { addedAt: Date.now() });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};
