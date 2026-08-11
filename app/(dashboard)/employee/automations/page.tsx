'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/use-store';
import { AutomationRule } from '@/lib/mock-db';
import { Zap, Plus, CheckCircle2, Play, ToggleLeft, ToggleRight, ArrowRight, ShieldCheck } from 'lucide-react';
import { showToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function AutomationsPage() {
  const { user } = useStore();
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: 'r1',
      name: 'Deal Won → Auto Onboarding Project & Invoice Generation',
      trigger_event: 'Deal Stage Changed to Won',
      action_type: 'Create Client Project + Generate Contract + Issue Invoice',
      is_active: true,
      execution_count: 14,
      created_at: new Date().toISOString()
    },
    {
      id: 'r2',
      name: 'Qualified Lead → Assign Sales Rep & Schedule Welcome Call Task',
      trigger_event: 'Lead Status Changed to Qualified',
      action_type: 'Assign Rep + Create Task + Send WhatsApp Notification',
      is_active: true,
      execution_count: 38,
      created_at: new Date().toISOString()
    },
    {
      id: 'r3',
      name: 'High Priority Ticket → Notify Support Lead on Slack & Email',
      trigger_event: 'Support Ticket Priority set to Critical',
      action_type: 'Send Resend Email Alert + Escalation Log',
      is_active: true,
      execution_count: 5,
      created_at: new Date().toISOString()
    }
  ]);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => {
      if (r.id === id) {
        const nextState = !r.is_active;
        showToast(nextState ? `Automation "${r.name}" enabled` : `Automation "${r.name}" paused`, 'info');
        return { ...r, is_active: nextState };
      }
      return r;
    }));
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/40 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Business Workflow Automation Engine</h1>
              <p className="text-sm text-muted-foreground">Trigger-Condition-Action automation rules connecting CRM lifecycle events</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold">
          <ShieldCheck className="h-4 w-4" />
          <span>Active Rules: {rules.filter(r => r.is_active).length}</span>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((r) => (
          <div key={r.id} className="bg-card border border-border/40 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">{r.name}</h3>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="bg-secondary/40 text-muted-foreground px-2.5 py-1 rounded-md border border-border/30">
                  Trigger: <strong className="text-foreground">{r.trigger_event}</strong>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md border border-primary/20 font-semibold">
                  Action: {r.action_type}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-xs text-muted-foreground">Executions: <strong>{r.execution_count}</strong></span>
              <button
                onClick={() => toggleRule(r.id)}
                className="cursor-pointer text-primary hover:opacity-80 transition-opacity"
              >
                {r.is_active ? <ToggleRight className="h-8 w-8 text-primary" /> : <ToggleLeft className="h-8 w-8 text-muted-foreground" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
