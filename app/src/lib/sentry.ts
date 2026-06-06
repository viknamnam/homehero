import * as Sentry from '@sentry/react-native';

// Crash reporting (build plan Sprint 3 🔒 "zero data-loss incidents" needs eyes).
// DSN comes from env so the app runs fine without a Sentry account configured.
// Privacy: errors and stack traces only — sendDefaultPii stays false, and no
// task content, notes, or member names are ever attached (analytics rule §5).
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!dsn) return;
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: 0, // errors only for alpha; performance tracing later
  });
}

/** Capture an exception if reporting is configured; silent no-op otherwise. */
export function captureError(e: unknown) {
  if (!dsn) return;
  Sentry.captureException(e);
}

/** Wrap the root component when reporting is configured. */
export function wrapRoot<T extends React.ComponentType<any>>(App: T): T {
  return dsn ? (Sentry.wrap(App) as T) : App;
}
