'use client';

import React, { useState } from 'react';
import { useDialer } from './dialer-context';
import { PostCallModal } from './post-call-modal';
import { Button } from '@/components/ui/button';
import { 
  Phone, PhoneOff, Mic, MicOff, Pause, Play, Grid, X, ChevronDown, 
  User, Search, Volume2, ShieldCheck, AlertCircle, PhoneIncoming, Sparkles
} from 'lucide-react';

export function Softphone() {
  const {
    isDialerOpen,
    setIsDialerOpen,
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
    acceptIncomingCall,
    declineIncomingCall,
    toggleMute,
    toggleHold,
    sendDtmf,
    postCallModalOpen,
    setPostCallModalOpen,
    lastCallData,
    savePostCallNotes
  } = useDialer();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const filteredContacts = clients.filter(c => {
    if (!c.phone) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.client_name.toLowerCase().includes(q) ||
      c.company_name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  const handleKeyPress = (digit: string) => {
    if (callState === 'connected') {
      sendDtmf(digit);
    } else {
      setPhoneNumber(phoneNumber + digit);
    }
  };

  return (
    <>
      {/* Floating Softphone Launcher Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        {!isDialerOpen && (
          <button
            onClick={() => setIsDialerOpen(true)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-full shadow-2xl transition-all duration-200 cursor-pointer ${
              callState === 'connected'
                ? 'bg-emerald-500 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold hover:scale-105 shadow-emerald-500/20'
            }`}
          >
            <Phone className="h-5 w-5" />
            <span className="font-bold text-sm">
              {callState === 'connected' ? `In Call (${formatTimer(callDuration)})` : 'Phone Dialer'}
            </span>
          </button>
        )}
      </div>

      {/* Main Softphone Panel Window */}
      {isDialerOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 rounded-2xl border border-border/40 bg-card shadow-2xl glass overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Header Bar */}
          <div className="px-4 py-3 bg-secondary/50 border-b border-border/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-primary" />
              <span className="font-bold text-xs tracking-wide">QEVN Softphone</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                Twilio Voice
              </span>
            </div>
            <button
              onClick={() => setIsDialerOpen(false)}
              className="rounded-full p-1 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 space-y-4">

            {/* INCOMING CALL BANNER */}
            {callState === 'incoming' && (
              <div className="p-4 rounded-xl border border-blue-500/40 bg-blue-500/10 text-center space-y-3 animate-pulse">
                <div className="flex justify-center">
                  <PhoneIncoming className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">Incoming Call</h4>
                  <p className="text-xs text-muted-foreground">{activeContact?.name || 'Unknown Caller'}</p>
                  <p className="text-[11px] text-blue-300 font-semibold">{phoneNumber || '+1 202-555-0199'}</p>
                </div>
                <div className="flex justify-center space-x-3 pt-2">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={acceptIncomingCall}>
                    Accept
                  </Button>
                  <Button size="sm" variant="destructive" onClick={declineIncomingCall}>
                    Decline
                  </Button>
                </div>
              </div>
            )}

            {/* ACTIVE CALL VIEW (Calling / Ringing / Connected / Ended) */}
            {callState !== 'idle' && callState !== 'incoming' && (
              <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
                
                {/* Caller Avatar with Pulse */}
                <div className="relative">
                  <div className={`w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary shadow-lg ${
                    callState === 'connected' ? 'animate-pulse' : ''
                  }`}>
                    <User className="h-10 w-10" />
                  </div>
                  {callState === 'connected' && (
                    <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card" />
                  )}
                </div>

                {/* Caller Info */}
                <div>
                  <h3 className="font-bold text-foreground text-base">
                    {activeContact?.name || phoneNumber || 'Dialing...'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {activeContact?.company ? `${activeContact.company} • ` : ''}{phoneNumber}
                  </p>
                  
                  {/* Status Indicator */}
                  <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/60">
                    <span className={`w-2 h-2 rounded-full ${
                      callState === 'calling' ? 'bg-amber-400 animate-ping' :
                      callState === 'ringing' ? 'bg-blue-400 animate-ping' :
                      callState === 'connected' ? 'bg-emerald-400' : 'bg-red-400'
                    }`} />
                    <span className="capitalize">
                      {callState === 'connected' ? formatTimer(callDuration) : callState}
                    </span>
                  </div>

                  {dtmfString && (
                    <p className="text-xs font-mono text-primary mt-1">DTMF: {dtmfString}</p>
                  )}
                </div>

                {/* Call Control Action Bar */}
                <div className="grid grid-cols-3 gap-3 w-full max-w-[240px] pt-2">
                  <button
                    onClick={toggleMute}
                    className={`p-3 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      isMuted ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-secondary/60 hover:bg-secondary text-foreground'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>

                  <button
                    onClick={toggleHold}
                    className={`p-3 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      isOnHold ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-secondary/60 hover:bg-secondary text-foreground'
                    }`}
                    title={isOnHold ? 'Resume' : 'Hold'}
                  >
                    {isOnHold ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                  </button>

                  <button
                    onClick={() => setShowKeypad(!showKeypad)}
                    className={`p-3 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      showKeypad ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-secondary/60 hover:bg-secondary text-foreground'
                    }`}
                    title="Keypad"
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                </div>

                {/* End Call Button */}
                <div className="pt-2">
                  <button
                    onClick={endCall}
                    className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl transition-transform hover:scale-105 cursor-pointer"
                    title="End Call"
                  >
                    <PhoneOff className="h-6 w-6" />
                  </button>
                </div>
              </div>
            )}

            {/* IDLE DIALER VIEW (Contact Search, Number Display, Dialpad) */}
            {callState === 'idle' && (
              <div className="space-y-3">
                
                {/* Contact Search Input */}
                <div className="relative">
                  <div className="flex items-center px-3 py-1.5 rounded-lg border border-border/40 bg-secondary/35">
                    <Search className="h-3.5 w-3.5 text-muted-foreground mr-2" />
                    <input
                      type="text"
                      placeholder="Search contact by name or phone..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSearchDropdown(true);
                      }}
                      onFocus={() => setShowSearchDropdown(true)}
                      className="w-full bg-transparent border-none text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                  </div>

                  {/* Contact Autocomplete Results */}
                  {showSearchDropdown && searchQuery && filteredContacts.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-border/40 bg-card shadow-xl p-1 glass">
                      {filteredContacts.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setPhoneNumber(c.phone || '');
                            setActiveContact({
                              client_id: c.id,
                              name: c.client_name,
                              company: c.company_name,
                              email: c.email,
                              phone: c.phone
                            });
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left p-2 rounded-md hover:bg-secondary/40 transition-colors text-xs flex justify-between items-center cursor-pointer"
                        >
                          <div>
                            <p className="font-semibold text-foreground">{c.client_name}</p>
                            <p className="text-[11px] text-muted-foreground">{c.company_name} • {c.phone}</p>
                          </div>
                          <Phone className="h-3.5 w-3.5 text-primary" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Contact Card if active */}
                {activeContact && (
                  <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-foreground">{activeContact.name}</p>
                      <p className="text-[11px] text-muted-foreground">{activeContact.company}</p>
                    </div>
                    <button 
                      onClick={() => setActiveContact(null)}
                      className="text-muted-foreground hover:text-foreground text-[10px] uppercase font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* Phone Number Screen */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/40 bg-secondary/20 min-h-[42px]">
                  <input
                    type="text"
                    placeholder="Enter phone number..."
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-transparent border-none text-base font-mono font-semibold tracking-wider text-foreground focus:outline-none"
                  />
                  {phoneNumber && (
                    <button
                      onClick={() => setPhoneNumber('')}
                      className="text-muted-foreground hover:text-foreground p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* DTMF Keypad Grid */}
                <div className="grid grid-cols-3 gap-2 py-1">
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
                      onClick={() => handleKeyPress(item.key)}
                      className="py-2.5 rounded-lg bg-secondary/35 hover:bg-secondary/70 border border-border/20 text-foreground transition-all duration-150 flex flex-col items-center justify-center cursor-pointer active:scale-95"
                    >
                      <span className="text-base font-bold leading-none">{item.key}</span>
                      {item.sub && <span className="text-[9px] text-muted-foreground mt-0.5 leading-none">{item.sub}</span>}
                    </button>
                  ))}
                </div>

                {/* Call Action Button */}
                <Button
                  onClick={() => startCall()}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg flex items-center justify-center space-x-2 rounded-xl cursor-pointer"
                >
                  <Phone className="h-4 w-4" />
                  <span>Call Number</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post-Call Notes Dialog */}
      <PostCallModal
        isOpen={postCallModalOpen}
        onClose={() => setPostCallModalOpen(false)}
        callData={lastCallData}
        onSave={savePostCallNotes}
      />
    </>
  );
}
