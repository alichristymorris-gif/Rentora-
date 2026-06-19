import React from 'react';
import { Mail, CheckSquare, Globe, ShieldAlert, FileText, Zap } from 'lucide-react';

interface MasterControlBarProps {
  activeAgent: 'rex' | 'ops' | 'scout' | 'fix' | 'ren';
  setActiveAgent: (agent: 'rex' | 'ops' | 'scout' | 'fix' | 'ren') => void;
  outreachQueue: any[];
  inquiries: any[];
  opsTasks: any[];
  issuesLog: any[];
  healthLog: any[];
  dailyReports: any[];
  scoutLeads: any[];
}

export function MasterControlBar({
  activeAgent,
  setActiveAgent,
  outreachQueue,
  inquiries,
  opsTasks,
  issuesLog,
  healthLog,
  dailyReports,
  scoutLeads
}: MasterControlBarProps) {
  
  // Computations
  const pendingRexCount = outreachQueue.filter(o => o.status === 'pending' && o.created_by !== 'scout').length;
  const openTasksCount = opsTasks.filter(t => !t.completed).length;
  const newInquiriesCount = inquiries.filter(i => i.status === 'new').length;
  const scoutLeadsCount = scoutLeads.length;
  const scoutQueuedOutreach = scoutLeads.filter(l => l.status === 'queued_for_outreach').length;
  
  const unresolvedIssuesCount = issuesLog.filter(i => !i.resolved).length;
  const lastHealthCheck = healthLog.length > 0 ? new Date(healthLog[0].check_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never';
  const lastRenReport = dailyReports.length > 0 ? new Date(dailyReports[0].created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'None';

  const agents = [
    {
      id: 'rex' as const,
      name: 'REX',
      emoji: '🦁',
      role: 'Outbound & Sales',
      icon: Mail,
      color: 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20',
      dotColor: 'bg-emerald-500',
      actionText: `${pendingRexCount} drafts require approval`
    },
    {
      id: 'ops' as const,
      name: 'OPS',
      emoji: '🤖',
      role: 'Database Operations',
      icon: CheckSquare,
      color: 'border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20',
      dotColor: 'bg-blue-500',
      actionText: `${openTasksCount} open tasks, ${newInquiriesCount} new inquiries`
    },
    {
      id: 'scout' as const,
      name: 'SCOUT',
      emoji: '🔭',
      role: 'Expansion Intel',
      icon: Globe,
      color: 'border-indigo-500/20 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20',
      dotColor: 'bg-indigo-500',
      actionText: `${scoutLeadsCount} target leads, ${scoutQueuedOutreach} outreach queued`
    },
    {
      id: 'fix' as const,
      name: 'FIX',
      emoji: '🛠️',
      role: 'Self-Healing Shield',
      icon: ShieldAlert,
      color: 'border-rose-500/20 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20',
      dotColor: 'bg-rose-500',
      actionText: `Last check: ${lastHealthCheck} • ${unresolvedIssuesCount} open issues`
    },
    {
      id: 'ren' as const,
      name: 'REN',
      emoji: '📈',
      role: 'Growth & Daily Reports',
      icon: FileText,
      color: 'border-amber-500/20 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20',
      dotColor: 'bg-amber-500',
      actionText: `Last compilation: ${lastRenReport}`
    }
  ];

  return (
    <div className="mb-8 p-6 rounded-[32px] border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm font-sans">
      <div className="flex items-center gap-2.5 mb-5">
        <Zap size={18} className="text-indigo-600 animate-pulse" />
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
          Founder Muhammad Ali's Agent Command Center
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {agents.map((agent) => {
          const isActive = activeAgent === agent.id;
          const Icon = agent.icon;
          
          return (
            <div
              key={agent.id}
              onClick={() => setActiveAgent(agent.id)}
              className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'border-indigo-600 bg-zinc-50 dark:bg-zinc-900/40 shadow-sm'
                  : 'border-zinc-100 dark:border-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800 bg-slate-50/50 dark:bg-zinc-905/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{agent.emoji}</span>
                  <div>
                    <h3 className="text-xs font-black text-zinc-950 dark:text-zinc-100">{agent.name}</h3>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight leading-none mt-0.5">{agent.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900/60 p-1 rounded-full px-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${agent.dotColor}`} />
                  <span className="text-[8px] font-extrabold text-zinc-500 uppercase tracking-widest">Active</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase block tracking-wider mb-0.5">Last Status Action</span>
                <p className="text-[10.5px] font-semibold text-zinc-700 dark:text-zinc-300 leading-tight">
                  {agent.actionText}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
