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
    const expireStr = '=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    const domain = window.location.hostname;
    
    // Clear cookies across paths and subdomains
    document.cookie = `qevn_user_id${expireStr}`;
    document.cookie = `qevn_role${expireStr}`;
    document.cookie = `qevn_user_id${expireStr}; domain=${domain}`;
    document.cookie = `qevn_role${expireStr}; domain=${domain}`;

    if (domain.includes('.')) {
      const parentDomain = '.' + domain.split('.').slice(-2).join('.');
      document.cookie = `qevn_user_id${expireStr}; domain=${parentDomain}`;
      document.cookie = `qevn_role${expireStr}; domain=${parentDomain}`;
    }
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
