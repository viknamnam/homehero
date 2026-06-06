// Sync engine — local-first, cloud-backed.
// Writes hit the local store instantly; a queue pushes them to Supabase in the
// background with the task id as client_id (idempotent). Pull rebuilds local
// state from the cloud. Logging never visibly fails (build plan §offline tolerance).
import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { Alert } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { File } from 'expo-file-system';
import { supabase, isCloudEnabled } from './supabase';
import { captureError } from './sentry';
import {
  useHousehold, Task, Member, PendingOp, PullPayload, uid,
} from '../store/HouseholdStore';
import { CATEGORIES, CategoryKey } from '../constants/categories';
import { personColours } from '../theme/tokens';

interface SyncApi {
  cloudEnabled: boolean;
  session: Session | null;
  busy: boolean;
  lastError: string | null;
  sendCode: (email: string) => Promise<boolean>;
  verifyCode: (email: string, code: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  /** After sign-in: does this account already belong to a household? Pull it if so. */
  pullMyHousehold: () => Promise<'pulled' | 'none'>;
  /** Push the locally-created household (members, settings, tasks) to the cloud. */
  uploadHousehold: () => Promise<boolean>;
  /** Join an existing household with an invite code. */
  joinWithInvite: (code: string, myName: string) => Promise<boolean>;
  createInvite: () => Promise<string | null>;
  syncNow: () => Promise<void>;
  /** Upload my profile photo to household-scoped storage; updates members.avatar. */
  uploadAvatar: (localUri: string) => Promise<boolean>;
  /** Delete the household everywhere (cloud cascade) and reset this device. */
  deleteHousehold: () => Promise<boolean>;
}

const SyncContext = createContext<SyncApi | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useHousehold();
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const fail = (e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    setLastError(msg);
    captureError(e); // crash visibility (no-op until a Sentry DSN is configured)
    return false;
  };

  // ---------- Auth (email + 6-digit code: works on web and phone alike) ----------
  const sendCode = useCallback(async (email: string) => {
    if (!supabase) return false;
    setLastError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    return error ? fail(error) : true;
  }, []);

