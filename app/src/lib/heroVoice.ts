// Hero Voice — curated motivation engine (Phase 4, curated-first per gaps #14).
// Fully offline: no API, no key, no network. A library of short, warm lines keyed
// by style and slot, with deterministic daily rotation so the whole household sees
// the same line all day. Default style is "bright" (encouraging + a little witty,
// never sarcastic). Warm and Calm are alternatives in Settings.
//
// Copy rules (build plan §9) apply to every line: no blame, no debt, no scoreboard.
// AI variation of this library is a later step (P4); live LLM is P5. This is the base.

export type HeroStyle = 'bright' | 'warm' | 'calm';

export const HERO_STYLES: { key: HeroStyle; label: string; blurb: string }[] = [
  { key: 'bright', label: 'Bright', blurb: 'Encouraging, a little witty' },
  { key: 'warm', label: 'Warm', blurb: 'Gentle and validating' },
  { key: 'calm', label: 'Calm', blurb: 'Quiet and grounded' },
];

type Slot =
  | 'greetMorning' | 'greetAfternoon' | 'greetEvening'
  | 'teamBanner'      // Home Value appreciation card
  | 'invaluable'      // mental-load note
  | 'thanksWins'      // Thanks "this week's wins" intro
  | 'saved';          // Add Task success

const LIB: Record<Slot, Record<HeroStyle, string[]>> = {
  greetMorning: {
    bright: ['A fresh day for the home team ☀️', 'Morning! Small things add up today.', 'New day, same great team ☀️', 'Here we go — gently does it.'],
    warm: ['Good morning. Whatever you do today counts.', 'Morning — you carry a lot, and it shows.', 'A new morning for your home 💛'],
    calm: ['Morning.', 'A quiet start to the day.', 'Morning — one thing at a time.'],
  },
  greetAfternoon: {
    bright: ['Afternoon — keeping the place humming 🙌', "Halfway through, doing great.", 'Afternoon! Every little bit helps.'],
    warm: ['Good afternoon. Thanks for all you do.', 'Afternoon — the home runs on this.'],
    calm: ['Afternoon.', 'Steady afternoon.', 'Afternoon — no rush.'],
  },
  greetEvening: {
    bright: ['Evening — winding down, well done 🌙', 'That was a team effort today 🌙', 'Evening! The home was well looked after.'],
    warm: ['Good evening. Today mattered.', 'Evening — rest is part of the work too 💛'],
    calm: ['Evening.', 'A calm close to the day 🌙', 'Evening — time to ease off.'],
  },
  teamBanner: {
    bright: ['Look at this team go 💛', "What a team you're building.", 'Teamwork, made visible.', 'Small shifts, big impact 💛'],
    warm: ['Every contribution here counts.', "You're building a more balanced home 💛", 'See the work. Share the load.'],
    calm: ['A picture of this week at home.', 'The week, gently summarised.', 'This week at home.'],
  },
  invaluable: {
    bright: ['Some of this is simply priceless 💛', 'Not everything fits a number — and that\u2019s the good part 💛', 'The unmeasurable bits? Those matter most.'],
    warm: ['Some work can be estimated. Some can only be appreciated 💛', 'The care behind this is beyond value 💛'],
    calm: ['Some of this is simply invaluable.', 'Not all of it has a number — and need not.'],
  },
  thanksWins: {
    bright: ['Look back at the good stuff 💛', 'Wins worth a smile this week.', 'The thank-yous add up 💛'],
    warm: ['Moments worth appreciating this week.', 'Kindness, remembered 💛'],
    calm: ["This week's appreciation.", 'A few good moments.'],
  },
  saved: {
    bright: ['Logged — nice one 💛', 'Got it. That counts!', 'Noted — every bit helps 💛', 'Done. The team thanks you 🙌'],
    warm: ['Logged — thank you 💛', 'Noted. That work is seen.', 'Got it — it all matters 💛'],
    calm: ['Logged.', 'Noted.', 'Saved.'],
  },
};

function dayIndex(): number {
  return Math.floor(Date.now() / 86400000);
}

// Deterministic per-day pick (stable for the whole household all day).
export function heroLine(slot: Slot, style: HeroStyle): string {
  const lines = LIB[slot][style];
  return lines[dayIndex() % lines.length];
}

// Random pick for transient moments (e.g. save toasts), avoids feeling robotic.
export function heroLineRandom(slot: Slot, style: HeroStyle): string {
  const lines = LIB[slot][style];
  return lines[Math.floor(Math.random() * lines.length)];
}

export function heroGreeting(style: HeroStyle): string {
  const h = new Date().getHours();
  const slot: Slot = h < 12 ? 'greetMorning' : h < 18 ? 'greetAfternoon' : 'greetEvening';
  return heroLine(slot, style);
}
