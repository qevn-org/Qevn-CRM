'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { showToast } from '@/components/ui/toast';
import { logAuth, redirectToLogin } from '@/lib/auth/auth-guard';
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  Calendar,
  PhoneCall,
  Settings,
  LogOut,
  Sun,
  Moon,
  Shield,
  Activity,
  FileText,
  CheckSquare,
  BarChart3,
  Target,
  Ticket,
  DollarSign,
  Zap,
  Menu,
  X
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, sidebarOpen, toggleSidebar, theme, setTheme } = useStore();

  const handleLogout = async () => {
    logAuth('User clicked Sign Out button');
    try {
      await db.logout();
    } catch (e) {
      console.error('[AUTH_LOGOUT] Exception in db.logout():', e);
    }
    
    setUser(null);
    showToast('Logged out successfully', 'success');
    redirectToLogin('user_explicit_logout');
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const employeeLinks = [
    { name: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
    { name: 'Clients', href: '/employee/clients', icon: Users },
    { name: 'Pipeline', href: '/employee/pipeline', icon: KanbanSquare },
    { name: 'Meetings', href: '/employee/meetings', icon: Calendar },
    { name: 'Dialer', href: '/employee/dialer', icon: PhoneCall },
    { name: 'Call History', href: '/employee/calls', icon: Activity },
    { name: 'Support Tickets', href: '/employee/tickets', icon: Ticket },
    { name: 'Projects', href: '/employee/projects', icon: KanbanSquare },
    { name: 'Finance & Invoices', href: '/employee/finance', icon: DollarSign },
    { name: 'Automations', href: '/employee/automations', icon: Zap },
    { name: 'My EOD', href: '/employee/eod', icon: FileText },
    { name: 'EOD History', href: '/employee/eod/history', icon: CheckSquare },
    { name: 'My Performance', href: '/employee/eod/performance', icon: BarChart3 },
    { name: 'My Goals', href: '/employee/eod/goals', icon: Target },
    { name: 'My Commitments', href: '/employee/eod/commitments', icon: CheckSquare },
    { name: 'Settings', href: '/employee/settings', icon: Settings },
  ];

  const adminLinks = [
    { name: 'Admin Dashboard', href: '/admin/dashboard', icon: Shield },
    { name: 'EOD Dashboard', href: '/admin/eod', icon: FileText },
    { name: 'Employees', href: '/admin/employees', icon: Users },
    { name: 'Activity Log', href: '/admin/activities', icon: Activity },
  ];

  const activeLink = (href: string) => {
    return pathname.startsWith(href)
      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
      : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground';
  };

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-border/40 bg-card transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      } glass`}
    >
      {/* Sidebar Header */}
      <div className={`flex h-16 items-center px-4 border-b border-border/20 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
        <Link href="/" className="flex items-center space-x-2">
          <img 
            src="/logo.png" 
            alt="QEVN Logo" 
            className="h-8 w-8 rounded-lg object-contain bg-white p-0.5 shadow-md shadow-primary/10"
          />
          {sidebarOpen && (
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
              QEVN CRM
            </span>
          )}
        </Link>
        {sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary/60 hover:text-foreground focus:outline-none cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
        {/* Employee Section */}
        <div className="space-y-1">
          {sidebarOpen && (
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">
              Workspace
            </p>
          )}
          {employeeLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${activeLink(
                link.href
              )}`}
            >
              <link.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="ml-3 truncate">{link.name}</span>}
            </Link>
          ))}
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-8 space-y-1">
            {sidebarOpen && (
              <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">
                Administration
              </p>
            )}
            {adminLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${activeLink(
                  link.href
                )}`}
              >
                <link.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="ml-3 truncate">{link.name}</span>}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-border/20 space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all duration-200 cursor-pointer"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="ml-3">Light Mode</span>}
            </>
          ) : (
            <>
              <Moon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="ml-3">Dark Mode</span>}
            </>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950/25 hover:text-red-300 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {sidebarOpen && <span className="ml-3">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
