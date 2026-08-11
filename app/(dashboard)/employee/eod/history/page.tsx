'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { EODReport } from '@/lib/mock-db';
import {
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  MessageSquare,
  Search
} from 'lucide-react';

export default function EODHistoryPage() {
  const { user } = useStore();
  const [reports, setReports] = useState<EODReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchDate, setSearchDate] = useState('');
  const [selectedReport, setSelectedReport] = useState<EODReport | null>(null);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await db.listEODReports({ employeeId: user.id, role: user.role });
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = reports.filter(r => {
    if (!searchDate) return true;
    return r.report_date.includes(searchDate);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/40 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">EOD Report History</h1>
          <p className="text-sm text-muted-foreground">View past daily submissions, progress, and manager review feedback</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="bg-secondary/35 border border-border/40 rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* History Table Card */}
      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-secondary/40 text-xs font-semibold text-muted-foreground uppercase border-b border-border/30">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Day Status</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Primary Objective</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-muted-foreground">Loading report history...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-muted-foreground">No past EOD reports found.</td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{r.report_date}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        r.day_status === 'Productive' ? 'bg-emerald-500/10 text-emerald-400' :
                        r.day_status === 'Partially Productive' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {r.day_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-primary">
                      {r.overall_progress ?? 80}%
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-muted-foreground">
                      {r.primary_objective || 'N/A'}
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
                        onClick={() => setSelectedReport(r)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-all cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border/40 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border/30 pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">EOD Report Details — {selectedReport.report_date}</h3>
                <span className="text-xs text-muted-foreground">Submitted by {selectedReport.employee_name || user?.name}</span>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-secondary/30 p-3 rounded-xl">
                <div><strong>Day Status:</strong> {selectedReport.day_status}</div>
                <div><strong>Progress:</strong> {selectedReport.overall_progress}%</div>
                <div><strong>Status:</strong> {selectedReport.status}</div>
                <div><strong>Submitted At:</strong> {selectedReport.submitted_at ? new Date(selectedReport.submitted_at).toLocaleTimeString() : 'Draft'}</div>
              </div>

              {selectedReport.manager_feedback && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center space-x-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Manager Feedback</span>
                  </h4>
                  <p className="text-xs text-amber-200/90 mt-1">{selectedReport.manager_feedback}</p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Primary Objective</h4>
                <p className="text-sm text-foreground bg-secondary/20 p-2.5 rounded-lg border border-border/20">{selectedReport.primary_objective || 'N/A'}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Biggest Achievement</h4>
                <p className="text-sm text-foreground bg-secondary/20 p-2.5 rounded-lg border border-border/20 whitespace-pre-line">{selectedReport.biggest_achievement || 'N/A'}</p>
              </div>

              {selectedReport.has_blockers && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-amber-400 mb-1">Blockers ({selectedReport.blocker_type})</h4>
                  <p className="text-sm text-foreground bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">{selectedReport.blocker_description}</p>
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
            </div>

            <div className="flex justify-end pt-2 border-t border-border/30">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
