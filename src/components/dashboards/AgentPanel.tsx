import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  Plus, 
  Mail, 
  FileText, 
  RefreshCw, 
  Check, 
  CheckSquare, 
  AlertTriangle, 
  Search, 
  Trash2, 
  Activity, 
  Globe, 
  TrendingUp, 
  Compass, 
  ShieldCheck, 
  Zap, 
  Code, 
  Flame, 
  Layers, 
  Briefcase 
} from 'lucide-react';

interface AgentPanelProps {
  listings: any[];
  users: any[];
  reports: any[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AgentPanel({ listings, users, reports }: AgentPanelProps) {
  // Agent Selection: 'rex' | 'ops' | 'scout'
  const [activeAgent, setActiveAgent] = useState<'rex' | 'ops' | 'scout'>('rex');

  // Database context summary that will be passed automatically to the API calls
  const dbContext = {
    totalListings: listings.length,
    activeListingsCount: listings.filter(l => l.status === 'available').length,
    bannedListingsCount: listings.filter(l => l.status === 'banned').length,
    totalUsers: users.length,
    adminsCount: users.filter(u => u.role === 'admin').length,
    ownersCount: users.filter(u => u.role === 'owner').length,
    rentersCount: users.filter(u => u.role === 'renter').length,
    pendingReportsCount: reports.filter(r => r.status === 'pending').length,
    resolvedReportsCount: reports.filter(r => r.status === 'resolved').length,
    latestListings: listings.slice(0, 3).map(l => ({ title: l.title, price: l.price, location: l.location }))
  };

  // ----- REX STATE & ACTIONS -----
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

  // ----- OPS STATE & ACTIONS -----
  const [opsTaskInput, setOpsTaskInput] = useState('');
  const [opsTaskList, setOpsTaskList] = useState<any[]>([
    { id: 1, text: 'Review new listing registrations', priority: 'HIGH', completed: false, category: 'Moderation' },
    { id: 2, text: 'Resolve pending user dispute reports', priority: 'HIGH', completed: false, category: 'Support' },
    { id: 3, text: 'Verify international payment routing on Gateway', priority: 'MED', completed: false, category: 'Dev' },
    { id: 4, text: 'A/B test search bar copy changes', priority: 'LOW', completed: false, category: 'UX Design' }
  ]);
  const [bugsDescription, setBugsDescription] = useState('');
  const [opsBugReport, setOpsBugReport] = useState('');
  const [loadingOpsBug, setLoadingOpsBug] = useState(false);
  const [opsDailyBrief, setOpsDailyBrief] = useState('');
  const [loadingOpsBrief, setLoadingOpsBrief] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [opsInquiryDraft, setOpsInquiryDraft] = useState('');
  const [loadingOpsInquiry, setLoadingOpsInquiry] = useState(false);

  const mockInquiries = [
    { id: 1, from: 'Hammad Ejaz (Karachi Landlord)', subject: 'Bulk registration discount query', body: 'Aoa, I have 12 luxury townhouses in Clifton. Do you offer discounted platform fees for bulk accounts?' },
    { id: 2, from: 'Sonia Mirza (Islamabad Renter)', subject: 'Security deposit safety concern', body: 'Hello, I want to rent a villa but want security escrow clearance. How does Rentora secure my funds?' },
    { id: 3, from: 'Global Properties UAE', subject: 'International integration request', body: 'Dear Rentora, We want to list our luxury Dubai condos. Are your API endpoints fully integrated for currency conversion?' }
  ];

  // ----- SCOUT STATE & ACTIONS -----
  const [selectedMarket, setSelectedMarket] = useState('Malaysia');
  const [scoutMarketPlan, setScoutMarketPlan] = useState('');
  const [loadingScoutMarket, setLoadingScoutMarket] = useState(false);
  const [scoutGapAnalysis, setScoutGapAnalysis] = useState('');
  const [loadingScoutGaps, setLoadingScoutGaps] = useState(false);
  const [scoutCompetitorIntel, setScoutCompetitorIntel] = useState('');
  const [loadingScoutComp, setLoadingScoutComp] = useState(false);

  // ----- CHATBOX STATE FOR EACH AGENT -----
  const [rexChat, setRexChat] = useState<Message[]>([
    { role: 'assistant', content: 'Assalam o Alaikum! I am Rex, your Sales Agent 🦁. I specialize in outbound outreach, closing deals, generating elite listings, and overcoming objections. Ask me anything, or use the automated templates on the left!' }
  ]);
  const [opsChat, setOpsChat] = useState<Message[]>([
    { role: 'assistant', content: 'Greeting Team Rentora! I am the Operations Agent 🤖. I keep tabs on database stats, assist with user support inquiries, track to-dos, and solve code bugs. What can I help clean up today?' }
  ]);
  const [scoutChat, setScoutChat] = useState<Message[]>([
    { role: 'assistant', content: 'System scanning active 📡. I am the Scout Agent 🔭. My domain is competitive intelligence, market trends, and diaspora potential. Tell me which country or competitor you want to reverse engineer.' }
  ]);

  const [rexInput, setRexInput] = useState('');
  const [opsInputClean, setOpsInputClean] = useState('');
  const [scoutInput, setScoutInput] = useState('');

  const [isSendingRex, setIsSendingRex] = useState(false);
  const [isSendingOps, setIsSendingOps] = useState(false);
  const [isSendingScout, setIsSendingScout] = useState(false);

  const rexEndRef = useRef<HTMLDivElement>(null);
  const opsEndRef = useRef<HTMLDivElement>(null);
  const scoutEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rexEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rexChat]);

