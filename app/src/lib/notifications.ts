import { Platform } from 'react-native';
import { supabase } from './supabase';

// NOTIFICATIONS (register #61): exactly TWO exist, ever —
//   1. "X sent you thanks 💛"  — delivered via push (server function notify-thanks)
//   2. Weekly digest            — LOCAL scheduled notification, Sunday 18:00
// Habit nudges were deliberately removed from the roadmap. Do not add more
// notification types without revisiting that decision.
//
// expo-notifications is NATIVE (⚠️ needs the next dev build). Same guarded-
// require pattern as speech.ts: on clients built before the rebuild, the
// module is absent, notificationsAvailable() returns false, and every entry
// point is a silent no-op — no crash, no UI.

let Notifications: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications');
} catch {
  Notifications = null;
}

export function notificationsAvailable(): boolean {
  return Notifications != null && Platform.OS !== 'web';
}

/** Ask permission + register this device's Expo push token for thanks delivery. */
export async function enableThanksPush(memberId: string): Promise<boolean> {
  if (!notificationsAvailable() || !supabase) return false;
  try {
    const perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) return false;
    const token = (await Notifications.getExpoPushTokenAsync()).data as string;
    const { error } = await supabase.from('push_tokens').upsert(
      { member_id: memberId, token, platform: Platform.OS, updated_at: new Date().toISOString() },
      { onConflict: 'member_id' },
    );
    return !error;
  } catch {
    return false;
  }
}

export async function disableThanksPush(memberId: string): Promise<void> {
  if (!supabase) return;
  try { await supabase.from('push_tokens').delete().eq('member_id', memberId); } catch {}
}

const DIGEST_ID = 'weekly-digest';

/** Local weekly digest: Sunday 18:00, quiet by design (one per week, cancellable). */
export async function scheduleWeeklyDigest(title: string, body: string): Promise<boolean> {
  if (!notificationsAvailable()) return false;
  try {
    const perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) return false;
    await Notifications.cancelScheduledNotificationAsync(DIGEST_ID).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: DIGEST_ID,
      content: { title, body },
      trigger: { weekday: 1, hour: 18, minute: 0, repeats: true }, // weekday 1 = Sunday (Expo convention)
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelWeeklyDigest(): Promise<void> {
  if (!notificationsAvailable()) return;
  try { await Notifications.cancelScheduledNotificationAsync(DIGEST_ID); } catch {}
}

/** Foreground presentation: show alerts quietly, no badge spam. */
export function setupNotificationHandler(): void {
  if (!notificationsAvailable()) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}
