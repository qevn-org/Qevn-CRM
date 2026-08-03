import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createServerClient } from '@supabase/ssr';
import {
  getGoogleOAuthRedirectUri,
  GOOGLE_OAUTH_STATE_COOKIE,
} from '@/lib/auth/google-oauth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error');

  if (oauthError) {
    console.error('[OAUTH ERROR] Google returned error:', oauthError, searchParams.get('error_description'));
    return NextResponse.redirect(
      new URL(`/employee/settings?error=${encodeURIComponent(oauthError)}`, request.url)
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const isSupabase = !!(supabaseUrl && supabaseAnonKey);

  let employeeId: string | null = null;

  if (isSupabase) {
    try {
      const supabaseServer = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
          },
          setAll() {
            // No-op for read-only callbacks
          },
        },
      });
      const { data: { user } } = await supabaseServer.auth.getUser();
      if (user) employeeId = user.id;
    } catch (e) {
      console.error('[OAUTH] Failed to get user from Supabase session:', e);
    }
  }

  if (!employeeId) {
    const cookie = request.cookies.get('qevn_user_id');
    if (cookie) employeeId = cookie.value;
  }

  if (!employeeId) {
    console.error('[OAUTH ERROR] No employee session found during callback');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (code && code.startsWith('mock_')) {
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    await db.saveCalendarIntegration({
      employee_id: employeeId,
      provider: 'google',
      access_token: 'mock_google_access_token',
      refresh_token: 'mock_google_refresh_token',
      expires_at: expiresAt,
    });

    await db.createActivity({
      employee_id: employeeId,
      action: 'Calendar Connected',
      description: 'Connected Google Calendar via Mock OAuth',
    });

    return NextResponse.redirect(new URL('/employee/settings', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/employee/settings?error=no_code', request.url));
  }

  const savedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  if (savedState && state !== savedState) {
    console.error('[OAUTH ERROR] OAuth state mismatch — possible CSRF attempt');
    return NextResponse.redirect(new URL('/employee/settings?error=state_mismatch', request.url));
  }

  const redirectUri = getGoogleOAuthRedirectUri(request);
  console.log('[OAUTH CALLBACK] Exchanging code with redirect_uri:', redirectUri);

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        code,
        grant_type: 'authorization_code',
      }),
    });

    const clearStateCookie = (response: NextResponse) => {
      response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, '', { maxAge: 0, path: '/' });
      return response;
    };

    if (res.ok) {
      const tokenData = await res.json();
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

      await db.saveCalendarIntegration({
        employee_id: employeeId,
        provider: 'google',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || undefined,
        expires_at: expiresAt,
      });

      await db.createActivity({
        employee_id: employeeId,
        action: 'Calendar Connected',
        description: 'Successfully connected Google Calendar integration',
      });

      return clearStateCookie(NextResponse.redirect(new URL('/employee/settings?connected=google', request.url)));
    }

    const errorBody = await res.text();
    console.error('[OAUTH ERROR] Failed to exchange token:', errorBody);
    return clearStateCookie(
      NextResponse.redirect(new URL('/employee/settings?error=exchange_failed', request.url))
    );
  } catch (err) {
    console.error('[OAUTH ERROR] Google token exchange crashed:', err);
    return NextResponse.redirect(new URL('/employee/settings?error=crash', request.url));
  }
}
