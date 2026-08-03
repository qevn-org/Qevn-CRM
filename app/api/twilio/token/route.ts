import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { employeeId } = await request.json();
    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Employee ID required' }, { status: 400 });
    }

    const integration = await db.getTwilioIntegration(employeeId);
    
    // Check if integration exists
    if (!integration || integration.status !== 'Connected') {
      return NextResponse.json({
        success: false,
        token: `mock_twilio_token_${employeeId}_${Date.now()}`,
        identity: `user_${employeeId}`,
        isMock: true,
        message: 'Twilio account not connected. Using softphone in demo simulator mode.'
      });
    }

    // Generate token JWT or mock token
    const token = `mock_twilio_token_${employeeId}_${Date.now()}`;
    const identity = `user_${employeeId}`;

    return NextResponse.json({
      success: true,
      token,
      identity,
      accountSid: integration.account_sid,
      phoneNumber: integration.phone_number,
      recordingEnabled: integration.recording_enabled
    });
  } catch (err: any) {
    console.error('[TWILIO TOKEN ERROR]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
