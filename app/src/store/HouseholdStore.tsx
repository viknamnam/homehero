import React, {
  createContext, useContext, useEffect, useMemo, useReducer, useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATEGORIES, CategoryKey } from '../constants/categories';
import type { HeroStyle } from '../lib/heroVoice';
import { personColours } from '../theme/tokens';

// ---------- Types ----------
export interface Member {
  id: string;            // cloud uuid once synced; local uid before
  name: string;
  colour: string;
  role?: 'adult' | 'child'; // undefined = adult (pre-Kids-Mode data)
  linked?: boolean;      // has an auth account (cloud mode)
  avatarUrl?: string | null; // signed URL to a household-scoped photo (refreshed on pull)
}

export interface Task {
  id: string;            // local uid; doubles as cloud client_id (idempotency key)
  categoryKey: CategoryKey;
  title?: string;
  notes?: string;        // private to author (masked server-side for others)
  occurredAt: string;
  durationMin: number;
  memberId: string;
  valueAmount: number;
  createdAt: string;
}

export interface Thanks {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  categoryKey?: CategoryKey; // optional: thanks for a specific kind of work
  note?: string;
  createdAt: string;
}

// Plan the Day (gaps #13): anyone can add a plan, assign it to someone OR leave it
// open for whoever's free ("I'll do it"). No dispatcher role — assignment and
// claiming are both first-class. Local-first; cloud sync gates the flag flip.
export interface PlannedTask {
  id: string;
  categoryKey: CategoryKey;
  title?: string;
  assignedMemberId: string | null;   // null = open to anyone
  repeat: 'none' | 'daily' | 'weekly';
  weekday?: number;                  // 0-6, for weekly
  date: string;                      // anchor day (ISO) for one-off plans
  claimedBy?: string;
  claimedDate?: string;              // claims apply to a single day
  completedDates: string[];
  createdBy: string;
  createdAt: string;
}

export type PendingOp =
  | { id: string; kind: 'task_upsert'; taskId: string }
  | { id: string; kind: 'task_delete'; taskId: string }
  | { id: string; kind: 'household_update' }
  | { id: string; kind: 'rate_update'; categoryKey: CategoryKey }
  | { id: string; kind: 'thanks_upsert'; thanksId: string }
  | { id: string; kind: 'thanks_delete'; thanksId: string }
  | { id: string; kind: 'plan_upsert'; planId: string }
  | { id: string; kind: 'plan_delete'; planId: string };

export interface CloudState {
  householdId: string | null;
  lastSyncAt: string | null;
  pendingOps: PendingOp[];
  categoryIds: Partial<Record<CategoryKey, string>>; // key -> cloud category uuid
}

export interface HouseholdState {
  householdName: string | null;
  currency: string;
  hideMoney: boolean;
  meId: string | null;
  members: Member[];
  rates: Record<CategoryKey, number>;
  tasks: Task[];
  logDurationsMs: number[];
  thanks: Thanks[];
  plans: PlannedTask[];
  heroStyle: HeroStyle;
  // Pocket money (Kids Mode, §10): parent-controlled, OFF by default, fully
  // separate from adult value calculations. Local-only for now (not in pull
  // payload — APPLY_PULL spreads state, so these survive syncs).
  pocketMoneyEnabled?: boolean;
  pocketPointsPerUnit?: number; // e.g. 70 => 70 hero points per 1 unit of currency
  // Notification prefs (#61) — per-device, local-only by nature
  thanksPushEnabled?: boolean;
  weeklyDigestEnabled?: boolean;
  cloud: CloudState;
}

const DEFAULT_RATES: Record<string, number> = { AED: 40, USD: 15, EUR: 14, GBP: 13 };

const initialRates = (currency: string): Record<CategoryKey, number> => {
  const base = DEFAULT_RATES[currency] ?? 15;
  return Object.fromEntries(
    CATEGORIES.map((c) => [c.key, Math.round(base * c.rateMultiplier)]),
  ) as Record<CategoryKey, number>;
};

const initialCloud: CloudState = {
  householdId: null, lastSyncAt: null, pendingOps: [], categoryIds: {},
};

