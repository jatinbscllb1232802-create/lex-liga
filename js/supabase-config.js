// Supabase configuration
const SUPABASE_URL = 'https://gqoxwbhjocyhbgyrugsr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ul73oOHRtNgcn3nX032M2w_af6XfqlU';

// Create the client using the UMD global
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expose as 'supabase' for the rest of the code
window.supabase = supabaseClient;

// Simple admin password
const ADMIN_PASSWORD = 'lexliga2026';
