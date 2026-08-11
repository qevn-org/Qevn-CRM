'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { Target, TrendingUp, CheckCircle2, Award, Calendar, Plus } from 'lucide-react';
import { showToast } from '@/components/ui/toast';

interface GoalItem {
  id: string;
  title: string;
  category: 'Calls' | 'Leads' | 'Meetings' | 'Revenue';
  targetValue: number;
  currentValue: number;
  deadline: string;
}

export default function MyGoalsPage() {
  const { user } = useStore();
  const [goals, setGoals] = useState<GoalItem[]>([
    { id: 'g1', title: 'Monthly Outbound Calls Goal', category: 'Calls', targetValue: 500, currentValue: 340, deadline: '2026-08-31' },
    { id: 'g2', title: 'New Leads Generated', category: 'Leads', targetValue: 50, currentValue: 38, deadline: '2026-08-31' },
    { id: 'g3', title: 'Client Discovery Meetings', category: 'Meetings', targetValue: 20, currentValue: 16, deadline: '2026-08-31' },
    { id: 'g4', title: 'Closed Won Pipeline Revenue', category: 'Revenue', targetValue: 500000, currentValue: 420000, deadline: '2026-08-31' }
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Calls' | 'Leads' | 'Meetings' | 'Revenue'>('Calls');
  const [newTarget, setNewTarget] = useState(100);

  const handleAddGoal = () => {
    if (!newTitle.trim()) {
      showToast('Please enter a goal title', 'warning');
      return;
    }
    const newGoal: GoalItem = {
      id: `g_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      targetValue: newTarget,
      currentValue: 0,
      deadline: '2026-08-31'
    };
    setGoals(prev => [...prev, newGoal]);
    setNewTitle('');
    showToast('New goal created!', 'success');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/40 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">My Monthly Performance Goals</h1>
              <p className="text-sm text-muted-foreground">Track call targets, lead generation benchmarks, and revenue milestones</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-semibold">
          <Award className="h-4 w-4" />
          <span>Overall Target Progress: 82%</span>
        </div>
      </div>

      {/* Goal Creation Bar */}
      <div className="bg-card border border-border/40 p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-foreground">Set New Performance Goal</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Goal Title (e.g. 50 Outbound Dials/Week)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="md:col-span-2 bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as any)}
            className="bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground"
          >
            <option value="Calls">Calls Goal</option>
            <option value="Leads">Leads Goal</option>
            <option value="Meetings">Meetings Goal</option>
            <option value="Revenue">Revenue Goal (₹)</option>
          </select>
          <button
            onClick={handleAddGoal}
            className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all cursor-pointer shadow-md shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            <span>Create Goal</span>
          </button>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
          return (
            <div key={goal.id} className="bg-card border border-border/40 p-6 rounded-2xl space-y-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {goal.category}
                  </span>
                  <h3 className="text-base font-bold text-foreground mt-2">{goal.title}</h3>
                </div>
                <span className="text-xl font-extrabold text-foreground">{pct}%</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Current: {goal.category === 'Revenue' ? `₹${goal.currentValue.toLocaleString()}` : goal.currentValue}</span>
                  <span>Target: {goal.category === 'Revenue' ? `₹${goal.targetValue.toLocaleString()}` : goal.targetValue}</span>
                </div>
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border/20">
                <span className="flex items-center space-x-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Target Date: {goal.deadline}</span>
                </span>
                <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>On Track</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
