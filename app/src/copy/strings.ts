// UX copy — mirrors Phase0_Copy_Library.md. No user-facing string ships outside this file.
// Banned phrases are linted in CI (see repo README). Keep this file boring and kind.

export const copy = {
  onboarding: {
    welcomeTitle: 'Welcome to HomeHero',
    welcomeSub: 'See the work. Share the load.',
    createHousehold: "Let's set up your home",
    householdHint: 'The Khan family · Flat 7 crew · whatever feels like you',
    yourName: "What's your name?",
    addPartner: 'Add another adult (optional — they can join later by invite)',
    currencyTitle: 'Your currency',
    valueIntro:
      'HomeHero can estimate the value of household work — a way to make invisible effort visible. You can hide it anytime in Settings.',
    startCta: 'Create our home',
    firstTaskPrompt: 'Log your first task — even small things count.',
  },
  today: {
    greetingMorning: (name: string) => `Good morning, ${name} ☀️`,
    greetingAfternoon: (name: string) => `Good afternoon, ${name}`,
    greetingEvening: (name: string) => `Good evening, ${name} 🌙`,
    statTasks: "Today's tasks",
    statTime: 'Time spent',
    statTimeSub: 'so far today',
    statValue: 'Home value today',
    statValueSub: 'created',
    greetingSubs: [
      "Let's see the day together.",
      'Even small things count.',
      'One thing at a time.',
    ],
    affirmTitle: 'Small shifts. Big impact.',
    affirmSub: 'Thanks for showing up for the team.',
    addTaskSub: 'Even a 5-minute task counts',
    emptyToday: 'Nothing logged yet today — even a 5-minute task counts.',
    addTaskCta: 'Add task',
  },
  addTask: {
    screenTitle: 'Add a task',
    whatPrompt: 'What did you do?',
    titleHint: 'Add a detail (optional)',
    durationPrompt: 'How long did it take?',
    custom: 'Custom',
    whoPrompt: 'Who did it?',
    valuePreview: (cur: string, n: number) => `Estimated value: ${cur}${n}`,
    valuePreviewSub: 'Based on your household rates',
    whenPrompt: 'When?',
    dayToday: 'Today',
    dayYesterday: 'Yesterday',
    noteLink: '+ Add a note (just for you)',
    saveCta: 'Add task',
    editTitle: 'Edit task',
    editCta: 'Save changes',
    savedToast: 'Logged 💛',
    savedEdit: 'Updated 💛',
    savedFirstEver: 'First task logged — it all counts from here.',
  },
  comingSoon: {
    homeValueTitle: 'Home Value',
    homeValueBody:
      'See how your family shares the load — by time, category, and value — with a plan-next-week tool. Built as a planning view, never a scoreboard.',
    thanksTitle: 'Thanks',
    thanksBody:
      'One-tap appreciation: send thanks for the work you noticed, and see weekly family wins.',
    togetherNote:
      'These two arrive together in Phase 2 (closed beta) — appreciation always ships alongside comparison, never after it.',
    phaseTag: 'Scheduled: Phase 2 · Weeks 9–14',
  },
  week: {
    header: 'This week at home…',
    heroHours: (h: number, m: number) => `${h}h ${m}m of family work`,
    heroValue: (cur: string, n: number) => `≈ ${cur}${n} estimated value`,
    deltaMore: (x: string) => `${x} more than last week`,
    deltaLess: (x: string) => `${x} less than last week`,
    deltaSame: 'About the same as last week',
    mentalLoadHeader: 'Mental load',
    mentalLoadSub: 'Planning, remembering, and emotional support — real work, often invisible.',
    sparseWeek: 'A quieter week on record — log as much or as little as helps.',
  },
  settings: {
    ratesTitle: 'Hourly rates',
    ratesSub: 'Used to estimate the value of household work. Adjust anytime.',
    hideMoneyLabel: 'Hide money everywhere',
    hideMoneySub:
      "Some families prefer hours only. Value disappears from every screen instantly — your data isn't deleted.",
    currencyTitle: 'Currency',
    membersTitle: 'Household members',
    metricsTitle: 'Logging speed (dev metric)',
    resetCta: 'Reset local data',
    resetConfirm: 'Tap again to confirm — this clears local demo data on this device only.',
  },
  errors: {
    generic: "That didn't go through. Your data is safe — try again in a moment.",
  },
};

export const currencySymbol: Record<string, string> = {
  AED: 'AED ', USD: '$', EUR: '€', GBP: '£',
};
