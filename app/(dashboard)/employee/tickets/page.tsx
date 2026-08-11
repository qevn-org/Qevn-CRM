'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { SupportTicket, Client } from '@/lib/mock-db';
import { Ticket, Plus, CheckCircle2, Clock, AlertTriangle, ShieldAlert, User, Building, Search, Filter } from 'lucide-react';
import { showToast } from '@/components/ui/toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function SupportTicketsPage() {
  const { user } = useStore();
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 't1',
      ticket_number: 'TICK-8021',
      client_id: 'c1',
      employee_id: user?.id || 'usr_emp_1',
      subject: 'WhatsApp API Webhook Latency Issue',
      description: 'Customer reports 45 second delay on incoming automated message callbacks',
      priority: 'Critical',
      status: 'In Progress',
      category: 'Technical',
      sla_deadline: '2026-08-11 18:00',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 't2',
      ticket_number: 'TICK-8022',
      client_id: 'c2',
      employee_id: user?.id || 'usr_emp_1',
      subject: 'Invoice & GST Breakdown Request',
      description: 'Requesting revised tax invoice with company GSTIN details',
      priority: 'Medium',
      status: 'Open',
      category: 'Billing',
      sla_deadline: '2026-08-12 12:00',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<'Technical' | 'Billing' | 'Onboarding' | 'General'>('Technical');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) {
      showToast('Subject is required', 'warning');
      return;
    }

    const ticket: SupportTicket = {
      id: `t_${Date.now()}`,
      ticket_number: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
      client_id: 'c1',
      employee_id: user?.id || 'usr_emp_1',
      subject: newSubject.trim(),
      description: 'New support request submitted from CRM console',
      priority: newPriority,
      status: 'Open',
      category: newCategory,
      sla_deadline: '2026-08-12 18:00',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setTickets(prev => [ticket, ...prev]);
    setNewSubject('');
    showToast(`Support Ticket ${ticket.ticket_number} created!`, 'success');
  };

  const updateTicketStatus = (id: string, newStatus: SupportTicket['status']) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    showToast(`Ticket status updated to ${newStatus}`, 'info');
  };

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/40 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Support & Customer Ticketing</h1>
              <p className="text-sm text-muted-foreground">Manage client support issues, SLA deadlines, and resolution escalation</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold">
            <span>SLA Compliance Rate: 98.4%</span>
          </div>
        </div>
      </div>

      {/* New Ticket Form */}
      <div className="bg-card border border-border/40 p-6 rounded-2xl space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-foreground">Create Support Ticket</h3>
        <form onSubmit={handleCreateTicket} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Ticket Subject / Issue Summary"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            className="md:col-span-2 bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as any)}
            className="bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
          >
            <option value="Technical">Technical Issue</option>
            <option value="Billing">Billing & Invoice</option>
            <option value="Onboarding">Client Onboarding</option>
            <option value="General">General Support</option>
          </select>
          <button
            type="submit"
            className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all cursor-pointer shadow-md shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            <span>Create Ticket</span>
          </button>
        </form>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket #</TableHead>
                <TableHead>Subject & Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>SLA Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-bold text-primary">{t.ticket_number}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{t.subject}</span>
                      <span className="text-[11px] text-muted-foreground">{t.category} • Client Prospect</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      t.priority === 'Critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      t.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {t.priority}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.sla_deadline}</TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'Resolved' ? 'success' : t.status === 'In Progress' ? 'outline' : 'secondary'}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      {t.status !== 'Resolved' && (
                        <Button size="sm" variant="outline" className="text-xs py-1 h-7" onClick={() => updateTicketStatus(t.id, 'Resolved')}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Resolve
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
