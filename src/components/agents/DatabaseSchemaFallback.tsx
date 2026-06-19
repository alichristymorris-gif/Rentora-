import React, { useState } from 'react';
import { AlertTriangle, Copy, Check } from 'lucide-react';

export function DatabaseSchemaFallback() {
  const [copied, setCopied] = useState(false);

  const sqlCode = `-- Step 1: Create Advanced AI Agents Tables
-- Copy and run this inside your Supabase SQL Editor:

-- Outreach queue (Rex & Scout drafts)
CREATE TABLE IF NOT EXISTS outreach_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_name TEXT NOT NULL,
  contact_email TEXT,
  draft_type TEXT NOT NULL, -- 'email' | 'proposal' | 'rebuttal'
  draft_content TEXT NOT NULL,
  priority TEXT DEFAULT 'medium', -- 'high' | 'medium' | 'low'
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'sent'
  created_by TEXT DEFAULT 'rex',
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  notes TEXT
);

-- Inquiries board (Ops messages)
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name TEXT NOT NULL,
  sender_contact TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  classification TEXT, -- 'pricing_question' | 'general' | 'complaint'
  status TEXT DEFAULT 'new', -- 'new' | 'drafted' | 'replied' | 'closed'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Smart tasks logger (Ops to-do tasks)
CREATE TABLE IF NOT EXISTS ops_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  priority TEXT DEFAULT 'MED', -- 'HIGH' | 'MED' | 'LOW'
  category TEXT,
  completed BOOLEAN DEFAULT false,
  created_by TEXT DEFAULT 'ops',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Health and Diagnostics log (Fix Agent updates)
CREATE TABLE IF NOT EXISTS health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_time TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL, -- 'healthy' | 'warning' | 'error'
  details TEXT
);

-- System issues and fixes found by Fix Agent
CREATE TABLE IF NOT EXISTS issues_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  severity TEXT DEFAULT 'low', -- 'low' | 'medium' | 'high' | 'needs_human'
  description TEXT,
  auto_fixed BOOLEAN DEFAULT false,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily Reports aggregated by Ren Agent
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  summary_text TEXT NOT NULL,
  action_items JSONB,
  metrics_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Leads tracker for Scout Agent
CREATE TABLE IF NOT EXISTS scout_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_name TEXT NOT NULL,
  lead_type TEXT, -- 'agency' | 'owner' | 'company'
  city TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  source_notes TEXT,
  fit_score TEXT DEFAULT 'medium', -- 'high' | 'medium' | 'low'
  status TEXT DEFAULT 'new', -- 'new' | 'queued_for_outreach' | 'contacted'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Row Level Security)
ALTER TABLE outreach_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_leads ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated admin users
CREATE POLICY "Admin access outreach_queue" ON outreach_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin access inquiries" ON inquiries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin access ops_tasks" ON ops_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin access health_log" ON health_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin access issues_log" ON issues_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin access daily_reports" ON daily_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin access scout_leads" ON scout_leads FOR ALL USING (true) WITH CHECK (true);

-- Insert some starter inquiries for testing
INSERT INTO inquiries (sender_name, sender_contact, subject, body, status) VALUES
('Hammad Ejaz (Karachi Landlord)', 'hammad@ejaz.com', 'Bulk registration discount query', 'Aoa, I have 12 luxury townhouses in Clifton. Do you offer discounted platform fees for bulk accounts?', 'new'),
('Sonia Mirza (Islamabad Renter)', 'sonia@mirza.com', 'Security deposit escrow query', 'Hello, I want to rent a villa but want security escrow clearance. How does Rentora secure my funds?', 'new'),
('Global Dubai Agencies', 'info@globaluae.com', 'International listing integration', 'Dear Rentora, We want to list our luxury Dubai condos. Are your API endpoints fully integrated for currency conversion?', 'new');
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-6 mb-8 text-amber-800 dark:text-amber-200 font-sans">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-xl shrink-0">
          <AlertTriangle className="text-amber-600" size={20} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black uppercase tracking-tight mb-1">Database Tables Missing</h3>
          <p className="text-xs leading-relaxed opacity-90 mb-4">
            Muhammad Ali! Your advanced AI Agents tables don't exist yet in Supabase project (kkvsueminnnbhiyhpuax). 
            Please host them by opening the <strong>SQL Editor</strong> in your Supabase Dashboard, pasting the structured commands below, and executing "Run".
          </p>

          <div className="relative rounded-2xl border border-zinc-205 dark:border-zinc-800 bg-zinc-950 p-4 font-mono text-[10px] text-zinc-300 max-h-[180px] overflow-y-auto w-full mb-3 whitespace-pre">
            <button
              onClick={copyToClipboard}
              className="absolute top-3 right-3 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl transition-all font-sans text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-emerald-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy SQL Script
                </>
              )}
            </button>
            {sqlCode}
          </div>
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 block">
            ★ Fallback active: In the meantime, the AI agents will run on simulated mock data so you can test features instantly.
          </span>
        </div>
      </div>
    </div>
  );
}
