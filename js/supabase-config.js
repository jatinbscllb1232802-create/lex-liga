// Supabase configuration - robust version

const SUPABASE_URL =
  'https://gqoxwbhjocyhbgyrugsr.supabase.co';

const SUPABASE_ANON_KEY =
  'sb_publishable_ul73oOHRtNgcn3nX032M2w_af6XfqlU';


// Create client safely

let supabase = null;

try {

  if (
    typeof window.supabase !== 'undefined' &&
    typeof window.supabase.createClient === 'function'
  ) {

    supabase =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      );

    console.log(
      'Supabase client created successfully'
    );

  } else if (
    typeof createClient === 'function'
  ) {

    supabase =
      createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      );

    console.log(
      'Supabase client created via createClient'
    );

  } else {

    throw new Error(
      'Supabase library not found. Check if the CDN script loaded.'
    );
  }

} catch (err) {

  console.error(
    'Failed to create Supabase client:',
    err
  );

  // Create a dummy client so the page shows
  // a readable error instead of crashing.

  supabase = {

    from: function () {

      return {

        select: () =>
          Promise.resolve({
            data: null,
            error: {
              message:
                'Supabase client failed to load. Please refresh the page.'
            }
          }),

        insert: () =>
          Promise.resolve({
            data: null,
            error: {
              message:
                'Supabase client failed to load'
            }
          }),

        update: () =>
          Promise.resolve({
            data: null,
            error: {
              message:
                'Supabase client failed to load'
            }
          }),

        delete: () =>
          Promise.resolve({
            data: null,
            error: {
              message:
                'Supabase client failed to load'
            }
          })

      };
    }

  };
}


// Make available globally

window.supabaseClient = supabase;


// Admin password
// Must match PLANREADME.md

const ADMIN_PASSWORD =
  'lexliga2026';
