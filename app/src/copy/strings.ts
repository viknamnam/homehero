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
    // Rotating daily lines (deterministic by day, time-of-day aware) — a curated
    // mini-precursor of Hero Voice (Phase 4). Every line passes the Section 9 lint.
    dailyLines: {
      morning: [
        'A new day at home — small things count today.',
        'Morning! One thing at a time, together.',
        'Whatever today brings, it counts here.',
        'Small starts make good days.',
        'A calm start — the little jobs matter too.',
        'Today is a team sport 💛',
      ],
      afternoon: [
        'Midday already — everything so far counted.',
        'A good afternoon for one small thing.',
        'The day is rolling — nice work keeping it going.',
        'Afternoon check-in: it all adds up.',
      ],
      evening: [
        'Evenings count too — gently does it.',
        'Winding down? Whatever got done today mattered.',
        'The quiet end of the day — well held.',
        'Rest is part of running a home, too.',
      ],
    },
    weekSoFarHeader: 'This week so far',
    weekSoFarSub: 'It all adds up 💛',
    weekSoFarCta: 'See your week →',
    affirmTitle: 'Small shifts. Big impact.',
    affirmSub: 'Thanks for showing up for the team.',
    addTaskSub: 'Even a 5-minute task counts',
    emptyToday: 'Nothing logged yet today — even a 5-minute task counts.',
    addTaskCta: 'Add task',
  },
  photo: {
    title: 'Update photo',
    camera: 'Take a photo',
    library: 'Choose from library',
    cancel: 'Cancel',
  },
  addTask: {
    screenTitle: 'Add a task',
    whatPrompt: 'What did you do?',
    titleHint: 'Add a detail (optional)',
    durationPrompt: 'How long did it take?',
    custom: 'Custom',
    whoPrompt: 'Who did it?',
    valuePreview: (cur: string, n: number) => `Estimated value: ${cur}${n}`,
    valueInvaluable: 'Real value: invaluable 💛',
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
    donutHeader: 'Top categories this week',
    donutCenterSub: 'total',
    donutOther: 'Everything else',
    mentalLoadInvaluable: 'Some work can be estimated. Some can only be appreciated 💛',
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
    editPhoto: 'Edit photo',
    metricsTitle: 'Logging speed (dev metric)',
    resetCta: 'Reset local data',
    resetConfirm: 'Tap again to confirm — this clears local demo data on this device only.',
  },
  sync: {
    cardTitle: 'Sync & account',
    introLocal: 'Your data lives on this device. Sign in to back it up and invite your family.',
    emailPrompt: 'Your email',
    sendCode: 'Send sign-in code',
    codeSent: 'Check your email and click the sign-in link — this page will sign in automatically. (If your email shows a 6-digit code, you can enter it below instead.)',
    codePrompt: 'Enter the code',
    verify: 'Sign in',
    uploadPrompt: 'Back up this household and turn on family sync?',
    uploadCta: 'Upload household to cloud',
    inviteTitle: 'Invite your family',
    inviteCta: 'Create invite code',
    inviteShare: (code: string) =>
      `Join our home on HomeHero 💛 Open the app, choose "Join with invite", and enter code: ${code} (valid 7 days)`,
    syncNow: 'Sync now',
    lastSync: (when: string) => `Last synced ${when}`,
    pending: (n: number) => `${n} change${n === 1 ? '' : 's'} waiting to sync — safe and will upload automatically.`,
    allSynced: 'Everything is synced.',
    signOut: 'Sign out',
    joinTitle: 'Join with invite',
    joinIntro: 'Someone set up your home already? Sign in, then enter your invite code.',
    inviteCodePrompt: 'Invite code',
    yourNamePrompt: 'Your name (as your family knows you)',
    joinCta: 'Join household',
    signInTab: 'Sign in / Join',
    createTab: 'Create new home',
  },
  errors: {
    generic: "That didn't go through. Your data is safe — try again in a moment.",
  },
};

export const currencySymbol: Record<string, string> = {
  AED: 'AED ', USD: '$', EUR: '€', GBP: '£',
};

// Deterministic daily greeting line: same line for the whole household all day,
// rotates with the calendar, varies by time of day.
export function dailyLine(): string {
  const h = new Date().getHours();
  const period = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  const lines = copy.today.dailyLines[period];
  const day = Math.floor(Date.now() / 86400000);
  return lines[day % lines.length];
}
