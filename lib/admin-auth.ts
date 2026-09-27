// Password check for the private review page (/admin). The browser asks for
// the password with its own login box (HTTP Basic auth, over HTTPS). Runs in
// middleware as well as on the server, so it uses no Node-only APIs.

export const ADMIN_REALM = 'Basic realm="Forum review", charset="UTF-8"';

// Basic auth sends UTF-8 bytes in base64; atob returns them one per char.
const asBytes = (s: string) => String.fromCharCode(...new TextEncoder().encode(s));

/** Compares in time that depends only on the expected value's length. */
function safeEqual(given: string, expected: string) {
  let diff = given.length ^ expected.length;
  for (let i = 0; i < expected.length; i++) diff |= (given.charCodeAt(i) || 0) ^ expected.charCodeAt(i);
  return diff === 0;
}

/**
 * True when the Authorization header carries the admin password. Any
 * username is accepted. With no password set, or one shorter than 12
 * characters, nobody gets in.
 */
export function isAdmin(authorization: string | null, password = process.env.FORUM_ADMIN_PASSWORD): boolean {
  if (!password || password.length < 12 || !authorization?.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = atob(authorization.slice("Basic ".length).trim());
  } catch {
    return false;
  }
  const colon = decoded.indexOf(":");
  if (colon < 0) return false;
  return safeEqual(decoded.slice(colon + 1), asBytes(password));
}
