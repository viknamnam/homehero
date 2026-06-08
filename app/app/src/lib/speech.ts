// In-app voice input (P4b) — thin, crash-safe wrapper around expo-speech-recognition.
//
// WHY THE GUARDED require(): the package resolves its NATIVE module at import
// time. The dev build currently on Vik's and Luis's phones predates the module,
// so a static `import` anywhere in the bundle would crash the whole app on
// launch — the exact safe-area-context incident (Gaps #22 lineage) we guard
// against. With the guard:
//   - old build  → require throws → `available` is false → mic button hidden,
//     everything else (typing, keyboard dictation, Quick Log parse) still works
//   - new build  → module present → mic lights up, no code change needed
//
// Recognition runs ON DEVICE via the platform speech service (the same engine
// behind the Samsung keyboard dictation we already validated) — audio never
// touches our servers, no per-use cost. ⚠️ Full feature needs the new dev build.

import type { ExpoSpeechRecognitionModule as SpeechModuleRef } from 'expo-speech-recognition'; // type-only: erased at runtime

type ResultEvent = { isFinal: boolean; results: { transcript: string }[] };
type ErrorEvent = { error: string; message: string };
type Subscription = { remove: () => void };

let mod: typeof SpeechModuleRef | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  mod = require('expo-speech-recognition').ExpoSpeechRecognitionModule;
} catch {
  mod = null; // native module not in this build — mic stays hidden
}

function recognitionAvailable(): boolean {
  if (!mod) return false;
  try {
    return mod.isRecognitionAvailable();
  } catch {
    return false;
  }
}

export const speech = {
  /** True only when the native module is in the build AND the device has a recognizer. */
  available: recognitionAvailable(),

  async requestPermission(): Promise<boolean> {
    if (!mod) return false;
    try {
      const res = await mod.requestPermissionsAsync();
      return res.granted;
    } catch {
      return false;
    }
  },

  /** Start listening; interim results stream through onResult as the person speaks. */
  start() {
    mod?.start({ interimResults: true, continuous: false });
  },

  /** Ask the recognizer to wrap up and deliver a final result (then 'end' fires). */
  stop() {
    mod?.stop();
  },

  abort() {
    mod?.abort();
  },

  onResult(cb: (e: ResultEvent) => void): Subscription {
    if (!mod) return { remove: () => {} };
    return mod.addListener('result', cb);
  },

  onEnd(cb: () => void): Subscription {
    if (!mod) return { remove: () => {} };
    return mod.addListener('end', cb);
  },

  onError(cb: (e: ErrorEvent) => void): Subscription {
    if (!mod) return { remove: () => {} };
    return mod.addListener('error', cb);
  },
};
