import React, {
  createContext, useContext, useEffect, useMemo, useReducer, useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATEGORIES, CategoryKey } from '../constants/categories';
import { personColours } from '../theme/tokens';

// ---------- Types ----------
export interface Member {
  id: string;            // cloud uuid once synced; local uid before
  name: string;
  colour: string;
  linked?: boolean;      // has an auth account (cloud mode)
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

export type PendingOp =
  | { id: string; kind: 'task_upsert'; taskId: string }
  | { id: string; kind: 'task_delete'; taskId: string }
  | { id: string; kind: 'household_update' }
  | { id: string; kind: 'rate_update'; categoryKey: CategoryKey };

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
      return {
        ...state,
        householdName: p.householdName,
        currency: p.currency,
        hideMoney: p.hideMoney,
        meId: p.meId,
        members: p.members,
        rates: p.rates,
        tasks: [...localPending, ...pulled].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
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