  useEffect(() => {
    opsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [opsChat]);

  useEffect(() => {
    scoutEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [scoutChat]);

  // ----- UTILITY CALL TO GEMINI SERVER ENDPOINT -----
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
        return `Agency communication gap: ${data.error || 'Server limit reached.'}`;
      }
    } catch (err) {
      return 'Offline error. Please verify the Gemini Dev server is running.';
    }
  };

  // ----- SALES (REX) SERVICES -----
  const handleGenerateRexEmail = async () => {
    if (!emailTo) return;
    setLoadingRexEmail(true);
    const systemPrompt = `Draft a premium business outbound cold email targeting ${emailTo}. The lead's situation is: ${emailSituation}. 
    Our primary target goal is: "${emailGoal}". 
    The style tone must be: "${emailTone}". 
    Make it highly converting (less than 200 words), with a clear call-to-action. Address from Muhammad Ali, Founder of Rentora. Ensure references to Rentora's real-time statistics (like total verified properties: ${dbContext.activeListingsCount}, active network users: ${dbContext.totalUsers}) are integrated naturally.`;
    const res = await askGeminiAgent(systemPrompt, 'rex');
    setRexEmailDraft(res);
    setLoadingRexEmail(false);
  };

  const handleGenerateProposal = async () => {
    if (!propClient) return;
    setLoadingRexProposal(true);
    const systemPrompt = `Create a professional investment & partnership proposal for potential partner ${propClient}, who controls these assets: "${propProperties}". 
    Category/type: ${propType}.
    Special offered terms: "${propOffer || 'None (Standard platforms pricing)'}". 
    Present this as high-legibility markdown with clear headers: Introduction, Platform Strengths (citing ${dbContext.activeListingsCount} active global listings), Multi-user Role Controls, and Strategic Next Steps. Sign off on behalf of rentora.com.`;
    const res = await askGeminiAgent(systemPrompt, 'rex');
    setRexProposal(res);
    setLoadingRexProposal(false);
  };

  const handleGenerateRebuttal = async () => {
    setLoadingRexRebuttal(true);
    const systemPrompt = `The property owner/landlord "${rebuttalName || 'the lead'}" raised the following core objection: "${rebuttalObjection}". 
    Write a beautiful counter-rebuttal script to overcome this objection immediately. 
    Provide two versions:
    1) WhatsApp message (3-4 friendly lines in conversational Roman Urdu/English mix)
    2) Formal Email respond (Professional, addressing key value props)`;
    const res = await askGeminiAgent(systemPrompt, 'rex');
    setRexRebuttal(res);
    setLoadingRexRebuttal(false);
  };

  const sendRexChatMessage = async () => {
    if (!rexInput.trim() || isSendingRex) return;
    const userText = rexInput;
    setRexChat(prev => [...prev, { role: 'user', content: userText }]);
    setRexInput('');
    setIsSendingRex(true);

    const helperContext = `The user says: "${userText}". Keep your answers actionable, persuasive, and directly assist them in closing rental deals. Refer freely to listings: ${JSON.stringify(dbContext.latestListings)}. Use natural conversational wording and professional Urdu/English where suited.`;
    const reply = await askGeminiAgent(helperContext, 'rex', rexChat);
    setRexChat(prev => [...prev, { role: 'assistant', content: reply }]);
    setIsSendingRex(false);
  };

  // ----- OPERATIONS (OPS) SERVICES -----
  const handleGenerateDailyBriefing = async () => {
    setLoadingOpsBrief(true);
    const systemPrompt = `Conduct a comprehensive operational audit. Rentora's current active database state:
    Total registered users: ${dbContext.totalUsers} (Admins: ${dbContext.adminsCount}, Landlords/Owners: ${dbContext.ownersCount}, Tenants/Renters: ${dbContext.rentersCount}).
    Current rental marketplace listings: ${dbContext.totalListings} (Available: ${dbContext.activeListingsCount}, Banned: ${dbContext.bannedListingsCount}).
    Submissions needing moderation attention: ${dbContext.pendingReportsCount} pending dispute reports.
    
    Synthesize this diagnostic data into an executive "Daily Operations Briefing" for Owner Muhammad Ali. Include:
    - Overall marketplace health ratio (active vs banned properties)
    - Action item priority mapping (support alerts vs pending listings)
    - Strategic developer suggestions to reduce database strain`;
    const res = await askGeminiAgent(systemPrompt, 'ops');
    setOpsDailyBrief(res);
    setLoadingOpsBrief(false);
  };

  const handleSolveSupportInquiry = async (inquiry: any) => {
    setSelectedInquiry(inquiry);
    setLoadingOpsInquiry(true);
    const systemPrompt = `Write a pristine support/partnership email reply to ${inquiry.from} regarding their request: "${inquiry.subject}".
    Details: "${inquiry.body}".
    Keep it solution-oriented, friendly, and structured. Sign off as Rentora Support Desk on behalf of Founder Muhammad Ali.`;
    const res = await askGeminiAgent(systemPrompt, 'ops');
    setOpsInquiryDraft(res);
    setLoadingOpsInquiry(false);
  };

  const handleAnalyzeBugTask = async () => {
    if (!bugsDescription) return;
    setLoadingOpsBug(true);
    const systemPrompt = `A user or developer has reported this bug/technical issue on Rentora webapp: "${bugsDescription}".
    Analyze the issue and outline:
    1) Technical critical severity level (CRITICAL/HIGH/MEDIUM/LOW)
    2) Likely code root-cause (Rentora is a React + Vite + Tailwind + database backend stack)
    3) Step-by-step resolution logic
    4) Specific prompt block to fix this in future code interactions`;
    const res = await askGeminiAgent(systemPrompt, 'ops');
    setOpsBugReport(res);
    setLoadingOpsBug(false);
  };

  const handleAddOpsTaskManual = async () => {
    if (!opsTaskInput.trim()) return;
    const taskText = opsTaskInput;
    setOpsTaskInput('');
    
    // Simple prompt to categorize automatically using Gemini
    const systemPrompt = `Categorize this system task and return the priority level (HIGH/MED/LOW) and category tag in this format "PRIORITY:LEVEL|TAG:TAGNAME|CLEANED_TASK:TEXT" -- original task: "${taskText}"`;
    const aiParsed = await askGeminiAgent(systemPrompt, 'ops');
    
    const prioMatch = aiParsed.match(/PRIORITY:\s*(\w+)/i);
    const tagMatch = aiParsed.match(/TAG:\s*([^|]+)/i);
    const taskMatch = aiParsed.match(/CLEANED_TASK:\s*(.+)/i);

    const priority = prioMatch?.[1] || 'MED';
    const tag = tagMatch?.[1]?.trim() || 'Ops';
    const cleanTask = taskMatch?.[1]?.trim() || taskText;

    setOpsTaskList(prev => [
      ...prev,
      { id: Date.now(), text: cleanTask, priority: priority.toUpperCase(), completed: false, category: tag }
    ]);
  };

  const toggleTaskStatus = (id: number) => {
    setOpsTaskList(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const sendOpsChatMessage = async () => {
    if (!opsInputClean.trim() || isSendingOps) return;
    const userText = opsInputClean;
    setOpsChat(prev => [...prev, { role: 'user', content: userText }]);
    setOpsInputClean('');
    setIsSendingOps(true);

    const helperContext = `The user is inquiring about operations: "${userText}". Synthesize your operational data (Users: ${dbContext.totalUsers}, Active listings: ${dbContext.activeListingsCount}, Reports: ${dbContext.pendingReportsCount}) to answer with high clinical accuracy. Use a helpful mix of English and Urdu where appropriate.`;
    const reply = await askGeminiAgent(helperContext, 'ops', opsChat);
    setOpsChat(prev => [...prev, { role: 'assistant', content: reply }]);
    setIsSendingOps(false);
  };

  // ----- RESEARCH / SCOUT SERVICES -----
  const handleAnalyzeMarketPlan = async (market: string) => {
    setSelectedMarket(market);
    setLoadingScoutMarket(true);
    const systemPrompt = `Generate an elite market entry and expansion strategy for Rentora entering "${market}".
    Current system footprint is: ${dbContext.activeListingsCount} active listings in original zones.
    Produce strategic insights covering:
    1) Market volume estimate and target renter profiles (such as student, expat, or family tiers)
    2) Direct competitors and local rental gaps
    3) Rentora unique global leverage point
    4) High-impact user acquisition framework for month 1. Keep it data-focused and realistic.`;
    const res = await askGeminiAgent(systemPrompt, 'scout');
    setScoutMarketPlan(res);
    setLoadingScoutMarket(false);
  };

  const handleRunGapScanner = async () => {
    setLoadingScoutGaps(true);
    const systemPrompt = `Do a deep-dive scan on unmet high-yield rental gaps in South Asia & Southeast Asia in 2026. Focus specifically on:
    - Secure booking transaction escrows (like JazzCash / Easypaisa / local nodes)
    - Diaspora asset management (remotely secure listings verification)
    - Fractional space & commercial workspace voids.
    Provide realistic, actionable recommendations of 2 brand-new features Rentora must ship this month to seize these gaps.`;
    const res = await askGeminiAgent(systemPrompt, 'scout');
    setScoutGapAnalysis(res);
    setLoadingScoutGaps(false);
  };

  const handleAnalyzeCompetitorsMeta = async () => {
    setLoadingScoutComp(true);
    const systemPrompt = `Examine global rental market leaders: Airbnb, OLX, and Zameen.com. Write a tactical competitive research matrix:
    - List Airbnb's pricing vulnerability inside tier-2 markets
    - Quantify OLX's listing fraud metrics and trust deficit
    - Explain Zameen's low focus on dynamic rental UX
    - Give a direct action item for Rentora to capture 10% of their market slice this quarter.`;
    const res = await askGeminiAgent(systemPrompt, 'scout');
    setScoutCompetitorIntel(res);
    setLoadingScoutComp(false);
  };

  const sendScoutChatMessage = async () => {
    if (!scoutInput.trim() || isSendingScout) return;
    const userText = scoutInput;
    setScoutChat(prev => [...prev, { role: 'user', content: userText }]);
    setScoutInput('');
    setIsSendingScout(true);

    const helperContext = `The user inquires about competitive research/market targets: "${userText}". Respond with data-driven strategic wisdom. Reference our current database health and target regions. Maintain a sharp, executive, diagnostic tone.`;
    const reply = await askGeminiAgent(helperContext, 'scout', scoutChat);
    setScoutChat(prev => [...prev, { role: 'assistant', content: reply }]);
    setIsSendingScout(false);
  };

  return (
    <div className="bg-white dark:bg-dark-bg transition-colors duration-300 font-sans">
      
      {/* Dynamic Agent Picker Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* REX Card */}
        <div 
          onClick={() => setActiveAgent('rex')}
          className={`p-6 rounded-[28px] border cursor-pointer transition-all duration-300 ${
            activeAgent === 'rex' 
              ? 'bg-slate-900 border-indigo-600 text-white shadow-2xl shadow-indigo-600/10' 
              : 'bg-slate-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 hover:border-indigo-600/30'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg ${
              activeAgent === 'rex' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600'
            }`}>
              🦁
            </div>
            <div>
              <h3 className="font-extrabold uppercase tracking-tight text-sm">REX Agent</h3>
              <p className={`text-[10px] font-bold tracking-widest uppercase ${
                activeAgent === 'rex' ? 'text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'
              }`}>Sales & Outreach</p>
            </div>
          </div>
          <p className={`text-[11px] leading-relaxed font-medium ${
            activeAgent === 'rex' ? 'text-zinc-300' : 'text-zinc-500'
          }`}>
            Optimized pipeline conversion, personalized cold outreach, customized agreements, and objections handling scripts.
          </p>
        </div>

        {/* OPS Card */}
        <div 
          onClick={() => setActiveAgent('ops')}
          className={`p-6 rounded-[28px] border cursor-pointer transition-all duration-300 ${
            activeAgent === 'ops' 
              ? 'bg-slate-900 border-indigo-600 text-white shadow-2xl shadow-indigo-600/10' 
              : 'bg-slate-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 hover:border-indigo-600/30'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg ${
              activeAgent === 'ops' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600'
            }`}>
              🤖
            </div>
            <div>
              <h3 className="font-extrabold uppercase tracking-tight text-sm">OPS Agent</h3>
              <p className={`text-[10px] font-bold tracking-widest uppercase ${
                activeAgent === 'ops' ? 'text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'
              }`}>Operations & Tasks</p>
            </div>
          </div>
          <p className={`text-[11px] leading-relaxed font-medium ${
            activeAgent === 'ops' ? 'text-zinc-300' : 'text-zinc-500'
          }`}>
            Database audits, smart priority task list management, support response constructor, and user dispute automation.
          </p>
        </div>

        {/* SCOUT Card */}
        <div 
          onClick={() => setActiveAgent('scout')}
          className={`p-6 rounded-[28px] border cursor-pointer transition-all duration-300 ${
            activeAgent === 'scout' 
              ? 'bg-slate-900 border-indigo-600 text-white shadow-2xl shadow-indigo-600/10' 
              : 'bg-slate-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 hover:border-indigo-600/30'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg ${
              activeAgent === 'scout' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600'
            }`}>
              🔭
            </div>
            <div>
              <h3 className="font-extrabold uppercase tracking-tight text-sm">SCOUT Agent</h3>
              <p className={`text-[10px] font-bold tracking-widest uppercase ${
                activeAgent === 'scout' ? 'text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'
              }`}>Market Intelligence</p>
            </div>
          </div>
          <p className={`text-[11px] leading-relaxed font-medium ${
            activeAgent === 'scout' ? 'text-zinc-300' : 'text-zinc-500'
          }`}>
            Reverse engineer competitors strategies, map global demographic opportunities, and trace high-yield market gaps.
          </p>
        </div>

      </div>

      {/* Main Agent Content Area Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Specific Agent Controls */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* ----- REX AGENT PANEL ----- */}
          {activeAgent === 'rex' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              
              {/* Cold Email Builder Section */}
              <div className="premium-card p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <Mail size={16} className="text-indigo-600" />
                  <h4 className="font-extrabold uppercase tracking-tight text-xs text-zinc-800 dark:text-zinc-200">Outreach Email Draftsman</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1.5 tracking-wider">Recipient Contact</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Ahsan Khan (Clifton Landlord)"
                      className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-500/30 transition-all"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1.5 tracking-wider">Target Objective Goal</label>
                    <select 
                      className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-500/30 transition-all font-sans"
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
                    className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-500/30 transition-all"
                    value={emailSituation}
                    onChange={(e) => setEmailSituation(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <span className="text-[10px] font-extrabold uppercase text-zinc-400">Powered by Rentora Core Context</span>
                  <button 
                    onClick={handleGenerateRexEmail}
                    disabled={loadingRexEmail || !emailTo}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
                  >
                    {loadingRexEmail ? <RefreshCw className="animate-spin text-white" size={12} /> : 'Generate Outreach Mail'}
                  </button>
                </div>

                <AnimatePresence>
                  {rexEmailDraft && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">REX Draft Output</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(rexEmailDraft);
                          }}
                          className="text-[9px] font-bold text-zinc-400 hover:text-indigo-600 cursor-pointer"
                        >
                          Copy to Clipboard
                        </button>
                      </div>
                      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-xs font-medium leading-relaxed font-sans text-zinc-700 dark:text-zinc-300 max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                        {rexEmailDraft}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Proposal Generator Section */}
              <div className="premium-card p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <FileText size={16} className="text-indigo-600" />
                  <h4 className="font-extrabold uppercase tracking-tight text-xs text-zinc-800 dark:text-zinc-200">Partnership Proposal Compiler</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1.5 tracking-wider">Client/Group Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Al-Fatah Property Holdings"
                      className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-500/30 transition-all"
                      value={propClient}
                      onChange={(e) => setPropClient(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1.5 tracking-wider">Properties Summary</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 15 premium listings in Bahria Town"
                      className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-500/30 transition-all"
                      value={propProperties}
                      onChange={(e) => setPropProperties(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1.5 tracking-wider">Proposal Type</label>
                    <select 
                      className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-500/30 transition-all font-sans"
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
                      className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-500/30 transition-all"
                      value={propOffer}
                      onChange={(e) => setPropOffer(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <span className="text-[10px] font-extrabold uppercase text-zinc-400">Pre-populates Supabase statistics</span>
                  <button 
                    onClick={handleGenerateProposal}
                    disabled={loadingRexProposal || !propClient}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
                  >
                    {loadingRexProposal ? <RefreshCw className="animate-spin text-white" size={12} /> : 'Compile Proposal Draft'}
                  </button>
                </div>

                <AnimatePresence>
                  {rexProposal && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">REX Partnership Proposal</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(rexProposal);
                          }}
                          className="text-[9px] font-bold text-zinc-400 hover:text-indigo-600 cursor-pointer"
                        >
                          Copy Draft
                        </button>
                      </div>
                      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-xs font-medium leading-relaxed font-sans text-zinc-700 dark:text-zinc-300 max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                        {rexProposal}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Rebuttal objection solver */}
              <div className="premium-card p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <Flame size={16} className="text-indigo-600" />
                  <h4 className="font-extrabold uppercase tracking-tight text-xs text-zinc-800 dark:text-zinc-200">Rebuttal Objection Handler</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1.5 tracking-wider">Contact Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Mian Zubair"
                      className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-500/30 transition-all"
                      value={rebuttalName}
                      onChange={(e) => setRebuttalName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1.5 tracking-wider">Core Objection / Concern</label>
                    <select 
                      className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-500/30 transition-all font-sans"
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
                <div className="flex items-center justify-end border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <button 
                    onClick={handleGenerateRebuttal}
                    disabled={loadingRexRebuttal}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
                  >
                    {loadingRexRebuttal ? <RefreshCw className="animate-spin text-white" size={12} /> : 'Generate Rebuttal Scripts'}
                  </button>
                </div>

                <AnimatePresence>
                  {rexRebuttal && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">REX Counter Scripts</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(rexRebuttal);
                          }}
                          className="text-[9px] font-bold text-zinc-400 hover:text-indigo-600 cursor-pointer"
                        >
                          Copy Rebuttals
                        </button>
                      </div>
                      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-xs font-semibold leading-relaxed font-sans text-zinc-700 dark:text-zinc-300 max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                        {rexRebuttal}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          )}

          {/* ----- OPS AGENT PANEL ----- */}
          {activeAgent === 'ops' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              
              {/* Daily Briefing Audit Section */}
              <div className="premium-card p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <Activity size={16} className="text-indigo-600" />
                  <h4 className="font-extrabold uppercase tracking-tight text-xs text-zinc-800 dark:text-zinc-200">Real-time DB Diagnostics & Audit Brief</h4>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900 mb-4 border border-zinc-100 dark:border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center md:text-left">
                    <span className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Renters Count</span>
                    <p className="text-xl font-extrabold text-zinc-850 dark:text-zinc-100 mt-1">{dbContext.rentersCount}</p>
                  </div>
                  <div className="text-center md:text-left border-l border-zinc-200 dark:border-zinc-850 pl-2">
                    <span className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider font-sans">Active Listings</span>
                    <p className="text-xl font-extrabold text-indigo-600 mt-1">{dbContext.activeListingsCount}</p>
                  </div>
                  <div className="text-center md:text-left border-l border-zinc-200 dark:border-zinc-850 pl-2">
                    <span className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Audit Alerts</span>
                    <p className="text-xl font-extrabold text-amber-500 mt-1">{dbContext.pendingReportsCount}</p>
                  </div>
                  <div className="text-center md:text-left border-l border-zinc-200 dark:border-zinc-850 pl-2">
                    <span className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Total Listings</span>
                    <p className="text-xl font-extrabold text-emerald-600 mt-1">{dbContext.totalListings}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <span className="text-[10px] font-extrabold uppercase text-zinc-400">Pulls system context metrics</span>
                  <button 
                    onClick={handleGenerateDailyBriefing}
                    disabled={loadingOpsBrief}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    {loadingOpsBrief ? <RefreshCw className="animate-spin text-white" size={12} /> : 'Generate AI Diagnostics Report'}
                  </button>
                </div>

                <AnimatePresence>
                  {opsDailyBrief && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-4"
                    >
                      <span className="block text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-2">OPS Diagnostic Operations Audit</span>
                      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-xs font-medium leading-relaxed font-sans text-zinc-700 dark:text-zinc-300 max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                        {opsDailyBrief}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bug Reports Analyser */}
              <div className="premium-card p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <Code size={16} className="text-indigo-600" />
                  <h4 className="font-extrabold uppercase tracking-tight text-xs text-zinc-800 dark:text-zinc-200">Interactive Code Bug Analyser</h4>
                </div>
                <div className="mb-4">
                  <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1.5 tracking-wider">Reported Behavior / Exception Log</label>
                  <textarea 
                    placeholder="e.g. users report that clicking the 'Approve' button in ListingModeration makes the page freeze on Safari browsers."
                    rows={3}
                    className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-500/30 transition-all font-sans"
                    value={bugsDescription}
                    onChange={(e) => setBugsDescription(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-end border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <button 
                    onClick={handleAnalyzeBugTask}
                    disabled={loadingOpsBug || !bugsDescription}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
                  >
                    {loadingOpsBug ? <RefreshCw className="animate-spin text-white" size={12} /> : 'Analyze & Suggest Bugfix'}
                  </button>
                </div>

                <AnimatePresence>
                  {opsBugReport && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-4"
                    >
                      <span className="block text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-2">OPS Diagnostic Solution & Instructions</span>
                      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-xs font-medium leading-relaxed font-sans text-zinc-700 dark:text-zinc-300 max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                        {opsBugReport}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* simulated Inbox reply tool */}
              <div className="premium-card p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <Briefcase size={16} className="text-indigo-600" />
                  <h4 className="font-extrabold uppercase tracking-tight text-xs text-zinc-800 dark:text-zinc-200">Partner Mail Desk Help</h4>
                </div>
                <div className="space-y-3 mb-4">
                  {mockInquiries.map((inq) => (
                    <div 
                      key={inq.id}
                      onClick={() => handleSolveSupportInquiry(inq)}
                      className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 ${
                        selectedInquiry?.id === inq.id 
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500/30' 
                          : 'bg-slate-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-indigo-600/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-150">{inq.from}</span>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-600">Pending reply</span>
                      </div>
                      <p className="text-[10px] font-extrabold text-zinc-400 mb-1">{inq.subject}</p>
                      <p className="text-[11px] text-zinc-500 line-clamp-1">"{inq.body}"</p>
                    </div>
                  ))}
                </div>

                <AnimatePresence>
                  {opsInquiryDraft && selectedInquiry && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="border-t border-zinc-100 dark:border-zinc-800 pt-4"
                    >
                      <span className="block text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-2">AI Prepared Email Draft</span>
                      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-xs font-medium leading-relaxed font-sans text-zinc-700 dark:text-zinc-300 max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                        {opsInquiryDraft}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Task Tracker list */}
              <div className="premium-card p-6">
                <div className="flex items-center justify-between gap-3 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={16} className="text-indigo-600" />
                    <h4 className="font-extrabold uppercase tracking-tight text-xs text-zinc-800 dark:text-zinc-200">System Smart Tasks Logger</h4>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 px-2.5 py-1 rounded-lg">
                    {opsTaskList.filter(t => !t.completed).length} pending
                  </span>
                </div>
                <div className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    placeholder="Ask Agent to auto prioritize task details (e.g. Fix mobile navbar margins)..."
                    className="flex-1 text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-500/30 transition-all font-sans"
                    value={opsTaskInput}
                    onChange={(e) => setOpsTaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddOpsTaskManual();
                    }}
                  />
                  <button 
                    onClick={handleAddOpsTaskManual}
                    className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-[10px] tracking-wider cursor-pointer"
                  >
                    Log Task
                  </button>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {opsTaskList.map((task) => (
                    <div 
                      key={task.id}
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`flex items-start justify-between gap-4 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                        task.completed 
                          ? 'opacity-50 line-through bg-zinc-50 border-zinc-100 dark:bg-zinc-900/40 dark:border-zinc-900' 
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
                          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-none">{task.text}</p>
                          <span className="text-[9px] font-extrabold text-indigo-600 uppercase mt-1 inline-block">{task.category}</span>
                        </div>
                      </div>
                      <span className={`text-[8px] font-black tracking-widest px-2.5 py-1 rounded-lg ${
                        task.priority === 'HIGH' ? 'bg-red-50 text-red-600 dark:bg-red-950/20' :
                        task.priority === 'MED' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {/* ----- SCOUT AGENT PANEL ----- */}
          {activeAgent === 'scout' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              
              {/* Country Selection Expansion Strategy */}
              <div className="premium-card p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <Globe size={16} className="text-indigo-600" />
                  <h4 className="font-extrabold uppercase tracking-tight text-xs text-zinc-800 dark:text-zinc-200">Global Geographic Expansion Strategy</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-lg' 
                          : 'bg-slate-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-850 hover:border-indigo-600/30'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{item.flag}</span>
                      <span className="text-xs font-black block text-zinc-800 dark:text-zinc-100 leading-tight truncate">{item.country}</span>
                      <span className="text-[9px] font-extrabold uppercase block text-indigo-600 tracking-wider mt-1">Growth: {item.growth}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <button 
                    onClick={() => handleAnalyzeMarketPlan(selectedMarket)}
                    disabled={loadingScoutMarket}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    {loadingScoutMarket ? <RefreshCw className="animate-spin text-white" size={12} /> : `Extract Strategic Plan: ${selectedMarket}`}
                  </button>
                </div>

                <AnimatePresence>
                  {scoutMarketPlan && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-4"
                    >
                      <span className="block text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-2">Scout entry diagnostics for {selectedMarket}</span>
                      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-xs font-medium leading-relaxed font-sans text-zinc-700 dark:text-zinc-300 max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                        {scoutMarketPlan}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Competitive gap scanner */}
              <div className="premium-card p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <TrendingUp size={16} className="text-indigo-600" />
                  <h4 className="font-extrabold uppercase tracking-tight text-xs text-zinc-800 dark:text-zinc-200">Competitors Void Gap Finder</h4>
                </div>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed mb-4">
                  The Scout analyzes structural flaws in direct legacy portals (Zameen.com, OLX Pakistan, Airbnb local models) to isolate dynamic market gaps.
                </p>
                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <span className="text-[10px] font-extrabold uppercase text-zinc-400">Examines global payment escrows</span>
                  <button 
                    onClick={handleRunGapScanner}
                    disabled={loadingScoutGaps}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    {loadingScoutGaps ? <RefreshCw className="animate-spin text-white" size={12} /> : 'Run Competitive Void Audit'}
                  </button>
                </div>

                <AnimatePresence>
                  {scoutGapAnalysis && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-4"
                    >
                      <span className="block text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-2">High-yield voids report</span>
                      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-xs font-semibold leading-relaxed font-sans text-zinc-700 dark:text-zinc-300 max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                        {scoutGapAnalysis}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Reverse Engineer Competitor Plans */}
              <div className="premium-card p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <Compass size={16} className="text-indigo-600" />
                  <h4 className="font-extrabold uppercase tracking-tight text-xs text-zinc-800 dark:text-zinc-200">Reverse Engineered Competitor Matrix</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-zinc-950/20 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-900">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🏨</span>
                      <div>
                        <span className="text-xs font-black text-zinc-800 dark:text-zinc-100 leading-none">Airbnb Pakistan Threat Profile</span>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Focusing on luxury capital rentals.</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-extrabold px-2.5 py-1 rounded bg-amber-50 text-amber-600 uppercase">HIGH CHALLENGE</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-zinc-950/20 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-900">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🏢</span>
                      <div>
                        <span className="text-xs font-black text-zinc-800 dark:text-zinc-100 leading-none">OLX Local Renting Deficit</span>
                        <p className="text-[10px] text-zinc-400 mt-0.5">High user concentration but severe fraud risk.</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-extrabold px-2.5 py-1 rounded bg-emerald-50 text-emerald-600 uppercase">EXPLOITABLE</span>
                  </div>
                </div>
                <div className="flex justify-end border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-4">
                  <button 
                    onClick={handleAnalyzeCompetitorsMeta}
                    disabled={loadingScoutComp}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    {loadingScoutComp ? <RefreshCw className="animate-spin text-white" size={12} /> : 'Synthesize Competitors Weaknesses Matrix'}
                  </button>
                </div>

                <AnimatePresence>
                  {scoutCompetitorIntel && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-4"
                    >
                      <span className="block text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-2">Reverse engineered competitor profiles</span>
                      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-xs font-medium leading-relaxed font-sans text-zinc-700 dark:text-zinc-300 max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                        {scoutCompetitorIntel}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          )}

        </div>

        {/* Right Side: Active Agent's Interactive Chat Console */}
        <div className="lg:col-span-4 bg-slate-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/80 rounded-[32px] overflow-hidden sticky top-24 shadow-sm flex flex-col h-[700px]">
          
          {/* Active Chat Header */}
          <div className="p-4 bg-slate-100/60 dark:bg-zinc-900/60 border-b border-zinc-150 dark:border-zinc-800/60 backdrop-blur-md flex items-center gap-3">
            <span className="text-xl">
              {activeAgent === 'rex' ? '🦁' : activeAgent === 'ops' ? '🤖' : '🔭'}
            </span>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-tight text-zinc-800 dark:text-zinc-100">
                {activeAgent === 'rex' ? 'REX (Sales Agent)' : activeAgent === 'ops' ? 'OPS (Operations)' : 'SCOUT (Research)'}
              </h4>
              <p className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">Automated Agent Panel Node</p>
            </div>
          </div>

          {/* Active Chat messages scroll space */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar font-sans">
            
            {activeAgent === 'rex' && rexChat.map((msg, idx) => (
              <div 
                key={idx}
                className={`max-w-[85%] rounded-[20px] p-4 text-xs font-semibold leading-relaxed font-sans ${
                  msg.role === 'user' 
                    ? 'ml-auto bg-indigo-600 text-white rounded-tr-sm shadow-xl shadow-indigo-600/10' 
                    : 'bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850/60 text-zinc-700 dark:text-zinc-300 rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            ))}

            {activeAgent === 'ops' && opsChat.map((msg, idx) => (
              <div 
                key={idx}
                className={`max-w-[85%] rounded-[20px] p-4 text-xs font-semibold leading-relaxed font-sans ${
                  msg.role === 'user' 
                    ? 'ml-auto bg-indigo-600 text-white rounded-tr-sm shadow-xl shadow-indigo-600/10' 
                    : 'bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850/60 text-zinc-700 dark:text-zinc-300 rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            ))}

            {activeAgent === 'scout' && scoutChat.map((msg, idx) => (
              <div 
                key={idx}
                className={`max-w-[85%] rounded-[20px] p-4 text-xs font-semibold leading-relaxed font-sans ${
                  msg.role === 'user' 
                    ? 'ml-auto bg-indigo-600 text-white rounded-tr-sm shadow-xl shadow-indigo-600/10' 
                    : 'bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850/60 text-zinc-700 dark:text-zinc-300 rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            ))}

            {/* Simulated loading bubble */}
            {((activeAgent === 'rex' && isSendingRex) || 
              (activeAgent === 'ops' && isSendingOps) || 
              (activeAgent === 'scout' && isSendingScout)) && (
              <div className="flex items-center gap-1.5 p-3.5 max-w-[60px] bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-[20px] rounded-tl-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce delay-200"></span>
              </div>
            )}

            {activeAgent === 'rex' && <div ref={rexEndRef} />}
            {activeAgent === 'ops' && <div ref={opsEndRef} />}
            {activeAgent === 'scout' && <div ref={scoutEndRef} />}

          </div>

          {/* Chat Inputs */}
          <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-150 dark:border-zinc-800/60 flex items-center gap-2">
            {activeAgent === 'rex' && (
              <>
                <textarea 
                  placeholder="Ask Rex to overhaul outreach or list conversions..."
                  rows={1}
                  className="flex-1 text-xs font-semibold px-4 py-3 max-h-24 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-500/20 resize-none font-sans"
                  value={rexInput}
                  onChange={(e) => setRexInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendRexChatMessage();
                    }
                  }}
                />
                <button 
                  onClick={sendRexChatMessage}
                  disabled={!rexInput.trim() || isSendingRex}
                  className="w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center cursor-pointer transition-all disabled:opacity-40 shadow-lg shadow-indigo-600/10"
                >
                  <Send size={14} />
                </button>
              </>
            )}

            {activeAgent === 'ops' && (
              <>
                <textarea 
                  placeholder="Ask Ops to diagnose active lists or clear disputes..."
                  rows={1}
                  className="flex-1 text-xs font-semibold px-4 py-3 max-h-24 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-500/20 resize-none font-sans"
                  value={opsInputClean}
                  onChange={(e) => setOpsInputClean(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendOpsChatMessage();
                    }
                  }}
                />
                <button 
                  onClick={sendOpsChatMessage}
                  disabled={!opsInputClean.trim() || isSendingOps}
                  className="w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center cursor-pointer transition-all disabled:opacity-40 shadow-lg shadow-indigo-600/10"
                >
                  <Send size={14} />
                </button>
              </>
            )}

            {activeAgent === 'scout' && (
              <>
                <textarea 
                  placeholder="Ask Scout about competitor fee cuts or local targets..."
                  rows={1}
                  className="flex-1 text-xs font-semibold px-4 py-3 max-h-24 rounded-2xl border border-zinc-100 dark:border-indigo-950 bg-slate-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-500/20 resize-none font-sans"
                  value={scoutInput}
                  onChange={(e) => setScoutInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendScoutChatMessage();
                    }
                  }}
                />
                <button 
                  onClick={sendScoutChatMessage}
                  disabled={!scoutInput.trim() || isSendingScout}
                  className="w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center cursor-pointer transition-all disabled:opacity-40 shadow-lg shadow-indigo-600/10"
                >
                  <Send size={14} />
                </button>
              </>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
