import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ShieldAlert, RefreshCw, Activity, Check, AlertTriangle, Cpu } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FixAgentPanelProps {
  issuesLog: any[];
  healthLog: any[];
  loadDatabaseData: () => Promise<void>;
  askGeminiAgent: (prompt: string, agentType: 'rex' | 'ops' | 'scout') => Promise<string>;
}

export function FixAgentPanel({
  issuesLog,
  healthLog,
  loadDatabaseData,
  askGeminiAgent
}: FixAgentPanelProps) {
  const [isAuditing, setIsAuditing] = useState(false);
  const [aiReportExplanation, setAiReportExplanation] = useState('');
  const [loadingAiReport, setLoadingAiReport] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'issues' | 'history'>('issues');

  const visibleIssues = issuesLog.filter(i => !i.resolved);

  const handleRunHealthCheck = async () => {
    setIsAuditing(true);
    setAiReportExplanation('');
    try {
      // Fetch current listings and users to analyze
      const { data: listings } = await supabase.from('listings').select('*');
      const { data: users } = await supabase.from('users').select('*');

      let foundIssues: any[] = [];
      let totalCheckedListings = listings?.length || 0;
      let totalCheckedUsers = users?.length || 0;

      // Check listings for issues
      if (listings) {
        for (const l of listings) {
          // Empty titles
          if (!l.title || l.title.trim() === '') {
            foundIssues.push({
              listing_id: l.id,
              issue_type: 'empty_title',
              severity: 'needs_human',
              description: `Listing id ${l.id.slice(0, 8)}... has an empty title.`
            });
          }
          // Zero/missing price
          if (l.price === null || l.price === undefined || l.price <= 0) {
            foundIssues.push({
              listing_id: l.id,
              issue_type: 'invalid_price',
              severity: 'high',
              description: `Listing "${l.title || 'Untitled'}" has invalid price format (${l.price}).`
            });
          }
          // Missing currency -> SAFE AUTO FIXABLE!
          if (!l.currency || l.currency.trim() === '') {
            // Safe auto-fixing direct DB mutation
            await supabase.from('listings').update({ currency: 'PKR' }).eq('id', l.id);
            foundIssues.push({
              listing_id: l.id,
              issue_type: 'missing_currency_autofixed',
              severity: 'low',
              description: `Listing "${l.title || 'Untitled'}" had empty currency code. Restored to "PKR" auto-heal.`,
              auto_fixed: true
            });
          }
        }
      }

      // Check users
      if (users) {
        for (const u of users) {
          if (!u.role) {
            foundIssues.push({
              issue_type: 'missing_role',
              severity: 'needs_human',
              description: `User "${u.email || 'Anonymous'}" is missing access role tag.`
            });
          }
          // Malformed phone format -> SAFE AUTO FIXABLE!
          if (u.phone && !u.phone.startsWith('+92') && !u.phone.startsWith('0')) {
            const healedNum = '0' + u.phone;
            await supabase.from('users').update({ phone: healedNum }).eq('id', u.id);
            foundIssues.push({
              issue_type: 'malformed_phone_autofixed',
              severity: 'low',
              description: `User "${u.email || 'Anonymous'}" had invalid leading telephone digits. Patched leading zero format.`,
              auto_fixed: true
            });
          }
        }
      }

      // Compute total healing details
      const autofixedCount = foundIssues.filter(i => i.auto_fixed).length;
      const issuesRequireAttention = foundIssues.filter(i => !i.auto_fixed).length;
      const systemStatus = issuesRequireAttention > 0 ? 'warning' : 'healthy';
      const detailMsg = `Scanned ${totalCheckedListings} listings and ${totalCheckedUsers} users. Discovered ${foundIssues.length} issues total. Healed and auto-fixed: ${autofixedCount}. Unresolved high/medium: ${issuesRequireAttention}.`;

      // Log to health_log
      await supabase.from('health_log').insert({
        status: systemStatus,
        details: detailMsg
      });

      // Insert remaining items into issues_log
      for (const iss of foundIssues) {
        await supabase.from('issues_log').insert({
          listing_id: iss.listing_id || null,
          issue_type: iss.issue_type,
          severity: iss.severity,
          description: iss.description,
          auto_fixed: iss.auto_fixed || false,
          resolved: iss.auto_fixed ? true : false
        });
      }

      await loadDatabaseData();

      // Trigger Gemini conversational Urdu/English audit explanation
      setLoadingAiReport(true);
      const prompt = `You are "Fix", Rentora's elite Automated Healing Agent. Formulate brief (2-3 sentences), highly reassuring instructions in a friendly mix of roman Urdu and English.
      Explain what issues were just detected and automatically healed: "${detailMsg}".
      Tell Founder Muhammad Ali what manual approvals or listing reviews he should command us to run next.`;
      
      const res = await askGeminiAgent(prompt, 'ops');
      setAiReportExplanation(res);

    } catch (err) {
      console.error(err);
    } finally {
      setIsAuditing(false);
      setLoadingAiReport(false);
    }
  };

  const handleResolveIssue = async (id: string) => {
    try {
      await supabase.from('issues_log').update({ resolved: true }).eq('id', id);
      await loadDatabaseData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Healing Action Header */}
      <div className="p-6 border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center shrink-0">
            <Cpu className="animate-spin text-rose-500" style={{ animationDuration: '6s' }} size={24} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase text-zinc-800 dark:text-zinc-200">FIX — Database Self-Healing Watchman</h4>
            <p className="text-[11px] text-zinc-400 font-medium leading-relaxed mt-0.5 max-w-md">
              Fix scans listings and profiles, formats inputs, automatically heals missing currency codes, fixes phone numbers, and flags malformed values.
            </p>
          </div>
        </div>
        <button
          onClick={handleRunHealthCheck}
          disabled={isAuditing}
          className="w-full md:w-auto px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0"
        >
          {isAuditing ? <RefreshCw className="animate-spin" size={14} /> : 'Execute Healing Audit Scan'}
        </button>
      </div>

      {/* Audit voice remarks */}
      {aiReportExplanation && (
        <div className="p-5 border border-rose-500/10 bg-rose-500/5 rounded-3xl text-xs text-rose-800 dark:text-rose-200 whitespace-pre-wrap leading-relaxed animate-pulse">
          <div className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-1">Fix's Diagnostic Response:</div>
          {aiReportExplanation}
        </div>
      )}

      {/* Sub tabs navigation */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800 pb-px gap-6 pt-3">
        <button
          onClick={() => setActiveSubTab('issues')}
          className={`pb-3 text-xs font-black uppercase tracking-wider relative cursor-pointer ${
            activeSubTab === 'issues' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'
          }`}
        >
          Outstanding Issues ({visibleIssues.length})
          {activeSubTab === 'issues' && (
            <motion.div layoutId="fixUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`pb-3 text-xs font-black uppercase tracking-wider relative cursor-pointer ${
            activeSubTab === 'history' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'
          }`}
        >
          Healing Scan Log ({healthLog.length})
          {activeSubTab === 'history' && (
            <motion.div layoutId="fixUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'issues' ? (
          <motion.div
            key="issues"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-3"
          >
            {visibleIssues.length === 0 ? (
              <div className="text-center py-12 p-6 border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-3xl">
                <span className="text-3xl block mb-2 font-sans">🛡️</span>
                <h4 className="text-xs font-black uppercase text-zinc-800 dark:text-zinc-200">Zero System Errors</h4>
                <p className="text-[11px] text-zinc-500 font-medium leading-relaxed max-w-xs mx-auto mt-1">
                  All listings and user fields comply with database integrity conventions. No unresolved issues found.
                </p>
              </div>
            ) : (
              visibleIssues.map((issue) => (
                <div 
                  key={issue.id}
                  className="p-4 border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                      <AlertTriangle size={14} className="text-orange-500" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-zinc-850 dark:text-zinc-150 block">{issue.description}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-1 block">
                        Category: {issue.issue_type} • Severity: {issue.severity}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolveIssue(issue.id)}
                    className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-850 dark:text-zinc-100 font-black uppercase text-[9px] tracking-wider rounded-xl flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Check size={10} />
                    Mark Resolved
                  </button>
                </div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-3"
          >
            {healthLog.length === 0 ? (
              <div className="p-8 text-center border border-zinc-100 dark:border-zinc-900 rounded-3xl text-xs text-zinc-500">
                Execute a healing scan check to build history logs.
              </div>
            ) : (
              healthLog.map((log) => (
                <div 
                  key={log.id}
                  className="p-4 border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl space-y-2"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold text-zinc-400">
                      {new Date(log.check_time).toLocaleString()}
                    </span>
                    <span className={`text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                      log.status === 'healthy' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-700 dark:text-zinc-300 font-medium max-w-3xl leading-relaxed">
                    {log.details}
                  </p>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
