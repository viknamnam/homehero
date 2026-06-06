import { colors } from '../theme/tokens';
import type { IconName } from '../components/icons';

export type CategoryKey =
  | 'cleaning' | 'cooking' | 'laundry' | 'waste' | 'child_logistics'
  | 'planning' | 'remembering' | 'emotional' | 'pets' | 'maintenance'
  | 'shopping' | 'homework' | 'other';

export interface Category {
  key: CategoryKey;
  name: string;
  icon: IconName;          // semantic icon name -> Lucide (components/icons.tsx)
  colour: string;
  mentalLoad: boolean;
  rateMultiplier: number;  // relative default vs. household base rate (NOT regional — see Gaps #11/#12)
}

// The 13 core categories — mirrors design doc §2 and the SQL seed trigger.
// rateMultiplier gives each category a sensible *relative* default (e.g. skilled maintenance > laundry)
// applied to the household's base rate. These are starting points, fully editable, and deliberately
// NOT region-specific — a regional rate library is V1.2 (Gaps log #11). Keep in sync with 0001_init.sql.
export const CATEGORIES: Category[] = [
  { key: 'cleaning',        name: 'Cleaning',          icon: 'sparkles', colour: colors.sage,         mentalLoad: false, rateMultiplier: 1.00 },
  { key: 'cooking',         name: 'Cooking & food',    icon: 'cooking', colour: colors.coral,        mentalLoad: false, rateMultiplier: 1.10 },
  { key: 'laundry',         name: 'Laundry',           icon: 'shirt', colour: colors.sky,          mentalLoad: false, rateMultiplier: 0.85 },
  { key: 'waste',           name: 'Waste & recycling', icon: 'recycle', colour: colors.sageDeep,     mentalLoad: false, rateMultiplier: 0.80 },
  { key: 'child_logistics', name: 'Child logistics',   icon: 'car', colour: colors.peach,        mentalLoad: false, rateMultiplier: 1.00 },
  { key: 'planning',        name: 'Planning / Admin',  icon: 'clipboard', colour: colors.lavender,     mentalLoad: true,  rateMultiplier: 1.05 },
  { key: 'remembering',     name: 'Remembering',       icon: 'bulb', colour: colors.lavender,     mentalLoad: true,  rateMultiplier: 1.00 },
  { key: 'emotional',       name: 'Emotional support', icon: 'heart', colour: colors.blush,        mentalLoad: true,  rateMultiplier: 1.00 },
  { key: 'pets',            name: 'Pet care',          icon: 'paw', colour: colors.butter,       mentalLoad: false, rateMultiplier: 0.90 },
  { key: 'maintenance',     name: 'Home maintenance',  icon: 'wrench', colour: colors.charcoalSoft, mentalLoad: false, rateMultiplier: 1.50 },
  { key: 'shopping',        name: 'Shopping / errands',icon: 'bag', colour: colors.teal,         mentalLoad: false, rateMultiplier: 0.95 },
  { key: 'homework',        name: 'Homework support',  icon: 'book', colour: colors.sky,          mentalLoad: false, rateMultiplier: 1.25 },
  { key: 'other',           name: 'Other',             icon: 'dots', colour: colors.mist,         mentalLoad: false, rateMultiplier: 1.00 },
];

export const categoryByKey = (key: CategoryKey): Category =>
  CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
