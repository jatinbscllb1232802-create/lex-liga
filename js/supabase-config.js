// Supabase configuration

const SUPABASE_URL = 'https://gqoxwbhjocyhbgyrugsr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ul73oOHRtNgcn3nX032M2w_af6XfqlU';

let supabase = null;

try {
  if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client created successfully');
  } else if (typeof createClient === 'function') {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    throw new Error('Supabase library not found');
  }
} catch (err) {
  console.error('Failed to create Supabase client:', err);
  supabase = {
    from: function () {
      return {
        select: () => Promise.resolve({ data: null, error: { message: 'Supabase client failed to load' } }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Supabase client failed to load' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Supabase client failed to load' } }),
        delete: () => Promise.resolve({ data: null, error: { message: 'Supabase client failed to load' } })
      };
    }
  };
}

window.supabaseClient = supabase;

// Separate admin passwords per sport
window.ADMIN_PASSWORDS = {
  futsal: 'lexliga2026',
  badminton: 'badminton2026'
};

const ADMIN_PASSWORD = window.ADMIN_PASSWORDS.futsal;
