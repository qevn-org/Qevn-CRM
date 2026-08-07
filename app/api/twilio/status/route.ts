import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    let payload: any = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      payload = await request.json().catch(() => ({}));
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        payload[key] = value;
      });
    } else {
      payload = await request.json().catch(async () => {
        const text = await request.text();
        const params = new URLSearchParams(text);
        const obj: any = {};
        params.forEach((v, k) => { obj[k] = v; });
        return obj;
      });
    }

    const callSid = payload.callSid || payload.CallSid || `CA_${Math.random().toString(36).substring(2, 11)}`;
    const employeeId = payload.employeeId || payload.EmployeeId || 'usr_emp_1';
    const clientId = payload.clientId;
    const contactName = payload.contactName;
    const companyName = payload.companyName;
    const phoneNumber = payload.phoneNumber || payload.To || payload.Called || payload.From || '';
    const direction = payload.direction || (payload.Direction?.includes('outbound') ? 'outbound' : 'inbound');
    const duration = Number(payload.duration || payload.CallDuration || payload.RecordingDuration || 0);
    const status = payload.status || payload.CallStatus || 'completed';
    const outcome = payload.outcome || payload.CallStatus || status;
    const notes = payload.notes || (payload.RecordingUrl ? `Recording URL: ${payload.RecordingUrl}` : '');
    const followupRequired = Boolean(payload.followupRequired);
    const followupDate = payload.followupDate;
    const tags = Array.isArray(payload.tags) ? payload.tags : ['Twilio Call'];
    const recordingUrl = payload.recordingUrl || payload.RecordingUrl || `https://api.twilio.com/2010-04-01/Accounts/ACmock/Recordings/RE${Date.now()}.mp3`;

    console.log(`[TWILIO CALL STATUS API] CallSid: ${callSid} | Status: ${status} | Duration: ${duration}s | Phone: ${phoneNumber}`);

    // Save call log in DB
    const callLog = await db.createCallLog({
      call_sid: callSid,
      client_id: clientId,
      employee_id: employeeId,
      contact_name: contactName,
      company_name: companyName,
      phone_number: phoneNumber,
      direction,
      duration,
      status,
      outcome,
      notes,
      recording_url: recordingUrl,
      recording_duration: duration,
      followup_required: followupRequired,
      followup_date: followupDate,
      tags
    });

    // Create activity timeline entry
    if (employeeId) {
      await db.createActivity({
        client_id: clientId,
        employee_id: employeeId,
        action: direction === 'outbound' ? 'Outbound Call Placed' : 'Inbound Call Received',
        description: `${direction === 'outbound' ? 'Called' : 'Received call from'} ${contactName || phoneNumber} (${duration}s) - ${outcome}`
      });
    }

    const acceptHeader = request.headers.get('accept') || '';
    const userAgent = request.headers.get('user-agent') || '';
    const isTwilioRequest = userAgent.toLowerCase().includes('twilio') || !contentType.includes('application/json');

    if (isTwilioRequest && !acceptHeader.includes('application/json')) {
      const xml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
      return new NextResponse(xml, {
        status: 200,
        headers: {
          'Content-Type': 'text/xml',
          'Cache-Control': 'no-cache'
        }
      });
    }

    return NextResponse.json({ success: true, callLog });
  } catch (err: any) {
    console.error('[TWILIO STATUS API ERROR]', err);
    const userAgent = request.headers.get('user-agent') || '';
    if (userAgent.toLowerCase().includes('twilio')) {
      return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      });
    }
    return NextResponse.json({ success: false, error: err.message || 'Error logging call status' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  if (userAgent.toLowerCase().includes('twilio')) {
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    });
  }
  return NextResponse.json({ success: true, message: 'Twilio Status Callback endpoint active' });
}


