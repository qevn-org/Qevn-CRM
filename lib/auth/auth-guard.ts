/**
 * Auth Guard & Session Validation Utility
 * Structured logging tag: [AUTH_GUARD]
 */

export function logAuth(event: string, details?: any) {
  const timestamp = new Date().toISOString();
  if (details) {
    console.log(`[AUTH_GUARD][${timestamp}] ${event}`, details);
  } else {
    console.log(`[AUTH_GUARD][${timestamp}] ${event}`);
  }
}

/**
 * Checks browser cookies for qevn_user_id or Supabase session tokens
 */
export function getAuthCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )\s*qevn_user_id\s*=\s*([^;]+)/);
  if (match) return decodeURIComponent(match[1]);

  // Check for Supabase auth cookie pattern
  const sbMatch = document.cookie.match(/(?:^|; )\s*sb-[^=]+-auth-token\s*=\s*([^;]+)/);
  if (sbMatch) return 'supabase_session_active';

  return null;
}

/**
 * Forcefully redirects to login page using hard browser navigation
 */
export function redirectToLogin(reason: string = 'unauthenticated') {
  logAuth(`Redirecting to /login due to: ${reason}`);
  if (typeof window !== 'undefined') {
    // Prevent redirect loops if already on auth page
    const pathname = window.location.pathname;
    if (['/login', '/signup', '/forgot-password', '/reset-password'].includes(pathname)) {
      return;
    }
    // Hard replacement prevents lingering loading UI and App Router navigation stalls
    window.location.replace('/login');
  }
}

/**
 * Purges all client session artifacts across cookies, localStorage, and sessionStorage
 */
export function purgeClientSession() {
  logAuth('Purging all client session storage and cookies');
  if (typeof document !== 'undefined') {
    const domain = window.location.hostname;
    const parentDomain = domain.includes('.') ? '.' + domain.split('.').slice(-2).join('.') : domain;

    const cookieNames = ['qevn_user_id', 'qevn_role'];
    
    // Extract any Supabase or session cookies from document.cookie
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0].trim();
      if (name) cookieNames.push(name);
    });

    const uniqueNames = Array.from(new Set(cookieNames));

    const paths = ['/', '/admin', '/employee', '/login'];
    const domains = ['', domain, parentDomain];

    uniqueNames.forEach((name) => {
      paths.forEach((path) => {
        domains.forEach((dom) => {
          let cookieStr = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
          if (dom) {
            cookieStr += `; domain=${dom}`;
          }
          document.cookie = cookieStr;
        });
      });
    });
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('[AUTH_GUARD] Error purging web storage:', e);
    }
  }
}
