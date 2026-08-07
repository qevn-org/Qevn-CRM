import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import twilio from 'twilio';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const employeeId = body.employeeId || 'usr_emp_1';

    const integration = await db.getTwilioIntegration(employeeId);

    const accountSid = (integration?.account_sid || process.env.TWILIO_ACCOUNT_SID || '').trim();
    const authToken = (integration?.auth_token || process.env.TWILIO_AUTH_TOKEN || '').trim();
    const twimlAppSid = (integration?.twiml_app_sid || process.env.TWIML_APP_SID || '').trim();
    const apiKey = (process.env.TWILIO_API_KEY || accountSid).trim();
    const apiSecret = (process.env.TWILIO_API_SECRET || authToken).trim();
    const identity = `user_${employeeId.replace(/[^\w-]/g, '_')}`;

    // Validate credentials for live JWT generation
    const isMock = !accountSid || accountSid.startsWith('ACmock') || accountSid.startsWith('AC_test') || !authToken;

    if (isMock) {
      console.log(`[TWILIO TOKEN] Generating demo token for user: ${identity}`);
      return NextResponse.json({
        success: true,
        token: `mock_twilio_token_${identity}_${Date.now()}`,
        identity,
        isMock: true,
        accountSid: accountSid || 'ACmock',
        phoneNumber: integration?.phone_number || process.env.TWILIO_PHONE_NUMBER || '+17167275053',
        message: 'Using Twilio demo simulator token'
      });
    }

    if (!twimlAppSid) {
      console.warn('[TWILIO TOKEN WARNING] TWIML_APP_SID is not set in env or DB integration');
    }

    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    // Create Voice Grant
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true
    });

    // Create Access Token (valid for 1 hour = 3600s)
    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity,
      ttl: 3600
    });

    token.addGrant(voiceGrant);
    const jwtToken = token.toJwt();

    console.log(`[TWILIO TOKEN SUCCESS] Generated Access Token for identity: ${identity} | App SID: ${twimlAppSid}`);

    return NextResponse.json({
      success: true,
      token: jwtToken,
      identity,
      accountSid,
      twimlAppSid,
      phoneNumber: integration?.phone_number || process.env.TWILIO_PHONE_NUMBER,
      recordingEnabled: integration?.recording_enabled ?? true,
      isMock: false
    });
  } catch (err: any) {
    console.error('[TWILIO TOKEN ERROR]', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to generate Twilio Access Token' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId') || 'usr_emp_1';
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ employeeId })
  }));
}

