import { CategoryKey } from './categories';

// Kid taxonomy (#82). Friendly, child-facing categories that each MAP onto an
// adult category underneath — so a kid's effort still rolls up into the family
// total instead of living in a separate silo. The `missions` arrays are the
// suggestion library a child taps from. Blame-free by construction (§10).
//
// Reward rule: concrete chores earn hero points AND can earn pocket money.
// 'emotional' work (Family Help, Kindness) earns hero points + badges +
// recognition, but never pocket money — we celebrate kindness with pride, not
// pay (see KidModeScreen pocket-money calc).

export interface KidCategory {
  key: string;
  label: string;
  emoji: string;
  mapsTo: CategoryKey;
  missions: string[];
}

export const KID_TAXONOMY: KidCategory[] = [
  { key: 'room', label: 'My Room', emoji: '🛏️', mapsTo: 'cleaning',
    missions: ['Make my bed', 'Put toys away', 'Put books back', 'Dirty clothes in the basket', 'Tidy my desk', 'Put shoes away'] },
  { key: 'kitchen', label: 'Kitchen Help', emoji: '🍽️', mapsTo: 'cooking',
    missions: ['Set the table', 'Clear my plate', 'Help unload the dishwasher', 'Put cups away', 'Help make a snack', 'Wipe the table', 'Fill water bottles'] },
  { key: 'cleaning', label: 'Cleaning', emoji: '🧹', mapsTo: 'cleaning',
    missions: ['Wipe surfaces', 'Sweep a small area', 'Dust shelves', 'Help vacuum', 'Clean up a spill', 'Put rubbish in the bin', 'Help sort recycling'] },
  { key: 'laundry', label: 'Laundry', emoji: '🧺', mapsTo: 'laundry',
    missions: ['Clothes in the laundry basket', 'Match socks', 'Fold simple clothes', 'Put folded clothes away', 'Hang my towel up', 'Bring laundry to the wash'] },
  { key: 'pets', label: 'Pet Care', emoji: '🐾', mapsTo: 'pets',
    missions: ['Fill the water bowl', 'Help feed the pet', 'Brush the pet', 'Walk the dog (with an adult)', 'Clean pet toys', 'Tidy the pet area'] },
  { key: 'school', label: 'School Bag', emoji: '🎒', mapsTo: 'child_logistics',
    missions: ['Pack my school bag', 'Prepare my PE kit', 'Homework in my folder', 'Charge my school device', 'Prepare my lunchbox', 'Put my uniform ready', 'Remember my library book'] },
  { key: 'family', label: 'Family Help', emoji: '🤝', mapsTo: 'emotional',
    missions: ['Help a younger sibling', 'Bring something for a parent', 'Carry light groceries', 'Hold the door', 'Help set up an activity', 'Share toys or games', 'Help someone who is tired'] },
  { key: 'kindness', label: 'Kindness', emoji: '💛', mapsTo: 'emotional',
    missions: ['Comforted someone', 'Said thank you', 'Helped without being asked', 'Shared kindly', 'Said sorry properly', 'Cheered someone up', 'Let someone choose first'] },
];

export const kidCatByKey = (key: string): KidCategory | undefined =>
  KID_TAXONOMY.find((c) => c.key === key);

// Universal default missions every kid starts with (pets added only if the
// household logs pet care). Each references a taxonomy mission + its adult map.
export const DEFAULT_STARTERS: { title: string; mapsTo: CategoryKey }[] = [
  { title: 'Make my bed', mapsTo: 'cleaning' },
  { title: 'Clear my plate', mapsTo: 'cooking' },
  { title: 'Tidy my room', mapsTo: 'cleaning' },
  { title: 'Clothes in the laundry basket', mapsTo: 'laundry' },
];
export const PET_STARTER = { title: 'Help feed the pet', mapsTo: 'pets' as CategoryKey };