const initialState: HouseholdState = {
  householdName: null,
  currency: 'AED',
  hideMoney: false,
  meId: null,
  members: [],
  rates: initialRates('AED'),
  tasks: [],
  logDurationsMs: [],
  thanks: [],
  plans: [],
  heroStyle: 'bright',
  cloud: initialCloud,
};

export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ---------- Actions ----------
export interface PullPayload {
  householdId: string;
  householdName: string;
  currency: string;
  hideMoney: boolean;
  meId: string;
  members: Member[];
  rates: Record<CategoryKey, number>;
  tasks: Task[];
  thanks: Thanks[];
  plans: PlannedTask[];
  categoryIds: Partial<Record<CategoryKey, string>>;
}

type Action =
  | { type: 'HYDRATE'; state: HouseholdState }
  | { type: 'CREATE_HOUSEHOLD'; householdName: string; currency: string; memberNames: string[] }
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; id: string; task: Task }
  | { type: 'DELETE_TASK'; id: string }
  | { type: 'SET_HIDE_MONEY'; value: boolean }
  | { type: 'SET_CURRENCY'; currency: string }
  | { type: 'SET_RATE'; key: CategoryKey; rate: number }
  | { type: 'RECORD_LOG_MS'; ms: number }
  | { type: 'RESET_LOG_MS' }
  | { type: 'SET_MEMBER_AVATAR'; memberId: string; avatarUrl: string }
  | { type: 'ADD_MEMBER'; member: Member }
  | { type: 'RENAME_MEMBER'; memberId: string; name: string }
  | { type: 'REMOVE_MEMBER'; memberId: string }
  | { type: 'ADD_THANKS'; thanks: Thanks }
  | { type: 'DELETE_THANKS'; id: string }
  | { type: 'ADD_PLAN'; plan: PlannedTask }
  | { type: 'DELETE_PLAN'; id: string }
  | { type: 'CLAIM_PLAN'; id: string; memberId: string; date: string }
  | { type: 'COMPLETE_PLAN'; id: string; date: string }
  | { type: 'SET_HERO_STYLE'; style: HeroStyle }
  | { type: 'SET_POCKET_MONEY'; enabled: boolean; pointsPerUnit: number }
  | { type: 'SET_NOTIFY_PREFS'; thanksPush?: boolean; weeklyDigest?: boolean }
  | { type: 'ENQUEUE'; op: PendingOp }
  | { type: 'DEQUEUE'; opIds: string[] }
  | { type: 'RELINK_MEMBERS'; idMap: Record<string, string>; members: Member[]; meId: string }
  | { type: 'APPLY_PULL'; pull: PullPayload }
  | { type: 'CLEAR_CLOUD' }
  | { type: 'RESET' };

