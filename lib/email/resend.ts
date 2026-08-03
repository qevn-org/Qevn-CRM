import { Resend } from 'resend';
import { db } from '../db';

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const SENDER_EMAIL = 'hello@qevn.in';

interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  clientId?: string;
  employeeId: string;
  template: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail({
  to,
  subject,
  html,
  clientId,
  employeeId,
  template,
  attachments
}: EmailPayload): Promise<{ success: boolean; error: string | null }> {
  console.log(`[EMAIL SENDING] Using template: ${template}`);
  console.log(`[EMAIL DETAILS] To: ${to} | Subject: ${subject}`);

  let success = false;
  let status = 'sent';
  let errorMsg: string | null = null;

  try {
    if (resend) {
      const payload: any = {
        from: `QEVN CRM <${SENDER_EMAIL}>`,
        to,
        subject,
        html,
      };
      if (attachments && attachments.length > 0) {
        payload.attachments = attachments;
      }

      const { data, error } = await resend.emails.send(payload);

      if (error) {
        status = 'failed';
        errorMsg = error.message;
        console.error('[EMAIL ERROR] Resend failed:', error);
      } else {
        success = true;
        status = 'delivered';
      }
    } else {
      // Mock email delivery success
      console.log(`[EMAIL MOCK] Resend API key not configured. Mocking success delivery to: ${to}`);
      console.log(`[EMAIL BODY PREVIEW]\n-------------------------\n${html.replace(/<[^>]*>/g, ' ')}\n-------------------------`);
      success = true;
      status = 'mock_delivered';
    }

    // Always log emails in the DB
    await db.createEmailLog({
      client_id: clientId || '',
      employee_id: employeeId,
      template,
      recipient: to,
      status
    });

  } catch (e: any) {
    status = 'failed';
    errorMsg = e.message;
    console.error('[EMAIL ERROR] Exception in email service:', e);
  }

  return { success, error: errorMsg };
}

