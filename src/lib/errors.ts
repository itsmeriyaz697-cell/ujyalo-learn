/** Friendly, non-technical error messages. Never include secrets or raw provider data. */

const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-email': 'That email address does not look right. Check it and try again.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found': 'We could not find an account with that email. You may need to sign up first.',
  'auth/wrong-password': 'That password is not correct. Try again or reset your password.',
  'auth/invalid-credential': 'Email or password is incorrect. Please check and try again.',
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
  'auth/weak-password': 'Please use a stronger password (at least 6 characters).',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'Network problem. Check your internet connection and try again.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled yet. Please contact support.',
  'auth/popup-closed-by-user': 'Sign-in window was closed before finishing.',
  'auth/popup-blocked': 'Your browser blocked the sign-in window. Allow pop-ups and try again.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/account-exists-with-different-credential':
    'This email is already used with a different sign-in method. Log in with that method instead.',
  'auth/requires-recent-login': 'Please log in again before making this change.',
  'auth/invalid-api-key': 'Firebase is not configured correctly. Please contact the site owner.',
  // Raised by the preflight probe before an account is ever created.
  'app/database-not-ready':
    'This site is not finished setting up its database yet, so accounts cannot be created. ' +
    'Please try again later — no account was created.',
  'app/database-unreachable': 'Could not reach the server. Check your internet connection and try again.',
};

export function friendlyAuthError(error: unknown): string {
  if (typeof error === 'string') return error;
  const code = (error as { code?: string })?.code;
  if (code && AUTH_ERRORS[code]) return AUTH_ERRORS[code];
  // Errors we raised ourselves already carry a message written for students;
  // replacing them with the generic fallback hides the only useful detail.
  if (code?.startsWith('app/')) return (error as Error).message;
  return 'Something went wrong signing in. Please try again.';
}

const API_MESSAGES: Record<string, string> = {
  not_configured:
    'The AI tutor is not connected yet. The site owner needs to configure an AI provider (see README → AI configuration).',
  unauthorized: 'Please log in to use the AI tutor.',
  rate_limited: 'You have reached the current AI usage limit. Please try again later.',
  payload_too_large: 'That message is too long. Please shorten it and try again.',
  invalid_request: 'The request could not be understood. Please reload and try again.',
  provider_unavailable:
    'The AI provider is temporarily unavailable. This is usually temporary — please try again in a moment.',
  provider_auth_error:
    'The AI provider rejected the site owner’s credentials. Please let the site owner know so they can fix the AI configuration.',
  timeout: 'The AI tutor took too long to respond. Try a shorter question or try again.',
  upstream_error: 'The AI service returned an error. Please try again.',
  network: 'You appear to be offline. AI features need an internet connection.',
  aborted: 'Response stopped.',
};

export function friendlyApiError(code?: string, fallback?: string): string {
  if (code && API_MESSAGES[code]) return API_MESSAGES[code];
  if (fallback && fallback.length < 300) return fallback;
  return 'The AI service is unavailable right now. Please try again shortly.';
}

export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}
