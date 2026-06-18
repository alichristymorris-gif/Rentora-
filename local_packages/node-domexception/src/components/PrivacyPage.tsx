import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';

export function PrivacyPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto py-20 px-6">
      <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-10 border-b border-slate-200 dark:border-dark-border pb-6 transition-colors">Privacy Policy</h1>
      <div className="prose prose-slate prose-lg max-w-none dark:prose-invert">
        <p className="text-slate-500 dark:text-dark-muted font-medium italic mb-10 transition-colors">Last updated: May 19, 2026</p>
        
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 transition-colors">1. Data Collection</h3>
        <p className="text-slate-500 dark:text-dark-muted mb-8 transition-colors">
          We collect information that you provide directly to us, such as when you create or modify your account, post listings, or send requests. This includes name, email address, profile photo, and listing details.
        </p>

        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 transition-colors">2. Use of Information</h3>
        <p className="text-slate-500 dark:text-dark-muted mb-8 transition-colors">
          We use the information we collect to provide, maintain, and improve our services, to facilitate transactions between owners and renters, and to provide customer support.
        </p>

        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 transition-colors">3. Data Sharing</h3>
        <p className="text-slate-500 dark:text-dark-muted mb-8 transition-colors">
          Your information is shared with other users only when necessary to facilitate a rental transaction. For example, if you send a rental request, your name and contact info will be visible to the owner.
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-8 rounded-3xl mt-12 text-blue-900 dark:text-blue-200 transition-colors">
          <h4 className="font-black mb-2 flex items-center gap-2 uppercase tracking-widest text-xs">
            <ShieldCheck size={16} /> Data Protection Promise
          </h4>
          <p className="text-sm font-medium leading-relaxed">
            We employ industry-standard security measures to protect your data. We never sell your personal information to third parties.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
