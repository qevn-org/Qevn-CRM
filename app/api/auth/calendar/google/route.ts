import { NextRequest, NextResponse } from 'next/server';
import {
  buildGoogleAuthUrl,
  createOAuthState,
  getGoogleOAuthRedirectUri,
  GOOGLE_OAUTH_STATE_COOKIE,
} from '@/lib/auth/google-oauth';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const redirectUri = getGoogleOAuthRedirectUri(request);

  if (!clientId) {
    console.log('[OAUTH] Google Client ID missing. Redirecting to mock callback.');
    return NextResponse.redirect(new URL(`${redirectUri}?code=mock_google_code`, request.url));
  }

  const state = createOAuthState();
  const googleAuthUrl = buildGoogleAuthUrl(clientId, redirectUri, state);

  console.log('[OAUTH] Building Google Auth URL with redirect_uri:', redirectUri);

  const response = NextResponse.redirect(googleAuthUrl);
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
