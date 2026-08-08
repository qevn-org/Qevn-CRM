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
    return parsed.origin;
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
    const From = formData?.get('From')?.toString() || process.env.TWILIO_PHONE_NUMBER || '+17167275053';
    const RawTo = formData?.get('To')?.toString() || formData?.get('Called')?.toString() || urlParams.get('to') || '';
    const To = formatE164(RawTo);
    const callerPhone = process.env.TWILIO_PHONE_NUMBER || '+17167275053';
    const record = formData?.get('Record') === 'true' || urlParams.get('record') === 'true';
    const baseUrl = getBaseUrl(request);
    const statusCallbackUrl = `${baseUrl}/api/twilio/status`;

    console.log(`[TWILIO VOICE WEBHOOK] Type: "${type}" | From: "${From}" | To: "${To}" | Employee: "${employeeId}"`);

    const voiceResponse = new twilio.twiml.VoiceResponse();

    // Determine the target number to dial
    // For WebRTC softphone calls: To is passed as a parameter
    // For REST API outbound calls: To is passed in URL query params  
    const targetNumber = To || urlParams.get('to') || '';

    if (targetNumber) {
      // DIRECT DIAL — no Say, no greeting, no robot voice.
      // Just immediately connect the audio to the target PSTN number.
      console.log(`[TWILIO VOICE WEBHOOK] Direct dialing ${targetNumber} with callerId ${callerPhone}`);
      
      const dial = voiceResponse.dial({
        callerId: callerPhone,
        record: record ? 'record-from-answer' as const : 'do-not-record' as const,
        timeout: 30,
        action: statusCallbackUrl,
        method: 'POST' as const
      });
      dial.number(targetNumber);
    } else {
      // No target number — should not happen in normal flow
      console.warn('[TWILIO VOICE WEBHOOK] No target number provided, hanging up.');
      voiceResponse.hangup();
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
    // Even on error, return a clean hangup — NO robot voice
    const fallbackResponse = new twilio.twiml.VoiceResponse();
    fallbackResponse.hangup();
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
