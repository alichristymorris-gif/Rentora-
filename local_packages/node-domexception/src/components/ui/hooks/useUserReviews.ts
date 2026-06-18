import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useUserReviews = (userId: string | undefined) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, `users/${userId}/reviews`), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(data);
      if (data.length > 0) {
        const sum = data.reduce((acc, r: any) => acc + (r.rating || 0), 0);
        setAverageRating(sum / data.length);
      } else {
        setAverageRating(0);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  return { reviews, loading, averageRating };
};
