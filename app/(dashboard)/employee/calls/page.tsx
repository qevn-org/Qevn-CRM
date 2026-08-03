'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { CallLog, Client } from '@/lib/mock-db';
import { ClickToCall } from '@/components/ui/click-to-call';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, Search, 
  Play, Tag, FileText, User, Building, Calendar, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';
import Link from 'next/link';

export default function CallHistoryPage() {
  const { user } = useStore();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'outbound' | 'inbound' | 'missed'>('All');

  const fetchData = async () => {
    if (!user) return;
    try {
      const logs = await db.getCallLogs(user.id, user.role);
      const clientList = await db.getClients(user.id, user.role);
      setCallLogs(logs);
      setClients(clientList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const formatDuration = (sec: number) => {
    if (!sec || sec === 0) return '0s';
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    if (mins === 0) return `${remainder}s`;
    return `${mins}m ${remainder}s`;
  };

  const filteredLogs = callLogs.filter(log => {
    // Tab filter
    if (activeTab === 'outbound' && log.direction !== 'outbound') return false;
    if (activeTab === 'inbound' && log.direction !== 'inbound') return false;
    if (activeTab === 'missed' && log.status !== 'missed' && log.status !== 'no-answer') return false;

    // Search query filter
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.contact_name && log.contact_name.toLowerCase().includes(q)) ||
      (log.company_name && log.company_name.toLowerCase().includes(q)) ||
      (log.phone_number && log.phone_number.includes(q)) ||
      (log.notes && log.notes.toLowerCase().includes(q)) ||
      (log.outcome && log.outcome.toLowerCase().includes(q))
    );
  });

  // Calculate statistics
  const totalCalls = callLogs.length;
  const outboundCount = callLogs.filter(l => l.direction === 'outbound').length;
  const inboundCount = callLogs.filter(l => l.direction === 'inbound').length;
  const missedCount = callLogs.filter(l => l.status === 'missed' || l.status === 'no-answer').length;
  const totalTalkTime = callLogs.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const avgDuration = totalCalls > 0 ? Math.round(totalTalkTime / totalCalls) : 0;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Twilio Call Logs & Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track outbound calls, incoming calls, notes, and call recordings.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total Calls</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{totalCalls}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <PhoneCall className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Outbound</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{outboundCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
              <PhoneOutgoing className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Inbound</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{inboundCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
              <PhoneIncoming className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Missed / Unanswered</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{missedCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 text-red-400">
              <PhoneMissed className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total Talk Time</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{formatDuration(totalTalkTime)}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex space-x-2 border-b border-border/20 pb-2">
          {(['All', 'outbound', 'inbound', 'missed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer capitalize ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              }`}
            >
              {tab} Calls
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by contact, phone, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 flex h-9 w-full rounded-lg border border-border/40 bg-secondary/35 px-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Call History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Call Activity Log</CardTitle>
          <CardDescription>Review complete call history, outcome notes, and voice recordings.</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-10 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-secondary/30 animate-pulse rounded-lg w-full" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <PhoneCall className="h-12 w-12 text-muted-foreground/60 mb-3" />
              <h3 className="text-md font-bold">No call history found</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Use the softphone dialer to place or receive calls.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Direction</TableHead>
                  <TableHead>Contact & Company</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration & Status</TableHead>
                  <TableHead>Outcome & Notes</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredLogs.map((log) => {
                  const client = clients.find(c => c.id === log.client_id || (c.phone && c.phone === log.phone_number));

                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center space-x-1.5">
                          {log.direction === 'outbound' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                              <ArrowUpRight className="h-3 w-3 mr-1" /> Outbound
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                              <ArrowDownLeft className="h-3 w-3 mr-1" /> Inbound
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          {client ? (
                            <Link href={`/employee/clients/${client.id}`} className="font-bold text-foreground hover:text-primary hover:underline transition-colors">
                              {log.contact_name || client.client_name}
                            </Link>
                          ) : (
                            <span className="font-bold text-foreground">{log.contact_name || 'Unknown Contact'}</span>
                          )}
                          <span className="text-[11px] text-muted-foreground">{log.company_name || client?.company_name || '—'}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <ClickToCall
                          phone={log.phone_number}
                          name={log.contact_name}
                          company={log.company_name}
                          clientId={log.client_id}
                          variant="link"
                        />
                      </TableCell>

                      <TableCell>
                        <div className="text-xs text-foreground">
                          <p className="font-semibold">{new Date(log.created_at).toLocaleDateString()}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs font-bold text-foreground">{formatDuration(log.duration)}</span>
                          <Badge variant="outline" className={`text-[10px] w-fit ${
                            log.status === 'completed' ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' :
                            log.status === 'busy' ? 'border-amber-500/40 text-amber-400 bg-amber-500/10' :
                            'border-red-500/40 text-red-400 bg-red-500/10'
                          }`}>
                            {log.status}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col space-y-1 max-w-[260px]">
                          {log.outcome && (
                            <span className="text-xs font-semibold text-primary">{log.outcome}</span>
                          )}
                          {log.notes && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{log.notes}</p>
                          )}
                          {log.tags && log.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {log.tags.map((tag, idx) => (
                                <span key={idx} className="text-[9px] bg-secondary/60 text-secondary-foreground border border-border/20 px-1 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <ClickToCall
                            phone={log.phone_number}
                            name={log.contact_name}
                            company={log.company_name}
                            clientId={log.client_id}
                            variant="button"
                            label="Redial"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
