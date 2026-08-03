'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { Client, Meeting } from '@/lib/mock-db';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, AlertCircle, TrendingUp, Users, Award, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function EmployeeDashboard() {
  const { user } = useStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const clientList = await db.getClients(user.id, user.role);
        const meetingList = await db.getMeetings(user.id, user.role);
        setClients(clientList);
        setMeetings(meetingList);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-secondary/40 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-secondary/30 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculations
  const todayMeetings = meetings.filter(m => m.meeting_date === todayStr);
  const upcomingMeetings = meetings.filter(m => m.meeting_date > todayStr);

  const pendingFeedback = meetings.filter(m => {
    const meetingDateTime = new Date(`${m.meeting_date}T${m.meeting_end}`);
    return meetingDateTime < new Date() && !m.feedback_sent;
  });

  const pendingFollowups = meetings.filter(m => {
    const meetingDateTime = new Date(`${m.meeting_date}T${m.meeting_end}`);
    // Check if 24 hours has passed
    const dayAfter = new Date(meetingDateTime.getTime() + 24 * 60 * 60 * 1000);
    return dayAfter < new Date() && !m.followup_sent;
  });

  const dealsWon = clients.filter(c => c.status === 'Won').length;
  const dealsLost = clients.filter(c => c.status === 'Lost').length;
  const conversionRate = clients.length > 0 
    ? Math.round((dealsWon / Math.max(1, dealsWon + dealsLost)) * 100) 
    : 0;

  const stats = [
    { name: "Today's Meetings", value: todayMeetings.length, icon: Calendar, color: 'text-purple-400', href: '/employee/meetings' },
    { name: 'Upcoming Meetings', value: upcomingMeetings.length, icon: Calendar, color: 'text-blue-400', href: '/employee/meetings' },
    { name: 'Pending Feedback', value: pendingFeedback.length, icon: AlertCircle, color: 'text-amber-400', href: '/employee/clients?status=Feedback Pending' },
    { name: 'Pending Follow-ups', value: pendingFollowups.length, icon: AlertCircle, color: 'text-rose-400', href: '/employee/clients?status=Follow-up Pending' },
    { name: 'Clients Added', value: clients.length, icon: Users, color: 'text-teal-400', href: '/employee/clients' },
    { name: 'Deals Won', value: dealsWon, icon: Award, color: 'text-emerald-400', href: '/employee/clients?status=Won' },
    { name: 'Deals Lost', value: dealsLost, icon: XCircle, color: 'text-rose-500', href: '/employee/clients?status=Lost' },
    { name: 'Conversion Rate', value: `${conversionRate}%`, icon: TrendingUp, color: 'text-indigo-400', href: '/employee/pipeline' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Hello, {user?.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">Here is a quick overview of your sales funnel and meetings today.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Link key={i} href={stat.href} className="block group">
            <Card className="hover:border-primary/50 hover:bg-secondary/20 hover:scale-[1.02] hover:shadow-lg transition-all duration-200 cursor-pointer">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors">{stat.name}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-secondary/50 ${stat.color} group-hover:bg-primary/20 transition-colors`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Meetings and Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Meetings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today&apos;s Agenda</CardTitle>
            <CardDescription>Scheduled meetings for today ({new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })})</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayMeetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-border/40 rounded-xl">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-foreground">No meetings today!</p>
                <p className="text-xs text-muted-foreground mt-0.5">Use the scheduler to schedule client discovery demo calls.</p>
                <Link href="/employee/meetings" className="mt-4">
                  <Button size="sm">Schedule Quick Meeting</Button>
                </Link>
              </div>
            ) : (
              todayMeetings.map((meet) => {
                const client = clients.find(c => c.id === meet.client_id);
                return (
                  <div key={meet.id} className="flex items-center justify-between p-4 rounded-xl border border-border/20 bg-secondary/10 hover:bg-secondary/20 transition-all duration-150">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{meet.meeting_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {meet.meeting_start} - {meet.meeting_end} • Client: {client?.client_name} ({client?.company_name})
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {meet.meeting_link && (
                        <a href={meet.meeting_link} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm">Join Call</Button>
                        </a>
                      )}
                      <Link href={`/employee/clients/${meet.client_id}`}>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks & Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Required Follow-ups</CardTitle>
            <CardDescription>Immediate action items for clients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingFeedback.length === 0 && pendingFollowups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-border/40 rounded-xl text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
                <p className="text-xs font-semibold text-foreground">All caught up!</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 px-6">No pending follow-ups or feedback templates require manual dispatch.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingFeedback.map((meet) => {
                  const client = clients.find(c => c.id === meet.client_id);
                  return (
                    <div key={meet.id} className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-2">
                      <div>
                        <p className="text-xs font-bold text-amber-200">Feedback Pending</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Discovery with {client?.company_name}</p>
                      </div>
                      <Link href={`/employee/clients/${meet.client_id}`} className="block">
                        <Button variant="secondary" size="sm" className="w-full text-xs py-1 h-8 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-200">
                          Send Feedback Email
                        </Button>
                      </Link>
                    </div>
                  );
                })}
                {pendingFollowups.map((meet) => {
                  const client = clients.find(c => c.id === meet.client_id);
                  return (
                    <div key={meet.id} className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 space-y-2">
                      <div>
                        <p className="text-xs font-bold text-red-200">24h Follow-up Reminder</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Meeting ended yesterday with {client?.company_name}</p>
                      </div>
                      <Link href={`/employee/clients/${meet.client_id}`} className="block">
                        <Button variant="secondary" size="sm" className="w-full text-xs py-1 h-8 bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-200">
                          Send Follow-up Email
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
