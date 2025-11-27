import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

console.log('Environment variables check:');
console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log(
  'EXPO_PUBLIC_SUPABASE_ANON_KEY exists:',
  !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);
console.log(
  'EXPO_PUBLIC_SUPABASE_ANON_KEY length:',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.length
);
console.log(
  'All environment variables:',
  Object.keys(process.env).filter((key) => key.startsWith('EXPO_PUBLIC'))
);

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate Supabase credentials
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Missing Supabase credentials. Please check your .env file:'
  );
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY:',
    supabaseAnonKey ? 'SET' : 'MISSING'
  );
  console.error(
    '❌ Please ensure your .env file exists in the project root with:'
  );
  console.error('EXPO_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.error(
    '❌ After adding .env file, restart the development server with: npm run dev'
  );
}

if (supabaseUrl) {
  console.log('✅ Supabase URL:', supabaseUrl);
}
if (supabaseAnonKey) {
  console.log(
    '✅ Supabase Key (first 20 chars):',
    supabaseAnonKey?.substring(0, 20) + '...'
  );
}

// Validate URL format
if (supabaseUrl && !supabaseUrl.includes('supabase.co')) {
  console.error(
    '❌ Invalid Supabase URL format. Should be: https://your-project-id.supabase.co'
  );
}

// Validate key format
if (supabaseAnonKey && supabaseAnonKey.length < 100) {
  console.error(
    '❌ Supabase ANON KEY seems too short. Should be a long JWT token.'
  );
}

// Create a fallback client if credentials are missing
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder-key';

export const supabase = createClient<Database>(
  supabaseUrl || fallbackUrl,
  supabaseAnonKey || fallbackKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Add connection test
const testConnection = async () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Cannot test connection: Missing Supabase credentials');
    return;
  }

  try {
    const { data, error } = await supabase
      .from('movies')
      .select('count')
      .limit(1);
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
    } else {
      console.log('✅ Supabase connection test successful');
    }
  } catch (err) {
    console.error('❌ Supabase connection test error:', err);
  }
};

// Test connection on startup
testConnection();

// Auth helper functions
export const signUp = async (
  email: string,
  password: string,
  username: string
) => {
  console.log('SignUp attempt for:', email);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
      },
    },
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

export const resetPassword = async (email: string) => {
  console.log('Password reset request for:', email);

  // Use the app's custom scheme for mobile deep linking
  const redirectUrl = 'watchbase://reset-password';

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });
  console.log('Password reset result:', {
    data: !!data,
    error: error?.message,
  });
  return { data, error };
};

export const updatePassword = async (newPassword: string) => {
  console.log('Updating password');
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  console.log('Update password result:', {
    data: !!data,
    error: error?.message,
  });
  return { data, error };
};
