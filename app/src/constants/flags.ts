// Phase 2 lives behind flags: the screens are built and shippable, but stay hidden
// until household testing validates the framing (build plan §gate: balance never
// reaches users before testing). Flip to true only when the register says so —
// and Thanks + Home Value flip TOGETHER (appreciation never ships after comparison).
export const FLAGS = {
  thanks: true,
  homeValue: true,
  planTheDay: true,
  quickLog: true,
  doodles: true, // decorative pastel background marks (Jun 2026 design pass) — kill switch if it reads as noise
  voiceMic: true, // P4b in-app mic — UI also self-gates on native module presence (see lib/speech.ts)
  heroAvatars: true, // illustrated avatar faces (privacy-friendly photo alternative; Kids Mode inherits)
  notifications: true, // #61: thanks-push + weekly digest ONLY (UI auto-hides until the expo-notifications rebuild)
  kidsMode: true, // P3: kid profiles + missions/points/streaks/badges view — avatars only, never money/comparisons
} as const;
