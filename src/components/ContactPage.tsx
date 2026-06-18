import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Globe, MessageSquare, TrendingUp } from 'lucide-react';

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto py-20 px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-8 transition-colors">Get in <span className="text-blue-600">Touch.</span></h1>
          <p className="text-xl text-slate-500 dark:text-dark-muted font-medium leading-relaxed mb-12 transition-colors">
            Have questions? We're here to help. Send us a message and our team will get back to you within 24 hours.
          </p>

          <div className="space-y-8">
            {[
              { icon: Globe, label: "Global HQ", value: "San Francisco, CA" },
              { icon: MessageSquare, label: "Support", value: "support@rentora.global" },
              { icon: TrendingUp, label: "Partnerships", value: "partners@rentora.global" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-6">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center transition-colors">
                  <item.icon size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-dark-muted transition-colors">{item.label}</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white transition-colors">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface border border-bento-border dark:border-dark-border p-10 rounded-[50px] shadow-sm transition-colors">
          {submitted ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✓</div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Message Sent!</h2>
              <p className="text-slate-400 dark:text-dark-muted font-medium">Thank you for reaching out. We'll be in touch soon.</p>
              <button 
                onClick={() => setSubmitted(false)}
                className="mt-8 text-blue-600 font-bold hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 dark:text-dark-muted tracking-widest transition-colors">First Name</label>
                  <input required type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-dark-border px-5 py-4 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 dark:text-dark-muted tracking-widest transition-colors">Last Name</label>
                  <input required type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-dark-border px-5 py-4 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-400 dark:text-dark-muted tracking-widest transition-colors">Email Address</label>
                <input required type="email" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-dark-border px-5 py-4 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-400 dark:text-dark-muted tracking-widest transition-colors">Message</label>
                <textarea required rows={5} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-dark-border px-5 py-4 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none" placeholder="Tell us how we can help..."></textarea>
              </div>
              <button className="w-full bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-2xl font-black tracking-tight hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-slate-900/10">
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}
