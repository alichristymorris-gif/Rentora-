import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  LogOut, 
  Activity, 
  Users, 
  Home, 
  AlertTriangle, 
  Eye, 
  CheckCircle2 
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AppUser, Listing } from '../../types';
import { TrustScore } from '../ui/TrustScore';
import { cn } from '../../lib/utils';

interface AdminDashboardProps {
  user: AppUser;
  onLogout: () => void;
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
}

export function AdminDashboard({ user, onLogout, listings: allListings, onSelectListing }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'listings' | 'reports'>('overview');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubReports = onSnapshot(collection(db, 'reports'), (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    setLoading(false);
    return () => {
      unsubUsers();
      unsubReports();
    };
  }, []);

  const handleToggleUserBan = async (userId: string, isBanned: boolean) => {
    await updateDoc(doc(db, 'users', userId), { isBanned: !isBanned });
  };

  const handleModeration = async (listingId: string, status: string) => {
    await updateDoc(doc(db, 'listings', listingId), { status: status });
  };

  const handleResolveReport = async (reportId: string, status: string) => {
    await updateDoc(doc(db, 'reports', reportId), { status });
  };

  const stats = {
    users: allUsers.length,
    listings: allListings.length,
    pendingReports: reports.filter(r => r.status === 'pending').length
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-[#f8fafc] dark:bg-dark-bg p-4 md:p-12 pb-32 transition-colors"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <div className="w-10 h-10 bg-slate-900 dark:bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                  <Shield size={20} />
               </div>
               <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Admin Console</h1>
            </div>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest ml-14">System Oversight & Moderation</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onLogout} className="text-red-600 text-sm font-black flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 px-6 py-3 rounded-2xl transition-all border border-transparent hover:border-red-100">
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-12 overflow-x-auto no-scrollbar pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'listings', label: 'Listing Moderation', icon: Home },
            { id: 'reports', label: 'Reports', icon: AlertTriangle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xl shadow-slate-900/10" 
                  : "bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-100 dark:border-dark-border"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
              {tab.id === 'reports' && stats.pendingReports > 0 && (
                <span className="bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {stats.pendingReports}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8">
          {activeTab === 'overview' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-dark-border transition-colors">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Users</div>
                   <div className="text-4xl font-black text-slate-900 dark:text-white">{stats.users}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-dark-border transition-colors">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Listings</div>
                   <div className="text-4xl font-black text-slate-900 dark:text-white">{stats.listings}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-dark-border transition-colors">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pending Reports</div>
                   <div className="text-4xl font-black text-red-500">{stats.pendingReports}</div>
                </div>
             </div>
          )}

          {activeTab === 'users' && (
             <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-dark-border overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="border-b border-slate-50 dark:border-dark-border">
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trust Score</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                         </tr>
                      </thead>
                      <tbody>
                         {allUsers.map((u) => (
                            <tr key={u.id} className="border-b border-slate-50 dark:border-dark-border last:border-0">
                               <td className="px-8 py-6">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-slate-900 dark:text-white">
                                        {u.displayName?.charAt(0) || u.email?.charAt(0) || '?'}
                                     </div>
                                     <div>
                                        <div className="font-black text-slate-900 dark:text-white">{u.displayName || 'Anonymous'}</div>
                                        <div className="text-[10px] text-slate-400 font-bold">{u.email}</div>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-8 py-6">
                                  <span className={cn(
                                     "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                     u.role === 'admin' ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600" : 
                                     u.role === 'owner' ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"
                                  )}>
                                     {u.role}
                                  </span>
                               </td>
                               <td className="px-8 py-6">
                                  <TrustScore score={u.trustScore || 0} />
                               </td>
                               <td className="px-8 py-6">
                                  <button 
                                     onClick={() => handleToggleUserBan(u.id, u.isBanned)}
                                     className={cn(
                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        u.isBanned 
                                          ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-100" 
                                          : "bg-red-50 dark:bg-red-900/30 text-red-600 hover:bg-red-100"
                                     )}
                                  >
                                     {u.isBanned ? 'Unban User' : 'Ban User'}
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {activeTab === 'listings' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allListings.map((l: any) => (
                   <div key={l.id} className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-dark-border overflow-hidden group transition-colors">
                      <div className="aspect-video relative overflow-hidden">
                         <img src={l.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                         <div className="absolute top-4 left-4">
                            <span className={cn(
                               "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-xl",
                               l.status === 'banned' ? "bg-red-600" : "bg-emerald-600"
                            )}>
                               {l.status}
                            </span>
                         </div>
                      </div>
                      <div className="p-6">
                         <h4 className="font-black text-slate-900 dark:text-white mb-1 truncate">{l.title}</h4>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">by {l.ownerName}</p>
                         <div className="flex gap-2">
                            <button 
                               onClick={() => onSelectListing(l)}
                               className="w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
                               title="View Listing"
                            >
                               <Eye size={18} />
                            </button>
                            <button 
                               onClick={() => handleModeration(l.id, 'available')}
                               className="flex-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100"
                            >
                               Approve
                            </button>
                            <button 
                               onClick={() => handleModeration(l.id, 'banned')}
                               className="flex-1 bg-red-50 dark:bg-red-900/30 text-red-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100"
                            >
                               Ban
                            </button>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          )}

          {activeTab === 'reports' && (
             <div className="space-y-4">
                {reports.length > 0 ? (
                   reports.map((r) => (
                      <div key={r.id} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-dark-border transition-colors">
                         <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex-1">
                               <div className="flex items-center gap-3 mb-4">
                                  <span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                     {r.reason}
                                  </span>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                     Target: {r.targetType} ({r.targetName})
                                  </span>
                               </div>
                               <p className="text-sm font-black text-slate-900 dark:text-white mb-2">Report Detail:</p>
                               <p className="text-xs text-slate-500 dark:text-dark-muted font-medium leading-relaxed mb-4 italic">"{r.details || 'No additional details provided.'}"</p>
                               <div className="text-[8px] font-black text-slate-300 uppercase">
                                  Reported on {new Date(r.createdAt).toLocaleString()}
                                </div>
                            </div>
                            <div className="flex flex-row md:flex-col gap-2 justify-end">
                               {r.status === 'pending' ? (
                                  <>
                                     <button 
                                        onClick={() => handleResolveReport(r.id, 'resolved')}
                                        className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                                     >
                                        Resolve
                                     </button>
                                     <button 
                                        onClick={() => handleResolveReport(r.id, 'dismissed')}
                                        className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200"
                                     >
                                        Dismiss
                                     </button>
                                  </>
                               ) : (
                                  <span className={cn(
                                     "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center",
                                     r.status === 'resolved' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                                  )}>
                                     {r.status}
                                  </span>
                               )}
                            </div>
                         </div>
                      </div>
                   ))
                ) : (
                   <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-dark-border transition-colors">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                         <CheckCircle2 size={32} className="text-emerald-500" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">All Clear!</h3>
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No pending reports at this time.</p>
                   </div>
                )}
             </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
