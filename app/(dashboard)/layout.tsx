'use client';

import React, { useEffect } from 'react';
import { Sidebar } from '@/components/shared/sidebar';
import { Header } from '@/components/shared/header';
import { CommandPalette } from '@/components/shared/cmd-k';
import { ToastContainer } from '@/components/ui/toast';
import { useStore } from '@/lib/store/use-store';
import { useRouter } from 'next/navigation';
import { DialerProvider } from '@/components/dialer/dialer-context';
import { Softphone } from '@/components/dialer/softphone';
import { Loader2 } from 'lucide-react';
import { logAuth, redirectToLogin } from '@/lib/auth/auth-guard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, sidebarOpen, theme, hasHydrated } = useStore();

  useEffect(() => {
    // 1. Hardened Session Redirect
    if (hasHydrated && !user) {
      logAuth('No active user profile in store after hydration. Triggering hard redirect.');
      redirectToLogin('unauthenticated_dashboard_access');

      // Failover timer to force browser navigation if App Router soft navigation stalls
      const failoverTimer = setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          logAuth('Failover timer triggered. Forcing window.location.href');
          window.location.href = '/login';
        }
      }, 300);

      return () => clearTimeout(failoverTimer);
    }

    // 2. Handle Browser Back Button (BFCache restore) after logout
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted && !useStore.getState().user) {
        logAuth('Restored from BFCache without active user session. Redirecting to login.');
        window.location.replace('/login');
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('pageshow', handlePageShow);
    }

    // 3. Set theme class
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
      } else {
        root.classList.add('dark');
        root.classList.remove('light');
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('pageshow', handlePageShow);
      }
    };
  }, [user, hasHydrated, theme]);

  // Loading state during hydration or auth check (Max 1.5s before forced redirect)
  useEffect(() => {
    const maxTimeout = setTimeout(() => {
      if (!useStore.getState().user) {
        logAuth('Max hydration loading timeout reached (1.5s). Forcing redirect to login.');
        redirectToLogin('hydration_timeout');
      }
    }, 1500);

    return () => clearTimeout(maxTimeout);
  }, []);

  if (!hasHydrated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl animate-pulse" />
            <img
              src="/logo.png"
              alt="QEVN Logo"
              className="relative h-14 w-14 rounded-2xl object-contain bg-card p-1.5 shadow-lg border border-border/40"
            />
          </div>
          <div className="flex items-center space-x-2 text-primary font-medium text-sm pt-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{!hasHydrated ? 'Loading CRM session...' : 'Redirecting to login...'}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {!hasHydrated
              ? 'Verifying authentication credentials'
              : 'No active session found. Redirecting to sign in.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <DialerProvider>
      <div className="min-h-screen bg-background">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Pane */}
        <div
          className={`flex flex-col min-h-screen transition-all duration-300 ${
            sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
          }`}
        >
          {/* Header Navigation */}
          <Header />

          {/* Dynamic Route Content */}
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Global Modals, Softphone & Notifications */}
        <CommandPalette />
        <ToastContainer />
        <Softphone />
      </div>
    </DialerProvider>
  );
}

