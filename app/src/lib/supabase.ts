// Supabase client. Session persists via AsyncStorage so sign-in survives restarts.
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          // On web, the magic-link URL carries the session — pick it up on load.
          // (Native uses code entry once custom SMTP enables {{ .Token }} emails.)
          detectSessionInUrl: Platform.OS === 'web',
        },
      })
    : null;

export const isCloudEnabled = supabase !== null;
