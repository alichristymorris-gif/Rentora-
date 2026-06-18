import React from 'react';
import { motion } from 'motion/react';
import { Globe } from 'lucide-react';

export function AboutPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto py-20 px-6">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-6">Redefining the <span className="text-blue-600">Rental</span> Experience.</h1>
        <p className="text-xl text-slate-500 dark:text-dark-muted font-medium leading-relaxed">
          Rentora is the global marketplace for all your rental needs. Our platform connects owners with renters in a secure, efficient, and transparent way.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {[
          { title: "Global Reach", text: "Rent from anywhere to anywhere. Our platform supports multiple countries and cities worldwide.", icon: "🌍" },
          { title: "Safe & Secure", text: "We prioritize your safety with verified profiles and secure digital agreements.", icon: "🛡️" },
          { title: "Wide Selection", text: "From rooms and cars to expensive equipment and office spaces, find everything you need.", icon: "📦" }
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-dark-surface border border-bento-border dark:border-dark-border p-8 rounded-[40px] text-center shadow-sm transition-colors">
            <div className="text-4xl mb-4">{item.icon}</div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{item.title}</h3>
            <p className="text-sm text-slate-400 dark:text-dark-muted font-medium leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 dark:bg-blue-600 text-white rounded-[50px] p-12 md:p-20 text-center relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Globe size={300} />
        </div>
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-8 relative z-10">Ready to start renting?</h2>
        <p className="text-slate-400 dark:text-blue-100 text-lg mb-10 max-w-xl mx-auto relative z-10">Join thousands of users who are already making the most of their unused assets or finding exactly what they need.</p>
        <button className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-100 transition-all relative z-10 active:scale-95 shadow-xl">
          Get Started Now
        </button>
      </div>
    </motion.div>
  );
}
