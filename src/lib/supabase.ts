import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || 'https://kkvsueminnnbhiyhpuax.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrdnN1ZW1pbm5uYmhpeWhwdWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDIyOTMsImV4cCI6MjA5NjA3ODI5M30.K1_apRRpuRXur_l4bvkYz97iRSRADCTp6ldbpD1DLzA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