  const verifyCode = useCallback(async (email: string, code: string) => {
    if (!supabase) return false;
    setLastError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(), token: code.trim(), type: 'email',
    });
    return error ? fail(error) : true;
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    dispatch({ type: 'CLEAR_CLOUD' });
  }, [dispatch]);

  // ---------- Pull: cloud -> local ----------
  const pull = useCallback(async (householdId: string): Promise<boolean> => {
    if (!supabase) return false;
    const authUserId = (await supabase.auth.getUser()).data.user?.id;

    const [{ data: hh, error: e1 }, { data: cats, error: e2 }] = await Promise.all([
      supabase.from('households').select('id,name,currency,hide_money').eq('id', householdId).single(),
      supabase.from('categories').select('id,key').eq('household_id', householdId),
    ]);
    if (e1 || e2 || !hh || !cats) return fail(e1 ?? e2 ?? new Error('pull failed'));

    const keyById = new Map(cats.map((c: any) => [c.id as string, c.key as CategoryKey]));
    const idByKey: Partial<Record<CategoryKey, string>> = {};
    cats.forEach((c: any) => { idByKey[c.key as CategoryKey] = c.id; });

    const [{ data: mems, error: e3 }, { data: rateRows, error: e4 }, { data: taskRows, error: e5 }, { data: apprRows, error: e6 }] =
      await Promise.all([
        supabase.from('members').select('id,display_name,colour,auth_user_id,avatar').eq('household_id', householdId),
        supabase.from('rates').select('category_id,hourly_rate').eq('household_id', householdId),
        supabase.from('tasks_visible').select('*').eq('household_id', householdId)
          .order('occurred_at', { ascending: false }).limit(500),
        supabase.from('appreciations')
          .select('id,client_id,from_member_id,to_member_id,category_id,message,created_at')
          .eq('household_id', householdId)
          .order('created_at', { ascending: false }).limit(200),
      ]);
    if (e3 || e4 || e5 || e6 || !mems || !rateRows || !taskRows || !apprRows)
      return fail(e3 ?? e4 ?? e5 ?? e6 ?? new Error('pull failed'));

    const me = mems.find((m: any) => m.auth_user_id === authUserId);
    if (!me) return fail(new Error('your account is not a member of this household'));

    const members: Member[] = mems.map((m: any) => ({
      id: m.id, name: m.display_name, colour: m.colour, linked: !!m.auth_user_id,
    }));

    // Resolve photo avatars: storage paths -> signed URLs (private bucket, 7-day expiry,
    // refreshed on every pull). Failures here never block the pull.
    try {
      const withAvatar = mems.filter((m: any) => m.avatar);
      if (withAvatar.length) {
        const { data: signed } = await supabase.storage
          .from('avatars')
          .createSignedUrls(withAvatar.map((m: any) => m.avatar as string), 60 * 60 * 24 * 7);
        const urlByPath = new Map(
          (signed ?? []).flatMap((x) => (x.path && x.signedUrl ? [[x.path, x.signedUrl] as const] : [])),
        );
        members.forEach((mm, i) => {
          const path = (mems[i] as any).avatar as string | null;
          if (path) mm.avatarUrl = urlByPath.get(path) ?? null;
        });
      }
    } catch { /* avatars are decorative — never fail a pull over them */ }

    const rates = Object.fromEntries(
      CATEGORIES.map((c) => [c.key, 0]),
    ) as Record<CategoryKey, number>;
    rateRows.forEach((r: any) => {
      const key = keyById.get(r.category_id);
      if (key) rates[key] = Number(r.hourly_rate);
    });

    const tasks: Task[] = taskRows
      .map((t: any): Task | null => {
        const categoryKey = keyById.get(t.category_id);
        if (!categoryKey) return null;
        return {
          id: t.client_id ?? t.id,
          categoryKey,
          title: t.title ?? undefined,
          notes: t.notes ?? undefined,
          occurredAt: t.occurred_at,
          durationMin: t.duration_min,
          memberId: t.assigned_member_id,
          valueAmount: Number(t.value_amount ?? 0),
          createdAt: t.created_at,
        };
      })
      .filter((t): t is Task => t !== null);

    const payload: PullPayload = {
      householdId,
      householdName: hh.name,
      currency: hh.currency,
      hideMoney: hh.hide_money,
      meId: me.id,
      members,
      rates,
      tasks,
      thanks: apprRows.map((a: any) => ({
        id: a.client_id ?? a.id,
        fromMemberId: a.from_member_id,
        toMemberId: a.to_member_id,
        categoryKey: a.category_id ? keyById.get(a.category_id) : undefined,
        note: a.message ?? undefined,
        createdAt: a.created_at,
      })),
      categoryIds: idByKey,
    };
    dispatch({ type: 'APPLY_PULL', pull: payload });
    return true;
  }, [dispatch]);

  const pullMyHousehold = useCallback(async (): Promise<'pulled' | 'none'> => {
    if (!supabase) return 'none';
    const authUserId = (await supabase.auth.getUser()).data.user?.id;
    if (!authUserId) return 'none';
    const { data } = await supabase.from('members')
      .select('household_id').eq('auth_user_id', authUserId).limit(1);
    const hid = data?.[0]?.household_id;
    if (!hid) return 'none';
    return (await pull(hid)) ? 'pulled' : 'none';
  }, [pull]);

  // ---------- Push queue ----------
  const pushing = useRef(false);
  const processQueue = useCallback(async () => {
    const s = stateRef.current;
    if (!supabase || !session || !s.cloud.householdId || pushing.current) return;
    if (s.cloud.pendingOps.length === 0) return;
    pushing.current = true;
    try {
      const done: string[] = [];
      for (const op of s.cloud.pendingOps) {
        const ok = await pushOne(op, stateRef.current);
        if (!ok) break;            // stop on first failure; retry next cycle
        done.push(op.id);
      }
      if (done.length) dispatch({ type: 'DEQUEUE', opIds: done });
    } finally {
      pushing.current = false;
    }
  }, [session, dispatch]);

  const pushOne = async (op: PendingOp, s: typeof state): Promise<boolean> => {
    if (!supabase || !s.cloud.householdId) return false;
    const hid = s.cloud.householdId;
    try {
      if (op.kind === 'task_upsert') {
        const t = s.tasks.find((x) => x.id === op.taskId);
        if (!t) return true; // deleted meanwhile
        const categoryId = s.cloud.categoryIds[t.categoryKey];
        if (!categoryId) throw new Error('missing category mapping — sync now to refresh');
        const { error } = await supabase.from('tasks').upsert({
          household_id: hid,
          category_id: categoryId,
          title: t.title ?? null,
          notes: t.notes ?? null,
          occurred_at: t.occurredAt,
          duration_min: t.durationMin,
          assigned_member_id: t.memberId,
          created_by_member_id: s.meId,
          value_amount: t.valueAmount,
          client_id: t.id,
        }, { onConflict: 'client_id' });
        if (error) throw error;
      } else if (op.kind === 'task_delete') {
        const { error } = await supabase.from('tasks')
          .delete().eq('household_id', hid).eq('client_id', op.taskId);
        if (error) throw error;
      } else if (op.kind === 'household_update') {
        const { error } = await supabase.from('households')
          .update({ hide_money: s.hideMoney, currency: s.currency }).eq('id', hid);
        if (error) throw error;
      } else if (op.kind === 'rate_update') {
        const categoryId = s.cloud.categoryIds[op.categoryKey];
        if (!categoryId) throw new Error('missing category mapping');
        const { error } = await supabase.from('rates')
          .update({ hourly_rate: s.rates[op.categoryKey], source: 'custom' })
          .eq('household_id', hid).eq('category_id', categoryId);
        if (error) throw error;
      } else if (op.kind === 'thanks_upsert') {
        const t = s.thanks.find((x) => x.id === op.thanksId);
        if (!t) return true; // withdrawn meanwhile
        const { error } = await supabase.from('appreciations').upsert({
          household_id: hid,
          from_member_id: t.fromMemberId,
          to_member_id: t.toMemberId,
          category_id: t.categoryKey ? (s.cloud.categoryIds[t.categoryKey] ?? null) : null,
          message: t.note ?? null,
          created_at: t.createdAt,
          client_id: t.id,
        }, { onConflict: 'client_id' });
        if (error) throw error;
      } else if (op.kind === 'thanks_delete') {
        const { error } = await supabase.from('appreciations')
          .delete().eq('household_id', hid).eq('client_id', op.thanksId);
        if (error) throw error;
      }
      return true;
    } catch (e) {
      fail(e);
      return false;
    }
  };

  // background loop: push then nothing else; pull happens on launch/sign-in/manual
  useEffect(() => {
    if (!session || !state.cloud.householdId) return;
    const t = setInterval(processQueue, 15000);
    processQueue();
    return () => clearInterval(t);
  }, [session, state.cloud.householdId, state.cloud.pendingOps.length, processQueue]);

  // pull once on launch when already linked
  const pulledOnLaunch = useRef(false);
  useEffect(() => {
    if (session && state.cloud.householdId && !pulledOnLaunch.current) {
      pulledOnLaunch.current = true;
      processQueue().then(() => pull(state.cloud.householdId!));
    }
  }, [session, state.cloud.householdId, processQueue, pull]);

  // ---------- Upload local household to cloud ----------
  const uploadHousehold = useCallback(async (): Promise<boolean> => {
    const s = stateRef.current;
    if (!supabase || !session || !s.householdName || !s.meId) return false;
    setBusy(true); setLastError(null);
    try {
      const meLocal = s.members.find((m) => m.id === s.meId)!;
      const { data, error } = await supabase.rpc('create_household_and_join', {
        p_name: s.householdName, p_currency: s.currency,
        p_member_name: meLocal.name, p_colour: meLocal.colour,
      });
      if (error) throw error;
      const householdId = (data as any).household_id as string;
      const myCloudId = (data as any).member_id as string;

      // other local members -> unlinked cloud members (claimable via invite)
      const idMap: Record<string, string> = { [s.meId]: myCloudId };
      const newMembers: Member[] = [{ ...meLocal, id: myCloudId, linked: true }];
      for (const m of s.members.filter((x) => x.id !== s.meId)) {
        const { data: row, error: e } = await supabase.from('members')
          .insert({ household_id: householdId, display_name: m.name, colour: m.colour })
          .select('id').single();
        if (e || !row) throw e ?? new Error('member insert failed');
        idMap[m.id] = row.id;
        newMembers.push({ ...m, id: row.id, linked: false });
      }
      dispatch({ type: 'RELINK_MEMBERS', idMap, members: newMembers, meId: myCloudId });

      // settings + per-category rates
      await supabase.from('households').update({ hide_money: s.hideMoney }).eq('id', householdId);
      const { data: cats } = await supabase.from('categories').select('id,key').eq('household_id', householdId);
      const idByKey: Partial<Record<CategoryKey, string>> = {};
      (cats ?? []).forEach((c: any) => { idByKey[c.key as CategoryKey] = c.id; });
      for (const c of CATEGORIES) {
        const cid = idByKey[c.key];
        if (cid) {
          await supabase.from('rates').update({ hourly_rate: s.rates[c.key] })
            .eq('household_id', householdId).eq('category_id', cid);
        }
      }

      // existing local tasks -> push (idempotent on client_id)
      for (const t of stateRef.current.tasks) {
        const { error: te } = await supabase.from('tasks').upsert({
          household_id: householdId,
          category_id: idByKey[t.categoryKey],
          title: t.title ?? null,
          notes: t.notes ?? null,
          occurred_at: t.occurredAt,
          duration_min: t.durationMin,
          assigned_member_id: idMap[t.memberId] ?? myCloudId,
          created_by_member_id: myCloudId,
          value_amount: t.valueAmount,
          client_id: t.id,
        }, { onConflict: 'client_id' });
        if (te) throw te;
      }

      return await pull(householdId);
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  }, [session, dispatch, pull]);

  // ---------- Invites ----------
  const createInvite = useCallback(async (): Promise<string | null> => {
    const s = stateRef.current;
    if (!supabase || !s.cloud.householdId) return null;
    const code = Array.from({ length: 6 }, () =>
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
    const { error } = await supabase.from('invites').insert({
      code,
      household_id: s.cloud.householdId,
      role: 'adult',
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    });
    if (error) { fail(error); return null; }
    return code;
  }, []);

  const joinWithInvite = useCallback(async (code: string, myName: string): Promise<boolean> => {
    if (!supabase || !session) return false;
    setBusy(true); setLastError(null);
    try {
      const colour = personColours[Math.floor(Math.random() * personColours.length)];
      const { data, error } = await supabase.rpc('redeem_invite', {
        p_code: code.trim(), p_name: myName.trim(), p_colour: colour,
      });
      if (error) throw error;
      return await pull((data as any).household_id as string);
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  }, [session, pull]);

  const deleteHousehold = useCallback(async (): Promise<boolean> => {
    const s = stateRef.current;
    setBusy(true); setLastError(null);
    try {
      if (supabase && session && s.cloud.householdId) {
        const { error } = await supabase.from('households').delete().eq('id', s.cloud.householdId);
        if (error) throw error;
        await supabase.auth.signOut().catch(() => {});
      }
      dispatch({ type: 'RESET' });
      return true;
    } catch (e) { return fail(e); } finally { setBusy(false); }
  }, [session, dispatch]);

  const uploadAvatar = useCallback(async (localUri: string): Promise<boolean> => {
    const s = stateRef.current;
    if (!supabase || !session || !s.cloud.householdId || !s.meId) return false;
    setBusy(true); setLastError(null);
    try {
      // Read the picked file as real bytes. (fetch(uri).arrayBuffer() is unreliable
      // on local file:// URIs in React Native and can yield an empty body silently.)
      const bytes = await new File(localUri).bytes();
      if (!bytes || bytes.length === 0) throw new Error('Could not read the selected image.');
      const path = `${s.cloud.householdId}/${s.meId}.jpg`;
      const { error } = await supabase.storage.from('avatars')
        .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      const { error: e2 } = await supabase.from('members').update({ avatar: path }).eq('id', s.meId);
      if (e2) throw e2;
      const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60 * 24 * 7);
      dispatch({ type: 'SET_MEMBER_AVATAR', memberId: s.meId, avatarUrl: signed?.signedUrl ?? localUri });
      return true;
    } catch (e: any) {
      // Photo failures must never be silent again (the original arrayBuffer bug).
      Alert.alert('Photo upload failed', e?.message ?? 'Something went wrong. Please try again.');
      return fail(e);
    } finally { setBusy(false); }
  }, [session, dispatch]);

  const syncNow = useCallback(async () => {
    setBusy(true); setLastError(null);
    try {
      await processQueue();
      const hid = stateRef.current.cloud.householdId;
      if (hid) await pull(hid);
    } finally {
      setBusy(false);
    }
  }, [processQueue, pull]);

  const api: SyncApi = {
    cloudEnabled: isCloudEnabled,
    session, busy, lastError,
    sendCode, verifyCode, signOut,
    pullMyHousehold, uploadHousehold, joinWithInvite, createInvite, syncNow, uploadAvatar, deleteHousehold,
  };

  return <SyncContext.Provider value={api}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncApi {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used inside SyncProvider');
  return ctx;
}
