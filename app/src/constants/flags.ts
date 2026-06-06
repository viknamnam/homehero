// Phase 2 lives behind flags: the screens are built and shippable, but stay hidden
// until household testing validates the framing (build plan §gate: balance never
// reaches users before testing). Flip to true only when the register says so —
// and Thanks + Home Value flip TOGETHER (appreciation never ships after comparison).
export const FLAGS = {
  thanks: false,
  homeValue: false,
  planTheDay: false,
} as const;
