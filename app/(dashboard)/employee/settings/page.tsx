'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { CalendarIntegration } from '@/lib/mock-db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { Calendar, CheckCircle2, XCircle, ArrowRight, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useStore();
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


      </div>
    </div>
  );
}
