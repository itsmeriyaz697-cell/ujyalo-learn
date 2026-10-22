import type { VercelRequest } from '@vercel/node';

/**
 * Firebase ID-token verification using the public Identity Toolkit REST API.
 *
 * This avoids shipping a service-account private key to Vercel. It requires
 * FIREBASE_PROJECT_ID and FIREBASE_WEB_API_KEY (the public web API key),
 * both set as server-side environment variables.
 */
export interface VerifiedUser {
  uid: string;
}

export interface AuthResult {
  user: VerifiedUser | null;
  /** Why the user is unauthenticated (for logs and error mapping). */
  reason: 'ok' | 'no_token' | 'invalid_token' | 'not_configured' | 'verify_failed';
  configured: boolean;
}

function tokenFromRequest(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  const value = Array.isArray(header) ? header[0] : header;
  if (!value?.startsWith('Bearer ')) return null;
  const token = value.slice(7).trim();
  return token || null;
}

export async function verifyFirebaseToken(req: VercelRequest): Promise<AuthResult> {
  const projectId = (process.env.FIREBASE_PROJECT_ID ?? '').trim();
  const apiKey = (process.env.FIREBASE_WEB_API_KEY ?? '').trim();
  const configured = Boolean(projectId && apiKey);

  if (!configured) return { user: null, reason: 'not_configured', configured: false };

  const token = tokenFromRequest(req);
  if (!token) return { user: null, reason: 'no_token', configured: true };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
        signal: controller.signal,
      },
    );
    clearTimeout(timer);
    if (!response.ok) {
      return { user: null, reason: 'invalid_token', configured: true };
    }
    const data = (await response.json()) as { users?: Array<{ localId?: string }> };
    const uid = data.users?.[0]?.localId;
    if (!uid) return { user: null, reason: 'invalid_token', configured: true };
    return { user: { uid }, reason: 'ok', configured: true };
  } catch {
    return { user: null, reason: 'verify_failed', configured: true };
  }
}

/** Constant-time-ish comparison for the admin allowlist. */
export function isAdmin(uid: string | undefined): boolean {
  if (!uid) return false;
  const admins = (process.env.ADMIN_UIDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!admins.length) return false;
  let result = false;
  for (const admin of admins) {
    // Compare lengths and characters without early exit.
    const equal = admin.length === uid.length && [...admin].every((ch, i) => ch === uid[i]);
    result = result || equal;
  }
  return result;
}