// -------------------------------------------------------------------------
// EMAIL HTML TEMPLATES BUILDERS
// -------------------------------------------------------------------------
export const emailTemplates = {
  welcome: (employeeName: string) => ({
    subject: 'Welcome to QEVN CRM!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #6366f1;">Welcome to QEVN, ${employeeName}!</h2>
        <p>Your CRM account has been created successfully. You can now log in and securely manage your clients.</p>
        <p>Use your email address and default password: <b>password</b> to access the portal.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 4px; margin-top: 10px;">Login to CRM</a>
        <footer style="margin-top: 20px; font-size: 12px; color: #64748b;">
          Sent from hello@qevn.in - QEVN Client Management Team
        </footer>
      </div>
    `
  }),

  passwordReset: (resetLink: string) => ({
    subject: 'Reset your QEVN password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #6366f1;">Password Reset Request</h2>
        <p>You requested a password reset for your QEVN CRM account. Click the button below to set a new password:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 4px; margin-top: 10px;">Reset Password</a>
        <p style="margin-top: 15px; font-size: 12px; color: #64748b;">If you did not request this, please ignore this email.</p>
      </div>
    `
  }),

  meetingConfirmation: (clientName: string, companyName: string, title: string, date: string, start: string, link: string) => ({
    subject: `Meeting Confirmed: ${title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #6366f1;">Meeting Confirmed</h2>
        <p>Dear ${clientName},</p>
        <p>Your meeting with the QEVN team has been scheduled successfully. Here are the details:</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <strong>Title:</strong> ${title}<br/>
          <strong>Date:</strong> ${date}<br/>
          <strong>Time:</strong> ${start}<br/>
          <strong>Join Link:</strong> <a href="${link}" target="_blank">${link}</a>
        </div>
        <p>We look forward to speaking with you!</p>
        <footer style="margin-top: 20px; font-size: 12px; color: #64748b;">
          Sent from hello@qevn.in - QEVN Client Management Team
        </footer>
      </div>
    `
  }),

  feedbackReminder: (companyName: string) => ({
    subject: 'Action Required: Send Meeting Feedback',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #6366f1; font-size: 20px;">Meeting Completed Notification</h2>
        <p>You have successfully completed your meeting with <b>${companyName}</b>.</p>
        <p>To ensure high client engagement, please go to your CRM dashboard and send the follow-up meeting feedback email.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/employee/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 4px; margin-top: 10px;">Go to CRM Dashboard</a>
      </div>
    `
  }),

  followupReminder: (companyName: string) => ({
    subject: 'Action Required: Follow-up Reminder (24h)',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #ef4444; font-size: 20px;">Follow-up Reminder</h2>
        <p>You had a meeting yesterday with <b>${companyName}</b>.</p>
        <p>This is a 24-hour reminder to send your follow-up email to proceed with negotiation/deal closure.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/employee/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 4px; margin-top: 10px;">Send Follow-up Email</a>
      </div>
    `
  }),

  meetingInvitation: (
    title: string,
    date: string,
    start: string,
    end: string,
    timezone: string,
    link: string,
    organizerName: string,
    notes: string,
    platform: string,
    attendees: string,
    gcalUrl?: string,
    outlookUrl?: string
  ) => ({
    subject: `Invitation: ${title} @ ${date} ${start} (${timezone})`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
        <div style="border-bottom: 2px solid #6366f1; padding-bottom: 12px; margin-bottom: 20px;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6366f1;">QEVN CRM Meeting Invitation</span>
          <h1 style="margin: 6px 0 0 0; font-size: 22px; color: #0f172a;">${title}</h1>
        </div>

        <p style="font-size: 14px; color: #475569; margin-bottom: 18px;">
          You have been invited by <strong>${organizerName}</strong> to attend a scheduled video conference meeting.
        </p>

        <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 16px; border-radius: 6px; margin: 18px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 120px; font-weight: 600;">Date:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${date}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Time:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${start} - ${end} (${timezone})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Platform:</td>
              <td style="padding: 6px 0; color: #0f172a;">${platform || 'Google Meet'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Organizer:</td>
              <td style="padding: 6px 0; color: #0f172a;">${organizerName}</td>
            </tr>
            ${attendees ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Attendees:</td>
              <td style="padding: 6px 0; color: #334155; font-size: 13px;">${attendees}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        ${notes ? `
        <div style="margin: 18px 0;">
          <h3 style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px; letter-spacing: 0.5px;">Agenda / Description</h3>
          <p style="font-size: 14px; color: #334155; line-height: 1.5; background-color: #f1f5f9; padding: 12px; border-radius: 6px; margin: 0; white-space: pre-line;">${notes}</p>
        </div>
        ` : ''}

        ${link ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${link}" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #6366f1; color: #ffffff; font-weight: 600; text-decoration: none; border-radius: 8px; font-size: 14px;">
            Join Video Meeting (${platform || 'Google Meet'})
          </a>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 8px;">Direct Link: <a href="${link}" style="color: #6366f1;">${link}</a></p>
        </div>
        ` : ''}

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; text-align: center;">
          <p style="font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 10px;">Add to your calendar:</p>
          <div style="display: flex; justify-content: center; gap: 10px;">
            ${gcalUrl ? `<a href="${gcalUrl}" target="_blank" style="display: inline-block; padding: 6px 14px; background-color: #4285f4; color: white; font-size: 12px; font-weight: 600; text-decoration: none; border-radius: 6px; margin-right: 6px;">Google Calendar</a>` : ''}
            ${outlookUrl ? `<a href="${outlookUrl}" target="_blank" style="display: inline-block; padding: 6px 14px; background-color: #0078d4; color: white; font-size: 12px; font-weight: 600; text-decoration: none; border-radius: 6px;">Outlook Calendar</a>` : ''}
          </div>
        </div>

        <footer style="margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px; font-size: 11px; color: #94a3b8; text-align: center;">
          Automated invitation sent by QEVN CRM Client Management System • hello@qevn.in
        </footer>
      </div>
    `
  })
};
