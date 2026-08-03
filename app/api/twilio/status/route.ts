import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      callSid, 
      employeeId, 
      clientId, 
      contactName, 
      companyName, 
      phoneNumber, 
      direction = 'outbound', 
      duration = 0, 
      status = 'completed', 
      outcome, 
      notes, 
      followupRequired = false, 
      followupDate, 
      tags = [] 
    } = body;

    console.log(`[TWILIO CALL STATUS API] Logging call: ${phoneNumber} | Duration: ${duration}s | Status: ${status}`);

    // Create call log entry in CRM DB
    const callLog = await db.createCallLog({
      call_sid: callSid || `CA_${Math.random().toString(36).substring(2, 11)}`,
      client_id: clientId,
      employee_id: employeeId || 'usr_emp_1',
      contact_name: contactName,
      company_name: companyName,
      phone_number: phoneNumber,
      direction,
      duration: Number(duration) || 0,
      status,
      outcome,
      notes,
      recording_url: `https://api.twilio.com/2010-04-01/Accounts/ACmock/Recordings/RE${Date.now()}.mp3`,
      recording_duration: Number(duration) || 0,
      followup_required: followupRequired,
      followup_date: followupDate,
      tags
    });

    // Create CRM activity entry
    if (employeeId) {
      await db.createActivity({
        client_id: clientId,
        employee_id: employeeId,
        action: direction === 'outbound' ? 'Outbound Call Placed' : 'Inbound Call Received',
        description: `${direction === 'outbound' ? 'Called' : 'Received call from'} ${contactName || phoneNumber} (${duration}s) - ${outcome || status}`
      });
    }

    return NextResponse.json({ success: true, callLog });
  } catch (err: any) {
    console.error('[TWILIO STATUS API ERROR]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
