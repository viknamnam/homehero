// Supabase client — OPTIONAL in Sprint 1. The app runs fully in local mode.
// Wire-up happens in Sprint 3 (offline-first sync with client_id idempotency keys).
import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isCloudEnabled = supabase !== null;
