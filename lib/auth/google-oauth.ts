import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';

export const GOOGLE_OAUTH_CALLBACK_PATH = '/api/auth/calendar/google/callback';
export const GOOGLE_OAUTH_STATE_COOKIE = 'google_oauth_state';

/**
 * Resolve the Google OAuth redirect URI. The value returned here MUST be
 * registered verbatim in Google Cloud Console → Credentials → OAuth 2.0 Client
 * → Authorized redirect URIs.
 */
export function getGoogleOAuthRedirectUri(request: NextRequest): string {
  const explicit = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (explicit) return explicit;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    return `${appUrl.replace(/\/$/, '')}${GOOGLE_OAUTH_CALLBACK_PATH}`;
  }

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const proto =
    request.headers.get('x-forwarded-proto') ??
    request.nextUrl.protocol.replace(':', '');

  if (host) {
    return `${proto}://${host}${GOOGLE_OAUTH_CALLBACK_PATH}`;
  }

  return `${request.nextUrl.origin}${GOOGLE_OAUTH_CALLBACK_PATH}`;
}

export function createOAuthState(): string {
  return randomBytes(32).toString('hex');
}

export function buildGoogleAuthUrl(clientId: string, redirectUri: string, state: string): string {
  return (
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',
      prompt: 'consent',
      state,
    }).toString()
  );
}
