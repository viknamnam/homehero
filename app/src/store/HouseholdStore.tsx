import React, {
  createContext, useContext, useEffect, useMemo, useReducer, useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATEGORIES, CategoryKey } from '../constants/categories';
import { personColours } from '../theme/tokens';

// ---------- Types ----------
export interface Member {
  id: string;
  name: string;
  colour: string;
}

export interface Task {
  id: string;
  categoryKey: CategoryKey;
  title?: string;
  occurredAt: string;      // ISO
  durationMin: number;
  memberId: string;
  valueAmount: number;     // denormalised at insert (audit trail if rates change)
  createdAt: string;
}

export interface HouseholdState {
  householdName: string | null;
  currency: string;             // 'AED' | 'USD' | 'EUR' | 'GBP'
  hideMoney: boolean;
  meId: string | null;
  members: Member[];
  rates: Record<CategoryKey, number>;
  tasks: Task[];
  logDurationsMs: number[];     // last 20 — the <10s metric (log_duration_ms)
}

// Base hourly rate per currency (the "cleaning ≈ 1.0" anchor). Per-category relative
// multipliers live on each Category. Regional rates are V1.2 (Gaps log #11/#12).
const DEFAULT_RATES: Record<string, number> = { AED: 40, USD: 15, EUR: 14, GBP: 13 };

const initialRates = (currency: string): Record<CategoryKey, number> => {
  const base = DEFAULT_RATES[currency] ?? 15;
  return Object.fromEntries(
    CATEGORIES.map((c) => [c.key, Math.round(base * c.rateMultiplier)]),
  ) as Record<CategoryKey, number>;
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
};

// ---------- Actions ----------
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
  | { type: 'RESET' };

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

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
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// ---------- Context ----------
interface StoreApi {
  state: HouseholdState;
  createHousehold: (householdName: string, currency: string, memberNames: string[]) => void;
  addTask: (input: {
    categoryKey: CategoryKey; title?: string; durationMin: number;
    memberId: string; occurredAt?: Date;
  }) => Task;
  updateTask: (id: string, input: {
    categoryKey: CategoryKey; title?: string; durationMin: number;
    memberId: string; occurredAt: Date;
  }) => void;
  deleteTask: (id: string) => void;
  setHideMoney: (v: boolean) => void;
  setCurrency: (c: string) => void;
  setRate: (key: CategoryKey, rate: number) => void;
  recordLogMs: (ms: number) => void;
  reset: () => void;
  taskValue: (categoryKey: CategoryKey, durationMin: number) => number;
}

const StoreContext = createContext<StoreApi | null>(null);
const STORAGE_KEY = 'homehero.v1';

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hydrated = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { dispatch({ type: 'HYDRATE', state: { ...initialState, ...JSON.parse(raw) } }); } catch {}
      }
      hydrated.current = true;
    });
  }, []);

  useEffect(() => {
    if (hydrated.current) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const api = useMemo<StoreApi>(() => ({
    state,
    createHousehold: (householdName, currency, memberNames) =>
      dispatch({ type: 'CREATE_HOUSEHOLD', householdName, currency, memberNames }),
    taskValue: (categoryKey, durationMin) =>
      Math.round((durationMin / 60) * (state.rates[categoryKey] ?? 0)),
    addTask: ({ categoryKey, title, durationMin, memberId, occurredAt }) => {
      const task: Task = {
        id: uid(),
        categoryKey,
        title: title?.trim() || undefined,
        durationMin,
        memberId,
        occurredAt: (occurredAt ?? new Date()).toISOString(),
        valueAmount: Math.round((durationMin / 60) * (state.rates[categoryKey] ?? 0)),
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_TASK', task });
      return task;
    },
    updateTask: (id, { categoryKey, title, durationMin, memberId, occurredAt }) => {
      const existing = state.tasks.find((t) => t.id === id);
      if (!existing) return;
      const task: Task = {
        ...existing,
        categoryKey,
        title: title?.trim() || undefined,
        durationMin,
        memberId,
        occurredAt: occurredAt.toISOString(),
        valueAmount: Math.round((durationMin / 60) * (state.rates[categoryKey] ?? 0)),
      };
      dispatch({ type: 'UPDATE_TASK', id, task });
    },
    deleteTask: (id) => dispatch({ type: 'DELETE_TASK', id }),
    setHideMoney: (v) => dispatch({ type: 'SET_HIDE_MONEY', value: v }),
    setCurrency: (c) => dispatch({ type: 'SET_CURRENCY', currency: c }),
    setRate: (key, rate) => dispatch({ type: 'SET_RATE', key, rate }),
    recordLogMs: (ms) => dispatch({ type: 'RECORD_LOG_MS', ms }),
    reset: () => dispatch({ type: 'RESET' }),
  }), [state]);

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
  const day = (d.getDay() + 6) % 7; // Monday = 0
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
