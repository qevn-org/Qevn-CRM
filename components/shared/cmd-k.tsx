'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { Client } from '@/lib/mock-db';
import { Search, User, KanbanSquare, Calendar, Plus, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CommandPalette: React.FC = () => {
  const router = useRouter();
  const { user } = useStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    const handleToggleEvent = () => setOpen((prev) => !prev);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('qevn-toggle-search', handleToggleEvent);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('qevn-toggle-search', handleToggleEvent);
    };
  }, []);

  // Fetch clients for search reference when opened
  useEffect(() => {
    const fetchSearchData = async () => {
      if (open && user) {
        const list = await db.getClients(user.id, user.role);
        setClients(list);
      }
    };
    fetchSearchData();
  }, [open, user]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
  }, [open]);

  if (!open || !user) return null;

  const filteredClients = query === ''
    ? []
    : clients.filter((c) => {
        const text = `${c.client_name} ${c.company_name} ${c.industry || ''} ${c.status} ${c.priority}`.toLowerCase();
        return text.includes(query.toLowerCase());
      }).slice(0, 5);

  const navigateTo = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const quickActions = [
    { name: 'Schedule New Meeting', icon: Calendar, action: () => navigateTo('/employee/meetings') },
    { name: 'Add New Client', icon: Plus, action: () => navigateTo('/employee/clients?add=true') },
    { name: 'View Kanban Pipeline', icon: KanbanSquare, action: () => navigateTo('/employee/pipeline') },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh]">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        />

        {/* Search Modal */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="relative z-50 w-full max-w-lg overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xl glass"
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-border/20 px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground mr-3 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search clients, industries, or quick commands..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder-muted-foreground"
            />
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {/* Search Results */}
            {query !== '' && (
              <div className="mb-4">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1.5">
                  Clients Matches
                </p>
                {filteredClients.length === 0 ? (
                  <p className="px-3 text-xs text-muted-foreground py-2">No matching clients found.</p>
                ) : (
                  filteredClients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => navigateTo(`/employee/clients/${c.id}`)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs hover:bg-secondary/40 text-left transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{c.client_name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{c.company_name} • {c.industry || 'No Industry'}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] bg-secondary/80 border border-border px-1.5 py-0.5 rounded uppercase font-bold text-muted-foreground">
                          {c.status}
                        </span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground/45" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Quick Actions / Commands */}
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1.5">
                Quick Shortcuts
              </p>
              <div className="space-y-0.5">
                {quickActions.map((act) => (
                  <button
                    key={act.name}
                    onClick={act.action}
                    className="flex w-full items-center rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/40 text-left transition-all duration-150 cursor-pointer"
                  >
                    <act.icon className="h-4 w-4 mr-3 text-muted-foreground/75" />
                    <span>{act.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-secondary/20 px-4 py-2 border-t border-border/10 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Use ↑↓ to navigate, Enter to select</span>
            <span>Esc to close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