function reducer(state: HouseholdState, action: Action): HouseholdState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;
    case 'CREATE_HOUSEHOLD': {
      const members: Member[] = action.memberNames
        .filter((n) => n.trim().length > 0)
        .map((name, i) => ({ id: uid(), name: name.trim(), colour: personColours[i % personColours.length] }));
      return {
        ...initialState,
        householdName: action.householdName.trim(),
        currency: action.currency,
        rates: initialRates(action.currency),
        members,
        meId: members[0]?.id ?? null,
      };
    }
    case 'ADD_TASK':
      return { ...state, tasks: [action.task, ...state.tasks] };
    case 'UPDATE_TASK':
      return { ...state, tasks: state.tasks.map((t) => (t.id === action.id ? action.task : t)) };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };
    case 'SET_HIDE_MONEY':
      return { ...state, hideMoney: action.value };
    case 'SET_CURRENCY':
      return { ...state, currency: action.currency };
    case 'SET_RATE':
      return { ...state, rates: { ...state.rates, [action.key]: action.rate } };
    case 'RECORD_LOG_MS':
      return { ...state, logDurationsMs: [action.ms, ...state.logDurationsMs].slice(0, 20) };
    case 'RESET_LOG_MS':
      return { ...state, logDurationsMs: [] };
    case 'ADD_MEMBER':
      return { ...state, members: [...state.members, action.member] };
    case 'RENAME_MEMBER':
      return {
        ...state,
        members: state.members.map((m) => m.id === action.memberId ? { ...m, name: action.name } : m),
      };
    case 'REMOVE_MEMBER':
      return {
        ...state,
        members: state.members.filter((m) => m.id !== action.memberId),
        tasks: state.tasks.filter((t) => t.memberId !== action.memberId),
        thanks: state.thanks.filter((t) => t.fromMemberId !== action.memberId && t.toMemberId !== action.memberId),
        plans: state.plans.map((p) => ({
          ...p,
          assignedMemberId: p.assignedMemberId === action.memberId ? null : p.assignedMemberId,
          claimedBy: p.claimedBy === action.memberId ? undefined : p.claimedBy,
        })),
      };
    case 'SET_MEMBER_AVATAR':
      return {
        ...state,
        members: state.members.map((m) =>
          m.id === action.memberId ? { ...m, avatarUrl: action.avatarUrl } : m),
      };
    case 'ADD_THANKS':
      return { ...state, thanks: [action.thanks, ...state.thanks] };
    case 'DELETE_THANKS':
      return { ...state, thanks: state.thanks.filter((t) => t.id !== action.id) };
    case 'SET_NOTIFY_PREFS':
      return {
        ...state,
        thanksPushEnabled: action.thanksPush ?? state.thanksPushEnabled,
        weeklyDigestEnabled: action.weeklyDigest ?? state.weeklyDigestEnabled,
      };
    case 'SET_POCKET_MONEY':
      return { ...state, pocketMoneyEnabled: action.enabled, pocketPointsPerUnit: Math.max(1, Math.round(action.pointsPerUnit)) };
    case 'SET_HERO_STYLE':
      return { ...state, heroStyle: action.style };
    case 'ADD_PLAN':
      return { ...state, plans: [action.plan, ...state.plans] };
    case 'DELETE_PLAN':
      return { ...state, plans: state.plans.filter((p) => p.id !== action.id) };
    case 'CLAIM_PLAN':
      return { ...state, plans: state.plans.map((p) =>
        p.id === action.id ? { ...p, claimedBy: action.memberId, claimedDate: action.date } : p) };
    case 'COMPLETE_PLAN':
      return { ...state, plans: state.plans.map((p) =>
        p.id === action.id && !p.completedDates.includes(action.date)
          ? { ...p, completedDates: [...p.completedDates, action.date], claimedBy: undefined, claimedDate: undefined }
          : (p.repeat === 'none' && p.id === action.id ? p : p)) };
    case 'ENQUEUE': {
      // collapse duplicate ops targeting the same record
      const dup = (o: PendingOp) =>
        o.kind === action.op.kind &&
        ((o.kind === 'task_upsert' || o.kind === 'task_delete')
          ? (o as any).taskId === (action.op as any).taskId
          : o.kind === 'rate_update'
            ? (o as any).categoryKey === (action.op as any).categoryKey
            : true);
      return {
        ...state,
        cloud: { ...state.cloud, pendingOps: [...state.cloud.pendingOps.filter((o) => !dup(o)), action.op] },
      };
    }
    case 'DEQUEUE':
      return {
        ...state,
        cloud: {
          ...state.cloud,
          pendingOps: state.cloud.pendingOps.filter((o) => !action.opIds.includes(o.id)),
          lastSyncAt: new Date().toISOString(),
        },
      };
    case 'RELINK_MEMBERS':
      return {
        ...state,
        members: action.members,
        meId: action.meId,
        tasks: state.tasks.map((t) => ({ ...t, memberId: action.idMap[t.memberId] ?? t.memberId })),
      };
    case 'APPLY_PULL': {
      const p = action.pull;
      const pendingTaskIds = new Set(
        state.cloud.pendingOps
          .filter((o): o is Extract<PendingOp, { taskId: string }> => 'taskId' in o)
          .map((o) => o.taskId),
      );
      const localPending = state.tasks.filter((t) => pendingTaskIds.has(t.id));
      const pulled = p.tasks.filter((t) => !pendingTaskIds.has(t.id));
      const pendingPlanIds = new Set(
        state.cloud.pendingOps
          .filter((o): o is Extract<PendingOp, { planId: string }> => 'planId' in o)
          .map((o) => o.planId),
      );
      const localPendingPlans = state.plans.filter((pl) => pendingPlanIds.has(pl.id));
      const pulledPlans = (p.plans ?? []).filter((pl) => !pendingPlanIds.has(pl.id));
      return {
        ...state,
        householdName: p.householdName,
        currency: p.currency,
        hideMoney: p.hideMoney,
        meId: p.meId,
        members: p.members,
        rates: p.rates,
        tasks: [...localPending, ...pulled].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
        thanks: p.thanks,
        plans: [...localPendingPlans, ...pulledPlans],
        cloud: {
          ...state.cloud,
          householdId: p.householdId,
          categoryIds: p.categoryIds,
          lastSyncAt: new Date().toISOString(),
        },
      };
    }
    case 'CLEAR_CLOUD':
      return { ...state, cloud: initialCloud };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// ---------- Context ----------
