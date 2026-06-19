import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Sparkles, RefreshCw, Layers, Compass, HelpCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RenAgentPanelProps {
  dbContext: any;
  outreachQueue: any[];
  issuesLog: any[];
  dailyReports: any[];
  loadDatabaseData: () => Promise<void>;
  askGeminiAgent: (prompt: string, agentType: 'rex' | 'ops' | 'scout') => Promise<string>;
}

export function RenAgentPanel({
  dbContext,
  outreachQueue,
  issuesLog,
  dailyReports,
  loadDatabaseData,
  askGeminiAgent
}: RenAgentPanelProps) {
  const [isCompiling, setIsCompiling] = useState(false);
  const [seoDraft, setSeoDraft] = useState('');
  const [loadingSeo, setLoadingSeo] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  const handleGenerateRenReport = async () => {
    setIsCompiling(true);
    try {
      const pendingOutreachCount = outreachQueue.filter(o => o.status === 'pending').length;
      const sentOutreachCount = outreachQueue.filter(o => o.status === 'sent').length;
      const unresolvedIssuesCount = issuesLog.filter(i => !i.resolved).length;

      const prompt = `You are "Ren", Rentora's executive Growth Director Agent. Draft an executive, professional Daily Report formatted in highly structured Markdown:

      📊 RENTORA DAILY REPORT

      ✅ COMPLETED TODAY
      - Run deep database sanity analysis on ${dbContext.totalListings} listings. Flagged items resolved.

      ⏳ WAITING FOR YOUR APPROVAL
      - There are ${pendingOutreachCount} outbound outreach campaigns pending review.

      ⚠️ INCONSISTENCIES FOUND
      - Found ${unresolvedIssuesCount} unresolved diagnostic issues requiring admin focus.

      📈 USER STATS HISTOGRAM
      - Renters (Tenants): ${dbContext.rentersCount} accounts
      - Landlords (Owners): ${dbContext.ownersCount} accounts
      - Total listings: ${dbContext.totalListings}
      
      Provide 2 customized content marketing recommendations for local realtors in Clifton and Bahria Town Lahore. Design it creatively in markdown.`;

      const res = await askGeminiAgent(prompt, 'rex');

      // Save report in DB
      await supabase.from('daily_reports').insert({
        summary_text: res,
        metrics_snapshot: {
          totalUsers: dbContext.totalUsers,
          totalListings: dbContext.totalListings,
          unresolvedIssuesCount,
          pendingOutreachCount,
          sentOutreachCount
        },
        action_items: ['Approve outreach drafts', 'Clear diagnostic warning tasks']
      });

      await loadDatabaseData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleGenerateSeoRecommendations = async () => {
    setLoadingSeo(true);
    try {
      const prompt = `Formulate actionable high-yield SEO suggestions for rentora.com. 
      Deliver localized, professional Title templates, keyword schemas, and search-optimized tags for Clifton Karachi, Bahria Town Lahore, and Sector F-11 Islamabad. Outline internal link strategies too.`;
      const res = await askGeminiAgent(prompt, 'scout');
      setSeoDraft(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSeo(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Report Generator Box */}
      <div className="p-6 border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-zinc-800 dark:text-zinc-200" />
            <h4 className="text-xs font-black uppercase text-zinc-850 dark:text-zinc-150">Ren's Executive Metrics Summarizer</h4>
          </div>
          <button
            onClick={handleGenerateRenReport}
            disabled={isCompiling}
            className="px-5 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-black uppercase text-[9.5px] tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            {isCompiling ? <RefreshCw className="animate-spin text-white" size={12} /> : 'Compile Daily Report'}
          </button>
        </div>

        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
          Ren consolidates growth metrics, pending actions queues, diagnostics issue logs, and outputs custom PDF-grade company summary reports.
        </p>
      </div>

      {/* SEO Engine */}
      <div className="p-6 border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-600 animate-pulse" />
            <h4 className="text-xs font-black uppercase text-zinc-855 dark:text-zinc-150">Pakistani Real-Estate SEO suggestions</h4>
          </div>
          <button
            onClick={handleGenerateSeoRecommendations}
            disabled={loadingSeo}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            {loadingSeo ? <RefreshCw className="animate-spin" size={12} /> : 'Run Local SEO suggestions'}
          </button>
        </div>
        
        {seoDraft && (
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 font-sans text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto">
            {seoDraft}
          </div>
        )}
      </div>

      {/* History Log */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Reports Archives ({dailyReports.length})</h4>
        {dailyReports.length === 0 ? (
          <div className="p-8 text-center border border-zinc-100 dark:border-zinc-900 rounded-2xl bg-white dark:bg-zinc-950 text-xs text-zinc-505">
            Click 'Compile Daily Report' to generate report history archives.
          </div>
        ) : (
          dailyReports.map((report) => {
            const isExpanded = expandedReportId === report.id;
            const snapshot = report.metrics_snapshot || {};
            
            return (
              <div 
                key={report.id}
                className="border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <div 
                  onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                  className="p-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 block">
                      📋 Rentora Daily Summary Report
                    </span>
                    <span className="text-[9.5px] font-bold text-zinc-400 mt-0.5 block">
                      Generated {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold text-zinc-500">
                    <span className="hidden sm:inline">Users: {snapshot.totalUsers ?? 0} • Listings: {snapshot.totalListings ?? 0}</span>
                    <span className="text-indigo-600 uppercase text-[9.5px] font-black tracking-widest leading-none">
                      {isExpanded ? 'Collapse' : 'Expand'}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-5 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-905 text-xs text-zinc-700 dark:text-zinc-300 font-sans whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                    {report.summary_text}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
