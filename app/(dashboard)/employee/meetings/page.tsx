'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { Client, Meeting } from '@/lib/mock-db';
import { 
  calendarService, 
  generateMeetingLink, 
  generateICSContent, 
  generateGoogleCalendarAddUrl, 
  generateOutlookCalendarAddUrl 
} from '@/lib/calendar/calendar';
import { sendEmail, emailTemplates } from '@/lib/email/resend';
import { AttendeeInput } from '@/components/ui/attendee-input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { showToast } from '@/components/ui/toast';
import { 
  Calendar as CalendarIcon, Plus, Link as LinkIcon, Users, Clock, Trash2, 
  CalendarDays, Video, Mail, RefreshCw, CheckCircle2, XCircle, AlertTriangle, 
  Edit3, CalendarCheck, CalendarX, ArrowRight, VideoOff, Info, CheckCircle
} from 'lucide-react';
import Link from 'next/link';

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' }
];

const PLATFORMS = [
  { value: 'Google Meet', label: 'Google Meet' },
  { value: 'Microsoft Teams', label: 'Microsoft Teams' },
  { value: 'Zoom', label: 'Zoom' },
  { value: 'Phone Call', label: 'Phone Call' },
  { value: 'In Person', label: 'In Person' }
];

const MEETING_TYPES = [
  { value: 'Discovery Call', label: 'Discovery Call' },
  { value: 'Product Demo', label: 'Product Demo' },
  { value: 'Technical Review', label: 'Technical Review' },
  { value: 'Contract Negotiation', label: 'Contract Negotiation' },
  { value: 'Strategy Session', label: 'Strategy Session' }
];

type MeetingStatus = 'Draft' | 'Scheduled' | 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show' | 'Rescheduled';

function MeetingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useStore();

  const [clients, setClients] = useState<Client[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<string>('All');

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  // Form Fields for New Meeting
  const [clientId, setClientId] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingType, setMeetingType] = useState('Discovery Call');
  const [platform, setPlatform] = useState('Google Meet');
  const [customLink, setCustomLink] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingStart, setMeetingStart] = useState('');
  const [meetingEnd, setMeetingEnd] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [attendeeEmails, setAttendeeEmails] = useState<string[]>([]);
  const [meetingNotes, setMeetingNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields for Edit / Reschedule
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAttendees, setEditAttendees] = useState<string[]>([]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const clientList = await db.getClients(user.id, user.role);
      const meetingList = await db.getMeetings(user.id, user.role);
      const integrations = await db.getCalendarIntegrations(user.id);
      
      setClients(clientList);
      setMeetings(meetingList);
      setIsGoogleConnected(integrations.some(i => i.provider === 'google'));

      // Pre-select client if client query parameter is set
      const urlClientId = searchParams.get('client');
      if (urlClientId) {
        const selected = clientList.find(c => c.id === urlClientId);
        setClientId(urlClientId);
        if (selected) {
          if (selected.email) setAttendeeEmails([selected.email.toLowerCase()]);
          setMeetingTitle(`Discovery Call & Demo - ${selected.company_name}`);
        }
        setModalOpen(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, searchParams]);

  // When Client selection changes, auto-populate attendees & title
  const handleClientChange = (selectedId: string) => {
    setClientId(selectedId);
    const selected = clients.find(c => c.id === selectedId);
    if (selected) {
      if (selected.email && !attendeeEmails.includes(selected.email.toLowerCase())) {
        setAttendeeEmails([...attendeeEmails, selected.email.toLowerCase()]);
      }
      if (!meetingTitle) {
        setMeetingTitle(`${meetingType} - ${selected.company_name}`);
      }
    }
  };

  const handleConnectGoogle = () => {
    window.location.href = '/api/auth/calendar/google';
  };

  // Create Meeting Flow
  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !meetingTitle || !meetingDate || !meetingStart || !meetingEnd) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    if (attendeeEmails.length === 0) {
      showToast('Please add at least one attendee email address', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedClient = clients.find(c => c.id === clientId);
      const attendeesStr = attendeeEmails.join(', ');

      const initialPayload = {
        client_id: clientId,
        employee_id: user!.id,
        meeting_title: meetingTitle,
        meeting_type: meetingType,
        meeting_link: customLink.trim(),
        platform: platform,
        status: 'Scheduled' as const,
        meeting_date: meetingDate,
        meeting_start: meetingStart,
        meeting_end: meetingEnd,
        timezone: timezone,
        meeting_notes: meetingNotes,
        attendees: attendeesStr,
        created_by: user!.id,
      };

      // 1. Create meeting entry in CRM database
      const newMeet = await db.createMeeting({
        ...initialPayload,
        calendar_event_id: ''
      });

      if (!newMeet) {
        showToast('Failed to save meeting in database', 'error');
        setIsSubmitting(false);
        return;
      }

      // 2. Update Client stage to 'Meeting Scheduled'
      if (selectedClient && ['Lead', 'Contacted'].includes(selectedClient.status)) {
        await db.updateClient(clientId, { status: 'Meeting Scheduled' });
      }

      // 3. Sync with Google Calendar API (generates real Google Meet link)
      const syncResult = await calendarService.syncMeetingToCalendar(newMeet, user!.id);
      let updatedMeet = newMeet;

      if (syncResult?.need_reconnect) {
        showToast(syncResult.error || 'Please reconnect Google Calendar', 'error');
      }

      if (syncResult && (syncResult.calendarEventId || syncResult.meetingLink)) {
        const updateRes = await db.updateMeeting(newMeet.id, {
          calendar_event_id: syncResult.calendarEventId || newMeet.calendar_event_id,
          meeting_link: syncResult.meetingLink || newMeet.meeting_link || (platform !== 'Google Meet' ? generateMeetingLink(platform) : '')
        });
        if (updateRes) updatedMeet = updateRes;
      }

      // 4. Send automated email invitations to ALL attendees
      const organizerName = user?.name || 'QEVN Team';
      const organizerEmail = user?.email || 'hello@qevn.in';

      const icsString = generateICSContent(updatedMeet, organizerName, organizerEmail);
      const gcalUrl = generateGoogleCalendarAddUrl(updatedMeet);
      const outlookUrl = generateOutlookCalendarAddUrl(updatedMeet);

      const emailTemplate = emailTemplates.meetingInvitation(
        updatedMeet.meeting_title,
        updatedMeet.meeting_date,
        updatedMeet.meeting_start,
        updatedMeet.meeting_end,
        updatedMeet.timezone,
        updatedMeet.meeting_link || '',
        organizerName,
        updatedMeet.meeting_notes || '',
        updatedMeet.platform || platform,
        updatedMeet.attendees || attendeesStr,
        gcalUrl,
        outlookUrl
      );

      let emailsSent = 0;
      for (const recipient of attendeeEmails) {
        const sendResult = await sendEmail({
          to: recipient,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          clientId: clientId,
          employeeId: user!.id,
          template: 'Meeting Invitation',
          attachments: [
            {
              filename: 'invite.ics',
              content: icsString,
              contentType: 'text/calendar; method=REQUEST'
            }
          ]
        });
        if (sendResult.success) emailsSent++;
      }

      showToast(
        emailsSent > 0
          ? `Meeting scheduled! Sent invitations to ${emailsSent} attendee(s).`
          : 'Meeting scheduled successfully!',
        'success'
      );

      // 5. Activity log
      await db.createActivity({
        client_id: clientId,
        employee_id: user!.id,
        action: 'Meeting Scheduled',
        description: `Scheduled "${meetingTitle}" with ${selectedClient?.client_name || 'Client'} (${attendeesStr})`
      });

      // Reset Modal Form
      setModalOpen(false);
      setClientId('');
      setMeetingTitle('');
      setCustomLink('');
      setMeetingDate('');
      setMeetingStart('');
      setMeetingEnd('');
      setAttendeeEmails([]);
      setMeetingNotes('');

      fetchData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error scheduling meeting', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Dialog
  const openEditModal = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setEditTitle(meeting.meeting_title);
    setEditDate(meeting.meeting_date);
    setEditStart(meeting.meeting_start);
    setEditEnd(meeting.meeting_end);
    setEditNotes(meeting.meeting_notes || '');
    setEditAttendees((meeting.attendees || '').split(',').map(e => e.trim()).filter(Boolean));
    setEditModalOpen(true);
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting) return;

    try {
      const attendeesStr = editAttendees.join(', ');
      const updated = await db.updateMeeting(selectedMeeting.id, {
        meeting_title: editTitle,
        meeting_date: editDate,
        meeting_start: editStart,
        meeting_end: editEnd,
        meeting_notes: editNotes,
        attendees: attendeesStr,
        updated_by: user!.id
      });

      if (updated) {
        // Sync update with Google Calendar
        await calendarService.updateMeetingInCalendar(updated, user!.id);

        showToast('Meeting updated successfully', 'success');

        await db.createActivity({
          client_id: updated.client_id,
          employee_id: user!.id,
          action: 'Meeting Updated',
          description: `Updated call details for "${editTitle}"`
        });

        setEditModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update meeting', 'error');
    }
  };

  // Reschedule Action
  const openRescheduleModal = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setEditDate(meeting.meeting_date);
    setEditStart(meeting.meeting_start);
    setEditEnd(meeting.meeting_end);
    setRescheduleModalOpen(true);
  };

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting) return;

    try {
      const updated = await db.updateMeeting(selectedMeeting.id, {
        meeting_date: editDate,
        meeting_start: editStart,
        meeting_end: editEnd,
        status: 'Rescheduled',
        updated_by: user!.id
      });

      if (updated) {
        // Sync with Google Calendar API
        await calendarService.updateMeetingInCalendar(updated, user!.id);

        // Re-send updated invitations to all attendees
        const attendeeList = (updated.attendees || '').split(',').map(e => e.trim()).filter(Boolean);
        const organizerName = user?.name || 'QEVN Team';
        const organizerEmail = user?.email || 'hello@qevn.in';

        const icsString = generateICSContent(updated, organizerName, organizerEmail);
        const gcalUrl = generateGoogleCalendarAddUrl(updated);
        const outlookUrl = generateOutlookCalendarAddUrl(updated);

        const emailTemplate = emailTemplates.meetingInvitation(
          `Rescheduled: ${updated.meeting_title}`,
          updated.meeting_date,
          updated.meeting_start,
          updated.meeting_end,
          updated.timezone,
          updated.meeting_link || '',
          organizerName,
          updated.meeting_notes || '',
          updated.platform || 'Google Meet',
          updated.attendees || '',
          gcalUrl,
          outlookUrl
        );

        for (const recipient of attendeeList) {
          await sendEmail({
            to: recipient,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            clientId: updated.client_id,
            employeeId: user!.id,
            template: 'Meeting Rescheduled Notification',
            attachments: [{ filename: 'rescheduled_invite.ics', content: icsString }]
          });
        }

        showToast(`Meeting rescheduled to ${editDate}. Notifications sent to attendees.`, 'success');

        await db.createActivity({
          client_id: updated.client_id,
          employee_id: user!.id,
          action: 'Meeting Rescheduled',
          description: `Rescheduled "${updated.meeting_title}" to ${editDate} ${editStart}`
        });

        setRescheduleModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to reschedule meeting', 'error');
    }
  };

  // Cancel Meeting
  const handleCancelMeeting = async (meeting: Meeting) => {
    if (!confirm(`Are you sure you want to cancel the meeting: "${meeting.meeting_title}"?`)) return;

    try {
      // Delete from Google Calendar
      await calendarService.deleteMeetingFromCalendar(meeting, user!.id);

      // Update status to Cancelled in DB
      const updated = await db.updateMeeting(meeting.id, { status: 'Cancelled' });
      if (updated) {
        showToast('Meeting cancelled and removed from Google Calendar', 'info');

        await db.createActivity({
          client_id: meeting.client_id,
          employee_id: user!.id,
          action: 'Meeting Cancelled',
          description: `Cancelled call: "${meeting.meeting_title}"`
        });

        fetchData();
      }
    } catch (err) {
      console.error(err);
      showToast('Error cancelling meeting', 'error');
    }
  };

  const handleUpdateStatus = async (meeting: Meeting, newStatus: MeetingStatus) => {
    try {
      const updated = await db.updateMeeting(meeting.id, { status: newStatus });
      if (updated) {
        showToast(`Status updated to ${newStatus}`, 'success');

        if (newStatus === 'Completed') {
          await db.updateClient(meeting.client_id, { status: 'Meeting Completed' });
        }

        await db.createActivity({
          client_id: meeting.client_id,
          employee_id: user!.id,
          action: 'Meeting Status Updated',
          description: `Status for "${meeting.meeting_title}" changed to ${newStatus}`
        });

        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter meetings by active tab
  const filteredMeetings = meetings.filter(m => {
    if (filterTab === 'All') return true;
    return (m.status || 'Scheduled') === filterTab;
  });

  // Calculate statistics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMeetingsCount = meetings.filter(m => m.meeting_date === todayStr).length;
  const upcomingMeetingsCount = meetings.filter(m => m.meeting_date >= todayStr && m.status !== 'Cancelled' && m.status !== 'Completed').length;
  const completedMeetingsCount = meetings.filter(m => m.status === 'Completed').length;
  const cancelledMeetingsCount = meetings.filter(m => m.status === 'Cancelled').length;

  const getStatusBadge = (status?: string) => {
    const st = (status || 'Scheduled') as MeetingStatus;
    switch (st) {
      case 'Scheduled':
        return <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-400 font-semibold">Scheduled</Badge>;
      case 'Upcoming':
        return <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/10 text-indigo-400 font-semibold">Upcoming</Badge>;
      case 'In Progress':
        return <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-400 font-semibold animate-pulse">In Progress</Badge>;
      case 'Completed':
        return <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold">Completed</Badge>;
      case 'Cancelled':
        return <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-400 font-semibold">Cancelled</Badge>;
      case 'No Show':
        return <Badge variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-300 font-semibold">No Show</Badge>;
      case 'Rescheduled':
        return <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400 font-semibold">Rescheduled</Badge>;
      default:
        return <Badge variant="outline">{st}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Meetings & Calendar Hub</h2>
          <p className="text-sm text-muted-foreground mt-1">Enterprise meeting scheduler with Google Calendar API sync and real Google Meet room creation.</p>
        </div>
        <Button className="flex items-center" onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Schedule Meeting
        </Button>
      </div>

      {/* Google Calendar Connection Status Banner */}
      {!isGoogleConnected && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-200">Google Calendar Disconnected or Expired</p>
              <p className="text-xs text-amber-300/80 mt-0.5">Connect your Google account to automatically generate valid Google Meet rooms via Google Calendar API.</p>
            </div>
          </div>
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold flex-shrink-0" onClick={handleConnectGoogle}>
            Connect Google Calendar <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Today&apos;s Meetings</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{todayMeetingsCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Upcoming</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{upcomingMeetingsCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
              <CalendarIcon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Completed</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{completedMeetingsCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Cancelled</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{cancelledMeetingsCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 text-red-400">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex space-x-2 border-b border-border/20 pb-2 overflow-x-auto">
        {(['All', 'Scheduled', 'Upcoming', 'Completed', 'Cancelled', 'Rescheduled'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
              filterTab === tab
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            }`}
          >
            {tab} {tab !== 'All' ? `(${meetings.filter(m => (m.status || 'Scheduled') === tab).length})` : `(${meetings.length})`}
          </button>
        ))}
      </div>

      {/* Meetings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Agenda</CardTitle>
          <CardDescription>Review upcoming meetings, attendees, and Google Meet room status.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-10 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-secondary/30 animate-pulse rounded-lg w-full" />
              ))}
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground/60 mb-3" />
              <h3 className="text-md font-bold">No meetings found</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Use the Schedule Meeting button to create call events.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meeting & Type</TableHead>
                  <TableHead>Client & Company</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Attendees</TableHead>
                  <TableHead>Meeting Room</TableHead>
                  <TableHead>Status & Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMeetings.map((meet) => {
                  const client = clients.find(c => c.id === meet.client_id);
                  const attendeeList = (meet.attendees || '')
                    .split(',')
                    .map(a => a.trim())
                    .filter(Boolean);

                  return (
                    <TableRow key={meet.id}>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <span className="font-bold text-foreground">{meet.meeting_title}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-secondary/60 text-secondary-foreground px-1.5 py-0.5 rounded font-semibold uppercase">
                              {meet.meeting_type || 'Discovery'}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {meet.platform || 'Google Meet'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client ? (
                          <div className="flex flex-col">
                            <Link href={`/employee/clients/${client.id}`} className="font-medium text-foreground hover:text-primary hover:underline transition-colors">
                              {client.client_name}
                            </Link>
                            <span className="text-[11px] text-muted-foreground">{client.company_name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unknown Client</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-xs text-foreground">
                          <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="font-semibold">{meet.meeting_date}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{meet.meeting_start} - {meet.meeting_end} ({meet.timezone})</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {attendeeList.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {attendeeList.map((email, idx) => (
                              <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary border border-primary/20 truncate">
                                {email}
                              </span>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {meet.meeting_link ? (
                          <a
                            href={meet.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                          >
                            <Video className="h-3.5 w-3.5 mr-1.5" />
                            Join Call
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">No link active</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(meet.status)}

                          {/* Quick Status Dropdown */}
                          <select
                            className="text-[11px] bg-secondary/40 border border-border/40 rounded px-1.5 py-1 text-foreground cursor-pointer focus:outline-none"
                            value={meet.status || 'Scheduled'}
                            onChange={(e) => handleUpdateStatus(meet, e.target.value as MeetingStatus)}
                          >
                            <option value="Scheduled">Scheduled</option>
                            <option value="Upcoming">Upcoming</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="No Show">No Show</option>
                            <option value="Rescheduled">Rescheduled</option>
                          </select>

                          {/* Edit Action */}
                          <Button variant="ghost" size="sm" className="p-1 h-7 text-xs" title="Edit Meeting" onClick={() => openEditModal(meet)}>
                            <Edit3 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>

                          {/* Reschedule Action */}
                          <Button variant="ghost" size="sm" className="p-1 h-7 text-xs" title="Reschedule" onClick={() => openRescheduleModal(meet)}>
                            <CalendarIcon className="h-3.5 w-3.5 text-amber-400" />
                          </Button>

                          {/* Cancel Action */}
                          <Button variant="ghost" size="sm" className="p-1 h-7 text-xs" title="Cancel Meeting" onClick={() => handleCancelMeeting(meet)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </Button>
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

      {/* Schedule Meeting Dialog */}
      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Schedule New Meeting"
        description="Select attendees and timing. Real Google Meet room will be created via Google Calendar API."
      >
        <form onSubmit={handleScheduleMeeting} className="space-y-4">
          <Select
            label="Select CRM Client *"
            options={[
              { value: '', label: 'Select client...' },
              ...clients.map(c => ({ value: c.id, label: `${c.client_name} (${c.company_name})` }))
            ]}
            value={clientId}
            onChange={(e) => handleClientChange(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Meeting Title *"
              placeholder="e.g. Product Discovery & Demo"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              required
            />
            <Select
              label="Meeting Type *"
              options={MEETING_TYPES}
              value={meetingType}
              onChange={(e) => setMeetingType(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Platform *"
              options={PLATFORMS}
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            />
            <Select
              label="Timezone *"
              options={TIMEZONES}
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Meeting Date *"
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              required
            />
            <Input
              label="Start Time *"
              type="time"
              value={meetingStart}
              onChange={(e) => setMeetingStart(e.target.value)}
              required
            />
            <Input
              label="End Time *"
              type="time"
              value={meetingEnd}
              onChange={(e) => setMeetingEnd(e.target.value)}
              required
            />
          </div>

          {/* Attendee Input Chip Component */}
          <AttendeeInput
            label="Attendees (Multi-Select)"
            value={attendeeEmails}
            onChange={setAttendeeEmails}
            clients={clients}
            placeholder="Type email or search contact name..."
          />

          {platform !== 'Google Meet' && (
            <Input
              label="Custom Video Call URL"
              placeholder="e.g. Teams or Zoom link"
              value={customLink}
              onChange={(e) => setCustomLink(e.target.value)}
            />
          )}

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agenda / Meeting Notes</label>
            <textarea
              className="flex min-h-[70px] w-full rounded-lg border border-border/40 bg-secondary/35 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Outline specific objectives and agenda topics..."
              value={meetingNotes}
              onChange={(e) => setMeetingNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-border/10">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Schedule Event & Send Invites
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Meeting Dialog */}
      <Dialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        title="Edit Meeting Details"
        description="Modify call parameters and sync changes with Google Calendar."
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Input
            label="Meeting Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Date"
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              required
            />
            <Input
              label="Start"
              type="time"
              value={editStart}
              onChange={(e) => setEditStart(e.target.value)}
              required
            />
            <Input
              label="End"
              type="time"
              value={editEnd}
              onChange={(e) => setEditEnd(e.target.value)}
              required
            />
          </div>

          <AttendeeInput
            label="Attendees"
            value={editAttendees}
            onChange={setEditAttendees}
            clients={clients}
          />

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agenda / Notes</label>
            <textarea
              className="flex min-h-[70px] w-full rounded-lg border border-border/40 bg-secondary/35 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-border/10">
            <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save & Sync Changes
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog
        open={rescheduleModalOpen}
        onOpenChange={setRescheduleModalOpen}
        title="Reschedule Meeting"
        description="Select new date and time for the meeting. Notifications will be sent to all attendees."
      >
        <form onSubmit={handleSaveReschedule} className="space-y-4">
          <Input
            label="New Meeting Date *"
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time *"
              type="time"
              value={editStart}
              onChange={(e) => setEditStart(e.target.value)}
              required
            />
            <Input
              label="End Time *"
              type="time"
              value={editEnd}
              onChange={(e) => setEditEnd(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-border/10">
            <Button type="button" variant="outline" onClick={() => setRescheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Reschedule & Notify Attendees
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export default function MeetingsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Loading meetings workspace...</div>}>
      <MeetingsContent />
    </Suspense>
  );
}
