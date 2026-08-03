import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accountSid, authToken } = await request.json();

    if (!accountSid || !authToken) {
      return NextResponse.json(
        { success: false, error: 'Account SID and Auth Token are required' },
        { status: 400 }
      );
    }

    // Demo/Mock Account SID validator
    if (accountSid.startsWith('ACmock') || accountSid.startsWith('AC_test')) {
      return NextResponse.json({
        success: true,
        friendlyName: 'QEVN Twilio Demo Account (Connected)',
        status: 'active',
        isMock: true
      });
    }

    // Live Twilio API authentication check
    const authHeader = 'Basic ' + Buffer.from(`${accountSid.trim()}:${authToken.trim()}`).toString('base64');
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid.trim()}.json`, {
      headers: {
        'Authorization': authHeader
      }
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        success: true,
        friendlyName: data.friendly_name || data.sid,
        status: data.status
      });
    } else {
      const errText = await res.text();
      console.error('[TWILIO VALIDATE ERROR]', res.status, errText);
      return NextResponse.json(
        { success: false, error: `Twilio verification failed (${res.status}): Invalid Account SID or Auth Token` },
        { status: 401 }
      );
    }
  } catch (err: any) {
    console.error('[TWILIO VALIDATE EXCEPTION]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error connecting to Twilio API' },
      { status: 500 }
    );
  }
}
