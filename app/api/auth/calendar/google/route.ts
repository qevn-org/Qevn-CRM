import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/calendar/google/callback`;

  // If no credentials configured, fallback to mock callback trigger
  if (!clientId) {
    console.log('[OAUTH] Google Client ID missing. Redirecting to mock callback.');
    return NextResponse.redirect(new URL(`${redirectUri}?code=mock_google_code`, request.url));
  }

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',
      prompt: 'consent'
    }).toString();

  return NextResponse.redirect(googleAuthUrl);
}
