'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/use-store';
import { CRMProject } from '@/lib/mock-db';
import { KanbanSquare, Plus, CheckCircle2, Clock, Calendar, Building, User, Target } from 'lucide-react';
import { showToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function ProjectsPage() {
  const { user } = useStore();
  const [projects, setProjects] = useState<CRMProject[]>([
    {
      id: 'p1',
      project_name: 'Nexus Enterprise CRM Onboarding & Twilio Setup',
      client_id: 'c1',
      employee_id: user?.id || 'usr_emp_1',
      status: 'In Progress',
      progress: 65,
      budget: 150000,
      due_date: '2026-08-25',
      description: 'Configure custom pipeline stages, import 10k contacts, setup Twilio Voice Webhook & SIP trunk',
      created_at: new Date().toISOString()
    },
    {
      id: 'p2',
      project_name: 'Starlight Retail WhatsApp API Integration',
      client_id: 'c2',
      employee_id: user?.id || 'usr_emp_1',
      status: 'Planning',
      progress: 20,
      budget: 85000,
      due_date: '2026-08-30',
      description: 'Meta Business verification, template approval, automated abandoned cart notification bot',
      created_at: new Date().toISOString()
    }
  ]);

  const [newProjectName, setNewProjectName] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newDueDate, setNewDueDate] = useState('2026-08-28');

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      showToast('Project name is required', 'warning');
      return;
    }

    const proj: CRMProject = {
      id: `p_${Date.now()}`,
      project_name: newProjectName.trim(),
      client_id: 'c1',
      employee_id: user?.id || 'usr_emp_1',
      status: 'In Progress',
      progress: 10,
      budget: Number(newBudget) || 50000,
      due_date: newDueDate,
      description: 'Client onboarding deliverable project',
      created_at: new Date().toISOString()
    };

    setProjects(prev => [proj, ...prev]);
    setNewProjectName('');
    setNewBudget('');
    showToast('Client project created successfully!', 'success');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/40 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <KanbanSquare className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Client Projects & Deliverables</h1>
              <p className="text-sm text-muted-foreground">Post-sale client onboarding, milestone tracking, and project delivery</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20 text-xs font-semibold">
          <Clock className="h-4 w-4" />
          <span>Active Projects: {projects.filter(p => p.status === 'In Progress').length}</span>
        </div>
      </div>

      {/* Project Creation Form */}
      <div className="bg-card border border-border/40 p-6 rounded-2xl space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-foreground">Launch New Onboarding Project</h3>
        <form onSubmit={handleCreateProject} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Project Title (e.g. Acme CRM Setup)"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="md:col-span-2 bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
          />
          <input
            type="number"
            placeholder="Contract Budget (₹)"
            value={newBudget}
            onChange={(e) => setNewBudget(e.target.value)}
            className="bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all cursor-pointer shadow-md shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            <span>Launch Project</span>
          </button>
        </form>
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 gap-4">
        {projects.map((p) => (
          <div key={p.id} className="bg-card border border-border/40 p-6 rounded-2xl space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider block">Client Onboarding</span>
                <h3 className="text-lg font-bold text-foreground">{p.project_name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-emerald-400">Budget: ₹{p.budget?.toLocaleString()}</span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {p.status}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-2 border-t border-border/20">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Milestone Progress</span>
                <span className="text-primary">{p.progress}% Completed</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${p.progress}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
