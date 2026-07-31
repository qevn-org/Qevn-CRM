import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile } from '../mock-db';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'meeting' | 'reminder' | 'followup' | 'email' | 'calendar';
  read: boolean;
  timestamp: string;
}

interface AppState {
  user: Profile | null;
  setUser: (user: Profile | null) => void;
  
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id' | 'read' | 'timestamp'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'not_1',
    title: 'Welcome to QEVN CRM',
    message: 'Securely manage your clients, meetings, and integrations here.',
    type: 'calendar',
    read: false,
    timestamp: new Date().toISOString()
  }
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      
      notifications: DEFAULT_NOTIFICATIONS,
      addNotification: (notif) => set((state) => ({
        notifications: [
          {
            ...notif,
            id: `not_${Math.random().toString(36).substr(2, 9)}`,
            read: false,
            timestamp: new Date().toISOString()
          },
          ...state.notifications
        ]
      })),
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) => 
          n.id === id ? { ...n, read: true } : n
        )
      })),
      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true }))
      })),
      
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      theme: 'dark',
      setTheme: (theme) => {
        // Handle side-effects on document elements
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
        set({ theme });
      }
    }),
    {
      name: 'qevn-crm-store',
      partialize: (state) => ({
        user: state.user,
        theme: state.theme,
        notifications: state.notifications
      })
    }
  )
);
