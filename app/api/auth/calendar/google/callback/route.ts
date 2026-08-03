import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const isSupabase = !!(supabaseUrl && supabaseAnonKey);

  // 1. Get current logged in employee ID
  let employeeId: string | null = null;

  if (isSupabase) {
    const supabaseServer = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(cookiesToSet) {
          // No-op for read only callbacks
        },
      },
    });
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (user) employeeId = user.id;
  } else {
    const cookie = request.cookies.get('qevn_user_id');
    if (cookie) employeeId = cookie.value;
  }

  if (!employeeId) {
    console.error('[OAUTH ERROR] No employee session found during callback');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Process Code and Exchange
  if (code && code.startsWith('mock_')) {
    // Mock OAuth success flow
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    await db.saveCalendarIntegration({
      employee_id: employeeId,
      provider: 'google',
      access_token: 'mock_google_access_token',
      refresh_token: 'mock_google_refresh_token',
      expires_at: expiresAt
    });

    await db.createActivity({
      employee_id: employeeId,
      action: 'Calendar Connected',
      description: 'Connected Google Calendar via Mock OAuth'
    });

    return NextResponse.redirect(new URL('/employee/settings', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/employee/settings?error=no_code', request.url));
  }

  // Real OAuth Exchange
  try {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
    // Force HTTPS protocol on production domains to guarantee redirect_uri match
    const proto = host.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${proto}://${host}/api/auth/calendar/google/callback`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        code,
        grant_type: 'authorization_code'
      })
    });

    if (res.ok) {
      const tokenData = await res.json();
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

      await db.saveCalendarIntegration({
        employee_id: employeeId,
        provider: 'google',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || undefined,
        expires_at: expiresAt
      });

      await db.createActivity({
        employee_id: employeeId,
        action: 'Calendar Connected',
        description: 'Successfully connected Google Calendar integration'
      });
    } else {
      console.error('[OAUTH ERROR] Failed to exchange token:', await res.text());
      return NextResponse.redirect(new URL('/employee/settings?error=exchange_failed', request.url));
    }
  } catch (err) {
    console.error('[OAUTH ERROR] Google token exchange crashed:', err);
    return NextResponse.redirect(new URL('/employee/settings?error=crash', request.url));
  }

  return NextResponse.redirect(new URL('/employee/settings', request.url));
}
