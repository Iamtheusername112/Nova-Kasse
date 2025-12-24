import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase environment variables are missing!\n' +
    'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.\n' +
    'Get your credentials from: Supabase Dashboard → Project Settings → API'
  );
}

// Create Supabase client with session persistence
// Add error handling for schema queries
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'nova-kasse-auth',
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'nova-kasse@1.0.0',
    },
  },
});

// Add error handler for database schema queries
if (typeof window !== 'undefined') {
  // Only add error handler on client side
  supabase.realtime.setAuth((error) => {
    if (error) {
      console.error('Supabase realtime auth error:', error);
    }
  });
}

