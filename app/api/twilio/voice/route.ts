import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

function formatE164(phone: string): string {
  let clean = phone.trim().replace(/[^\d+]/g, '');
  if (!clean) return '';
  if (!clean.startsWith('+')) {
    if (clean.length === 10 && /^[6789]/.test(clean)) {
      clean = `+91${clean}`;
    } else if (clean.length === 10) {
      clean = `+1${clean}`;
    } else {
      clean = `+${clean}`;
    }
  }
  return clean;
}

function getBaseUrl(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const origin = request.nextUrl.origin || '';
  let raw = envUrl || origin || 'https://crm.qevn.in';
  try {
    if (!raw.startsWith('http')) raw = `https://${raw}`;
    const parsed = new URL(raw);
    return parsed.origin; // Guarantees pure origin e.g. "https://crm.qevn.in" with NO paths like /login
  } catch (e) {
    return 'https://crm.qevn.in';
  }
}

export async function POST(request: NextRequest) {
  try {
    const urlParams = request.nextUrl.searchParams;
    let formData: FormData | null = null;
    try {
      formData = await request.formData();
    } catch (e) {
      // Body might not be form data
    }

    const type = urlParams.get('type') || formData?.get('type')?.toString() || '';
    const employeeId = urlParams.get('employeeId') || formData?.get('employeeId')?.toString() || '';
    const Direction = formData?.get('Direction')?.toString() || 'inbound';
    const From = formData?.get('From')?.toString() || process.env.TWILIO_PHONE_NUMBER || '+17167275053';
    const RawTo = formData?.get('To')?.toString() || formData?.get('Called')?.toString() || urlParams.get('to') || '';
    const To = formatE164(RawTo);
    const callerPhone = process.env.TWILIO_PHONE_NUMBER || '+17167275053';
    const record = formData?.get('Record') === 'true' || urlParams.get('record') === 'true';
    const baseUrl = getBaseUrl(request);
    const statusCallbackUrl = `${baseUrl}/api/twilio/status`;

    console.log(`[TWILIO VOICE WEBHOOK] BaseUrl: "${baseUrl}" | Type: "${type}" | Direction: "${Direction}" | From: "${From}" | To: "${To}" | Employee: "${employeeId}"`);

    const voiceResponse = new twilio.twiml.VoiceResponse();

    // SCENARIO 1: REST API Call (Outbound Call created via POST /2010-04-01/Accounts/{Sid}/Calls.json)
    // The recipient answered the phone. Connect recipient to agent client or play greeting with fallback.
    if (type === 'outbound_api' || Direction === 'outbound-api') {
      console.log('[TWILIO VOICE WEBHOOK] Handling REST API outbound call answered by recipient');
      
      voiceResponse.say({ voice: 'alice' }, 'Connecting your call to QEVN CRM agent. Please wait.');
      
      if (employeeId) {
        const clientIdentity = `user_${employeeId.replace(/[^\w-]/g, '_')}`;
        console.log(`[TWILIO VOICE WEBHOOK] Bridging answered call to WebRTC client identity: ${clientIdentity}`);
        
        const dial = voiceResponse.dial({
          callerId: callerPhone,
          timeout: 30,
          action: statusCallbackUrl,
          method: 'POST'
        });
        dial.client(clientIdentity);

        // Fallback TwiML if agent is not currently online in WebRTC softphone
        voiceResponse.say({ voice: 'alice' }, 'The agent is currently unavailable to take your call. Thank you for calling QEVN CRM.');
      } else {
        voiceResponse.say({ voice: 'alice' }, 'Thank you for answering. Your call with QEVN CRM is connected.');
      }
    } 
    // SCENARIO 2: WebRTC Softphone Call (Browser Twilio Device initiated call)
    // From starts with 'client:' (e.g. client:user_emp_1). Dial target PSTN number To.
    else if (From.startsWith('client:') || type === 'softphone' || Direction === 'inbound') {
      console.log(`[TWILIO VOICE WEBHOOK] Handling Softphone WebRTC call to PSTN number: ${To}`);
      
      if (To) {
        const dial = voiceResponse.dial({
          callerId: callerPhone,
          record: record ? 'record-from-answer' : 'do-not-record',
          timeout: 30,
          action: statusCallbackUrl,
          method: 'POST'
        });
        dial.number(To);
      } else {
        voiceResponse.say({ voice: 'alice' }, 'Invalid recipient phone number requested.');
      }
    } 
    // SCENARIO 3: Generic / Fallback Inbound PSTN call
    else {
      console.log(`[TWILIO VOICE WEBHOOK] Fallback handling for incoming call to ${To}`);
      if (To && To !== From) {
        const dial = voiceResponse.dial({
          callerId: callerPhone,
          record: record ? 'record-from-answer' : 'do-not-record',
          timeout: 30,
          action: statusCallbackUrl,
          method: 'POST'
        });
        dial.number(To);
      } else {
        voiceResponse.say({ voice: 'alice' }, 'Welcome to QEVN CRM Voice Integration. Call connected.');
      }
    }

    const xml = voiceResponse.toString();
    console.log('[TWILIO VOICE WEBHOOK] Generated TwiML:\n', xml);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (err: any) {
    console.error('[TWILIO VOICE ERROR]', err);
    const fallbackResponse = new twilio.twiml.VoiceResponse();
    fallbackResponse.say({ voice: 'alice' }, 'An error occurred connecting your call. Please try again.');
    return new NextResponse(fallbackResponse.toString(), {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
        'Cache-Control': 'no-cache'
      }
    });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}


