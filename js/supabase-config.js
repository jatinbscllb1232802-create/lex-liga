// Supabase configuration
const SUPABASE_URL = 'https://gqoxwbhjocyhbgyrugsr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ul73oOHRtNgcn3nX032M2w_af6XfqlU';

// Robust client creation
let supabase;

if (window.supabase && typeof window.supabase.createClient === 'function') {
  // Standard CDN global
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else if (typeof createClient === 'function') {
  // Alternative export
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.error('Supabase library not loaded. Check the CDN script.');
  // Fallback dummy so the page does not completely crash
  supabase = {
    from: () => ({ select: () => Promise.resolve({ data: [], error: { message: 'Supabase not loaded' } }) })
  };
}

// Simple admin password
const ADMIN_PASSWORD = 'lexliga2026';
