'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/use-store';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Bell, Search, User, CheckCheck, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user, notifications, markNotificationRead, markAllNotificationsRead, toggleSidebar } = useStore();
  const [bellOpen, setBellOpen] = useState(false);

  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getPageTitle = () => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return 'Overview';
    
    // Capitalize parts
    const title = parts[parts.length - 1];
    return title.charAt(0).toUpperCase() + title.slice(1).replace('-', ' ');
  };

  // Open search command palette event
  const triggerSearch = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('qevn-toggle-search'));
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-purple-500/20 text-purple-300';
      case 'reminder': return 'bg-amber-500/20 text-amber-300';
      case 'followup': return 'bg-red-500/20 text-red-300';
      case 'email': return 'bg-blue-500/20 text-blue-300';
      default: return 'bg-emerald-500/20 text-emerald-300';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/20 px-6 backdrop-blur-md bg-background/55">
      {/* Page Title & Mobile Sidebar toggle */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary/60 hover:text-foreground focus:outline-none cursor-pointer transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-md font-semibold text-foreground tracking-tight">{getPageTitle()}</h1>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-4">
        {/* Search Trigger */}
        <button
          onClick={triggerSearch}
          className="flex h-9 w-48 items-center justify-between rounded-lg border border-border/40 bg-secondary/35 px-3 py-1.5 text-xs text-muted-foreground hover:border-border transition-colors cursor-pointer"
        >
          <span className="flex items-center">
            <Search className="mr-2 h-3.5 w-3.5" />
            Search...
          </span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border/60 bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        {/* Notifications Dropdown */}
        <DropdownMenu
          trigger={
            <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary/60 hover:text-foreground focus:outline-none cursor-pointer transition-colors">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </button>
          }
        >
          <div className="w-80 p-2">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/20 mb-2">
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  className="flex items-center text-xs text-primary hover:underline cursor-pointer"
                >
                  <CheckCheck className="mr-1 h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1">
              {notifications.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-6">No new notifications</p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markNotificationRead(notif.id)}
                    className={`flex items-start p-2 rounded-lg cursor-pointer transition-colors hover:bg-secondary/40 ${
                      !notif.read ? 'bg-secondary/20' : 'opacity-70'
                    }`}
                  >
                    <div className={`mt-0.5 rounded-full p-1 mr-2 ${getNotificationColor(notif.type)}`}>
                      <Bell className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{notif.title}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{notif.message}</p>
                      <span className="text-[9px] text-muted-foreground/60 mt-1 block">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DropdownMenu>

        {/* User Profile */}
        <div className="flex items-center space-x-3 pl-2 border-l border-border/20">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold text-foreground">{user.name}</span>
            <span className="text-[10px] text-muted-foreground capitalize font-medium">{user.role}</span>
          </div>
          {user.profile_image ? (
            <img
              src={user.profile_image}
              alt={user.name}
              className="h-8 w-8 rounded-lg object-cover ring-1 ring-border"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <User className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
