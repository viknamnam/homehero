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

// OFFLINE FALLBACK: when the quick-log function is unreachable (no connection,
// not yet deployed, provider hiccup), a small keyword matcher keeps the
// feature alive: rough guesses, clearly labelled in the UI, fully editable in
// the same review step. Better an honest guess than a dead end.

const KEYWORDS: [RegExp, CategoryKey, number][] = [
  [/laundry|wash(ed|ing)? clothes|iron/i, 'laundry', 20],
  [/cook|lunch(es)?|dinner|breakfast|meal|baked?/i, 'cooking', 25],
  [/clean|tidi?e?d|vacuum|hoover|mop|dishes|dishwasher|wiped?/i, 'cleaning', 20],
  [/bin|rubbish|trash|recycl/i, 'waste', 5],
  [/school run|drove|drop(ped)? off|pick(ed)? up|football|practice|activity/i, 'child_logistics', 35],
  [/order(ed)?|book(ed)?|form|appointment|plann?(ed|ing)|organis|schedul/i, 'planning', 15],
  [/remember(ed)?|kept track|reminded/i, 'remembering', 10],
  [/comfort|calm(ed)?|listen(ed)?|meltdown|upset|hug/i, 'emotional', 20],
  [/dog|cat|pet|walk(ed)? the/i, 'pets', 20],
  [/fix(ed)?|repair|maintenance|bulb|leak/i, 'maintenance', 30],
  [/shop|grocer|errand|bought|store/i, 'shopping', 30],
  [/homework|revision|reading practice/i, 'homework', 25],
];

export function offlineParse(text: string): ParsedTask[] {
  const parts = text
    .split(/,|;|\.|\band then\b|\band\b/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 2);
  const tasks: ParsedTask[] = [];
  for (const part of parts.slice(0, 8)) {
    const hit = KEYWORDS.find(([re]) => re.test(part));
    const stated = part.match(/(\d{1,3})\s*(?:min|minutes|m\b)/i);
    const title = part.replace(/^(i|we)\s+/i, '').trim();
    tasks.push({
      title: title.charAt(0).toUpperCase() + title.slice(1, 60),
      categoryKey: hit ? hit[1] : 'other',
      minutes: stated ? Math.min(240, Math.max(5, Number(stated[1]))) : (hit ? hit[2] : 15),
    });
  }
  return tasks;
}
