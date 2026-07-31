'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { Client, Meeting, Activity, Profile } from '@/lib/mock-db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Building2, Calendar, AlertCircle, 
  Award, TrendingUp, DollarSign, Activity as ActivityIcon 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

export default function AdminDashboard() {
  const { user } = useStore();
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const empList = await db.listProfiles();
        const clientList = await db.getClients(user!.id, 'admin');
        const meetingList = await db.getMeetings(user!.id, 'admin');
        const actList = await db.getActivities(user!.id, 'admin');

        setEmployees(empList.filter(e => e.role === 'employee'));
        setClients(clientList);
        setMeetings(meetingList);
        setActivities(actList.slice(0, 5)); // show top 5
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (isLoading) {
    return <div className="text-center py-20 text-muted-foreground animate-pulse">Loading admin dashboard analytics...</div>;
  }

  // Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMeetings = meetings.filter(m => m.meeting_date === todayStr).length;
  const pendingFollowups = meetings.filter(m => {
    const meetingDateTime = new Date(`${m.meeting_date}T${m.meeting_end}`);
    const dayAfter = new Date(meetingDateTime.getTime() + 24 * 60 * 60 * 1000);
    return dayAfter < new Date() && !m.followup_sent;
  }).length;

  const dealsWon = clients.filter(c => c.status === 'Won').length;
  const dealsLost = clients.filter(c => c.status === 'Lost').length;
  
  // Mock Revenue calculation: $15,000 per won deal
  const totalRevenue = dealsWon * 15000;

  const kpiStats = [
    { name: 'Total Employees', value: employees.length + 1, icon: Users, color: 'text-blue-400' },
    { name: 'Total Clients', value: clients.length, icon: Building2, color: 'text-teal-400' },
    { name: "Today's Meetings", value: todayMeetings, icon: Calendar, color: 'text-purple-400' },
    { name: 'Pending Follow-ups', value: pendingFollowups, icon: AlertCircle, color: 'text-rose-400' },
    { name: 'Total Meetings', value: meetings.length, icon: Calendar, color: 'text-indigo-400' },
    { name: 'Closed Deals (Won)', value: dealsWon, icon: Award, color: 'text-emerald-400' },
    { name: 'Closed Deals (Lost)', value: dealsLost, icon: AlertCircle, color: 'text-red-400' },
    { name: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-indigo-400' },
  ];

  // Chart Data
  const monthlyLeadsData = [
    { name: 'Mar', leads: 4 },
    { name: 'Apr', leads: 7 },
    { name: 'May', leads: 5 },
    { name: 'Jun', leads: 11 },
    { name: 'Jul', leads: clients.length + 2 },
  ];

  const meetingConversionData = [
    { name: 'Discovery', count: meetings.length + 5 },
    { name: 'Demo Call', count: meetings.length + 2 },
    { name: 'Negotiation', count: clients.filter(c => c.status === 'Negotiation' || c.status === 'Won').length },
    { name: 'Won Deals', count: dealsWon }
  ];

  const leadSourceData = [
    { name: 'LinkedIn Outreach', value: clients.filter(c => c.lead_source === 'LinkedIn Outreach').length + 2 },
    { name: 'Cold Email', value: clients.filter(c => c.lead_source === 'Cold Email').length + 1 },
    { name: 'Inbound Inquiry', value: clients.filter(c => c.lead_source === 'Inbound Inquiry').length + 1 },
    { name: 'Referral', value: clients.filter(c => c.lead_source === 'Referral').length }
  ].filter(item => item.value > 0);

  const COLORS = ['#6366f1', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Global CRM Command</h2>
        <p className="text-sm text-muted-foreground mt-1">Review organizational performance, lead distributions, and funnel conversions.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiStats.map((stat, i) => (
          <Card key={i} className="hover:border-primary/20 transition-all duration-200">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.name}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-secondary/50 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      {mounted && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Leads Generated */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Lead Accrual</CardTitle>
              <CardDescription>Number of client accounts provisioned monthly.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyLeadsData}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Lead Source Share */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Generation Channels</CardTitle>
              <CardDescription>Primary acquisition channels for current pipeline clients.</CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              <div className="w-full h-full flex flex-col sm:flex-row items-center">
                <div className="flex-1 h-full min-h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadSourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {leadSourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="space-y-2 mt-4 sm:mt-0 px-6">
                  {leadSourceData.map((item, index) => (
                    <div key={item.name} className="flex items-center space-x-2.5">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-xs text-muted-foreground font-medium">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Funnel Conversion Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Funnel Progression Volume</CardTitle>
              <CardDescription>Total conversions across scheduled meetings, demo stages, negotiations, and closed deals.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={meetingConversionData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Team Activities</CardTitle>
          <CardDescription>Audit log history tracking actions across QEVN employee scopes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-6">No recent actions logged.</p>
          ) : (
            <div className="space-y-4">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start space-x-3 p-3 rounded-xl border border-border/20 bg-secondary/10 hover:bg-secondary/20 transition-all duration-150">
                  <div className="p-2 rounded-full bg-secondary text-primary mt-0.5">
                    <ActivityIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">{act.action}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{act.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
