import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  type: 'owner' | 'renter';
}

export function ReviewModal({ isOpen, onClose, onSubmit, type }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const isRenter = type === 'renter';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white dark:bg-dark-surface border border-bento-border dark:border-dark-border w-full max-w-sm rounded-[40px] p-8 shadow-2xl transition-colors"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-500 transition-colors">
             <Star size={32} fill="currentColor" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{isRenter ? 'Rate Renter' : 'Rate Host'}</h2>
          <p className="text-xs text-slate-400 dark:text-dark-muted font-bold uppercase tracking-widest mt-2">{isRenter ? 'How was the guest?' : 'How was your experience?'}</p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={cn(
                  "p-2 transition-transform active:scale-90",
                  rating >= star ? "text-amber-400" : "text-slate-200 dark:text-slate-700"
                )}
              >
                <Star size={32} fill={rating >= star ? "currentColor" : "none"} />
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Comment</label>
            <textarea 
              rows={3}
              placeholder={isRenter ? "Tell others about the renter..." : "Tell others about the host..."}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-dark-border rounded-2xl px-5 py-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-900 dark:text-white font-medium resize-none shadow-inner"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <button 
            onClick={() => {
              onSubmit(rating, comment);
              onClose();
            }}
            className="w-full bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-[22px] font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
          >
            Submit Review
          </button>
        </div>
      </motion.div>
    </div>
  );
}
