import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calendarService } from '@/lib/calendar/calendar';
import { sendEmail, emailTemplates } from '@/lib/email/resend';
import { 
  generateICSContent, 
  generateGoogleCalendarAddUrl, 
  generateOutlookCalendarAddUrl 
} from '@/lib/calendar/calendar';

export async function POST(request: NextRequest) {
  console.log('[API CALENDAR SYNC] Received calendar sync request');

  try {
    const body = await request.json();
    const { meetingId, employeeId } = body;

    if (!meetingId || !employeeId) {
      return NextResponse.json(
        { success: false, error: 'Missing meetingId or employeeId parameter' },
        { status: 400 }
      );
    }

    // 1. Fetch meeting from DB
    const meeting = await db.getMeeting(meetingId);
    if (!meeting) {
      return NextResponse.json(
        { success: false, error: `Meeting not found with ID: ${meetingId}` },
        { status: 444 }
      );
    }

    console.log(`[API CALENDAR SYNC] Syncing meeting "${meeting.meeting_title}" (${meeting.id}) for employee: ${employeeId}`);

    // 2. Call calendarService to create Google Calendar event and Google Meet room
    const syncResult = await calendarService.syncMeetingToCalendar(meeting, employeeId);

    if (syncResult?.need_reconnect) {
      console.warn(`[API CALENDAR SYNC] Google Calendar OAuth expired or not connected for employee: ${employeeId}`);
      return NextResponse.json({
        success: false,
        need_reconnect: true,
        error: syncResult.error || 'Your Google Calendar connection has expired. Please reconnect your Google account.'
      });
    }

    // 3. Save returned hangoutLink and calendarEventId in DB
    let updatedMeeting = meeting;
    if (syncResult && syncResult.calendarEventId) {
      const updateData: any = {
        calendar_event_id: syncResult.calendarEventId,
      };
      if (syncResult.meetingLink) {
        updateData.meeting_link = syncResult.meetingLink;
      }

      const res = await db.updateMeeting(meeting.id, updateData);
      if (res) updatedMeeting = res;
      console.log(`[API CALENDAR SYNC] Saved Google Event ID: ${syncResult.calendarEventId} and Meet Link: ${syncResult.meetingLink} in DB`);
    }

    // 4. Send automated email invitations to ALL attendees with .ics file
    const attendeeEmails = (updatedMeeting.attendees || '')
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0 && e.includes('@'));

    const profile = await db.getProfile(employeeId);
    const organizerName = profile?.name || 'QEVN Team';
    const organizerEmail = profile?.email || 'hello@qevn.in';

    const icsString = generateICSContent(updatedMeeting, organizerName, organizerEmail);
    const gcalUrl = generateGoogleCalendarAddUrl(updatedMeeting);
    const outlookUrl = generateOutlookCalendarAddUrl(updatedMeeting);

    const emailTemplate = emailTemplates.meetingInvitation(
      updatedMeeting.meeting_title,
      updatedMeeting.meeting_date,
      updatedMeeting.meeting_start,
      updatedMeeting.meeting_end,
      updatedMeeting.timezone,
      updatedMeeting.meeting_link || '',
      organizerName,
      updatedMeeting.meeting_notes || '',
      updatedMeeting.platform || 'Google Meet',
      updatedMeeting.attendees || '',
      gcalUrl,
      outlookUrl
    );

    let emailsSent = 0;
    for (const recipient of attendeeEmails) {
      const sendRes = await sendEmail({
        to: recipient,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        clientId: updatedMeeting.client_id,
        employeeId,
        template: 'Meeting Invitation',
        attachments: [
          {
            filename: 'invite.ics',
            content: icsString,
            contentType: 'text/calendar; method=REQUEST'
          }
        ]
      });
      if (sendRes.success) emailsSent++;
    }

    console.log(`[API CALENDAR SYNC] Successfully processed sync. Sent ${emailsSent} invitation email(s).`);

    return NextResponse.json({
      success: true,
      meeting: updatedMeeting,
      calendarEventId: syncResult?.calendarEventId,
      meetingLink: updatedMeeting.meeting_link,
      emailsSent
    });

  } catch (err: any) {
    console.error('[API CALENDAR SYNC ERROR] Exception in calendar sync API route:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error during calendar sync' },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
