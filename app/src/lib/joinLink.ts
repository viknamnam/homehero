// Join links (#65): one URL, three doors.
//   - Scanned in person with the phone camera -> deep link straight into the app
//   - Tapped in a message -> same deep link
//   - Opened without the app installed -> heronest.app/join web fallback
//     (page shows the code + store links; part of the heronest.app site work)
// The link carries ONLY the invite code — single-use, 48h expiry, 8-member cap
// all enforced server-side, and adults still sign in with their email first.

export const JOIN_BASE = 'https://heronest.app/join/';
export const KID_BASE = 'https://heronest.app/kid/';

export function joinUrlFor(code: string): string {
  return JOIN_BASE + code.trim().toUpperCase();
}

export function kidUrlFor(token: string): string {
  return KID_BASE + token;
}

/** Extract a kid-device token from a kid link (heronest.app/kid/TOKEN or heronest://kid/TOKEN). */
export function kidTokenFromUrl(url: string): string | null {
  const m = url.match(/(?:heronest\.app\/kid\/|heronest:\/\/kid\/?\??token=?)([A-Za-z0-9_-]{8,})/i);
  return m ? m[1] : null;
}

/** Extract an invite code from any incoming URL we recognise. */
export function codeFromUrl(url: string): string | null {
  const m = url.match(/(?:heronest\.app\/join\/|heronest:\/\/join\/?\??code=?)([A-Za-z0-9]{4,12})/i);
  return m ? m[1].toUpperCase() : null;
}
