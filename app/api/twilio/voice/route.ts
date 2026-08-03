import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const To = formData.get('To') || formData.get('PhoneNumber') || '';
    const From = formData.get('From') || process.env.TWILIO_PHONE_NUMBER || '+12025550199';
    const record = formData.get('Record') === 'true' ? 'record-from-answer-start' : 'do-not-record';

    console.log(`[TWILIO VOICE WEBOOK] Outbound call to ${To} from ${From}`);

    // Generate TwiML XML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${From}" record="${record}" timeout="30">
    <Number>${To}</Number>
  </Dial>
</Response>`;

    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'text/xml'
      }
    });
  } catch (err) {
    console.error('[TWILIO VOICE ERROR]', err);
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>An error occurred placing the call. Please try again.</Say>
</Response>`;
    return new NextResponse(fallbackTwiml, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