interface StoreApi {
  state: HouseholdState;
  dispatch: React.Dispatch<Action>;
  createHousehold: (householdName: string, currency: string, memberNames: string[]) => void;
  addTask: (input: {
    categoryKey: CategoryKey; title?: string; notes?: string; durationMin: number;
    memberId: string; occurredAt?: Date;
  }) => Task;
  updateTask: (id: string, input: {
    categoryKey: CategoryKey; title?: string; notes?: string; durationMin: number;
    memberId: string; occurredAt: Date;
  }) => void;
  deleteTask: (id: string) => void;
  sendThanks: (input: { toMemberId: string; categoryKey?: CategoryKey; note?: string }) => void;
  deleteThanks: (id: string) => void;
  addPlan: (input: { categoryKey: CategoryKey; title?: string; assignedMemberId: string | null; repeat: 'none' | 'daily' | 'weekly' }) => void;
  deletePlan: (id: string) => void;
  claimPlan: (id: string) => void;
  completePlan: (id: string) => void;
  setHeroStyle: (style: HeroStyle) => void;
  setPocketMoney: (enabled: boolean, pointsPerUnit: number) => void;
  setHideMoney: (v: boolean) => void;
  setCurrency: (c: string) => void;
  setRate: (key: CategoryKey, rate: number) => void;
  recordLogMs: (ms: number) => void;
  resetLogMetric: () => void;
  reset: () => void;
  taskValue: (categoryKey: CategoryKey, durationMin: number) => number;
}

