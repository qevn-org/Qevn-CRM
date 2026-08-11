'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { CheckSquare, Calendar, Clock, AlertCircle, Plus, CheckCircle2, Building, User } from 'lucide-react';
import { showToast } from '@/components/ui/toast';

interface CommitmentItem {
  id: string;
  clientName: string;
  companyName: string;
  commitment: string;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Fulfilled' | 'Overdue';
}

export default function MyCommitmentsPage() {
  const { user } = useStore();
  const [commitments, setCommitments] = useState<CommitmentItem[]>([
    { id: 'c1', clientName: 'Rajesh Sharma', companyName: 'Acme Corp India', commitment: 'Deliver customized CRM demo environment with WhatsApp API integration', dueDate: '2026-08-12', status: 'In Progress' },
    { id: 'c2', clientName: 'Ananya Gupta', companyName: 'Nexus Tech Solutions', commitment: 'Send revised commercial pricing proposal with 15% enterprise volume discount', dueDate: '2026-08-11', status: 'Fulfilled' },
    { id: 'c3', clientName: 'Vikram Mehta', companyName: 'Starlight Retail', commitment: 'Schedule technical integration call with CTO & Lead Engineer', dueDate: '2026-08-13', status: 'Pending' }
  ]);

  const [newClient, setNewClient] = useState('');
  const [newCommitment, setNewCommitment] = useState('');
  const [newDate, setNewDate] = useState('2026-08-12');

  const handleAddCommitment = () => {
    if (!newCommitment.trim()) {
      showToast('Please enter commitment details', 'warning');
      return;
    }
    const item: CommitmentItem = {
      id: `c_${Date.now()}`,
      clientName: newClient.trim() || 'Client Prospect',
      companyName: 'QEVN Client',
      commitment: newCommitment.trim(),
      dueDate: newDate,
      status: 'Pending'
    };
    setCommitments(prev => [item, ...prev]);
    setNewClient('');
    setNewCommitment('');
    showToast('Commitment logged!', 'success');
  };

  const toggleStatus = (id: string) => {
    setCommitments(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'Fulfilled' ? 'Pending' : 'Fulfilled';
        showToast(nextStatus === 'Fulfilled' ? 'Commitment marked as Fulfilled!' : 'Commitment status reopened', 'info');
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/40 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">My Client Commitments</h1>
              <p className="text-sm text-muted-foreground">Track promises, deliverable deadlines, and client follow-up commitments</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20 text-xs font-semibold">
          <Clock className="h-4 w-4" />
          <span>Active Commitments: {commitments.filter(c => c.status !== 'Fulfilled').length}</span>
        </div>
      </div>

      {/* Commitment Creation Form */}
      <div className="bg-card border border-border/40 p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-foreground">Log New Client Commitment</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Client / Company Name"
            value={newClient}
            onChange={(e) => setNewClient(e.target.value)}
            className="bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground"
          />
          <input
            type="text"
            placeholder="Commitment Description (e.g. Send revised SLA document)"
            value={newCommitment}
            onChange={(e) => setNewCommitment(e.target.value)}
            className="md:col-span-2 bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground"
          />
          <button
            onClick={handleAddCommitment}
            className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all cursor-pointer shadow-md shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            <span>Add Commitment</span>
          </button>
        </div>
      </div>

      {/* Commitments List */}
      <div className="space-y-3">
        {commitments.map((c) => (
          <div key={c.id} className="bg-card border border-border/40 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start space-x-3">
              <button
                onClick={() => toggleStatus(c.id)}
                className={`p-1 rounded-lg border mt-0.5 cursor-pointer transition-all ${
                  c.status === 'Fulfilled'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-secondary text-muted-foreground border-border/40 hover:text-foreground'
                }`}
              >
                <CheckCircle2 className="h-5 w-5" />
              </button>

              <div>
                <div className="flex items-center space-x-2">
                  <h3 className={`text-base font-bold ${c.status === 'Fulfilled' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {c.commitment}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center space-x-1">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span>{c.clientName} ({c.companyName})</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Due: {c.dueDate}</span>
                  </span>
                </div>
              </div>
            </div>

            <div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                c.status === 'Fulfilled' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                c.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {c.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
