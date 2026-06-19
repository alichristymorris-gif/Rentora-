import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, TrendingUp, Compass, RefreshCw, Send, Sparkles, Check, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ScoutAgentPanelProps {
  scoutLeads: any[];
  loadDatabaseData: () => Promise<void>;
  askGeminiAgent: (prompt: string, agentType: 'rex' | 'ops' | 'scout') => Promise<string>;
}

export function ScoutAgentPanel({
  scoutLeads,
  loadDatabaseData,
  askGeminiAgent
}: ScoutAgentPanelProps) {
  // Navigation
  const [activeSubTab, setActiveSubTab] = useState<'strategy' | 'leads'>('strategy');

  // Market selection inputs
  const [selectedMarket, setSelectedMarket] = useState('Malaysia');
  const [scoutMarketPlan, setScoutMarketPlan] = useState('');
  const [loadingScoutMarket, setLoadingScoutMarket] = useState(false);

  const [scoutGapAnalysis, setScoutGapAnalysis] = useState('');
  const [loadingScoutGaps, setLoadingScoutGaps] = useState(false);

  const [scoutCompetitorIntel, setScoutCompetitorIntel] = useState('');
  const [loadingScoutComp, setLoadingScoutComp] = useState(false);

  // Leads Parser States
  const [scoutLeadInput, setScoutLeadInput] = useState('');
  const [loadingLeadsParse, setLoadingLeadsParse] = useState(false);
  const [draftingLeadsSet, setDraftingLeadsSet] = useState<Record<string, boolean>>({});

  const handleAnalyzeMarketPlan = async (countryName: string) => {
    setSelectedMarket(countryName);
    setLoadingScoutMarket(true);
    try {
      const prompt = `Synthesize an international market expansion playbook for Rentora platform to capture the diaspora demographics in "${countryName}". 
      Isolate payment gateway regulations, marketing channel mixes, and local competitive challenges. Make it high-signal.`;
      const res = await askGeminiAgent(prompt, 'scout');
      setScoutMarketPlan(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingScoutMarket(false);
    }
  };

  const handleRunGapScanner = async () => {
    setLoadingScoutGaps(true);
    try {
      const prompt = `Perform a Competitor Void and Gap Analysis for Rentora. Compare with direct portals like Zameen.com, Zillow local model, and OLX. 
      Outline 3 specific digital loopholes or transactional friction points that Rentora can exploit instantly.`;
      const res = await askGeminiAgent(prompt, 'scout');
      setScoutGapAnalysis(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingScoutGaps(false);
    }
  };

  const handleAnalyzeCompetitorsMeta = async () => {
    setLoadingScoutComp(true);
    try {
      const prompt = `Develop a Reverse Engineered Competitor Matrix detailing Airbnb Pakistan and OLX's weaknesses, and model how Rentora's escrow structures counter their core trust gaps.`;
      const res = await askGeminiAgent(prompt, 'scout');
      setScoutCompetitorIntel(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingScoutComp(false);
    }
  };

  const handleParseAndLogLeads = async () => {
    if (!scoutLeadInput.trim()) return;
    setLoadingLeadsParse(true);
    try {
      const prompt = `You are Rentora's Intelligence Parser. Parse this text input: "${scoutLeadInput}". 
      Clean and map this into a standard JSON array of objects.
      Each object MUST match these exact keys:
      - "lead_name" (e.g. name of agency or owner)
      - "lead_type" (either 'agency', 'owner', or 'company')
      - "city" (city in Pakistan/overseas)
      - "contact_email" (email address or null)
      - "contact_phone" (phone or null)
      - "source_notes" (short 1-sentence logic outlining why Scout targets them)
      - "fit_score" (either 'high', 'medium', or 'low')
      
      Output ONLY valid JSON. Absolutely no pre-text or wrapping annotations.`;
      
      const res = await askGeminiAgent(prompt, 'scout');
      const cleanJson = res.replace(/```json/i, '').replace(/```/g, '').trim();
      const leads = JSON.parse(cleanJson);

      if (Array.isArray(leads)) {
        for (const lead of leads) {
          await supabase.from('scout_leads').insert({
            lead_name: lead.lead_name || 'Generic Target Property',
            lead_type: lead.lead_type || 'owner',
            city: lead.city || 'Karachi',
            contact_email: lead.contact_email || null,
            contact_phone: lead.contact_phone || null,
            source_notes: lead.source_notes || 'Scanned by AI expansion module',
            fit_score: lead.fit_score || 'medium'
          });
        }
        setScoutLeadInput('');
        setActiveSubTab('leads');
        await loadDatabaseData();
      }
    } catch (err) {
      console.error("Leads parse failure:", err);
      // Fallback: insert 1 standard fallback lead safely
      try {
        await supabase.from('scout_leads').insert({
          lead_name: scoutLeadInput.length > 30 ? scoutLeadInput.slice(0, 30) : scoutLeadInput,
          lead_type: 'owner',
          city: 'Karachi',
          source_notes: 'Created from manual search input note.',
          fit_score: 'high'
        });
        setScoutLeadInput('');
        setActiveSubTab('leads');
        await loadDatabaseData();
      } catch (err2) {
        console.error(err2);
      }
    } finally {
      setLoadingLeadsParse(false);
    }
  };

  const handleDraftOutreachForLead = async (lead: any) => {
    setDraftingLeadsSet(prev => ({ ...prev, [lead.id]: true }));
    try {
      const prompt = `Compose a custom, elite email pitch targeting the lead "${lead.lead_name}" who is a "${lead.lead_type}" from city "${lead.city}". 
      Incorporate details: "${lead.source_notes}". 
      Prio level is ${lead.fit_score}. Suggest high-conversion platform capabilities. From Muhammad Ali, rentora.com.`;
      
      const response = await askGeminiAgent(prompt, 'scout');
      
      // Save it as pending draft in outreach_queue
      await supabase.from('outreach_queue').insert({
        lead_name: lead.lead_name,
        contact_email: lead.contact_email || null,
        draft_type: 'email',
        draft_content: response,
        priority: lead.fit_score || 'medium',
        status: 'pending',
        created_by: 'scout'
      });

      // Update lead status
      await supabase.from('scout_leads').update({
        status: 'queued_for_outreach'
      }).eq('id', lead.id);

      await loadDatabaseData();
    } catch (err) {
      console.error(err);
    } finally {
      setDraftingLeadsSet(prev => ({ ...prev, [lead.id]: false }));
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Subtab Navigation */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800 pb-px gap-6">
        <button
          onClick={() => setActiveSubTab('strategy')}
          className={`pb-3 text-xs font-black uppercase tracking-wider relative cursor-pointer ${
            activeSubTab === 'strategy' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'
          }`}
        >
          Competitive Strategy
          {activeSubTab === 'strategy' && (
            <motion.div layoutId="scoutUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('leads')}
          className={`pb-3 text-xs font-black uppercase tracking-wider relative flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'leads' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'
          }`}
        >
          Research & Leads Browser
          {scoutLeads.length > 0 && (
            <span className="bg-indigo-600 text-white rounded-full text-[8.5px] font-black h-4 w-4 flex items-center justify-center">
              {scoutLeads.length}
            </span>
          )}
          {activeSubTab === 'leads' && (
            <motion.div layoutId="scoutUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'strategy' ? (
          <motion.div
            key="strategy"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            {/* Global Countries Cards Selection */}
            <div className="premium-card p-6 border border-zinc-150 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-950">
              <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-3">
                <Globe size={16} className="text-indigo-600" />
                <h4 className="font-extrabold uppercase tracking-tight text-xs text-zinc-800 dark:text-zinc-200">Global Geographic Expansion Strategy</h4>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {[
                  { country: 'Malaysia', flag: '🇲🇾', growth: '34%' },
                  { country: 'Bangladesh', flag: '🇧🇩', growth: '42%' },
                  { country: 'UAE / Dubai', flag: '🇦🇪', growth: '29%' },
                  { country: 'Indonesia', flag: '🇮🇩', growth: '38%' }
                ].map((item) => (
                  <div 
                    key={item.country}
                    onClick={() => handleAnalyzeMarketPlan(item.country)}
                    className={`p-4 rounded-2xl border text-center cursor-pointer transition-all duration-200 ${
                      selectedMarket === item.country 
                        ? 'border-indigo-650 bg-indigo-50/50 dark:bg-indigo-950/25 shadow-sm' 
                        : 'bg-slate-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-850 hover:border-indigo-500/30'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{item.flag}</span>
                    <span className="text-xs font-black block text-zinc-800 dark:text-zinc-100 leading-tight">{item.country}</span>
                    <span className="text-[9px] font-extrabold uppercase block text-indigo-600 tracking-wider mt-1">Growth: {item.growth}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end border-t border-zinc-100 dark:border-zinc-900 pt-4">
                <button 
                  onClick={() => handleAnalyzeMarketPlan(selectedMarket)}
                  disabled={loadingScoutMarket}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-2"
                >
                  {loadingScoutMarket ? <RefreshCw className="animate-spin text-white" size={12} /> : `Extract Strategic Plan: ${selectedMarket}`}
                </button>
              </div>

              {scoutMarketPlan && (
                <div className="mt-4 p-4 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-[220px] overflow-y-auto">
                  {scoutMarketPlan}
                </div>
              )}
            </div>

            {/* Void Gap Scanner */}
            <div className="premium-card p-6 border border-zinc-150 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-950">
              <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-3">
                <TrendingUp size={16} className="text-indigo-600" />
                <h4 className="font-extrabold uppercase tracking-tight text-xs text-zinc-800 dark:text-zinc-200">Competitors Void Gap Finder</h4>
              </div>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed mb-4">
                The Scout analyzes structural flaws and payment issues in direct legacy portals (Zameen.com, OLX, Airbnb) to construct market-opening products.
              </p>
              <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900 pt-4">
                <span className="text-[10px] font-extrabold uppercase text-zinc-400">Examines escrow clearances</span>
                <button 
                  onClick={handleRunGapScanner}
                  disabled={loadingScoutGaps}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-2"
                >
                  {loadingScoutGaps ? <RefreshCw className="animate-spin text-white" size={12} /> : 'Run Competitive Void Audit'}
                </button>
              </div>

              {scoutGapAnalysis && (
                <div className="mt-4 p-4 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-[220px] overflow-y-auto">
                  {scoutGapAnalysis}
                </div>
              )}
            </div>

            {/* Dynamic Competitors Matrix */}
            <div className="premium-card p-6 border border-zinc-150 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-950">
              <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-3">
                <Compass size={16} className="text-indigo-600" />
                <h4 className="font-extrabold uppercase tracking-tight text-xs text-zinc-800 dark:text-zinc-200">Reverse Engineered Competitors Weaknesses</h4>
              </div>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-850">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🏨</span>
                    <div>
                      <span className="text-xs font-black text-zinc-800 dark:text-zinc-100">Airbnb Pakistan Weakness profile</span>
                      <p className="text-[10px] text-zinc-400">Strict regulatory rules and low localized escrow payouts.</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded bg-orange-50 text-orange-600 uppercase">HIGH VALUE Target</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-850">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🏢</span>
                    <div>
                      <span className="text-xs font-black text-zinc-800 dark:text-zinc-100">OLX Deficits</span>
                      <p className="text-[10px] text-zinc-400">Zero landlord/tenant vetting or visual screening checklists.</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 uppercase">EXPLOITABLE</span>
                </div>
              </div>
              <div className="flex justify-end border-t border-zinc-100 dark:border-zinc-900 pt-4">
                <button 
                  onClick={handleAnalyzeCompetitorsMeta}
                  disabled={loadingScoutComp}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-2"
                >
                  {loadingScoutComp ? <RefreshCw className="animate-spin text-white" size={12} /> : 'Synthesize Competitors Meta'}
                </button>
              </div>

              {scoutCompetitorIntel && (
                <div className="mt-4 p-4 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-[220px] overflow-y-auto">
                  {scoutCompetitorIntel}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="leads"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            {/* Parser Form */}
            <div className="p-6 border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-3xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-indigo-600" />
                <h4 className="text-xs font-black uppercase text-zinc-805 dark:text-zinc-200">Paste Leads or Targets Description</h4>
              </div>
              <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">
                Copy-paste listing target info or details (e.g. "Fatima Renting, Clifton, email: fatima@rent.com. High priority target"). Scout AI will dynamically analyze, parse them into rows, and append to the research logger below.
              </p>
              
              <div className="flex gap-2">
                <textarea
                  placeholder="e.g. Al-Miraj Properties, Karachi, email: info@miraj.com, controls 20 flats..."
                  rows={2}
                  className="flex-1 text-xs font-semibold px-4 py-3 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-250 outline-none"
                  value={scoutLeadInput}
                  onChange={(e) => setScoutLeadInput(e.target.value)}
                />
                <button
                  onClick={handleParseAndLogLeads}
                  disabled={loadingLeadsParse || !scoutLeadInput.trim()}
                  className="px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-wider flex items-center justify-center shrink-0 cursor-pointer"
                >
                  {loadingLeadsParse ? <RefreshCw className="animate-spin text-white" size={14} /> : 'Parse & Log'}
                </button>
              </div>
            </div>

            {/* List of Leads */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Targets Research Log ({scoutLeads.length})</h4>
              {scoutLeads.length === 0 ? (
                <div className="p-12 text-center border border-zinc-100 dark:border-zinc-900 rounded-3xl bg-white dark:bg-zinc-950">
                  <p className="text-xs text-zinc-500 font-medium">No target growth leads logged yet! Paste listing targets above to seed Scout.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scoutLeads.map((lead) => (
                    <div 
                      key={lead.id}
                      className="p-5 border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-3xl flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-xs font-black text-zinc-800 dark:text-zinc-250 block">{lead.lead_name}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            lead.fit_score === 'high' ? 'bg-emerald-50 text-emerald-600' :
                            lead.fit_score === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-650'
                          }`}>
                            {lead.fit_score} Fit
                          </span>
                        </div>
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-500">
                          {lead.lead_type} • {lead.city}
                        </span>
                        <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed mt-1.5">
                          "{lead.source_notes}"
                        </p>
                        {lead.contact_email && (
                          <span className="text-[10.5px] font-mono text-zinc-400 mt-2 block">
                            📧 {lead.contact_email}
                          </span>
                        )}
                      </div>

                      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400">
                          Status: {lead.status === 'queued_for_outreach' ? 'Queued to Rex font' : 'new'}
                        </span>
                        
                        {lead.status === 'queued_for_outreach' ? (
                          <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 text-[9px] font-extrabold px-3 py-1 rounded-xl flex items-center gap-1">
                            <CheckCircle2 size={10} />
                            Task Queued
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDraftOutreachForLead(lead)}
                            disabled={draftingLeadsSet[lead.id]}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[9px] tracking-wider rounded-xl flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            {draftingLeadsSet[lead.id] ? <RefreshCw className="animate-spin text-white" size={10} /> : 'Draft Outreach'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
