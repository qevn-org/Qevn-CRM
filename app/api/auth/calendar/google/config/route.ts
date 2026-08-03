import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuthRedirectUri } from '@/lib/auth/google-oauth';

/**
 * Returns the redirect URI and client ID this deployment uses for Google OAuth.
 * Use these exact values in Google Cloud Console → Credentials.
 */
export async function GET(request: NextRequest) {
  const redirectUri = getGoogleOAuthRedirectUri(request);
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const hasSecret = !!process.env.GOOGLE_CLIENT_SECRET;

  return NextResponse.json({
    redirectUri,
    clientId: clientId || null,
    clientConfigured: !!clientId && hasSecret,
    googleConsoleSteps: {
      authorizedJavaScriptOrigins: [new URL(redirectUri).origin],
      authorizedRedirectUris: [redirectUri],
    },
  });
}
