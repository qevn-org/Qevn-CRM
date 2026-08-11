import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { sendEmail, emailTemplates } from '../../../../lib/email/resend';

export async function GET(request: NextRequest) {
  // Flexible auth check for Vercel Cron, GitHub Actions, or local timers
  const authHeader = request.headers.get('authorization');
  const xCronHeader = request.headers.get('x-cron-secret');
  const secretParam = request.nextUrl.searchParams.get('secret');

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const isBearerValid = authHeader === `Bearer ${cronSecret}`;
    const isHeaderValid = xCronHeader === cronSecret;
    const isParamValid = secretParam === cronSecret;

    if (!isBearerValid && !isHeaderValid && !isParamValid) {
      return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
    }
  }

  try {
    const now = new Date();
    // Retrieve ALL meetings in system
    const allMeetings = await db.getMeetings('', 'admin');
    const allClients = await db.getClients('', 'admin');
    const allProfiles = await db.listProfiles();

    let feedbackSentCount = 0;
    let followupSentCount = 0;

    for (const meet of allMeetings) {
      const client = allClients.find(c => c.id === meet.client_id);
      const employee = allProfiles.find(e => e.id === meet.employee_id);
      
      if (!client || !employee) continue;

      const meetingEndDateTime = new Date(`${meet.meeting_date}T${meet.meeting_end}`);
      
      // 1. Check for Completed Meetings (Immediate Feedback Reminder)
      if (meetingEndDateTime < now && !meet.feedback_reminder_sent && !meet.feedback_sent) {
        // Send Feedback reminder to employee
        const template = emailTemplates.feedbackReminder(client.company_name);
        await sendEmail({
          to: employee.email,
          subject: template.subject,
          html: template.html,
          clientId: client.id,
          employeeId: employee.id,
          template: 'Feedback Reminder Alert'
        });

        // Update flags
        await db.updateMeeting(meet.id, { feedback_reminder_sent: true });
        
        await db.createActivity({
          client_id: client.id,
          employee_id: employee.id,
          action: 'Reminder Sent',
          description: `Dispatched completed meeting feedback email prompt to employee: ${employee.name}`
        });

        feedbackSentCount++;
      }

      // 2. Check for 24-hour Follow-up Reminder
      const dayAfterMeeting = new Date(meetingEndDateTime.getTime() + 24 * 60 * 60 * 1000);
      if (dayAfterMeeting < now && !meet.followup_reminder_sent && !meet.followup_sent) {
        // Send Followup reminder to employee
        const template = emailTemplates.followupReminder(client.company_name);
        await sendEmail({
          to: employee.email,
          subject: template.subject,
          html: template.html,
          clientId: client.id,
          employeeId: employee.id,
          template: '24h Follow-up Alert'
        });

        // Update flags
        await db.updateMeeting(meet.id, { followup_reminder_sent: true });

        await db.createActivity({
          client_id: client.id,
          employee_id: employee.id,
          action: 'Follow-up Sent',
          description: `Dispatched 24-hour follow-up alert to employee: ${employee.name}`
        });

        followupSentCount++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary: {
        feedback_reminders_sent: feedbackSentCount,
        followup_reminders_sent: followupSentCount
      }
    });

  } catch (err: any) {
    console.error('[CRON ERROR] Cron background check crashed:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
