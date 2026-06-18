import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send } from 'lucide-react';
import { Listing } from '../../../types';

interface RentalRequestModalProps {
  isOpen: boolean;
  listing: Listing | null;
  onClose: () => void;
  onSubmit: (listing: Listing, message: string) => void;
}

export function RentalRequestModal({ isOpen, listing, onClose, onSubmit }: RentalRequestModalProps) {
  const [message, setMessage] = useState('');
  
  if (!isOpen || !listing) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white border border-bento-border w-full max-w-md rounded-[40px] p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
             <Send size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Send Rental Request</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">To: {listing.ownerName}</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Your Message</label>
            <textarea 
              autoFocus
              rows={4}
              placeholder="Hi, I'm interested in this rental. Can we discuss the details?"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-900 font-medium resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
             <button onClick={onClose} className="flex-1 bg-white border border-slate-100 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all">Cancel</button>
             <button 
              onClick={() => {onSubmit(listing, message); onClose();}}
              disabled={!message.trim()}
              className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-slate-900/10 active:scale-95 transition-all disabled:opacity-50"
             >
               Send Request
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
