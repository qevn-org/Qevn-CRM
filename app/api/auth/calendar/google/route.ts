import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';

  // Use the hardcoded env variable — this MUST match exactly what is registered
  // in Google Cloud Console → Credentials → Authorized Redirect URIs
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/calendar/google/callback';

  // If no credentials configured, fallback to mock callback trigger
  if (!clientId) {
    console.log('[OAUTH] Google Client ID missing. Redirecting to mock callback.');
    return NextResponse.redirect(new URL(`${redirectUri}?code=mock_google_code`, request.url));
  }

  console.log('[OAUTH] Building Google Auth URL with redirect_uri:', redirectUri);

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
