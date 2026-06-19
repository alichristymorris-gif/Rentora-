import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Code, Briefcase, CheckSquare, RefreshCw, Check, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OpsAgentPanelProps {
  dbContext: any;
  inquiries: any[];
  opsTasks: any[];
  loadDatabaseData: () => Promise<void>;
  askGeminiAgent: (prompt: string, agentType: 'rex' | 'ops' | 'scout') => Promise<string>;
}

export function OpsAgentPanel({
  dbContext,
  inquiries,
  opsTasks,
  loadDatabaseData,
  askGeminiAgent
}: OpsAgentPanelProps) {
  const [opsTaskInput, setOpsTaskInput] = useState('');
  const [loadingTask, setLoadingTask] = useState(false);

  const [bugsDescription, setBugsDescription] = useState('');
  const [opsBugReport, setOpsBugReport] = useState('');
  const [loadingOpsBug, setLoadingOpsBug] = useState(false);

  const [opsDailyBrief, setOpsDailyBrief] = useState('');
  const [loadingOpsBrief, setLoadingOpsBrief] = useState(false);

  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [opsInquiryDraft, setOpsInquiryDraft] = useState('');
  const [loadingOpsInquiry, setLoadingOpsInquiry] = useState(false);

  // Fallbacks for empty tables
  const visibleInquiries = inquiries.length > 0 ? inquiries : [
    { id: '1', sender_name: 'Hammad Ejaz (Karachi Landlord)', sender_contact: 'hammad@ejaz.com', subject: 'Bulk registration discount query', body: 'Aoa, I have 12 luxury townhouses in Clifton. Do you offer discounted platform fees for bulk accounts?', status: 'new' },
    { id: '2', sender_name: 'Sonia Mirza (Islamabad Renter)', sender_contact: 'sonia@mirza.com', subject: 'Security deposit safety concern', body: 'Hello, I want to rent a villa but want security escrow clearance. How does Rentora secure my funds?', status: 'new' },
    { id: '3', sender_name: 'Global Dubai Agencies', sender_contact: 'info@globaluae.com', subject: 'International integration request', body: 'Dear Rentora, We want to list our luxury Dubai condos. Are your API endpoints fully integrated for currency conversion?', status: 'new' }
  ];

  const visibleTasks = opsTasks.length > 0 ? opsTasks : [
    { id: '1', text: 'Review new listing registrations', priority: 'HIGH', category: 'Moderation', completed: false },
    { id: '2', text: 'Resolve pending user dispute reports', priority: 'HIGH', category: 'Support', completed: false },
    { id: '3', text: 'Verify international payment routing on Gateway', priority: 'MED', category: 'Dev', completed: false },
    { id: '4', text: 'A/B test search bar copy changes', priority: 'LOW', category: 'UX Design', completed: false }
  ];

  const handleGenerateDailyBriefing = async () => {
    setLoadingOpsBrief(true);
    try {
      const prompt = `Provide a meticulous, developer-level live database status audit for Rentora dashboard based on the following context numbers: 
      Total listings registered: ${dbContext.totalListings} (Available properties: ${dbContext.activeListingsCount}, banned lists: ${dbContext.bannedListingsCount}). 
      Total registered user nodes: ${dbContext.totalUsers} (Admins: ${dbContext.adminsCount}, Landlords: ${dbContext.ownersCount}, Tenant Renters: ${dbContext.rentersCount}). 
      Outstanding tenant ticket report alerts: ${dbContext.pendingReportsCount}. 
      Explain any architectural anomalies or platform health suggestions in structural terms.`;
      
      const res = await askGeminiAgent(prompt, 'ops');
      setOpsDailyBrief(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOpsBrief(false);
    }
  };

  const handleAnalyzeBugTask = async () => {
    if (!bugsDescription) return;
    setLoadingOpsBug(true);
    try {
      const prompt = `A software bug on rentora.com was reported: "${bugsDescription}".
      Identify:
      1. Technical critical severity level (CRITICAL/HIGH/MED/LOW)
      2. Hypothetical broken modules (using React, Tailwind, Supabase architecture)
      3. Precise step-by-step resolution logic script instructions.`;
      
      const res = await askGeminiAgent(prompt, 'ops');
      setOpsBugReport(res);

      const severity = bugsDescription.toLowerCase().includes('critical') || bugsDescription.toLowerCase().includes('broke')
        ? 'high' : 'medium';

      // Insert real issue into database logs
      await supabase.from('issues_log').insert({
        issue_type: 'reported_bug',
        severity,
        description: `Bug: ${bugsDescription.slice(0, 100)}... AI suggested fix: ${res.slice(0, 150)}...`,
        auto_fixed: false,
        resolved: false
      });
      await loadDatabaseData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOpsBug(false);
    }
  };

  const handleSolveSupportInquiry = async (inq: any) => {
    setSelectedInquiry(inq);
    setLoadingOpsInquiry(true);
    try {
      const prompt = `Compose an outstanding solution response email targeting: "${inq.sender_name || inq.from}" (Contact: ${inq.sender_contact || 'None'}).
      Subject query topic of interest: "${inq.subject}".
      Message context: "${inq.body}".
      Style: Empathetic, solving their exact pain point, professional. Address on behalf of Founder Muhammad Ali, Rentora Support Hub.`;
      
      const res = await askGeminiAgent(prompt, 'ops');
      setOpsInquiryDraft(res);

      // Save into outreach queue for Admin review
      await supabase.from('outreach_queue').insert({
        lead_name: inq.sender_name || inq.from || 'Ticket Reply',
        contact_email: inq.sender_contact || null,
        draft_type: 'email',
        draft_content: res,
        priority: 'medium',
        status: 'pending',
        created_by: 'ops',
        notes: `Reply draft to tickets id: ${inq.id}`
      });

      // Update inquiry status to 'drafted' in DB if real
      if (inquiries.length > 0) {
        await supabase.from('inquiries').update({ status: 'drafted' }).eq('id', inq.id);
      }
      
      await loadDatabaseData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOpsInquiry(false);
    }
  };

  const handleAddOpsTaskManual = async () => {
    if (!opsTaskInput.trim()) return;
    setLoadingTask(true);
    try {
      const prompt = `Categorize this system task and return the priority level (HIGH/MED/LOW) and category tag in this format: "PRIORITY:LEVEL|TAG:TAGNAME|CLEANED_TASK:TEXT" -- original: "${opsTaskInput}"`;
      const aiParsed = await askGeminiAgent(prompt, 'ops');
      
      const prioMatch = aiParsed.match(/PRIORITY:\s*(\w+)/i);
      const tagMatch = aiParsed.match(/TAG:\s*([^|]+)/i);
      const taskMatch = aiParsed.match(/CLEANED_TASK:\s*(.+)/i);

      const priority = prioMatch?.[1]?.toUpperCase() || 'MED';
      const category = tagMatch?.[1]?.trim() || 'Ops';
      const cleanText = taskMatch?.[1]?.trim() || opsTaskInput;

      await supabase.from('ops_tasks').insert({
        text: cleanText,
        priority,
        category,
        completed: false,
        created_by: 'ops'
      });
      setOpsTaskInput('');
      await loadDatabaseData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTask(false);
    }
  };

  const handleToggleTask = async (task: any) => {
    try {
      if (opsTasks.length > 0) {
        await supabase.from('ops_tasks').update({
          completed: !task.completed
        }).eq('id', task.id);
      }
      await loadDatabaseData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Diagnostics Panel */}
      <div className="premium-card p-6 border border-zinc-150 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-950">
        <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-3">
          <Activity size={16} className="text-indigo-600" />
          <h4 className="font-extrabold uppercase tracking-tight text-xs text-zinc-800 dark:text-zinc-200">Real-time DB Diagnostics & Audit Brief</h4>
        </div>
        
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900 mb-4 border border-zinc-100 dark:border-zinc-850 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Renters Count</span>
            <p className="text-xl font-extrabold text-zinc-850 dark:text-zinc-100 mt-1">{dbContext.rentersCount}</p>
          </div>
          <div className="border-l border-zinc-200 dark:border-zinc-800 pl-3">
            <span className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Active Listings</span>
            <p className="text-xl font-extrabold text-indigo-600 mt-1">{dbContext.activeListingsCount}</p>
          </div>
          <div className="border-l border-zinc-200 dark:border-zinc-800 pl-3">
            <span className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Audit Alerts</span>
            <p className="text-xl font-extrabold text-amber-500 mt-1">{dbContext.pendingReportsCount}</p>
          </div>
          <div className="border-l border-zinc-200 dark:border-zinc-800 pl-3">
            <span className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Total Listings</span>
            <p className="text-xl font-extrabold text-emerald-600 mt-1">{dbContext.totalListings}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900 pt-4">
          <span className="text-[10px] font-extrabold uppercase text-zinc-400">Pulls system context metrics</span>
          <button 
            onClick={handleGenerateDailyBriefing}
            disabled={loadingOpsBrief}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-2 cursor-pointer shadow-md"
          >
            {loadingOpsBrief ? <RefreshCw className="animate-spin text-white" size={12} /> : 'Generate AI Diagnostics Report'}
          </button>
        </div>

        {opsDailyBrief && (
          <div className="mt-4 p-4 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-[220px] overflow-y-auto">
            {opsDailyBrief}
          </div>
        )}
      </div>

      {/* Code Bug Analyser */}
      <div className="premium-card p-6 border border-zinc-150 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-950">
        <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-3">
          <Code size={16} className="text-indigo-600" />
          <h4 className="font-extrabold uppercase tracking-tight text-xs text-zinc-800 dark:text-zinc-200">Interactive Code Bug Analyser</h4>
        </div>
        <div className="mb-4">
          <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1.5 tracking-wider">Reported Exception / Behavior Log</label>
          <textarea 
            placeholder="e.g. Users report that clicking the 'Approve' button in ListingModeration makes the page freeze on Safari browsers."
            rows={3}
            className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-250 outline-none focus:border-indigo-500/30 transition-all font-sans"
            value={bugsDescription}
            onChange={(e) => setBugsDescription(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-end border-t border-zinc-100 dark:border-zinc-900 pt-4">
          <button 
            onClick={handleAnalyzeBugTask}
            disabled={loadingOpsBug || !bugsDescription}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loadingOpsBug ? <RefreshCw className="animate-spin text-white" size={12} /> : 'Analyze & Log Bugfix'}
          </button>
        </div>

        {opsBugReport && (
          <div className="mt-4 p-4 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-[220px] overflow-y-auto">
            {opsBugReport}
          </div>
        )}
      </div>

      {/* Partners Mail desk reply tool */}
      <div className="premium-card p-6 border border-zinc-150 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-950">
        <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-3">
          <Briefcase size={16} className="text-indigo-600" />
          <h4 className="font-extrabold uppercase tracking-tight text-xs text-zinc-800 dark:text-zinc-200">Partner Mail Desk Help</h4>
        </div>
        <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
          {visibleInquiries.map((inq) => (
            <div 
              key={inq.id}
              onClick={() => handleSolveSupportInquiry(inq)}
              className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 ${
                selectedInquiry?.id === inq.id 
                  ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500/30' 
                  : 'bg-slate-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-850 hover:border-indigo-650/20'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-150">{inq.sender_name || inq.from}</span>
                <span className={`text-[9px] font-extrabold uppercase tracking-wider ${
                  inq.status === 'drafted' ? 'text-emerald-500' : 'text-indigo-600'
                }`}>
                  {inq.status === 'drafted' ? 'Draft Sent For Approval' : 'Pending reply'}
                </span>
              </div>
              <p className="text-[10px] font-extrabold text-zinc-400 mb-1">{inq.subject}</p>
              <p className="text-[11px] text-zinc-500 line-clamp-1">"{inq.body}"</p>
            </div>
          ))}
        </div>

        {opsInquiryDraft && selectedInquiry && (
          <div className="mt-4 p-4 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-[220px] overflow-y-auto">
            <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Draft reply dispatched to Rex approvals queue</div>
            {opsInquiryDraft}
          </div>
        )}
      </div>

      {/* Smart Tasks Logger */}
      <div className="premium-card p-6 border border-zinc-150 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-3 mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <CheckSquare size={16} className="text-indigo-600" />
            <h4 className="font-extrabold uppercase tracking-tight text-xs text-zinc-800 dark:text-zinc-200">System Smart Tasks Logger</h4>
          </div>
          <span className="text-[9px] font-extrabold uppercase bg-indigo-50 dark:bg-indigo-950/45 text-indigo-600 px-2.5 py-1 rounded-lg">
            {visibleTasks.filter(t => !t.completed).length} pending
          </span>
        </div>
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            placeholder="E.g. Fix mobile navigation list spacing..."
            className="flex-1 text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-250 outline-none focus:border-indigo-500/20 transition-all font-sans"
            value={opsTaskInput}
            onChange={(e) => setOpsTaskInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddOpsTaskManual();
            }}
          />
          <button 
            onClick={handleAddOpsTaskManual}
            disabled={loadingTask}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-[10px] tracking-wider cursor-pointer"
          >
            {loadingTask ? <RefreshCw size={12} className="animate-spin" /> : 'Log Task'}
          </button>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {visibleTasks.map((task) => (
            <div 
              key={task.id}
              onClick={() => handleToggleTask(task)}
              className={`flex items-center justify-between gap-4 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                task.completed 
                  ? 'opacity-50 line-through bg-zinc-50 border-zinc-100 dark:bg-zinc-900/40 dark:border-zinc-950' 
                  : 'bg-slate-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-850'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center text-xs ${
                  task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-200 dark:border-zinc-700'
                }`}>
                  {task.completed && <Check size={12} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-850 dark:text-zinc-205">{task.text}</p>
                  <span className="text-[9px] font-bold text-indigo-500 uppercase mt-0.5 inline-block">{task.category || 'Ops'}</span>
                </div>
              </div>
              <span className={`text-[8.5px] font-black tracking-widest px-2.5 py-1 rounded-lg ${
                task.priority === 'HIGH' ? 'bg-red-50 text-red-650' :
                task.priority === 'MED' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-650'
              }`}>
                {task.priority || 'MED'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
