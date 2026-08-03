'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { Client, Meeting } from '@/lib/mock-db';
import { calendarService } from '@/lib/calendar/calendar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { showToast } from '@/components/ui/toast';
import { Calendar, Plus, Link as LinkIcon, Users, Clock, Trash2, CalendarDays } from 'lucide-react';

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' }
];

function MeetingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useStore();

  const [clients, setClients] = useState<Client[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);

  // Form Fields
  const [clientId, setClientId] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingStart, setMeetingStart] = useState('');
  const [meetingEnd, setMeetingEnd] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [attendees, setAttendees] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');

  const fetchData = async () => {
    if (!user) return;
    try {
      const clientList = await db.getClients(user.id, user.role);
      const meetingList = await db.getMeetings(user.id, user.role);
      setClients(clientList);
      setMeetings(meetingList);

      // Pre-select client if client query parameter is set
      const urlClientId = searchParams.get('client');
      if (urlClientId) {
        setClientId(urlClientId);
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

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !meetingTitle || !meetingDate || !meetingStart || !meetingEnd) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    const payload = {
      client_id: clientId,
      employee_id: user!.id,
      meeting_title: meetingTitle,
      meeting_link: meetingLink,
      meeting_date: meetingDate,
      meeting_start: meetingStart,
      meeting_end: meetingEnd,
      timezone: timezone,
      meeting_notes: meetingNotes,
      attendees: attendees,
    };

    try {
      // 1. Create meeting entry (local/supabase db)
      const newMeet = await db.createMeeting({
        ...payload,
        calendar_event_id: '' // Will fill next
      });

      if (newMeet) {
        // 2. Call calendar service to sync (OAuth triggers or mock)
        const syncResult = await calendarService.syncMeetingToCalendar(newMeet, user!.id);
        
        // 3. Update meeting with returned event id and generated Meet link
        if (syncResult && syncResult.calendarEventId) {
          await db.updateMeeting(newMeet.id, { 
            calendar_event_id: syncResult.calendarEventId,
            meeting_link: syncResult.meetingLink || newMeet.meeting_link
          });
        }

        showToast('Meeting scheduled successfully!', 'success');
        
        // Audit log
        const client = clients.find(c => c.id === clientId);
        await db.createActivity({
          client_id: clientId,
          employee_id: user!.id,
          action: 'Meeting Created',
          description: `Scheduled discovery call: "${meetingTitle}" with ${client?.client_name}`
        });

        // If calendar connected, notify
        const integrations = await db.getCalendarIntegrations(user!.id);
        if (integrations.length > 0) {
          showToast(`Synced automatically with your ${integrations[0].provider} calendar!`, 'info');
        }

        // Reset
        setModalOpen(false);
        setClientId('');
        setMeetingTitle('');
        setMeetingLink('');
        setMeetingDate('');
        setMeetingStart('');
        setMeetingEnd('');
        setAttendees('');
        setMeetingNotes('');

        fetchData();
      }
    } catch (err) {
      console.error(err);
      showToast('Error scheduling meeting', 'error');
    }
  };

  const handleDeleteMeeting = async (meeting: Meeting) => {
    if (!confirm('Are you sure you want to cancel this meeting?')) return;
    try {
      // 1. Delete from external calendar
      await calendarService.deleteMeetingFromCalendar(meeting, user!.id);

      // 2. Delete from database
      const success = await db.deleteMeeting(meeting.id);
      if (success) {
        showToast('Meeting cancelled successfully', 'success');
        
        await db.createActivity({
          client_id: meeting.client_id,
          employee_id: user!.id,
          action: 'Meeting Deleted',
          description: `Cancelled discovery call: "${meeting.meeting_title}"`
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Scheduler Workspace</h2>
          <p className="text-sm text-muted-foreground mt-1">Schedule video calls, discovery demos, and sync them to your calendar.</p>
        </div>
        <Button className="flex items-center" onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Schedule Call
        </Button>
      </div>

      {/* Scheduled meetings directory */}
      <Card>
        <CardHeader>
          <CardTitle>Meetings Agenda</CardTitle>
          <CardDescription>Review all scheduled and historical meetings in your timeline.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-10 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-secondary/30 animate-pulse rounded-lg w-full" />
              ))}
            </div>
          ) : meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground/60 mb-3" />
              <h3 className="text-md font-bold">No meetings scheduled</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Use the Schedule button to initiate call events.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meeting Details</TableHead>
                  <TableHead>Client & Company</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Meeting Link</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((meet) => {
                  const client = clients.find(c => c.id === meet.client_id);
                  return (
                    <TableRow key={meet.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{meet.meeting_title}</span>
                          {meet.meeting_notes && (
                            <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{meet.meeting_notes}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{client.client_name}</span>
                            <span className="text-[11px] text-muted-foreground">{client.company_name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unknown Client</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-xs text-foreground">
                          <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          <div>
                            <p className="font-semibold">{meet.meeting_date}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{meet.meeting_start} - {meet.meeting_end} ({meet.timezone})</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {meet.meeting_link ? (
                          <a
                            href={meet.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline flex items-center"
                          >
                            <LinkIcon className="h-3 w-3 mr-1.5" />
                            Join Video Call
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">No link provided</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteMeeting(meet)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Meeting Dialog */}
      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Schedule New Meeting"
        description="Fill in discovery parameters to schedule a call and write it to the calendars."
      >
        <form onSubmit={handleScheduleMeeting} className="space-y-4">
          <Select
            label="Select Client *"
            options={[
              { value: '', label: 'Select client...' },
              ...clients.map(c => ({ value: c.id, label: `${c.client_name} (${c.company_name})` }))
            ]}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
          />

          <Input
            label="Meeting Title *"
            placeholder="e.g. Discovery Call & Demo - QEVN"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Meeting Date *"
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              required
            />
            <Select
              label="Timezone *"
              options={TIMEZONES}
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
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

          <Input
            label="Meeting Join Link"
            placeholder="e.g. Google Meet, Zoom, Teams URL"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
          />

          <Input
            label="Invite Attendees"
            placeholder="e.g. email1@stripe.com, email2@qevn.in"
            value={attendees}
            onChange={(e) => setAttendees(e.target.value)}
          />

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agenda / Notes</label>
            <textarea
              className="flex min-h-[60px] w-full rounded-lg border border-border/40 bg-secondary/35 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Outline specific objectives for the call..."
              value={meetingNotes}
              onChange={(e) => setMeetingNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-border/10">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Schedule Event
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export default function MeetingsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Loading meetings view...</div>}>
      <MeetingsContent />
    </Suspense>
  );
}
