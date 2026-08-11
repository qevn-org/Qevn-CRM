'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { EODReport, CallLog, Client } from '@/lib/mock-db';
import {
  BarChart3,
  TrendingUp,
  PhoneCall,
  Users,
  CheckCircle2,
  Calendar,
  Zap,
  Target
} from 'lucide-react';

export default function MyPerformancePage() {
  const { user } = useStore();
  const [reports, setReports] = useState<EODReport[]>([]);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPerformanceData();
    }
  }, [user]);

  const loadPerformanceData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const eodData = await db.listEODReports({ employeeId: user.id, role: user.role });
      const callData = await db.getCallLogs(user.id, user.role);
      const clientData = await db.getClients(user.id, user.role);

      setReports(eodData);
      setCalls(callData);
      setClients(clientData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalCalls = calls.length;
  const connectedCalls = calls.filter(c => c.status === 'completed').length;
  const totalCallSecs = calls.reduce((acc, c) => acc + (c.duration || 0), 0);

  const productiveDays = reports.filter(r => r.day_status === 'Productive').length;
  const approvedReports = reports.filter(r => r.status === 'Approved').length;
  const avgProgress = reports.length > 0
    ? Math.round(reports.reduce((acc, r) => acc + (r.overall_progress ?? 80), 0) / reports.length)
    : 85;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/40 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">My Performance Analytics</h1>
              <p className="text-sm text-muted-foreground">Aggregated productivity, call execution, and EOD milestone trends</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-semibold">
          <Zap className="h-4 w-4" />
          <span>Performance Rating: Excellent</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-card border border-border/40 p-5 rounded-2xl space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Goal Completion</span>
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div className="text-3xl font-extrabold text-foreground">{avgProgress}%</div>
          <p className="text-xs text-emerald-400 flex items-center space-x-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Consistent daily output</span>
          </p>
        </div>

        <div className="bg-card border border-border/40 p-5 rounded-2xl space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total CRM Calls</span>
            <PhoneCall className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-foreground">{totalCalls}</div>
          <p className="text-xs text-muted-foreground">{connectedCalls} connected ({Math.round(totalCallSecs / 60)} mins)</p>
        </div>

        <div className="bg-card border border-border/40 p-5 rounded-2xl space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Productive Days</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-foreground">{productiveDays}</div>
          <p className="text-xs text-muted-foreground">Out of {reports.length} EOD submissions</p>
        </div>

        <div className="bg-card border border-border/40 p-5 rounded-2xl space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved Reports</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-foreground">{approvedReports}</div>
          <p className="text-xs text-emerald-400">Reviewed by Management</p>
        </div>

      </div>

      {/* Performance Summary Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* EOD Submission Quality */}
        <div className="bg-card border border-border/40 p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>EOD Submission Quality Breakdown</span>
          </h3>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Productive Days Rate</span>
                <span className="font-bold text-foreground">{reports.length > 0 ? Math.round((productiveDays / reports.length) * 100) : 100}%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${reports.length > 0 ? Math.round((productiveDays / reports.length) * 100) : 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Manager Approval Rate</span>
                <span className="font-bold text-foreground">{reports.length > 0 ? Math.round((approvedReports / reports.length) * 100) : 100}%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${reports.length > 0 ? Math.round((approvedReports / reports.length) * 100) : 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CRM Activity Execution */}
        <div className="bg-card border border-border/40 p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-base font-semibold text-foreground flex items-center space-x-2">
            <Users className="h-4 w-4 text-primary" />
            <span>Active Pipeline Ownership</span>
          </h3>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-secondary/30 p-4 rounded-xl border border-border/20">
              <span className="text-xs text-muted-foreground block">Assigned Leads</span>
              <span className="text-2xl font-bold text-foreground">{clients.filter(c => c.status === 'Lead').length}</span>
            </div>

            <div className="bg-secondary/30 p-4 rounded-xl border border-border/20">
              <span className="text-xs text-muted-foreground block">Contacted Prospects</span>
              <span className="text-2xl font-bold text-foreground">{clients.filter(c => c.status === 'Contacted').length}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
