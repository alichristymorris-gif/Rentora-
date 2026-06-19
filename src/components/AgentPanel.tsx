import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Modular Component Imports
import { DatabaseSchemaFallback } from './agents/DatabaseSchemaFallback';
import { MasterControlBar } from './agents/MasterControlBar';
import { RexAgentPanel } from './agents/RexAgentPanel';
import { OpsAgentPanel } from './agents/OpsAgentPanel';
import { ScoutAgentPanel } from './agents/ScoutAgentPanel';
import { FixAgentPanel } from './agents/FixAgentPanel';
import { RenAgentPanel } from './agents/RenAgentPanel';

interface AgentPanelProps {
  listings?: any[];
  users?: any[];
  reports?: any[];
  user?: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AgentPanel({
  listings: initialListings = [],
  users: initialUsers = [],
  reports: initialReports = []
}: AgentPanelProps) {
  // Navigation
  const [activeAgent, setActiveAgent] = useState<'rex' | 'ops' | 'scout' | 'fix' | 'ren'>('rex');

  // Supabase Sync States
  const [schemaError, setSchemaError] = useState(false);
  const [listings, setListings] = useState<any[]>(initialListings);
  const [users, setUsers] = useState<any[]>(initialUsers);
  const [reports, setReports] = useState<any[]>(initialReports);

  // New Tables States
  const [outreachQueue, setOutreachQueue] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [opsTasks, setOpsTasks] = useState<any[]>([]);
  const [issuesLog, setIssuesLog] = useState<any[]>([]);
  const [healthLog, setHealthLog] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [scoutLeads, setScoutLeads] = useState<any[]>([]);

  // Individual Chat states for all 5 Agents
  const [rexChat, setRexChat] = useState<Message[]>([
    { role: 'assistant', content: 'Assalam o Alaikum! I am Rex, your Sales Agent 🦁. I specialize in outbound outreach, closing deals, generating elite listings, and overcoming objections. Ask me anything, or use the templates on the left!' }
  ]);
  const [opsChat, setOpsChat] = useState<Message[]>([
    { role: 'assistant', content: 'Greetings! I am the Operations Agent 🤖. I keep tabs on database stats, assist with support inquiries, track task logs, and identify code bugs. What can I clean up today?' }
  ]);
  const [scoutChat, setScoutChat] = useState<Message[]>([
    { role: 'assistant', content: 'System scanning active 📡. I am the Scout Agent 🔭. My domain is competitor void analysis, market trends, and geographic parsing. Tell me where you want to expand next.' }
  ]);
  const [fixChat, setFixChat] = useState<Message[]>([
    { role: 'assistant', content: 'Wrench and tools online 🛠️. I am the Fix Agent. I inspect raw listings and users for malformed elements, format raw prefixes, and automatically patch values. Command me to run a health audit.' }
  ]);
  const [renChat, setRenChat] = useState<Message[]>([
    { role: 'assistant', content: 'Aggregates configured. I am Ren, your Growth Representative 📈. I compile company reports and customize search engine optimizations. Choose a dynamic action to start!' }
  ]);

  // Chat input states
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Base listings and users data loader
  useEffect(() => {
    const loadBaseData = async () => {
      try {
        if (listings.length === 0) {
          const { data: listingsData } = await supabase.from('listings').select('*').order('createdAt', { ascending: false });
          if (listingsData) setListings(listingsData);
        }
        if (users.length === 0) {
          const { data: usersData } = await supabase.from('users').select('*');
          if (usersData) setUsers(usersData);
        }
        if (reports.length === 0) {
          const { data: reportsData } = await supabase.from('reports').select('*');
          if (reportsData) setReports(reportsData);
        }
      } catch (err) {
        console.warn('Base database elements missing or offline:', err);
      }
    };
    loadBaseData();
  }, [initialListings, initialUsers, initialReports]);

  // Load Custom Tables
  const loadDatabaseData = async () => {
    try {
      setSchemaError(false);
      const { data: oQueue, error: err1 } = await supabase.from('outreach_queue').select('*').order('created_at', { ascending: false });
      if (err1) throw err1;
      setOutreachQueue(oQueue || []);

      const { data: inqs, error: err2 } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false });
      if (err2) throw err2;
      setInquiries(inqs || []);

      const { data: tasks, error: err3 } = await supabase.from('ops_tasks').select('*').order('created_at', { ascending: false });
      if (err3) throw err3;
      setOpsTasks(tasks || []);

      const { data: issuesList, error: err4 } = await supabase.from('issues_log').select('*').order('created_at', { ascending: false });
      if (err4) throw err4;
      setIssuesLog(issuesList || []);

      const { data: hLog, error: err5 } = await supabase.from('health_log').select('*').order('check_time', { ascending: false });
      if (err5) throw err5;
      setHealthLog(hLog || []);

      const { data: reps, error: err6 } = await supabase.from('daily_reports').select('*').order('report_date', { ascending: false });
      if (err6) throw err6;
      setDailyReports(reps || []);

      const { data: sLeads, error: err7 } = await supabase.from('scout_leads').select('*').order('created_at', { ascending: false });
      if (err7) throw err7;
      setScoutLeads(sLeads || []);
    } catch (err: any) {
      console.warn("Table resolution error - schema fallbacks active:", err.message);
      if (err.code === '42P01' || err.message?.includes('relation') || err.message?.includes('does not exist')) {
        setSchemaError(true);
      }
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rexChat, opsChat, scoutChat, fixChat, renChat, isSendingChat, activeAgent]);

  // Database context summary Passed directly to server system prompts
  const dbContext = {
    totalListings: listings.length,
    activeListingsCount: listings.filter(l => l.status === 'available' || l.status === 'available').length,
    bannedListingsCount: listings.filter(l => l.status === 'banned').length,
    totalUsers: users.length,
    adminsCount: users.filter(u => u.role === 'admin').length,
    ownersCount: users.filter(u => u.role === 'owner').length,
    rentersCount: users.filter(u => u.role === 'renter').length,
    pendingReportsCount: reports.filter(r => r.status === 'pending').length,
    resolvedReportsCount: reports.filter(r => r.status === 'resolved').length,
    latestListings: listings.slice(0, 3).map(l => ({ title: l.title, price: l.price, city: l.city || 'Karachi' }))
  };

  // call server proxy for Gemini
  const askGeminiAgent = async (prompt: string, agentType: 'rex' | 'ops' | 'scout', chatHistory: Message[] = []) => {
    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...chatHistory,
            { role: 'user', content: prompt }
          ],
          context: {
            agentRole: agentType,
            supabaseDatabase: dbContext
          }
        })
      });
      const data = await response.json();
      if (response.ok) {
        return data.content;
      } else {
        return `I encountered an issue communicating with our central server processor: ${data.message || 'API Exception error'}`;
      }
    } catch (err) {
      console.error(err);
      return "Central AI Hub connection timed out. Please try again in 5 seconds.";
    }
  };

  // Conversational message dispatch handles
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isSendingChat) return;
    const textMsg = chatInput;
    setChatInput('');
    setIsSendingChat(true);

    // 1. Update correct chat history state
    let history: Message[] = [];
    if (activeAgent === 'rex') {
      history = [...rexChat];
      setRexChat(prev => [...prev, { role: 'user', content: textMsg }]);
    } else if (activeAgent === 'ops') {
      history = [...opsChat];
      setOpsChat(prev => [...prev, { role: 'user', content: textMsg }]);
    } else if (activeAgent === 'scout') {
      history = [...scoutChat];
      setScoutChat(prev => [...prev, { role: 'user', content: textMsg }]);
    } else if (activeAgent === 'fix') {
      history = [...fixChat];
      setFixChat(prev => [...prev, { role: 'user', content: textMsg }]);
    } else if (activeAgent === 'ren') {
      history = [...renChat];
      setRenChat(prev => [...prev, { role: 'user', content: textMsg }]);
    }

    // 2. Fetch from Gemini
    const roleMap: Record<string, 'rex' | 'ops' | 'scout'> = {
      rex: 'rex',
      ops: 'ops',
      scout: 'scout',
      fix: 'ops',
      ren: 'rex'
    };
    
    const replyStr = await askGeminiAgent(textMsg, roleMap[activeAgent] || 'ops', history);

    // 3. Append assist text to right panel
    if (activeAgent === 'rex') {
      setRexChat(prev => [...prev, { role: 'assistant', content: replyStr }]);
    } else if (activeAgent === 'ops') {
      setOpsChat(prev => [...prev, { role: 'assistant', content: replyStr }]);
    } else if (activeAgent === 'scout') {
      setScoutChat(prev => [...prev, { role: 'assistant', content: replyStr }]);
    } else if (activeAgent === 'fix') {
      setFixChat(prev => [...prev, { role: 'assistant', content: replyStr }]);
    } else if (activeAgent === 'ren') {
      setRenChat(prev => [...prev, { role: 'assistant', content: replyStr }]);
    }

    setIsSendingChat(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 font-sans transition-all">
      {/* 1. Schema fallback banner warnings */}
      {schemaError && <DatabaseSchemaFallback />}

      {/* 2. Top-level status console bar */}
      <MasterControlBar
        activeAgent={activeAgent}
        setActiveAgent={setActiveAgent}
        outreachQueue={outreachQueue}
        inquiries={inquiries}
        opsTasks={opsTasks}
        issuesLog={issuesLog}
        healthLog={healthLog}
        dailyReports={dailyReports}
        scoutLeads={scoutLeads}
      />

      {/* 3. Main Action Areas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Specific Agent Active Control view forms */}
        <div className="lg:col-span-8 space-y-8">
          {activeAgent === 'rex' && (
            <RexAgentPanel
              dbContext={dbContext}
              outreachQueue={outreachQueue}
              loadDatabaseData={loadDatabaseData}
              askGeminiAgent={askGeminiAgent}
            />
          )}

          {activeAgent === 'ops' && (
            <OpsAgentPanel
              dbContext={dbContext}
              inquiries={inquiries}
              opsTasks={opsTasks}
              loadDatabaseData={loadDatabaseData}
              askGeminiAgent={askGeminiAgent}
            />
          )}

          {activeAgent === 'scout' && (
            <ScoutAgentPanel
              scoutLeads={scoutLeads}
              loadDatabaseData={loadDatabaseData}
              askGeminiAgent={askGeminiAgent}
            />
          )}

          {activeAgent === 'fix' && (
            <FixAgentPanel
              issuesLog={issuesLog}
              healthLog={healthLog}
              loadDatabaseData={loadDatabaseData}
              askGeminiAgent={askGeminiAgent}
            />
          )}

          {activeAgent === 'ren' && (
            <RenAgentPanel
              dbContext={dbContext}
              outreachQueue={outreachQueue}
              issuesLog={issuesLog}
              dailyReports={dailyReports}
              loadDatabaseData={loadDatabaseData}
              askGeminiAgent={askGeminiAgent}
            />
          )}
        </div>

        {/* Right Side: Active Agent's Interactive Chat Console */}
        <div className="lg:col-span-4 bg-slate-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/80 rounded-[32px] overflow-hidden sticky top-24 shadow-sm flex flex-col h-[650px]">
          
          {/* Conversational Header */}
          <div className="p-4 bg-slate-100/60 dark:bg-zinc-900/60 border-b border-zinc-150 dark:border-zinc-800/60 backdrop-blur-md flex items-center gap-3">
            <span className="text-xl">
              {activeAgent === 'rex' ? '🦁' : 
               activeAgent === 'ops' ? '🤖' : 
               activeAgent === 'scout' ? '🔭' : 
               activeAgent === 'fix' ? '🛠️' : '📈'}
            </span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-tight text-zinc-800 dark:text-zinc-100">
                {activeAgent === 'rex' ? 'REX (Outbound Sales)' : 
                 activeAgent === 'ops' ? 'OPS (Operations)' : 
                 activeAgent === 'scout' ? 'SCOUT (Intelligence)' : 
                 activeAgent === 'fix' ? 'FIX (healing shield)' : 'REN (growth direct)'}
              </h4>
              <p className="text-[9px] font-bold uppercase text-indigo-600 tracking-widest mt-0.5">Automated Assistant Client Node</p>
            </div>
          </div>

          {/* Messages window list scroll */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {activeAgent === 'rex' && rexChat.map((msg, idx) => (
              <div 
                key={idx}
                className={`max-w-[85%] rounded-[20px] p-4 text-xs font-semibold leading-relaxed ${
                  msg.role === 'user' 
                    ? 'ml-auto bg-indigo-600 text-white rounded-tr-sm shadow-sm' 
                    : 'bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850/60 text-zinc-700 dark:text-zinc-300 rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            ))}

            {activeAgent === 'ops' && opsChat.map((msg, idx) => (
              <div 
                key={idx}
                className={`max-w-[85%] rounded-[20px] p-4 text-xs font-semibold leading-relaxed ${
                  msg.role === 'user' 
                    ? 'ml-auto bg-indigo-600 text-white rounded-tr-sm shadow-sm' 
                    : 'bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850/60 text-zinc-700 dark:text-zinc-300 rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            ))}

            {activeAgent === 'scout' && scoutChat.map((msg, idx) => (
              <div 
                key={idx}
                className={`max-w-[85%] rounded-[20px] p-4 text-xs font-semibold leading-relaxed ${
                  msg.role === 'user' 
                    ? 'ml-auto bg-indigo-600 text-white rounded-tr-sm shadow-sm' 
                    : 'bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850/60 text-zinc-700 dark:text-zinc-300 rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            ))}

            {activeAgent === 'fix' && fixChat.map((msg, idx) => (
              <div 
                key={idx}
                className={`max-w-[85%] rounded-[20px] p-4 text-xs font-semibold leading-relaxed ${
                  msg.role === 'user' 
                    ? 'ml-auto bg-indigo-600 text-white rounded-tr-sm shadow-sm' 
                    : 'bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850/60 text-zinc-700 dark:text-zinc-300 rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            ))}

            {activeAgent === 'ren' && renChat.map((msg, idx) => (
              <div 
                key={idx}
                className={`max-w-[85%] rounded-[20px] p-4 text-xs font-semibold leading-relaxed ${
                  msg.role === 'user' 
                    ? 'ml-auto bg-indigo-600 text-white rounded-tr-sm shadow-sm' 
                    : 'bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850/60 text-zinc-700 dark:text-zinc-300 rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            ))}

            {isSendingChat && (
              <div className="flex items-center gap-1.5 p-3.5 max-w-[60px] bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-[20px] rounded-tl-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce delay-200"></span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Interactive Chat Input Area */}
          <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-150 dark:border-zinc-800/60 flex items-center gap-2">
            <textarea 
              placeholder={`Ask ${activeAgent.toUpperCase()} anything...`}
              rows={1}
              className="flex-1 text-xs font-semibold px-4 py-3 max-h-24 rounded-2xl border border-zinc-155 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 outline-none resize-none"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChatMessage();
                }
              }}
            />
            <button 
              onClick={handleSendChatMessage}
              disabled={!chatInput.trim() || isSendingChat}
              className="w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center cursor-pointer transition-all disabled:opacity-40 shadow shadow-indigo-600/10"
            >
              <Send size={14} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
