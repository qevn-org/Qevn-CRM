'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { EODReport, EODWorkItem, Client } from '@/lib/mock-db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { showToast } from '@/components/ui/toast';
import {
  FileText,
  Sparkles,
  Save,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HelpCircle,
  BarChart2,
  Calendar,
  User,
  Building,
  Link as LinkIcon,
  ArrowRight
} from 'lucide-react';

export default function MyEODPage() {
  const { user } = useStore();
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  // Form State
  const [primaryObjective, setPrimaryObjective] = useState('');
  const [dayStatus, setDayStatus] = useState<'Productive' | 'Partially Productive' | 'Blocked'>('Productive');
  const [overallProgress, setOverallProgress] = useState(80);
  const [biggestAchievement, setBiggestAchievement] = useState('');
  const [importantWork, setImportantWork] = useState('');
  const [hasBlockers, setHasBlockers] = useState(false);
  const [blockerType, setBlockerType] = useState('Technical');
  const [blockerDescription, setBlockerDescription] = useState('');
  const [needsHelp, setNeedsHelp] = useState(false);
  const [helpDetails, setHelpDetails] = useState('');
  const [learnings, setLearnings] = useState('');
  const [tomorrow1, setTomorrow1] = useState('');
  const [tomorrow2, setTomorrow2] = useState('');
  const [tomorrow3, setTomorrow3] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Submitted' | 'Approved' | 'Changes Requested'>('Draft');
  const [managerFeedback, setManagerFeedback] = useState('');

  // Work Items
  const [workItems, setWorkItems] = useState<Array<Omit<EODWorkItem, 'id' | 'eod_report_id' | 'created_at'>>>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemProject, setNewItemProject] = useState('');
  const [newItemTime, setNewItemTime] = useState(30);
  const [newItemPriority, setNewItemPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newItemStatus, setNewItemStatus] = useState<'Completed' | 'In Progress' | 'Blocked' | 'Cancelled'>('Completed');

  // Deterministic CRM Activity Summary
  const [crmSummary, setCrmSummary] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadReportData();
      db.getClients(user.id, user.role).then(setClients).catch(console.error);
    }
  }, [user, reportDate]);

  const loadReportData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const summary = await db.getDailyCRMActivity(user.id, reportDate);
      setCrmSummary(summary);

      const existing = await db.getEODReport(user.id, reportDate);
      if (existing) {
        setPrimaryObjective(existing.primary_objective || '');
        setDayStatus(existing.day_status || 'Productive');
        setOverallProgress(existing.overall_progress ?? 80);
        setBiggestAchievement(existing.biggest_achievement || '');
        setImportantWork(existing.important_work || '');
        setHasBlockers(existing.has_blockers || false);
        setBlockerType(existing.blocker_type || 'Technical');
        setBlockerDescription(existing.blocker_description || '');
        setNeedsHelp(existing.needs_help || false);
        setHelpDetails(existing.help_details || '');
        setLearnings(existing.learnings || '');
        setTomorrow1(existing.tomorrow_priority_1 || '');
        setTomorrow2(existing.tomorrow_priority_2 || '');
        setTomorrow3(existing.tomorrow_priority_3 || '');
        setStatus(existing.status as any || 'Draft');
        setManagerFeedback(existing.manager_feedback || '');

        if (existing.work_items && existing.work_items.length > 0) {
          setWorkItems(existing.work_items.map(w => ({
            task_name: w.task_name,
            description: w.description || '',
            project: w.project || '',
            client_id: w.client_id || '',
            priority: w.priority || 'Medium',
            status: w.status || 'Completed',
            time_spent_minutes: w.time_spent_minutes || 0,
            reference_link: w.reference_link || ''
          })));
        }
      } else {
        // Reset defaults for new date
        setPrimaryObjective('');
        setDayStatus('Productive');
        setOverallProgress(80);
        setBiggestAchievement('');
        setImportantWork('');
        setHasBlockers(false);
        setNeedsHelp(false);
        setLearnings('');
        setTomorrow1('');
        setTomorrow2('');
        setTomorrow3('');
        setStatus('Draft');
        setManagerFeedback('');
        setWorkItems([]);
      }
    } catch (err) {
      console.error('Error loading EOD report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Deterministic EOD Content Generator from real CRM activity
  const handleAutoGenerateEOD = () => {
    if (!crmSummary) return;

    const parts = [];
    if (crmSummary.calls_made > 0) {
      parts.push(`Initiated ${crmSummary.calls_made} phone calls (${crmSummary.connected_calls} connected, ${Math.round(crmSummary.total_call_duration / 60)} mins call time).`);
    }
    if (crmSummary.leads_created > 0) {
      parts.push(`Created ${crmSummary.leads_created} new leads in CRM.`);
    }
    if (crmSummary.leads_contacted > 0) {
      parts.push(`Contacted and moved ${crmSummary.leads_contacted} leads forward.`);
    }
    if (crmSummary.meetings_scheduled > 0 || crmSummary.meetings_completed > 0) {
      parts.push(`Attended/scheduled ${crmSummary.meetings_scheduled + crmSummary.meetings_completed} client meetings.`);
    }

    const generatedAchieve = parts.length > 0
      ? `Today's CRM Execution:\n- ${parts.join('\n- ')}`
      : 'Executed routine CRM client follow-ups and pipeline management.';

    setBiggestAchievement(generatedAchieve);
    setImportantWork(`Maintained active outreach and updated CRM activity timelines for ${crmSummary.activities_count} client touchpoints.`);
    if (!primaryObjective) {
      setPrimaryObjective(`Complete client follow-ups, maintain high call volume, and advance active pipeline opportunities.`);
    }

    showToast('Draft content auto-generated from real CRM activity!', 'success');
  };

  const handleAddWorkItem = () => {
    if (!newItemName.trim()) {
      showToast('Please enter a task name', 'warning');
      return;
    }
    setWorkItems(prev => [
      ...prev,
      {
        task_name: newItemName.trim(),
        project: newItemProject.trim(),
        time_spent_minutes: newItemTime,
        priority: newItemPriority,
        status: newItemStatus
      }
    ]);
    setNewItemName('');
    setNewItemProject('');
    showToast('Work item added', 'info');
  };

  const handleRemoveWorkItem = (index: number) => {
    setWorkItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (submitStatus: 'Draft' | 'Submitted') => {
    if (!user) return;
    setIsSaving(true);
    try {
      const payload: Omit<EODReport, 'id' | 'created_at' | 'updated_at' | 'work_items'> = {
        employee_id: user.id,
        report_date: reportDate,
        primary_objective: primaryObjective,
        day_status: dayStatus,
        overall_progress: overallProgress,
        biggest_achievement: biggestAchievement,
        important_work: importantWork,
        has_blockers: hasBlockers,
        blocker_type: hasBlockers ? blockerType : undefined,
        blocker_description: hasBlockers ? blockerDescription : undefined,
        needs_help: needsHelp,
        help_details: needsHelp ? helpDetails : undefined,
        learnings,
        tomorrow_priority_1: tomorrow1,
        tomorrow_priority_2: tomorrow2,
        tomorrow_priority_3: tomorrow3,
        status: submitStatus,
        submitted_at: submitStatus === 'Submitted' ? new Date().toISOString() : undefined
      };

      const result = await db.saveEODReport(payload, workItems);
      if (result) {
        setStatus(submitStatus);
        showToast(
          submitStatus === 'Submitted' ? 'EOD Report submitted successfully for manager review!' : 'EOD Draft saved!',
          'success'
        );
      } else {
        showToast('Failed to save EOD report', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving report', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/40 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">End of Day (EOD) Report</h1>
              <p className="text-sm text-muted-foreground">Submit your daily execution, metrics, and tomorrow's top priorities</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-secondary/50 px-3 py-1.5 rounded-lg border border-border/30">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer"
            />
          </div>

          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
            status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            status === 'Submitted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            status === 'Changes Requested' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
            'bg-secondary text-muted-foreground border-border/40'
          }`}>
            Status: {status}
          </span>
        </div>
      </div>

      {/* Employee Identity & Metadata Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-secondary/30 border border-border/30 p-4 rounded-xl text-xs">
        <div>
          <span className="text-muted-foreground block">Employee Name:</span>
          <span className="font-bold text-foreground">{user?.name || 'Employee'}</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Department / Role:</span>
          <span className="font-bold text-foreground capitalize">Sales & CRM ({user?.role})</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Reporting Manager:</span>
          <span className="font-bold text-foreground">CRM Administrator</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Submission Deadline:</span>
          <span className="font-bold text-emerald-400">Today @ 7:00 PM IST</span>
        </div>
      </div>

      {/* Planned vs Completed Target Tracker */}
      {crmSummary && (
        <div className="bg-card border border-border/40 p-6 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
              <BarChart2 className="h-4 w-4 text-primary" />
              <span>Planned vs. Completed Execution Benchmark</span>
            </h3>
            <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Target Comparison</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="bg-secondary/30 p-4 rounded-xl border border-border/20 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Outbound Dials</span>
                <span className="font-bold text-primary">
                  {Math.round((crmSummary.calls_made / 40) * 100)}% Achieved
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-foreground">
                <span>Target: 40</span>
                <span>Actual: {crmSummary.calls_made}</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.min(100, Math.round((crmSummary.calls_made / 40) * 100))}%` }}
                />
              </div>
            </div>

            <div className="bg-secondary/30 p-4 rounded-xl border border-border/20 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Connected Calls</span>
                <span className="font-bold text-emerald-400">
                  {Math.round((crmSummary.connected_calls / 15) * 100)}% Achieved
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-foreground">
                <span>Target: 15</span>
                <span>Actual: {crmSummary.connected_calls}</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${Math.min(100, Math.round((crmSummary.connected_calls / 15) * 100))}%` }}
                />
              </div>
            </div>

            <div className="bg-secondary/30 p-4 rounded-xl border border-border/20 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Meetings Completed</span>
                <span className="font-bold text-amber-400">
                  {Math.round((crmSummary.meetings_completed / 2) * 100)}% Achieved
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-foreground">
                <span>Target: 2</span>
                <span>Actual: {crmSummary.meetings_completed}</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${Math.min(100, Math.round((crmSummary.meetings_completed / 2) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manager Feedback Alert if changes requested */}
      {managerFeedback && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-300">Manager Review Feedback</h4>
            <p className="text-xs text-amber-200/90 mt-1">{managerFeedback}</p>
          </div>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-[#101010] lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Main EOD Fields */}
        <div className="lg:col-span-2 space-y-6">

          {/* Auto-Generate Bar */}
          <div className="flex items-center justify-between bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border border-primary/20 p-4 rounded-xl">
            <div className="flex items-center space-x-3">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Auto-Generate from CRM Activity</h3>
                <p className="text-xs text-muted-foreground">Pull actual calls, leads, and meetings logged today</p>
              </div>
            </div>
            <button
              onClick={handleAutoGenerateEOD}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-all cursor-pointer shadow-md shadow-primary/20"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate My EOD</span>
            </button>
          </div>

          {/* Section 1: Daily Overview & Objectives */}
          <div className="bg-card border border-border/40 p-6 rounded-2xl space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center space-x-2">
              <User className="h-4 w-4 text-primary" />
              <span>Daily Overview & Objectives</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Primary Objective Today</label>
                <input
                  type="text"
                  placeholder="e.g. Close 3 pending client follow-ups and complete 40 outbound calls"
                  value={primaryObjective}
                  onChange={(e) => setPrimaryObjective(e.target.value)}
                  className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Day Productivity Status</label>
                <select
                  value={dayStatus}
                  onChange={(e) => setDayStatus(e.target.value as any)}
                  className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Productive">🟢 Productive</option>
                  <option value="Partially Productive">🟡 Partially Productive</option>
                  <option value="Blocked">🔴 Blocked</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-muted-foreground">Overall Goal Completion Progress</label>
                <span className="text-xs font-bold text-primary">{overallProgress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={overallProgress}
                onChange={(e) => setOverallProgress(parseInt(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>
          </div>

          {/* Section 2: Structured Work Items */}
          <div className="bg-card border border-border/40 p-6 rounded-2xl space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Tasks & Work Completed</span>
            </h2>

            {/* Work Item Input Form */}
            <div className="bg-secondary/20 border border-border/30 p-4 rounded-xl space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Task Name (e.g. Proposal deck for Acme Corp)"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="md:col-span-2 bg-background border border-border/40 rounded-lg px-3 py-1.5 text-sm text-foreground"
                />
                <input
                  type="text"
                  placeholder="Project / Category"
                  value={newItemProject}
                  onChange={(e) => setNewItemProject(e.target.value)}
                  className="bg-background border border-border/40 rounded-lg px-3 py-1.5 text-sm text-foreground"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Time (mins):</span>
                    <input
                      type="number"
                      value={newItemTime}
                      onChange={(e) => setNewItemTime(parseInt(e.target.value) || 0)}
                      className="w-16 bg-background border border-border/40 rounded px-2 py-1 text-xs text-foreground"
                    />
                  </div>

                  <select
                    value={newItemPriority}
                    onChange={(e) => setNewItemPriority(e.target.value as any)}
                    className="bg-background border border-border/40 rounded px-2 py-1 text-xs text-foreground"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>

                  <select
                    value={newItemStatus}
                    onChange={(e) => setNewItemStatus(e.target.value as any)}
                    className="bg-background border border-border/40 rounded px-2 py-1 text-xs text-foreground"
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleAddWorkItem}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-medium text-xs transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Work Item</span>
                </button>
              </div>
            </div>

            {/* List of Work Items */}
            <div className="space-y-2 pt-2">
              {workItems.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-4">No structured work items added yet. Add tasks above.</p>
              ) : (
                workItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-secondary/30 border border-border/30 p-3 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className={`h-4 w-4 ${item.status === 'Completed' ? 'text-emerald-400' : 'text-amber-400'}`} />
                      <div>
                        <h4 className="text-sm font-medium text-foreground">{item.task_name}</h4>
                        <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-0.5">
                          {item.project && <span>📁 {item.project}</span>}
                          <span>⏱️ {item.time_spent_minutes} mins</span>
                          <span className="capitalize">⚡ {item.priority}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveWorkItem(idx)}
                      className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 3: Achievements & Key Deliverables */}
          <div className="bg-card border border-border/40 p-6 rounded-2xl space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Achievements & Learnings</span>
            </h2>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Biggest Achievement Today</label>
              <textarea
                rows={3}
                placeholder="Highlight your major win or key output today..."
                value={biggestAchievement}
                onChange={(e) => setBiggestAchievement(e.target.value)}
                className="w-full bg-secondary/35 border border-border/40 rounded-lg p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">What Did You Learn / Key Takeaways?</label>
              <textarea
                rows={2}
                placeholder="New skills, client insights, or process improvements..."
                value={learnings}
                onChange={(e) => setLearnings(e.target.value)}
                className="w-full bg-secondary/35 border border-border/40 rounded-lg p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Section 4: Blockers & Assistance */}
          <div className="bg-card border border-border/40 p-6 rounded-2xl space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>Challenges & Blockers</span>
            </h2>

            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasBlockers}
                  onChange={(e) => setHasBlockers(e.target.checked)}
                  className="rounded accent-primary h-4 w-4"
                />
                <span>Did you face any blockers today?</span>
              </label>

              <label className="flex items-center space-x-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={needsHelp}
                  onChange={(e) => setNeedsHelp(e.target.checked)}
                  className="rounded accent-primary h-4 w-4"
                />
                <span>Do you need manager help?</span>
              </label>
            </div>

            {hasBlockers && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Blocker Type</label>
                  <select
                    value={blockerType}
                    onChange={(e) => setBlockerType(e.target.value)}
                    className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground"
                  >
                    <option value="Technical">Technical / Bug</option>
                    <option value="Client">Client Response Pending</option>
                    <option value="Resource">Resource / Access</option>
                    <option value="Process">Internal Process</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Describe the Blocker</label>
                  <input
                    type="text"
                    placeholder="Details about what is holding back progress..."
                    value={blockerDescription}
                    onChange={(e) => setBlockerDescription(e.target.value)}
                    className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground"
                  />
                </div>
              </div>
            )}

            {needsHelp && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">What Specific Help Do You Need?</label>
                <input
                  type="text"
                  placeholder="e.g. Approval on pricing discount for client proposal..."
                  value={helpDetails}
                  onChange={(e) => setHelpDetails(e.target.value)}
                  className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground"
                />
              </div>
            )}
          </div>

          {/* Section 5: Tomorrow's Top 3 Priorities */}
          <div className="bg-card border border-border/40 p-6 rounded-2xl space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center space-x-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              <span>Tomorrow's Top 3 Priorities</span>
            </h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="1. Highest priority task for tomorrow"
                value={tomorrow1}
                onChange={(e) => setTomorrow1(e.target.value)}
                className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground"
              />
              <input
                type="text"
                placeholder="2. Second priority task"
                value={tomorrow2}
                onChange={(e) => setTomorrow2(e.target.value)}
                className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground"
              />
              <input
                type="text"
                placeholder="3. Third priority task"
                value={tomorrow3}
                onChange={(e) => setTomorrow3(e.target.value)}
                className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Right 1 Column: Real CRM Activity Cards & Action Sidebar */}
        <div className="space-y-6">

          {/* CRM Real Activity Tracker Card */}
          <div className="bg-card border border-border/40 p-6 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                <span>Today's CRM Execution</span>
              </h3>
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Live Metrics</span>
            </div>

            {crmSummary ? (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-secondary/30 p-3 rounded-xl border border-border/20">
                  <span className="text-[10px] text-muted-foreground block uppercase font-medium">Calls Made</span>
                  <span className="text-xl font-extrabold text-foreground">{crmSummary.calls_made}</span>
                  <span className="text-[10px] text-muted-foreground block">{crmSummary.connected_calls} connected</span>
                </div>

                <div className="bg-secondary/30 p-3 rounded-xl border border-border/20">
                  <span className="text-[10px] text-muted-foreground block uppercase font-medium">Call Time</span>
                  <span className="text-xl font-extrabold text-foreground">{Math.round(crmSummary.total_call_duration / 60)} m</span>
                  <span className="text-[10px] text-muted-foreground block">Voice dialer</span>
                </div>

                <div className="bg-secondary/30 p-3 rounded-xl border border-border/20">
                  <span className="text-[10px] text-muted-foreground block uppercase font-medium">Leads Added</span>
                  <span className="text-xl font-extrabold text-foreground">{crmSummary.leads_created}</span>
                  <span className="text-[10px] text-muted-foreground block">New contacts</span>
                </div>

                <div className="bg-secondary/30 p-3 rounded-xl border border-border/20">
                  <span className="text-[10px] text-muted-foreground block uppercase font-medium">Meetings</span>
                  <span className="text-xl font-extrabold text-foreground">{crmSummary.meetings_scheduled + crmSummary.meetings_completed}</span>
                  <span className="text-[10px] text-muted-foreground block">{crmSummary.meetings_completed} completed</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">Loading CRM metrics...</div>
            )}
          </div>

          {/* Submit Actions Box */}
          <div className="bg-card border border-border/40 p-6 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground">Report Actions</h3>
            <p className="text-xs text-muted-foreground">Save as a draft throughout the day, or submit once your workday is finished.</p>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleSave('Draft')}
                disabled={isSaving}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-border/40 hover:bg-secondary/50 text-foreground text-sm font-medium transition-all cursor-pointer"
              >
                <Save className="h-4 w-4 text-muted-foreground" />
                <span>Save Draft</span>
              </button>

              <button
                onClick={() => handleSave('Submitted')}
                disabled={isSaving}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-md shadow-primary/20"
              >
                <Send className="h-4 w-4" />
                <span>Submit EOD Report</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
