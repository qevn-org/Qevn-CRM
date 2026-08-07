import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  console.log('[TWILIO CALL API] Initiating outbound call request');

  try {
    const body = await request.json();
    let { to, employeeId } = body;

    if (!to) {
      return NextResponse.json({ success: false, error: 'Target phone number "to" is required' }, { status: 400 });
    }

    // 1. Sanitize and format phone number to E.164 standard
    let cleanTo = String(to).trim().replace(/[^\d+]/g, '');
    if (!cleanTo.startsWith('+')) {
      if (cleanTo.length === 10 && /^[6789]/.test(cleanTo)) {
        cleanTo = `+91${cleanTo}`;
      } else if (cleanTo.length === 10) {
        cleanTo = `+1${cleanTo}`;
      } else {
        cleanTo = `+${cleanTo}`;
      }
    }

    // 2. Fetch Twilio integration credentials
    let accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    let authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    let fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim();

    if (employeeId) {
      const integration = await db.getTwilioIntegration(employeeId);
      if (integration) {
        accountSid = integration.account_sid || accountSid;
        authToken = integration.auth_token || authToken;
        fromNumber = integration.phone_number || fromNumber;
      }
    }

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json({
        success: false,
        error: 'Twilio Account SID, Auth Token, or Phone Number is not configured.'
      }, { status: 400 });
    }

    // Check if using mock credentials
    if (accountSid.startsWith('ACmock') || accountSid.startsWith('AC_test')) {
      console.log(`[TWILIO CALL API MOCK] Placing mock call to ${cleanTo}`);
      return NextResponse.json({
        success: true,
        callSid: `CA_mock_${Date.now()}`,
        status: 'queued',
        to: cleanTo,
        from: fromNumber,
        isMock: true
      });
    }

    console.log(`[TWILIO CALL API] Placing live Twilio REST call: From ${fromNumber} -> To ${cleanTo}`);

    // TwiML webhook URL with explicit outbound_api flag and employee context
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://crm.qevn.in').replace(/\/$/, '');
    const twimlUrl = `${appUrl}/api/twilio/voice?type=outbound_api&employeeId=${encodeURIComponent(employeeId || '')}&to=${encodeURIComponent(cleanTo)}`;
    const statusCallbackUrl = `${appUrl}/api/twilio/status`;

    // 3. Call Twilio REST API: POST /2010-04-01/Accounts/{AccountSid}/Calls.json
    const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const params = new URLSearchParams({
      To: cleanTo,
      From: fromNumber,
      Url: twimlUrl,
      StatusCallback: statusCallbackUrl,
      StatusCallbackMethod: 'POST',
      Record: 'true'
    });

    // Add status callback events if supported
    ['initiated', 'ringing', 'answered', 'completed'].forEach(evt => {
      params.append('StatusCallbackEvent', evt);
    });

    const res = await fetch(twilioEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const responseText = await res.text();
    console.log(`[TWILIO CALL API RESPONSE STATUS] ${res.status}`);

    if (res.ok) {
      const data = JSON.parse(responseText);
      console.log(`[TWILIO CALL API SUCCESS] Call Sid: ${data.sid} | Status: ${data.status}`);
      return NextResponse.json({
        success: true,
        callSid: data.sid,
        status: data.status,
        to: cleanTo,
        from: fromNumber
      });
    } else {
      console.error(`[TWILIO CALL API ERROR] Status ${res.status}:`, responseText);
      let errorMsg = `Twilio error (${res.status})`;
      let errorCode = null;

      try {
        const errJson = JSON.parse(responseText);
        errorCode = errJson.code;
        errorMsg = errJson.message || errorMsg;

        if (errorCode === 21215) {
          errorMsg = `Geo Permission error (Code 21215): Enable outbound calls to ${cleanTo} in Twilio Console -> Voice -> Settings -> Geo Permissions.`;
        } else if (errorCode === 21210) {
          errorMsg = `Invalid Phone Number (Code 21210): The target number ${cleanTo} is unroutable or improperly formatted.`;
        } else if (errorCode === 20003) {
          errorMsg = `Authentication Error (Code 20003): Invalid Twilio Account SID or Auth Token.`;
        } else if (errorCode === 21614) {
          errorMsg = `Invalid Caller ID (Code 21614): The Twilio number ${fromNumber} does not support voice calls.`;
        }
      } catch (e) {}

      return NextResponse.json({
        success: false,
        error: errorMsg,
        errorCode,
        raw: responseText
      }, { status: res.status });
    }

  } catch (err: any) {
    console.error('[TWILIO CALL API EXCEPTION]', err);
    return NextResponse.json({ success: false, error: err.message || 'Exception placing Twilio call' }, { status: 500 });
  }
}

