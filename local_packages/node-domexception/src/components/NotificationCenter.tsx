import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, MessageSquare, Info, X } from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppNotification } from '../types';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  userId: string;
  onNavigateToMessage?: (chatId: string) => void;
}

export function NotificationCenter({ userId, onNavigateToMessage }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification)));
    });

    return () => unsub();
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-dark-border rounded-2xl flex items-center justify-center text-slate-400 group relative transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20"
      >
        <Bell size={20} className="group-hover:rotate-12 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-[10px] font-black text-white rounded-full flex items-center justify-center border-2 border-white dark:border-dark-bg">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[120]" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 max-h-[480px] bg-white dark:bg-dark-surface border border-bento-border dark:border-dark-border rounded-[32px] overflow-hidden shadow-2xl z-[121] flex flex-col transition-colors"
            >
              <div className="p-6 border-b border-slate-50 dark:border-dark-border flex items-center justify-between bg-white dark:bg-dark-surface transition-colors">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] uppercase font-black text-blue-600 tracking-widest">{unreadCount} New</span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
                       <Bell size={24} />
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">All caught up!</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id);
                        if (notif.type === 'message' && notif.link && onNavigateToMessage) {
                          const chatId = notif.link.split('/').pop();
                          if (chatId) onNavigateToMessage(chatId);
                          setIsOpen(false);
                        }
                      }}
                      className={cn(
                        "p-5 flex gap-4 transition-all cursor-pointer border-b border-slate-50 dark:border-dark-border last:border-0",
                        !notif.read ? "bg-blue-50/30 dark:bg-blue-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        notif.type === 'message' ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" : "bg-slate-50 dark:bg-slate-800 text-slate-400"
                      )}>
                        {notif.type === 'message' ? <MessageSquare size={18} /> : <Info size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-black text-slate-900 dark:text-white text-[13px] truncate">{notif.title}</h4>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                             {formatDistanceToNow(notif.createdAt, { addSuffix: false })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-dark-muted font-medium line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                 <div className="p-4 bg-slate-50 dark:bg-slate-900 text-center transition-colors">
                  <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">Mark all as read</button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
