'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { EODReport } from '@/lib/mock-db';
import { showToast } from '@/components/ui/toast';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  Search,
  Calendar,
  User,
  ThumbsUp,
  RotateCcw,
  BarChart2,
  Filter
} from 'lucide-react';

export default function AdminEODDashboardPage() {
  const { user } = useStore();
  const [reports, setReports] = useState<EODReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedReport, setSelectedReport] = useState<EODReport | null>(null);
  const [managerFeedback, setManagerFeedback] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    if (user) {
      loadTeamReports();
    }
  }, [user]);

  const loadTeamReports = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await db.listEODReports({ role: user.role });
      setReports(data);
    } catch (err) {
      console.error('Error loading team EOD reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewAction = async (newStatus: 'Approved' | 'Changes Requested') => {
    if (!selectedReport || !user) return;
    setIsReviewing(true);
    try {
      const success = await db.reviewEODReport(
        selectedReport.id,
        newStatus,
        managerFeedback.trim(),
        user.id
      );

      if (success) {
        showToast(`EOD Report marked as ${newStatus}!`, 'success');
        setSelectedReport(null);
        setManagerFeedback('');
        loadTeamReports();
      } else {
        showToast('Failed to update report status', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error reviewing report', 'error');
    } finally {
      setIsReviewing(false);
    }
  };

  const filteredReports = reports.filter(r => {
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    return true;
  });

  const pendingCount = reports.filter(r => r.status === 'Submitted' || r.status === 'Under Review').length;
  const approvedCount = reports.filter(r => r.status === 'Approved').length;
  const changesCount = reports.filter(r => r.status === 'Changes Requested').length;

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
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Team EOD Dashboard & Review</h1>
              <p className="text-sm text-muted-foreground">Review employee daily reports, evaluate blockers, and track team performance</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadTeamReports}
            className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 cursor-pointer"
          >
            Refresh Queue
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-card border border-border/40 p-5 rounded-2xl space-y-1 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Reports</span>
          <div className="text-3xl font-extrabold text-foreground">{reports.length}</div>
          <p className="text-xs text-muted-foreground">All team submissions</p>
        </div>

        <div className="bg-card border border-amber-500/30 p-5 rounded-2xl space-y-1 shadow-sm bg-amber-500/5">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Pending Review</span>
          <div className="text-3xl font-extrabold text-amber-300">{pendingCount}</div>
          <p className="text-xs text-amber-400/80">Requires manager action</p>
        </div>

        <div className="bg-card border border-emerald-500/30 p-5 rounded-2xl space-y-1 shadow-sm bg-emerald-500/5">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Approved</span>
          <div className="text-3xl font-extrabold text-emerald-300">{approvedCount}</div>
          <p className="text-xs text-emerald-400/80">Reviewed & confirmed</p>
        </div>

        <div className="bg-card border border-border/40 p-5 rounded-2xl space-y-1 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Changes Requested</span>
          <div className="text-3xl font-extrabold text-foreground">{changesCount}</div>
          <p className="text-xs text-muted-foreground">Feedback sent to employee</p>
        </div>

      </div>

      {/* Filter Bar */}
      <div className="flex items-center space-x-2 border-b border-border/30 pb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Filter Status:</span>
        {['All', 'Submitted', 'Approved', 'Changes Requested', 'Draft'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              statusFilter === st
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Review Queue Table */}
      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-secondary/40 text-xs font-semibold text-muted-foreground uppercase border-b border-border/30">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Day Status</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Blockers</th>
                <th className="px-6 py-4">Review Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-muted-foreground">Loading review queue...</td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-muted-foreground">No EOD reports match the current filter.</td>
                </tr>
              ) : (
                filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground flex items-center space-x-2">
                      <User className="h-4 w-4 text-primary" />
                      <span>{r.employee_name || 'Employee'}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{r.report_date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        r.day_status === 'Productive' ? 'bg-emerald-500/10 text-emerald-400' :
                        r.day_status === 'Partially Productive' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {r.day_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">{r.overall_progress ?? 80}%</td>
                    <td className="px-6 py-4">
                      {r.has_blockers ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          ⚠️ {r.blocker_type || 'Yes'}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                        r.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        r.status === 'Submitted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        r.status === 'Changes Requested' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-secondary text-muted-foreground border-border/40'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedReport(r);
                          setManagerFeedback(r.manager_feedback || '');
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Review EOD</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
          <div className="bg-card border border-border/40 rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-border/30 pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Review EOD Report — {selectedReport.employee_name}</h3>
                <span className="text-xs text-muted-foreground">Report Date: {selectedReport.report_date}</span>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Real CRM Activity Card */}
            {selectedReport.crm_activity_summary && (
              <div className="bg-secondary/30 border border-border/30 p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center space-x-1">
                  <BarChart2 className="h-3.5 w-3.5" />
                  <span>Real CRM Activity Metrics</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div><strong>Calls Made:</strong> {selectedReport.crm_activity_summary.calls_made}</div>
                  <div><strong>Connected Calls:</strong> {selectedReport.crm_activity_summary.connected_calls}</div>
                  <div><strong>Call Duration:</strong> {Math.round(selectedReport.crm_activity_summary.total_call_duration / 60)} mins</div>
                  <div><strong>Leads Created:</strong> {selectedReport.crm_activity_summary.leads_created}</div>
                </div>
              </div>
            )}

            {/* Report Content */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Primary Objective</h4>
                <p className="text-sm text-foreground bg-secondary/20 p-2.5 rounded-lg border border-border/20">{selectedReport.primary_objective || 'N/A'}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Biggest Achievement Today</h4>
                <p className="text-sm text-foreground bg-secondary/20 p-2.5 rounded-lg border border-border/20 whitespace-pre-line">{selectedReport.biggest_achievement || 'N/A'}</p>
              </div>

              {selectedReport.has_blockers && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span>Blocker Encountered: {selectedReport.blocker_type}</span>
                  </h4>
                  <p className="text-xs text-amber-200/90">{selectedReport.blocker_description}</p>
                  {selectedReport.needs_help && (
                    <p className="text-xs font-bold text-red-300 pt-1">Requested Manager Help: {selectedReport.help_details}</p>
                  )}
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Tomorrow's Priorities</h4>
                <ol className="list-decimal list-inside text-sm text-foreground space-y-1 bg-secondary/20 p-2.5 rounded-lg border border-border/20">
                  {selectedReport.tomorrow_priority_1 && <li>{selectedReport.tomorrow_priority_1}</li>}
                  {selectedReport.tomorrow_priority_2 && <li>{selectedReport.tomorrow_priority_2}</li>}
                  {selectedReport.tomorrow_priority_3 && <li>{selectedReport.tomorrow_priority_3}</li>}
                </ol>
              </div>

              {/* Manager Feedback Textarea */}
              <div className="pt-2">
                <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Manager Review Feedback Notes</label>
                <textarea
                  rows={3}
                  placeholder="Add feedback, guidance, or requested changes..."
                  value={managerFeedback}
                  onChange={(e) => setManagerFeedback(e.target.value)}
                  className="w-full bg-secondary/35 border border-border/40 rounded-lg p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-border/30">
              <button
                onClick={() => handleReviewAction('Changes Requested')}
                disabled={isReviewing}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-all cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Request Changes</span>
              </button>

              <button
                onClick={() => handleReviewAction('Approved')}
                disabled={isReviewing}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <ThumbsUp className="h-4 w-4" />
                <span>Approve EOD Report</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
