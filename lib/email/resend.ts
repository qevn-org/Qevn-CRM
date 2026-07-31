import { Resend } from 'resend';
import { db } from '../db';

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const SENDER_EMAIL = 'hello@qevn.in';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  clientId?: string;
  employeeId: string;
  template: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  clientId,
  employeeId,
  template
}: EmailPayload): Promise<{ success: boolean; error: string | null }> {
  console.log(`[EMAIL SENDING] Using template: ${template}`);
  console.log(`[EMAIL DETAILS] To: ${to} | Subject: ${subject}`);

  let success = false;
  let status = 'sent';
  let errorMsg: string | null = null;

  try {
    if (resend) {
      const { data, error } = await resend.emails.send({
        from: `QEVN CRM <${SENDER_EMAIL}>`,
        to,
        subject,
        html,
      });

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
      console.log(`[EMAIL MOCK] Resend API key not configured. Mocking success delivery.`);
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
  })
};
