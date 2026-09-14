// Supabase configuration - robust version
const SUPABASE_URL = 'https://gqoxwbhjocyhbgyrugsr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ul73oOHRtNgcn3nX032M2w_af6XfqlU';

// Create client safely
let supabase = null;

try {
  // The UMD build exposes a global called 'supabase'
  if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client created successfully');
  } else if (typeof createClient === 'function') {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client created via createClient');
  } else {
    throw new Error('Supabase library not found. Check if the CDN script loaded.');
  }
} catch (err) {
  console.error('Failed to create Supabase client:', err);
  // Create a dummy so the page shows a clear error instead of crashing
  supabase = {
    from: function() {
      return {
        select: () => Promise.resolve({ data: null, error: { message: 'Supabase client failed to load. Please refresh the page.' } }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Supabase client failed to load' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Supabase client failed to load' } }),
        delete: () => Promise.resolve({ data: null, error: { message: 'Supabase client failed to load' } })
      };
    }
  };
}

// Make sure it is available globally
window.supabaseClient = supabase;

// Admin password
const ADMIN_PASSWORD = 'lexliga@2026';
