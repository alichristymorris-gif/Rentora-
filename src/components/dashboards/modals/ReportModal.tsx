import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'listing' | 'user';
  targetId: string;
  targetName: string;
}

export function ReportModal({ isOpen, onClose, targetType, targetId, targetName }: ReportModalProps) {
  const [reason, setReason] = useState('scam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('reports').insert({
        reporterId: user?.id,
        targetType,
        targetId,
        targetName,
        reason,
        details,
        status: 'pending',
        createdAt: Date.now()
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] p-8 shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-8">
           <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500">
              <AlertTriangle size={24} />
           </div>
           <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Report {targetType === 'listing' ? 'Listing' : 'User'}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{targetName}</p>
           </div>
        </div>

        <div className="space-y-6">
           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Reason for report</label>
              <select 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 transition-all outline-none appearance-none"
              >
                <option value="scam">Scam or Fraud</option>
                <option value="inappropriate">Inappropriate Content</option>
                <option value="misleading">Misleading Information</option>
                <option value="off_platform">Asking for off-platform payment</option>
                <option value="other">Other</option>
              </select>
           </div>

           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Additional details</label>
              <textarea 
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please provide more information..."
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-3xl px-6 py-4 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 transition-all outline-none min-h-[120px] resize-none"
              />
           </div>

           <button 
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-red-600 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-red-600/20"
           >
              {submitting ? 'Submitting...' : 'Submit Report'}
           </button>
        </div>
      </motion.div>
    </div>
  );
}
