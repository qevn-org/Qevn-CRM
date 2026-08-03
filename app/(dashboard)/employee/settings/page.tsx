'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { CalendarIntegration } from '@/lib/mock-db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { Calendar, CheckCircle2, XCircle, ArrowRight, Phone } from 'lucide-react';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  no_code: 'Google did not return an authorization code. Please try connecting again.',
  exchange_failed: 'Failed to exchange the authorization code. Check that GOOGLE_CLIENT_SECRET is set correctly.',
  state_mismatch: 'OAuth security check failed. Please try connecting again.',
  crash: 'An unexpected error occurred during Google Calendar connection.',
  access_denied: 'You declined Google Calendar access. Connect again when ready.',
};

export default function SettingsPage() {
  const { user } = useStore();
  const searchParams = useSearchParams();
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIntegrations = async () => {
    if (!user) return;
    try {
      const list = await db.getCalendarIntegrations(user.id);
      setIntegrations(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, [user]);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'google') {
      showToast('Google Calendar connected successfully!', 'success');
      window.history.replaceState({}, '', '/employee/settings');
      fetchIntegrations();
    } else if (error) {
      const message = OAUTH_ERROR_MESSAGES[error] ?? `Connection failed: ${error}`;
      showToast(message, 'error');
      window.history.replaceState({}, '', '/employee/settings');
    }
  }, [searchParams, user]);

  const handleConnect = (provider: 'google') => {
    showToast(`Redirecting to ${provider} OAuth consent screen...`, 'info');
    // In production, router.push(`/api/auth/calendar/${provider}`)
    // For demo/fallback, we can redirect or trigger callback mock simulation
    window.location.href = `/api/auth/calendar/${provider}`;
  };

  const handleDisconnect = async (provider: 'google') => {
    if (!user) return;
    try {
      const success = await db.deleteCalendarIntegration(user.id, provider);
      if (success) {
        showToast('Disconnected Google Calendar', 'success');
        
        await db.createActivity({
          employee_id: user.id,
          action: 'Calendar Connected',
          description: `Disconnected ${provider} calendar provider`
        });
        
        fetchIntegrations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isConnected = (provider: 'google') => {
    return integrations.some(i => i.provider === provider);
  };

  if (isLoading) {
    return <div className="text-center py-20 text-muted-foreground animate-pulse">Loading settings pane...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Workspace Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure calendar integrations, synchronizations, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Calendar Card */}
        <Card className="hover:border-primary/20 transition-all duration-200">
          <CardHeader className="flex flex-row items-center space-x-4">
            <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Google Calendar</CardTitle>
              <CardDescription>Sync CRM events with your Google Calendar.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 pb-2">
              <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider">Connected Features</p>
              <ul className="space-y-2 text-xs text-foreground/80">
                <li className="flex items-start">
                  <span className="text-primary mr-2 font-bold">•</span>
                  <span><strong>Auto-Sync CRM Events</strong>: Scheduled discovery meetings automatically synchronize with your Google Calendar.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2 font-bold">•</span>
                  <span><strong>Automatic Google Meet Link</strong>: Secure video call links are dynamically generated and attached to each meeting.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2 font-bold">•</span>
                  <span><strong>Calendar Invitations</strong>: Automated calendar invites are dispatched directly to guests, allowing them to Accept/Decline.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2 font-bold">•</span>
                  <span><strong>Instant Updates</strong>: Modifying or canceling meetings automatically sends updates to all guest calendars.</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-between border-t border-border/20 pt-4">
              <div className="flex items-center space-x-2">
                {isConnected('google') ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">Connected & Synced</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">Not Connected</span>
                  </>
                )}
              </div>

              {isConnected('google') ? (
                <Button variant="destructive" size="sm" onClick={() => handleDisconnect('google')}>
                  Disconnect
                </Button>
              ) : (
                <Button size="sm" className="flex items-center" onClick={() => handleConnect('google')}>
                  Connect Calendar <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Twilio Voice Dialer Settings Component */}
        <TwilioSettingsCard userId={user?.id || ''} />
      </div>
    </div>
  );
}

function TwilioSettingsCard({ userId }: { userId: string }) {
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [twimlAppSid, setTwimlAppSid] = useState('');
  const [voiceRegion, setVoiceRegion] = useState('us1');
  const [recordingEnabled, setRecordingEnabled] = useState(true);

  const [status, setStatus] = useState<'Connected' | 'Not Connected' | 'Invalid Credentials'>('Not Connected');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userId) {
      db.getTwilioIntegration(userId).then(data => {
        if (data) {
          setAccountSid(data.account_sid || '');
          setAuthToken(data.auth_token || '');
          setPhoneNumber(data.phone_number || '');
          setTwimlAppSid(data.twiml_app_sid || '');
          setVoiceRegion(data.voice_region || 'us1');
          setRecordingEnabled(data.recording_enabled !== false);
          setStatus(data.status || 'Connected');
        } else {
          // Pre-fill demo defaults for immediate test capability
          setAccountSid('ACmock_demo_account_12345');
          setAuthToken('mock_auth_token_secret');
          setPhoneNumber('+12025550199');
          setStatus('Connected');
        }
      });
    }
  }, [userId]);

  const handleTestConnection = async () => {
    if (!accountSid || !authToken) {
      showToast('Account SID and Auth Token are required to test', 'warning');
      return;
    }

    setIsTesting(true);
    try {
      const res = await fetch('/api/twilio/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountSid, authToken })
      });
      const data = await res.json();

      if (data.success) {
        setStatus('Connected');
        showToast(`Twilio Connection Verified: ${data.friendlyName || 'Active'}`, 'success');
      } else {
        setStatus('Invalid Credentials');
        showToast(data.error || 'Invalid Twilio credentials', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Error testing Twilio connection', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountSid || !authToken || !phoneNumber) {
      showToast('Account SID, Auth Token, and Twilio Number are required', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await db.saveTwilioIntegration({
        employee_id: userId,
        account_sid: accountSid.trim(),
        auth_token: authToken.trim(),
        phone_number: phoneNumber.trim(),
        twiml_app_sid: twimlAppSid.trim(),
        voice_region: voiceRegion,
        recording_enabled: recordingEnabled,
        status: status === 'Invalid Credentials' ? 'Invalid Credentials' : 'Connected'
      });

      if (saved) {
        showToast('Twilio Voice settings saved successfully!', 'success');

        await db.createActivity({
          employee_id: userId,
          action: 'Twilio Settings Saved',
          description: `Updated Twilio Voice integration settings (${phoneNumber})`
        });
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to save Twilio settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="hover:border-primary/20 transition-all duration-200">
      <CardHeader className="flex flex-row items-center space-x-4">
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
          <Phone className="h-6 w-6" />
        </div>
        <div>
          <CardTitle>Twilio Voice Softphone</CardTitle>
          <CardDescription>Make and receive calls directly inside QEVN CRM.</CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Twilio Account SID *</label>
              <input
                type="text"
                value={accountSid}
                onChange={(e) => setAccountSid(e.target.value)}
                placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="mt-1 flex h-9 w-full rounded-md border border-border/40 bg-secondary/35 px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Twilio Auth Token * (Encrypted)</label>
              <input
                type="password"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="••••••••••••••••••••••••••••••••"
                className="mt-1 flex h-9 w-full rounded-md border border-border/40 bg-secondary/35 px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Twilio Phone Number *</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+12025550199"
                  className="mt-1 flex h-9 w-full rounded-md border border-border/40 bg-secondary/35 px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">TwiML App SID</label>
                <input
                  type="text"
                  value={twimlAppSid}
                  onChange={(e) => setTwimlAppSid(e.target.value)}
                  placeholder="APXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  className="mt-1 flex h-9 w-full rounded-md border border-border/40 bg-secondary/35 px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  checked={recordingEnabled}
                  onChange={(e) => setRecordingEnabled(e.target.checked)}
                  className="rounded border-border text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="text-foreground">Enable Automatic Call Recording</span>
              </label>

              <div className="flex items-center space-x-1.5 text-xs font-semibold">
                {status === 'Connected' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-400">Connected</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{status}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/20 pt-4 space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              isLoading={isTesting}
              className="text-xs"
            >
              Test Connection
            </Button>
            <Button type="submit" size="sm" isLoading={isSaving} className="text-xs">
              Save Twilio Credentials
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
