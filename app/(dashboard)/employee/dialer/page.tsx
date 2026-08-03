'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/use-store';
import { useDialer } from '@/components/dialer/dialer-context';
import { db } from '@/lib/db';
import { Client, CallLog, Meeting } from '@/lib/mock-db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { showToast } from '@/components/ui/toast';
import { 
  Phone, PhoneOff, Mic, MicOff, Pause, Play, Grid, Search, User, 
  Building2, Mail, Calendar, Clock, Star, PhoneIncoming, PhoneOutgoing, 
  PhoneMissed, ArrowUpRight, ArrowDownLeft, CheckCircle2, RotateCcw, 
  FileText, Tag, Plus, ExternalLink, ShieldCheck, AlertTriangle, Delete
} from 'lucide-react';
import Link from 'next/link';

const OUTCOMES = [
  { value: 'Connected - Interested', label: 'Connected - Interested' },
  { value: 'Connected - Follow-up Needed', label: 'Connected - Follow-up Needed' },
  { value: 'Left Voicemail', label: 'Left Voicemail' },
  { value: 'Call Back Later', label: 'Call Back Later' },
  { value: 'Not Interested', label: 'Not Interested' },
  { value: 'Wrong Number', label: 'Wrong Number' },
  { value: 'No Answer', label: 'No Answer' },
];

function DialerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useStore();

  const {
    callState,
    phoneNumber,
    setPhoneNumber,
    activeContact,
    setActiveContact,
    isMuted,
    isOnHold,
    showKeypad,
    setShowKeypad,
    callDuration,
    dtmfString,
    clients,
    startCall,
    endCall,
    toggleMute,
    toggleHold,
    sendDtmf
  } = useDialer();

  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [clientMeetings, setClientMeetings] = useState<Meeting[]>([]);
  const [selectedTab, setSelectedTab] = useState<'contacts' | 'recent' | 'missed' | 'favorites'>('contacts');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Post-Call Form State inside Right Panel
  const [outcome, setOutcome] = useState('Connected - Interested');
  const [notes, setNotes] = useState('');
  const [followupRequired, setFollowupRequired] = useState(false);
  const [followupDate, setFollowupDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Outbound Call']);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    try {
      const logs = await db.getCallLogs(user.id, user.role);
      const meets = await db.getMeetings(user.id, user.role);
      setCallLogs(logs);
      setClientMeetings(meets);

      // Pre-select contact from URL params if present
      const urlPhone = searchParams.get('phone');
      const urlClientId = searchParams.get('clientId');
      const urlName = searchParams.get('name');

      if (urlPhone) {
        setPhoneNumber(urlPhone);
        if (urlClientId || urlName) {
          const clientObj = clients.find(c => c.id === urlClientId || c.client_name === urlName);
          setActiveContact({
            client_id: urlClientId || clientObj?.id,
            name: urlName || clientObj?.client_name,
            company: clientObj?.company_name,
            email: clientObj?.email,
            phone: urlPhone
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, searchParams]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleSelectContact = (client: Client) => {
    setPhoneNumber(client.phone || '');
    setActiveContact({
      client_id: client.id,
      name: client.client_name,
      company: client.company_name,
      email: client.email,
      phone: client.phone
    });
    showToast(`Loaded ${client.client_name} into dialer`, 'info');
  };

  const handleKeyPress = (digit: string) => {
    if (callState === 'connected') {
      sendDtmf(digit);
    } else {
      setPhoneNumber(phoneNumber + digit);
    }
  };

  const handleBackspace = () => {
    setPhoneNumber(phoneNumber.slice(0, -1));
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingNotes(true);

    try {
      await fetch('/api/twilio/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: user.id,
          clientId: activeContact?.client_id,
          contactName: activeContact?.name,
          companyName: activeContact?.company,
          phoneNumber: phoneNumber || '+12025550199',
          direction: 'outbound',
          duration: callDuration || 120,
          status: 'completed',
          outcome,
          notes,
          followupRequired,
          followupDate: followupRequired ? followupDate : undefined,
          tags
        })
      });

      showToast('Call notes logged to CRM timeline successfully!', 'success');
      setNotes('');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save call notes', 'error');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Filtered contacts based on search query
  const filteredContacts = clients.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      c.client_name.toLowerCase().includes(q) ||
      c.company_name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  // Filtered call logs
  const recentLogs = callLogs.slice(0, 15);
  const missedLogs = callLogs.filter(l => l.status === 'missed' || l.status === 'no-answer');

  // Selected client object
  const selectedClient = clients.find(c => c.id === activeContact?.client_id || (c.phone && c.phone === phoneNumber));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Phone className="h-7 w-7 text-emerald-500" />
            Twilio Business Calling Station
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise full-page softphone console. Make outbound calls, handle incoming inquiries, and record call notes.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Twilio Voice Active
          </Badge>
        </div>
      </div>

      {/* Main 3-Panel Desktop Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        
        {/* =================================================================== */}
        {/* LEFT PANEL: CONTACT DISCOVERY & FEEDS (3 Columns)                   */}
        {/* =================================================================== */}
        <Card className="lg:col-span-3 flex flex-col h-full bg-card border-border/40 shadow-lg">
          <CardHeader className="p-4 pb-2 border-b border-border/20 space-y-3">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Contacts & Call Log</span>
              <span className="text-[11px] text-muted-foreground font-normal">{clients.length} contacts</span>
            </CardTitle>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search name, phone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 flex h-8 w-full rounded-md border border-border/40 bg-secondary/35 px-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 border-b border-border/10 pb-1 text-[11px]">
              {(['contacts', 'recent', 'missed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-2.5 py-1 font-semibold rounded-md transition-all cursor-pointer capitalize ${
                    selectedTab === tab
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-muted-foreground hover:bg-secondary/40'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-2 flex-1 overflow-y-auto max-h-[540px] space-y-1">
            {selectedTab === 'contacts' && (
              filteredContacts.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-10">No contacts found</p>
              ) : (
                filteredContacts.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectContact(c)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between group ${
                      activeContact?.client_id === c.id || phoneNumber === c.phone
                        ? 'border-primary bg-primary/10 shadow-xs'
                        : 'border-transparent hover:bg-secondary/40'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-secondary text-foreground flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {c.client_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                          {c.client_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{c.company_name} • {c.phone || 'No Phone'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectContact(c);
                        startCall(c.phone, {
                          client_id: c.id,
                          name: c.client_name,
                          company: c.company_name,
                          email: c.email,
                          phone: c.phone
                        });
                      }}
                      className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      title="Call Now"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )
            )}

            {selectedTab === 'recent' && (
              recentLogs.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-10">No recent calls</p>
              ) : (
                recentLogs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => {
                      setPhoneNumber(log.phone_number);
                      setActiveContact({
                        client_id: log.client_id,
                        name: log.contact_name,
                        company: log.company_name,
                        phone: log.phone_number
                      });
                    }}
                    className="p-2.5 rounded-lg border border-border/20 hover:bg-secondary/30 transition-all cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      {log.direction === 'outbound' ? (
                        <ArrowUpRight className="h-4 w-4 text-blue-400 flex-shrink-0" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{log.contact_name || log.phone_number}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleDateString()} • {log.duration}s</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]">
                      Redial
                    </Button>
                  </div>
                ))
              )
            )}

            {selectedTab === 'missed' && (
              missedLogs.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-10">No missed calls</p>
              ) : (
                missedLogs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => {
                      setPhoneNumber(log.phone_number);
                      setActiveContact({
                        client_id: log.client_id,
                        name: log.contact_name,
                        company: log.company_name,
                        phone: log.phone_number
                      });
                    }}
                    className="p-2.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <PhoneMissed className="h-4 w-4 text-red-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{log.contact_name || log.phone_number}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] text-red-400 border-red-500/30">
                      Call Back
                    </Button>
                  </div>
                ))
              )
            )}
          </CardContent>
        </Card>

        {/* =================================================================== */}
        {/* CENTER PANEL: MODERN OPAQUE SOFTPHONE CONSOLE (5 Columns)           */}
        {/* =================================================================== */}
        <Card className="lg:col-span-5 flex flex-col h-full bg-card border-border/40 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="p-4 border-b border-border/20 bg-secondary/30 flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <CardTitle className="text-sm font-bold">Twilio Softphone Console</CardTitle>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-semibold">
              Live WebRTC Ready
            </span>
          </CardHeader>

          <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-6 bg-card">
            
            {/* Active Contact Display Card */}
            <div className="p-4 rounded-xl border border-border/30 bg-secondary/30 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 text-primary font-bold flex items-center justify-center text-lg">
                  {activeContact?.name ? activeContact.name.charAt(0) : <User className="h-6 w-6" />}
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">
                    {activeContact?.name || 'Manual Phone Entry'}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {activeContact?.company ? `${activeContact.company} • ` : ''}{activeContact?.email || 'Ready to connect'}
                  </p>
                </div>
              </div>

              {activeContact && (
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setActiveContact(null)}>
                  Clear
                </Button>
              )}
            </div>

            {/* Active Call Status Screen (When in call) */}
            {callState !== 'idle' && (
              <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-center space-y-2 animate-in fade-in">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500 text-white font-bold text-xs animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span className="capitalize">{callState} ({formatTimer(callDuration)})</span>
                </div>
                <p className="text-xs text-emerald-200 font-semibold">{phoneNumber}</p>
                {dtmfString && <p className="text-[11px] font-mono text-emerald-300">DTMF Input: {dtmfString}</p>}
              </div>
            )}

            {/* Phone Screen Display Input */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-secondary/40">
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter number or pick contact..."
                className="w-full bg-transparent border-none text-xl font-mono font-bold tracking-widest text-foreground focus:outline-none placeholder:text-muted-foreground/50"
              />
              <div className="flex items-center space-x-1">
                {phoneNumber && (
                  <button
                    onClick={handleBackspace}
                    className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    title="Backspace"
                  >
                    <Delete className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Solid Tactile Keypad Grid (0-9, *, #) */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: '1', sub: '' },
                { key: '2', sub: 'ABC' },
                { key: '3', sub: 'DEF' },
                { key: '4', sub: 'GHI' },
                { key: '5', sub: 'JKL' },
                { key: '6', sub: 'MNO' },
                { key: '7', sub: 'PQRS' },
                { key: '8', sub: 'TUV' },
                { key: '9', sub: 'WXYZ' },
                { key: '*', sub: '' },
                { key: '0', sub: '+' },
                { key: '#', sub: '' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleKeyPress(item.key)}
                  className="py-3.5 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/30 text-foreground transition-all duration-150 flex flex-col items-center justify-center cursor-pointer shadow-xs active:scale-95 hover:border-primary/40"
                >
                  <span className="text-xl font-bold leading-none">{item.key}</span>
                  {item.sub && <span className="text-[9px] text-muted-foreground font-semibold mt-1 leading-none">{item.sub}</span>}
                </button>
              ))}
            </div>

            {/* Primary Control Action Bar */}
            <div className="space-y-3 pt-2">
              {callState === 'idle' ? (
                <Button
                  onClick={() => startCall()}
                  className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-xl flex items-center justify-center space-x-2 rounded-xl cursor-pointer"
                >
                  <Phone className="h-5 w-5" />
                  <span>Call {phoneNumber || 'Number'}</span>
                </Button>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant={isMuted ? 'destructive' : 'outline'}
                    onClick={toggleMute}
                    className="py-6 flex flex-col items-center justify-center"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    <span className="text-[10px] mt-1">{isMuted ? 'Muted' : 'Mute'}</span>
                  </Button>

                  <Button
                    variant={isOnHold ? 'destructive' : 'outline'}
                    onClick={toggleHold}
                    className="py-6 flex flex-col items-center justify-center"
                    title={isOnHold ? 'Resume' : 'Hold'}
                  >
                    {isOnHold ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                    <span className="text-[10px] mt-1">{isOnHold ? 'Held' : 'Hold'}</span>
                  </Button>

                  <Button
                    variant={showKeypad ? 'primary' : 'outline'}
                    onClick={() => setShowKeypad(!showKeypad)}
                    className="py-6 flex flex-col items-center justify-center"
                  >
                    <Grid className="h-5 w-5" />
                    <span className="text-[10px] mt-1">DTMF</span>
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={endCall}
                    className="py-6 flex flex-col items-center justify-center bg-red-600 hover:bg-red-700 text-white"
                  >
                    <PhoneOff className="h-5 w-5" />
                    <span className="text-[10px] mt-1">Hang Up</span>
                  </Button>
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* =================================================================== */}
        {/* RIGHT PANEL: CONTACT INTELLIGENCE & CALL NOTES (4 Columns)         */}
        {/* =================================================================== */}
        <Card className="lg:col-span-4 flex flex-col h-full bg-card border-border/40 shadow-lg">
          <CardHeader className="p-4 border-b border-border/20 space-y-1">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Contact Intelligence</span>
              {selectedClient && (
                <Link href={`/employee/clients/${selectedClient.id}`} className="text-xs text-primary hover:underline flex items-center">
                  Full Profile <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              Context, notes, and activity timeline for selected caller.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 flex-1 overflow-y-auto space-y-5">
            {/* Selected Client Summary */}
            {selectedClient ? (
              <div className="p-3.5 rounded-xl border border-border/30 bg-secondary/20 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-foreground text-sm">{selectedClient.client_name}</h4>
                    <p className="text-muted-foreground text-xs">{selectedClient.designation || 'Lead Contact'} • {selectedClient.company_name}</p>
                  </div>
                  <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-semibold">
                    {selectedClient.status}
                  </Badge>
                </div>

                <div className="space-y-1 pt-1 text-[11px] text-muted-foreground border-t border-border/10">
                  <p>📧 {selectedClient.email || 'No email'}</p>
                  <p>📞 {selectedClient.phone || 'No phone'}</p>
                  <p>🏢 Industry: {selectedClient.industry || 'Enterprise Technology'}</p>
                  <p>📍 Location: {selectedClient.city ? `${selectedClient.city}, ` : ''}{selectedClient.country || 'India'}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-border/20 bg-secondary/15 text-center text-xs text-muted-foreground space-y-1">
                <User className="h-6 w-6 mx-auto text-muted-foreground/60 mb-1" />
                <p className="font-semibold">No contact selected</p>
                <p className="text-[11px]">Pick a contact from left list or dial a number to view CRM intelligence.</p>
              </div>
            )}

            {/* Post-Call Outcome & Notes Form */}
            <form onSubmit={handleSaveNotes} className="space-y-3 p-3.5 rounded-xl border border-border/30 bg-secondary/20">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Log Call Outcome & Notes
              </h4>

              <Select
                label="Call Outcome *"
                options={OUTCOMES}
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                required
              />

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase">Call Notes</label>
                <textarea
                  className="flex min-h-[75px] w-full rounded-lg border border-border/40 bg-secondary/40 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Record summary of call conversation..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={followupRequired}
                    onChange={(e) => setFollowupRequired(e.target.checked)}
                    className="rounded border-border text-primary h-4 w-4"
                  />
                  <span className="text-foreground">Follow-up Required</span>
                </label>

                {followupRequired && (
                  <Input
                    label="Follow-up Date"
                    type="date"
                    value={followupDate}
                    onChange={(e) => setFollowupDate(e.target.value)}
                    required={followupRequired}
                  />
                )}
              </div>

              <Button type="submit" size="sm" className="w-full text-xs font-semibold" isLoading={isSavingNotes}>
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Save Notes to Timeline
              </Button>
            </form>

            {/* Related Client Meeting History */}
            {selectedClient && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Related Meetings</h4>
                <div className="space-y-1.5">
                  {clientMeetings.filter(m => m.client_id === selectedClient.id).length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic">No meetings scheduled for this client.</p>
                  ) : (
                    clientMeetings.filter(m => m.client_id === selectedClient.id).map(m => (
                      <div key={m.id} className="p-2 rounded bg-secondary/30 text-xs flex justify-between items-center border border-border/20">
                        <div>
                          <p className="font-semibold text-foreground">{m.meeting_title}</p>
                          <p className="text-[10px] text-muted-foreground">{m.meeting_date} at {m.meeting_start}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px]">{m.status || 'Scheduled'}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

export default function DedicatedDialerPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Loading business calling station...</div>}>
      <DialerContent />
    </Suspense>
  );
}
