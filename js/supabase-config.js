// Supabase configuration - Publishable key is safe for client-side use
const SUPABASE_URL = 'https://gqoxwbhjocyhbgyrugsr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ul73oOHRtNgcn3nX032M2w_af6XfqlU';

// Create client (using CDN version of supabase-js)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Simple admin password (change later if needed)
const ADMIN_PASSWORD = 'lexliga2026';
