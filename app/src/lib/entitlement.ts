// Entitlement logic (#50) — pure + testable, no I/O.
// Trial is anchored to the household's creation time (#52: derived, not a
// resettable local flag). Order of precedence: grandfathered > active sub >
// trial > lapsed.

export type AccessLevel = 'trial' | 'active' | 'lapsed';

export const TRIAL_DAYS = 14;

export function accessLevelFor(input: {
  createdAt?: string | null;
  premiumUntil?: string | null;
  grandfathered?: boolean;
  now?: Date;
}): AccessLevel {
  const now = input.now ?? new Date();
  if (input.grandfathered) return 'active';
  if (input.premiumUntil && new Date(input.premiumUntil) > now) return 'active';
  if (input.createdAt) {
    const ends = new Date(input.createdAt);
    ends.setDate(ends.getDate() + TRIAL_DAYS);
    if (ends > now) return 'trial';
  } else {
    // No cloud household yet (local-only / brand new) — treat as in trial.
    return 'trial';
  }
  return 'lapsed';
}

export function trialDaysLeft(createdAt?: string | null, now: Date = new Date()): number {
  if (!createdAt) return TRIAL_DAYS;
  const ends = new Date(createdAt);
  ends.setDate(ends.getDate() + TRIAL_DAYS);
  return Math.max(0, Math.ceil((ends.getTime() - now.getTime()) / 86400000));
}

/** Writes are blocked only when lapsed. Export is never blocked. */
export function canWrite(level: AccessLevel): boolean {
  return level !== 'lapsed';
}
