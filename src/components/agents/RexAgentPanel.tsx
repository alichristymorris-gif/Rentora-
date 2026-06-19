import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, FileText, Flame, RefreshCw, Layers, CheckSquare, Trash2, Check, X, FileCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RexAgentPanelProps {
  dbContext: any;
  outreachQueue: any[];
  loadDatabaseData: () => Promise<void>;
  askGeminiAgent: (prompt: string, agentType: 'rex' | 'ops' | 'scout') => Promise<string>;
}

export function RexAgentPanel({
  dbContext,
  outreachQueue,
  loadDatabaseData,
  askGeminiAgent
}: RexAgentPanelProps) {
  // Navigation: 'generators' | 'approvals'
  const [activeSubTab, setActiveSubTab] = useState<'generators' | 'approvals'>('generators');

  // Input states (Form)
  const [emailTo, setEmailTo] = useState('');
  const [emailSituation, setEmailSituation] = useState('');
  const [emailGoal, setEmailGoal] = useState('List their property on Rentora');
  const [emailTone, setEmailTone] = useState('Professional & warm');
  const [rexEmailDraft, setRexEmailDraft] = useState('');
  const [loadingRexEmail, setLoadingRexEmail] = useState(false);

  const [propClient, setPropClient] = useState('');
  const [propProperties, setPropProperties] = useState('');
  const [propType, setPropType] = useState('Standard Listing Partnership');
  const [propOffer, setPropOffer] = useState('');
  const [rexProposal, setRexProposal] = useState('');
  const [loadingRexProposal, setLoadingRexProposal] = useState(false);

  const [rebuttalName, setRebuttalName] = useState('');
  const [rebuttalObjection, setRebuttalObjection] = useState('Your commission is too high');
  const [rexRebuttal, setRexRebuttal] = useState('');
  const [loadingRexRebuttal, setLoadingRexRebuttal] = useState(false);

  // Editable drafts local text cache
  const [editedDrafts, setEditedDrafts] = useState<Record<string, string>>({});

  // Filter pending
  const pendingDrafts = outreachQueue.filter(o => o.status === 'pending');

  const handleGenerateRexEmail = async () => {
    if (!emailTo) return;
    setLoadingRexEmail(true);
    try {
      const systemPrompt = `Draft a premium business outbound cold email targeting "${emailTo}". 
      Situation/Context: "${emailSituation || 'Interested landlord'}". 
      Objective goal: "${emailGoal}". 
      Tone: "${emailTone}". 
      Keep it brief, highly professional (under 180 words), with a compelling call to action. From Muhammad Ali, Founder of rentora.com. Incorporate live metrics (Rentora active listings: ${dbContext.activeListingsCount}, total platform users: ${dbContext.totalUsers}) naturally if applicable.`;
      
      const res = await askGeminiAgent(systemPrompt, 'rex');
      setRexEmailDraft(res);

      // Automatically insert to outreach queue
      await supabase.from('outreach_queue').insert({
        lead_name: emailTo,
        contact_email: null,
        draft_type: 'email',
        draft_content: res,
        priority: 'medium',
        status: 'pending',
        created_by: 'rex'
      });
      await loadDatabaseData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRexEmail(false);
    }
  };

  const handleGenerateProposal = async () => {
    if (!propClient) return;
    setLoadingRexProposal(true);
    try {
      const systemPrompt = `Draft an elegant Partnership and Business Proposal for "${propClient}" who manages "${propProperties}". 
      Proposal structure: "${propType}". 
      Special terms offered: "${propOffer || 'Standard Platform Terms'}". 
      Write in polished markdown. Highlight Rentora's multi-user management tools and active ${dbContext.activeListingsCount} listings. From Muhammad Ali, Founder.`;
      
      const res = await askGeminiAgent(systemPrompt, 'rex');
      setRexProposal(res);

      // Save to database
      await supabase.from('outreach_queue').insert({
        lead_name: propClient,
        contact_email: null,
        draft_type: 'proposal',
        draft_content: res,
        priority: 'high',
        status: 'pending',
        created_by: 'rex'
      });
      await loadDatabaseData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRexProposal(false);
    }
  };

  const handleGenerateRebuttal = async () => {
    setLoadingRexRebuttal(true);
    try {
      const systemPrompt = `A property manager/owner named "${rebuttalName || 'Lead'}" raised this core objection: "${rebuttalObjection}". 
      Compose 2 options to overcome this:
      Option 1: Quick WhatsApp voice/text hybrid response (Urdu/English blend, friendly and brief).
      Option 2: Structured email response showing absolute values.`;
      
      const res = await askGeminiAgent(systemPrompt, 'rex');
      setRexRebuttal(res);

      await supabase.from('outreach_queue').insert({
        lead_name: rebuttalName || 'Anonymous Landlord',
        contact_email: null,
        draft_type: 'rebuttal',
        draft_content: res,
        priority: 'medium',
        status: 'pending',
        created_by: 'rex'
      });
      await loadDatabaseData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRexRebuttal(false);
    }
  };

  const handleApproveDraft = async (id: string, originalContent: string) => {
    const finalContent = editedDrafts[id] !== undefined ? editedDrafts[id] : originalContent;
    try {
      await supabase.from('outreach_queue').update({
        status: 'approved',
        draft_content: finalContent,
        approved_at: new Date().toISOString()
      }).eq('id', id);
      await loadDatabaseData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectDraft = async (id: string) => {
    try {
      await supabase.from('outreach_queue').update({
        status: 'rejected'
      }).eq('id', id);
      await loadDatabaseData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Subtab Controllers */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800 pb-px gap-6">
        <button
          onClick={() => setActiveSubTab('generators')}
          className={`pb-3 text-xs font-black uppercase tracking-wider relative cursor-pointer ${
            activeSubTab === 'generators' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'
          }`}
        >
          Outreach Tools
          {activeSubTab === 'generators' && (
            <motion.div layoutId="rexUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('approvals')}
          className={`pb-3 text-xs font-black uppercase tracking-wider relative flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'approvals' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'
          }`}
        >
          Pending Approvals
          {pendingDrafts.length > 0 && (
            <span className="bg-indigo-600 text-white rounded-full text-[8.5px] font-black h-4 w-4 flex items-center justify-center animate-pulse">
              {pendingDrafts.length}
            </span>
          )}
          {activeSubTab === 'approvals' && (
            <motion.div layoutId="rexUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'generators' ? (
          <motion.div
            key="generators"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            {/* Cold Email Builder Section */}
            <div className="premium-card p-6 border border-zinc-150 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-950">
              <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-3">
                <Mail size={16} className="text-indigo-600" />
                <h4 className="font-extrabold uppercase tracking-tight text-xs text-zinc-800 dark:text-zinc-200">Outreach Email Draftsman</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1.5 tracking-wider">Recipient Contact</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Ahsan Khan (Clifton Landlord)"
                    className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-250 outline-none focus:border-indigo-500/30 transition-all"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1.5 tracking-wider">Target Objective Goal</label>
                  <select 
                    className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-250 outline-none focus:border-indigo-500/30 transition-all"
                    value={emailGoal}
                    onChange={(e) => setEmailGoal(e.target.value)}
                  >
                    <option>List their property on Rentora</option>
                    <option>Platform partnership & Bulk accounts</option>
                    <option>Offer exclusive zero-fee list slot</option>
                    <option>Follow up on previous listing invite</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1.5 tracking-wider">Lead Context/Situation</label>
                <textarea 
                  placeholder="e.g. Has 5 premium apartments listed on OLX with poor visitor engagement."
                  rows={2}
                  className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-250 outline-none focus:border-indigo-500/30 transition-all"
                  value={emailSituation}
                  onChange={(e) => setEmailSituation(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-zinc-100 dark:border-zinc-900 pt-4">
                <span className="text-[10px] font-extrabold uppercase text-zinc-400">Auto-saved to outreach queue on compile</span>
                <button 
                  onClick={handleGenerateRexEmail}
                  disabled={loadingRexEmail || !emailTo}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loadingRexEmail ? <RefreshCw className="animate-spin text-white" size={12} /> : 'Generate Outreach Mail'}
                </button>
              </div>

              {rexEmailDraft && (
                <div className="mt-4 p-4 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs font-medium whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                  <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mb-2">Draft Output Saved to Queue</div>
                  {rexEmailDraft}
                </div>
              )}
            </div>

            {/* Proposal Section */}
            <div className="premium-card p-6 border border-zinc-150 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-950">
              <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-3">
                <FileText size={16} className="text-indigo-600" />
                <h4 className="font-extrabold uppercase tracking-tight text-xs text-zinc-800 dark:text-zinc-200">Partnership Proposal Compiler</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1.5 tracking-wider">Client/Group Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Al-Fatah Property Holdings"
                    className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-250 outline-none focus:border-indigo-500/30 transition-all font-sans"
                    value={propClient}
                    onChange={(e) => setPropClient(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1.5 tracking-wider">Properties Summary</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 15 premium listings in Bahria Town"
                    className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-250 outline-none focus:border-indigo-500/30 transition-all font-sans"
                    value={propProperties}
                    onChange={(e) => setPropProperties(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1.5 tracking-wider">Proposal Type</label>
                  <select 
                    className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-250 outline-none focus:border-indigo-500/30 transition-all"
                    value={propType}
                    onChange={(e) => setPropType(e.target.value)}
                  >
                    <option>Standard Listing Partnership</option>
                    <option>Exclusive Portfolio Management Deal</option>
                    <option>Joint Venture / Marketing Alliance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1.5 tracking-wider">Special Terms Incentives</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Initial 3 months commission-free listing"
                    className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-250 outline-none focus:border-indigo-500/30 transition-all font-sans"
                    value={propOffer}
                    onChange={(e) => setPropOffer(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-zinc-100 dark:border-zinc-900 pt-4">
                <span className="text-[10px] font-extrabold uppercase text-zinc-400">Extracts real metrics directly</span>
                <button 
                  onClick={handleGenerateProposal}
                  disabled={loadingRexProposal || !propClient}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loadingRexProposal ? <RefreshCw className="animate-spin text-white" size={12} /> : 'Compile Proposal Draft'}
                </button>
              </div>

              {rexProposal && (
                <div className="mt-4 p-4 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs font-medium whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                  <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mb-2">Proposal Draft Saved to Queue</div>
                  {rexProposal}
                </div>
              )}
            </div>

            {/* Rebuttal Section */}
            <div className="premium-card p-6 border border-zinc-150 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-950">
              <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-3">
                <Flame size={16} className="text-indigo-600" />
                <h4 className="font-extrabold uppercase tracking-tight text-xs text-zinc-800 dark:text-zinc-200">Rebuttal Objection Handler</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1.5 tracking-wider">Contact Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mian Zubair"
                    className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-250 outline-none focus:border-indigo-500/30 transition-all font-sans"
                    value={rebuttalName}
                    onChange={(e) => setRebuttalName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1.5 tracking-wider">Core Objection / Concern</label>
                  <select 
                    className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-250 outline-none focus:border-indigo-500/30 transition-all"
                    value={rebuttalObjection}
                    onChange={(e) => setRebuttalObjection(e.target.value)}
                  >
                    <option>Your commission is too high</option>
                    <option>I already use OLX and Zameen and find tenants independently</option>
                    <option>Rentora is a new platform, why should I trust you with payouts?</option>
                    <option>I am a remote overseas landlord and do not have local teams for keys check-ins</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end border-t border-zinc-100 dark:border-zinc-900 pt-4">
                <button 
                  onClick={handleGenerateRebuttal}
                  disabled={loadingRexRebuttal}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  {loadingRexRebuttal ? <RefreshCw className="animate-spin text-white" size={12} /> : 'Generate Rebuttal Scripts'}
                </button>
              </div>

              {rexRebuttal && (
                <div className="mt-4 p-4 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs font-medium whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                  <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mb-2">Rebuttals Loaded & Cached to Queue</div>
                  {rexRebuttal}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="approvals"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            {pendingDrafts.length === 0 ? (
              <div className="text-center py-12 p-6 border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-3xl">
                <span className="text-3xl block mb-2">✅</span>
                <h4 className="text-xs font-black uppercase text-zinc-800 dark:text-zinc-200">Clean Queue</h4>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-xs mx-auto font-medium">
                  Muhammad Ali, there are no outreach drafts waiting for your approval! Use the Outreach Tools to command Rex.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                  Review & dispatch outbounds:
                </div>
                {pendingDrafts.map((draft) => (
                  <div 
                    key={draft.id} 
                    className="p-5 border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-3xl space-y-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-extrabold text-zinc-800 dark:text-zinc-200">{draft.lead_name}</span>
                          <span className={`text-[8.5px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md ${
                            draft.draft_type === 'email' ? 'bg-blue-50 dark:bg-blue-900/15 text-blue-600' :
                            draft.draft_type === 'proposal' ? 'bg-purple-50 dark:bg-purple-900/15 text-purple-600' : 'bg-red-50 dark:bg-red-900/15 text-red-650'
                          }`}>
                            {draft.draft_type}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-zinc-400 mt-1 block">
                          Drafted by {draft.created_by || 'rex'} • Priority: {draft.priority || 'medium'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproveDraft(draft.id, draft.draft_content)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={12} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectDraft(draft.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-[10px] tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <X size={12} />
                          Reject
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                        Draft content (Click to Edit directly)
                      </label>
                      <textarea
                        rows={7}
                        className="w-full text-xs font-semibold px-4 py-3 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-250 outline-none focus:border-indigo-500/20"
                        value={editedDrafts[draft.id] !== undefined ? editedDrafts[draft.id] : draft.draft_content}
                        onChange={(e) => {
                          setEditedDrafts({
                            ...editedDrafts,
                            [draft.id]: e.target.value
                          });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
