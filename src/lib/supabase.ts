import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://psncflamqhhzoejhfshe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzbmNmbGFtcWhoem9lamhmc2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MzAwMjYsImV4cCI6MjA4NDMwNjAyNn0.2gv4cW8vcDsz43EuaGuqSm0MmV1bLHPgYts7dFj5uoc';

// Create untyped client for flexibility
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check connection
export async function checkConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('suppliers').select('count').limit(1);
    return !error;
  } catch {
    return false;
  }
}
