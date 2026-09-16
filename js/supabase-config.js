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

window.ADMIN_PASSWORDS = {
  futsal: 'lexliga2026',
  badminton: 'badminton2026'
};

const ADMIN_PASSWORD = window.ADMIN_PASSWORDS.futsal;

/* Shared UI: announce bar + uniform nav + sound on every public page */
(function () {
  var path = (location.pathname || '').toLowerCase();
  if (path.indexOf('admin') !== -1) return;

  function addCss(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    (document.head || document.documentElement).appendChild(l);
  }

  function addScript(src, onload) {
    if (document.querySelector('script[data-lex="' + src + '"]')) {
      if (onload) onload();
      return;
    }
    var s = document.createElement('script');
    s.src = src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=6';
    s.async = false;
    s.setAttribute('data-lex', src);
    if (onload) s.onload = onload;
    (document.body || document.documentElement).appendChild(s);
  }

  function boot() {
    addCss('css/extras.css');
    // Order: nav first (DOM), then announce (needs supabase), then extras
    addScript('js/mobile-nav.js', function () {
      addScript('js/announce.js');
      addScript('js/live-extras.js');
      addScript('js/pwa-register.js');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
