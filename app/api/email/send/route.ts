import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { db } from '@/lib/db';

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, clientId, employeeId, template } = body;

    if (!to || !to.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid recipient email address is required' }, { status: 400 });
    }

    console.log(`[SERVER EMAIL API] Dispatching to: ${to} | Subject: ${subject} | Sender: ${SENDER_EMAIL}`);

    let status = 'sent';
    let errorMsg: string | null = null;

    if (resend) {
      // Try sending via Resend API
      const { data, error } = await resend.emails.send({
        from: `QEVN CRM <${SENDER_EMAIL}>`,
        to,
        subject,
        html,
      });

      if (error) {
        console.error('[SERVER EMAIL API] Resend error:', error);
        // Fallback: If unverified domain error, retry with onboarding@resend.dev
        if (error.message.includes('domain') || error.message.includes('verify')) {
          console.log('[SERVER EMAIL API] Retrying with onboarding@resend.dev sender fallback...');
          const retry = await resend.emails.send({
            from: 'QEVN CRM <onboarding@resend.dev>',
            to,
            subject,
            html,
          });

          if (retry.error) {
            status = 'failed';
            errorMsg = retry.error.message;
          } else {
            status = 'delivered';
          }
        } else {
          status = 'failed';
          errorMsg = error.message;
        }
      } else {
        status = 'delivered';
      }
    } else {
      console.log(`[SERVER EMAIL API] RESEND_API_KEY not configured. Simulating delivery success to ${to}`);
      status = 'mock_delivered';
    }

    // Always record email in database logs
    if (employeeId) {
      await db.createEmailLog({
        client_id: clientId || '',
        employee_id: employeeId,
        template: template || 'CRM Document',
        recipient: to,
        status
      });
    }

    if (status === 'failed') {
      return NextResponse.json({ success: false, error: errorMsg || 'Email delivery failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    console.error('[SERVER EMAIL API EXCEPTION]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
