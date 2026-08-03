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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, sidebarOpen, theme } = useStore();

  useEffect(() => {
    // If not logged in, redirect to login
    if (!user) {
      router.push('/login');
    }
    
    // Set theme class on initial mount
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
  }, [user, router, theme]);

  if (!user) return null;

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
