import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useUserReviews = (userId: string | undefined) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (!userId) return;

    let channel: any = null;

    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (!error && data) {
        setReviews(data);
        if (data.length > 0) {
          const sum = data.reduce((acc, r: any) => acc + (r.rating || 0), 0);
          setAverageRating(sum / data.length);
        } else {
          setAverageRating(0);
        }
      }
      setLoading(false);
    };

    fetchReviews();

    channel = supabase.channel(`user-reviews-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `userId=eq.${userId}` }, () => {
        fetchReviews();
      })
      .subscribe();

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [userId]);

  return { reviews, loading, averageRating };
};
