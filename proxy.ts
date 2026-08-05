import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass public assets and auth API pages to prevent redirects
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const isSupabase = !!(supabaseUrl && supabaseAnonKey);

  // Initialize the response where createServerClient will write updated cookies
  let supabaseResponse = NextResponse.next({
    request,
  });

  let userId: string | null = null;
  let userRole: string | null = null;

  if (isSupabase) {
    try {
      const supabaseServer = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set({ name, value, ...options });
              supabaseResponse.cookies.set({ name, value, ...options });
            });
          },
        },
      });

      const { data: { session } } = await supabaseServer.auth.getSession();
      if (session?.user) {
        userId = session.user.id;
        userRole = session.user.user_metadata?.role || 'employee';
      }
    } catch (e) {
      console.error('[PROXY] Supabase auth session check failed:', e);
    }
  }

  // Fallback to cookie check for demo / mock mode
  if (!userId) {
    const qevnUserId = request.cookies.get('qevn_user_id')?.value;
    const qevnRole = request.cookies.get('qevn_role')?.value;
    if (qevnUserId) {
      userId = qevnUserId;
      userRole = qevnRole || 'employee';
    }
  }

  // Helper to perform redirects while preserving response cookies (critical for session syncing)
  const redirect = (url: string) => {
    const redirectResponse = NextResponse.redirect(new URL(url, request.url));
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        maxAge: cookie.maxAge,
        expires: cookie.expires
      });
    });
    return redirectResponse;
  };

  const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(pathname);

  // If not logged in and trying to access dashboard pages, redirect to login
  if (!userId && !isAuthPage && pathname !== '/') {
    return redirect('/login');
  }

  // If logged in and trying to access auth pages, redirect to dashboard
  if (userId && isAuthPage) {
    const dashboardUrl = userRole === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
    return redirect(dashboardUrl);
  }

  // Enforce Admin RBAC
  if (pathname.startsWith('/admin') && userRole !== 'admin') {
    return redirect('/employee/dashboard');
  }

  // Enforce Employee dashboard restrictions
  if (pathname.startsWith('/employee') && !userId) {
    return redirect('/login');
  }

  // If at root '/' redirect to correct dashboard
  if (pathname === '/') {
    if (userId) {
      const dashboardUrl = userRole === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
      return redirect(dashboardUrl);
    } else {
      return redirect('/login');
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|assets|favicon.ico|api/cron).*)'],
};
