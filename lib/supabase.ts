import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

console.log('Environment variables check:');
console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY length:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.length);

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate Supabase credentials
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file:');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
  throw new Error('Supabase credentials not configured');
}

console.log('✅ Supabase URL:', supabaseUrl);
console.log('✅ Supabase Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');

// Validate URL format
if (!supabaseUrl.includes('supabase.co')) {
  console.error('❌ Invalid Supabase URL format. Should be: https://your-project-id.supabase.co');
}

// Validate key format
if (supabaseAnonKey.length < 100) {
  console.error('❌ Supabase ANON KEY seems too short. Should be a long JWT token.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth helper functions
export const signUp = async (email: string, password: string) => {
  console.log('SignUp attempt for:', email);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  console.log('SignUp result:', { data: !!data, error: error?.message });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  console.log('SignIn attempt for:', email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  console.log('SignIn result:', { data: !!data, error: error?.message });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data, error: authError } = await supabase.auth.getUser();
  const user = data?.user ?? null;
  return { user, error: authError };
};