const StoreContext = createContext<StoreApi | null>(null);
const STORAGE_KEY = 'homehero.v2';

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hydrated = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          dispatch({ type: 'HYDRATE', state: { ...initialState, ...parsed, cloud: { ...initialCloud, ...(parsed.cloud ?? {}) } } });
        } catch {}
      }
      hydrated.current = true;
    });
  }, []);

  useEffect(() => {
    if (hydrated.current) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const api = useMemo<StoreApi>(() => {
    const linked = !!state.cloud.householdId;
    const enqueue = (op: Omit<PendingOp, 'id'>) =>
      linked && dispatch({ type: 'ENQUEUE', op: { ...op, id: uid() } as PendingOp });

    return {
      state,
      dispatch,
      createHousehold: (householdName, currency, memberNames) =>
        dispatch({ type: 'CREATE_HOUSEHOLD', householdName, currency, memberNames }),
      taskValue: (categoryKey, durationMin) =>
        Math.round((durationMin / 60) * (state.rates[categoryKey] ?? 0)),
      addTask: ({ categoryKey, title, notes, durationMin, memberId, occurredAt }) => {
        const task: Task = {
          id: uid(),
          categoryKey,
          title: title?.trim() || undefined,
          notes: notes?.trim() || undefined,
          durationMin,
          memberId,
          occurredAt: (occurredAt ?? new Date()).toISOString(),
          valueAmount: Math.round((durationMin / 60) * (state.rates[categoryKey] ?? 0)),
          createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_TASK', task });
        enqueue({ kind: 'task_upsert', taskId: task.id } as any);
        return task;
      },
      updateTask: (id, { categoryKey, title, notes, durationMin, memberId, occurredAt }) => {
        const existing = state.tasks.find((t) => t.id === id);
        if (!existing) return;
        const task: Task = {
          ...existing,
          categoryKey,
          title: title?.trim() || undefined,
          notes: notes?.trim() || undefined,
          durationMin,
          memberId,
          occurredAt: occurredAt.toISOString(),
          valueAmount: Math.round((durationMin / 60) * (state.rates[categoryKey] ?? 0)),
        };
        dispatch({ type: 'UPDATE_TASK', id, task });
        enqueue({ kind: 'task_upsert', taskId: id } as any);
      },
      deleteTask: (id) => {
        dispatch({ type: 'DELETE_TASK', id });
        enqueue({ kind: 'task_delete', taskId: id } as any);
      },
      sendThanks: ({ toMemberId, categoryKey, note }) => {
        if (!state.meId) return;
        const thanks: Thanks = {
          id: uid(),
          fromMemberId: state.meId,
          toMemberId,
          categoryKey,
          note: note?.trim() || undefined,
          createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_THANKS', thanks });
        enqueue({ kind: 'thanks_upsert', thanksId: thanks.id } as any);
      },
      deleteThanks: (id) => {
        dispatch({ type: 'DELETE_THANKS', id });
        enqueue({ kind: 'thanks_delete', thanksId: id } as any);
      },
      addPlan: ({ categoryKey, title, assignedMemberId, repeat }) => {
        if (!state.meId) return;
        const now = new Date();
        const planId = uid();
        dispatch({ type: 'ADD_PLAN', plan: {
          id: planId, categoryKey, title: title?.trim() || undefined,
          assignedMemberId, repeat,
          weekday: repeat === 'weekly' ? now.getDay() : undefined,
          date: now.toISOString().slice(0, 10),
          completedDates: [], createdBy: state.meId, createdAt: now.toISOString(),
        } });
        enqueue({ kind: 'plan_upsert', planId } as any);
      },
      deletePlan: (id) => {
        dispatch({ type: 'DELETE_PLAN', id });
        enqueue({ kind: 'plan_delete', planId: id } as any);
      },
      claimPlan: (id) => {
        if (!state.meId) return;
        dispatch({ type: 'CLAIM_PLAN', id, memberId: state.meId, date: new Date().toISOString().slice(0, 10) });
        enqueue({ kind: 'plan_upsert', planId: id } as any);
      },
      completePlan: (id) => {
        dispatch({ type: 'COMPLETE_PLAN', id, date: new Date().toISOString().slice(0, 10) });
        enqueue({ kind: 'plan_upsert', planId: id } as any);
      },
      setHeroStyle: (style) => dispatch({ type: 'SET_HERO_STYLE', style }),
      setPocketMoney: (enabled, pointsPerUnit) => dispatch({ type: 'SET_POCKET_MONEY', enabled, pointsPerUnit }),
      setHideMoney: (v) => { dispatch({ type: 'SET_HIDE_MONEY', value: v }); enqueue({ kind: 'household_update' } as any); },
      setCurrency: (c) => { dispatch({ type: 'SET_CURRENCY', currency: c }); enqueue({ kind: 'household_update' } as any); },
      setRate: (key, rate) => { dispatch({ type: 'SET_RATE', key, rate }); enqueue({ kind: 'rate_update', categoryKey: key } as any); },
      recordLogMs: (ms) => dispatch({ type: 'RECORD_LOG_MS', ms }),
      resetLogMetric: () => dispatch({ type: 'RESET_LOG_MS' }),
      reset: () => dispatch({ type: 'RESET' }),
    };
  }, [state]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

/** Like useHousehold, but returns null outside the provider — for presentational
 *  components (e.g. Avatar) that must not crash in isolated render contexts. */
export function useHouseholdMaybe(): StoreApi | null {
  return useContext(StoreContext);
}

export function useHousehold(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useHousehold must be used inside HouseholdProvider');
  return ctx;
}

// ---------- Date helpers ----------
export const isSameDay = (iso: string, ref: Date) => {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() &&
         d.getMonth() === ref.getMonth() &&
         d.getDate() === ref.getDate();
};

export const startOfWeek = (ref: Date) => {
  const d = new Date(ref);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const inWeekOf = (iso: string, weekStart: Date) => {
  const t = new Date(iso).getTime();
  const end = weekStart.getTime() + 7 * 24 * 3600 * 1000;
  return t >= weekStart.getTime() && t < end;
};

export const fmtHM = (totalMin: number) =>
  `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`;
