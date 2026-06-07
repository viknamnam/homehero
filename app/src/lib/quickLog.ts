import { CategoryKey } from '../constants/categories';
import { supabase } from './supabase';

export interface ParsedTask { title: string; categoryKey: CategoryKey; minutes: number; }

// Calls the quick-log Edge Function. The LLM key lives server-side as a Supabase
// secret — the app only ever sends text and receives validated task JSON.
export async function parseQuickLog(text: string): Promise<ParsedTask[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.functions.invoke('quick-log', { body: { text } });
    if (error || !data?.tasks) return null;
    return data.tasks as ParsedTask[];
  } catch {
    return null;
  }
}
