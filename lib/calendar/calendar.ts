import { db } from '../db';
import { Meeting } from '../mock-db';

interface CalendarEventPayload {
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: string;
}

// -------------------------------------------------------------------------
// REFRESH GOOGLE TOKEN
// -------------------------------------------------------------------------
async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[CALENDAR ERROR] Refreshing Google token failed:', error);
    return null;
  }
}

// -------------------------------------------------------------------------
// GET VALID ACCESS TOKEN
// -------------------------------------------------------------------------
async function getValidToken(employeeId: string, provider: 'google'): Promise<string | null> {
  const integrations = await db.getCalendarIntegrations(employeeId);
  const integration = integrations.find(c => c.provider === provider);
  if (!integration) return null;

  const now = new Date();
  const expiresAt = new Date(integration.expires_at);

  // If token is still valid (with 5-minute buffer)
  if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return integration.access_token;
  }

  // Token expired - refresh it
  if (!integration.refresh_token) return null;

  console.log(`[CALENDAR] Token expired for ${provider}, refreshing...`);
  const refreshData = await refreshGoogleToken(integration.refresh_token);

  if (refreshData) {
    const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();
    await db.saveCalendarIntegration({
      employee_id: employeeId,
      provider,
      access_token: refreshData.access_token,
      refresh_token: integration.refresh_token, // retain old refresh token
      expires_at: newExpiresAt
    });
    return refreshData.access_token;
  }

  return null;
}

// -------------------------------------------------------------------------
// MAIN SYNC SERVICE
// -------------------------------------------------------------------------
export const calendarService = {
  async syncMeetingToCalendar(meeting: Meeting, employeeId: string): Promise<string | null> {
    const integrations = await db.getCalendarIntegrations(employeeId);
    // Find Google integration
    const integration = integrations.find(i => i.provider === 'google');
    if (!integration) {
      console.log(`[CALENDAR SYNC] No Google Calendar integration found for employee: ${employeeId}. Mocking event.`);
      return `mock_${meeting.id}_gcal`;
    }

    const token = await getValidToken(employeeId, 'google');
    if (!token) return `mock_${meeting.id}_gcal`;

    const eventStart = `${meeting.meeting_date}T${meeting.meeting_start}:00`;
    const eventEnd = `${meeting.meeting_date}T${meeting.meeting_end}:00`;

    try {
      // Google Calendar API Sync
      const eventPayload: CalendarEventPayload = {
        summary: meeting.meeting_title,
        description: meeting.meeting_notes || 'Scheduled via QEVN CRM',
        start: { dateTime: eventStart, timeZone: meeting.timezone },
        end: { dateTime: eventEnd, timeZone: meeting.timezone },
      };
      if (meeting.meeting_link) {
        eventPayload.location = meeting.meeting_link;
      }

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('[CALENDAR SYNC] Successfully synced to Google Calendar:', data.id);
        return data.id;
      } else {
        console.error('[CALENDAR SYNC] Google Calendar API error:', await res.text());
      }
    } catch (err) {
      console.error('[CALENDAR SYNC] Failed syncing event to Google:', err);
    }

    return `mock_${meeting.id}_gcal`;
  },

  async updateMeetingInCalendar(meeting: Meeting, employeeId: string): Promise<boolean> {
    if (!meeting.calendar_event_id || meeting.calendar_event_id.startsWith('mock_')) {
      console.log(`[CALENDAR UPDATE] Mock calendar update for event: ${meeting.calendar_event_id}`);
      return true;
    }

    const token = await getValidToken(employeeId, 'google');
    if (!token) return false;

    const eventStart = `${meeting.meeting_date}T${meeting.meeting_start}:00`;
    const eventEnd = `${meeting.meeting_date}T${meeting.meeting_end}:00`;

    try {
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${meeting.calendar_event_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: meeting.meeting_title,
          description: meeting.meeting_notes,
          start: { dateTime: eventStart, timeZone: meeting.timezone },
          end: { dateTime: eventEnd, timeZone: meeting.timezone },
          location: meeting.meeting_link
        }),
      });
      if (res.ok) return true;
    } catch (err) {
      console.error('[CALENDAR UPDATE] Error updating event:', err);
    }
    return false;
  },

  async deleteMeetingFromCalendar(meeting: Meeting, employeeId: string): Promise<boolean> {
    if (!meeting.calendar_event_id || meeting.calendar_event_id.startsWith('mock_')) {
      console.log(`[CALENDAR DELETE] Mock calendar delete for event: ${meeting.calendar_event_id}`);
      return true;
    }

    const token = await getValidToken(employeeId, 'google');
    if (!token) return false;

    try {
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${meeting.calendar_event_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (res.ok) return true;
    } catch (err) {
      console.error('[CALENDAR DELETE] Error deleting event:', err);
    }
    return false;
  }
};
