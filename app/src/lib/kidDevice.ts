import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// Kid device binding (#48). A child's own device holds an anonymous Supabase
// session bound to exactly one child member. There is NO adult view on this
// device — the only data it can reach is its household's, via RLS scoped
// through kid_devices (migration 0011).

const KEY = 'heronest.kiddevice';
export type KidDevice = { memberId: string; householdId: string };

export async function getKidDevice(): Promise<KidDevice | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as KidDevice) : null;
  } catch { return null; }
}

/** Redeem a kid link on a fresh device: anon sign-in -> bind -> remember. */
export async function redeemKidLink(token: string): Promise<KidDevice | null> {
  if (!supabase) return null;
  try {
    // Anonymous session (requires Anonymous sign-ins enabled in Supabase Auth)
    const { error: authErr } = await supabase.auth.signInAnonymously();
    if (authErr) return null;
    const { data, error } = await supabase.rpc('redeem_kid_link', { p_token: token });
    if (error || !data) return null;
    const dev: KidDevice = { memberId: data.memberId, householdId: data.householdId };
    await AsyncStorage.setItem(KEY, JSON.stringify(dev));
    return dev;
  } catch { return null; }
}

/** Unbind this device (parent-initiated reset / testing). */
export async function clearKidDevice(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
    if (supabase) await supabase.auth.signOut();
  } catch {}
}
