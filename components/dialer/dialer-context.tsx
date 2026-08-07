'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { Client, CallLog } from '@/lib/mock-db';
import { showToast } from '@/components/ui/toast';

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'incoming';

export interface ActiveContact {
  client_id?: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
}

interface DialerContextType {
  isDialerOpen: boolean;
  setIsDialerOpen: (open: boolean) => void;
  callState: CallState;
  phoneNumber: string;
  setPhoneNumber: (num: string) => void;
  activeContact: ActiveContact | null;
  setActiveContact: (contact: ActiveContact | null) => void;
  isMuted: boolean;
  isOnHold: boolean;
  showKeypad: boolean;
  setShowKeypad: (show: boolean) => void;
  callDuration: number;
  dtmfString: string;
  clients: Client[];
  openDialerWithNumber: (num: string, contact?: ActiveContact) => void;
  startCall: (num?: string, contact?: ActiveContact) => Promise<void>;
  endCall: () => void;
  acceptIncomingCall: () => void;
  declineIncomingCall: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  sendDtmf: (digit: string) => void;
  postCallModalOpen: boolean;
  setPostCallModalOpen: (open: boolean) => void;
  lastCallData: {
    phoneNumber: string;
    contactName?: string;
    companyName?: string;
    clientId?: string;
    duration: number;
    direction: 'inbound' | 'outbound';
  } | null;
  savePostCallNotes: (notesData: {
    outcome: string;
    notes: string;
    followupRequired: boolean;
    followupDate?: string;
    tags: string[];
  }) => Promise<void>;
}

const DialerContext = createContext<DialerContextType | undefined>(undefined);

export function DialerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useStore();
  const [isDialerOpen, setIsDialerOpen] = useState(false);
  const [callState, setCallState] = useState<CallState>('idle');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [activeContact, setActiveContact] = useState<ActiveContact | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [dtmfString, setDtmfString] = useState('');
  const [clients, setClients] = useState<Client[]>([]);

  // Post-Call Notes state
  const [postCallModalOpen, setPostCallModalOpen] = useState(false);
  const [lastCallData, setLastCallData] = useState<{
    phoneNumber: string;
    contactName?: string;
    companyName?: string;
    clientId?: string;
    duration: number;
    direction: 'inbound' | 'outbound';
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const deviceRef = useRef<any>(null);
  const activeCallRef = useRef<any>(null);
  const isDeviceReadyRef = useRef<boolean>(false);

  // Initialize Twilio WebRTC Device for softphone calls
  useEffect(() => {
    if (!user) return;

    let isSubscribed = true;

    async function initTwilioDevice() {
      try {
        console.log('[TWILIO SOFTPHONE] Requesting WebRTC access token...');
        const res = await fetch('/api/twilio/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: user?.id || 'usr_emp_1' })
        });
        const data = await res.json();

        if (!isSubscribed) return;

        if (data.success && data.token && !data.isMock) {
          try {
            console.log('[TWILIO SOFTPHONE] Initializing Twilio WebRTC Voice SDK...');
            const { Device, Call } = await import('@twilio/voice-sdk');

            const device = new Device(data.token, {
              logLevel: 1,
              codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU]
            });

            device.on('registered', () => {
              console.log('[TWILIO SOFTPHONE] WebRTC Softphone Registered & Ready!');
              isDeviceReadyRef.current = true;
            });

            device.on('error', (err: any) => {
              console.error('[TWILIO SOFTPHONE ERROR]', err);
              isDeviceReadyRef.current = false;
            });

            device.on('incoming', (call: any) => {
              console.log('[TWILIO SOFTPHONE INCOMING]', call);
              activeCallRef.current = call;
              setCallState('incoming');
              setPhoneNumber(call.parameters?.From || 'Unknown');
              setIsDialerOpen(true);

              call.on('disconnect', () => {
                setCallState('ended');
                setTimeout(() => setCallState('idle'), 1000);
              });
            });

            await device.register();
            deviceRef.current = device;
          } catch (sdkErr) {
            console.warn('[TWILIO SOFTPHONE] Browser WebRTC SDK initialization notice:', sdkErr);
          }
        } else {
          console.log('[TWILIO SOFTPHONE] Softphone running in demo/simulator mode.');
        }
      } catch (err) {
        console.error('[TWILIO SOFTPHONE TOKEN ERROR]', err);
      }
    }

    initTwilioDevice();

    return () => {
      isSubscribed = false;
      if (deviceRef.current) {
        try {
          deviceRef.current.destroy();
        } catch (e) {}
      }
    };
  }, [user]);

  // Fetch CRM clients for contact auto-complete search
  useEffect(() => {
    if (user) {
      db.getClients(user.id, user.role).then(setClients).catch(console.error);
    }
  }, [user]);

  // Duration Timer Management
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  const openDialerWithNumber = (num: string, contact?: ActiveContact) => {
    setPhoneNumber(num);
    if (contact) setActiveContact(contact);
    setIsDialerOpen(true);
  };

  const startCall = async (num?: string, contact?: ActiveContact) => {
    let targetNum = (num || phoneNumber).trim();
    if (!targetNum) {
      showToast('Please enter a valid phone number', 'warning');
      return;
    }

    // Auto-format 10-digit number to E.164 (+91 for India if starts with 6,7,8,9)
    let cleanDigits = targetNum.replace(/[^\d+]/g, '');
    if (!cleanDigits.startsWith('+')) {
      if (cleanDigits.length === 10 && /^[6789]/.test(cleanDigits)) {
        cleanDigits = `+91${cleanDigits}`;
      } else if (cleanDigits.length === 10) {
        cleanDigits = `+1${cleanDigits}`;
      } else {
        cleanDigits = `+${cleanDigits}`;
      }
    }
    targetNum = cleanDigits;
    setPhoneNumber(targetNum);

    if (contact) setActiveContact(contact);

    // Look up contact if not provided
    if (!contact) {
      const found = clients.find(c => c.phone && c.phone.replace(/\D/g, '').includes(targetNum.replace(/\D/g, '')));
      if (found) {
        setActiveContact({
          client_id: found.id,
          name: found.client_name,
          company: found.company_name,
          email: found.email,
          phone: found.phone
        });
      }
    }

    setIsDialerOpen(true);
    setCallState('calling');
    setCallDuration(0);
    setIsMuted(false);
    setIsOnHold(false);
    setDtmfString('');

    try {
      // 1. Check if Live WebRTC Device is ready in browser
      if (deviceRef.current && isDeviceReadyRef.current) {
        showToast(`Placing live WebRTC call to ${targetNum}...`, 'info');
        console.log(`[TWILIO SOFTPHONE] Connecting WebRTC call to target: ${targetNum}`);

        const call = await deviceRef.current.connect({
          params: {
            To: targetNum,
            type: 'softphone',
            employeeId: user?.id || 'usr_emp_1'
          }
        });

        activeCallRef.current = call;

        call.on('ringing', () => {
          console.log('[TWILIO SOFTPHONE] Target phone is ringing...');
          setCallState('ringing');
          showToast(`Calling ${targetNum}... Recipient phone is ringing!`, 'info');
        });

        call.on('accept', () => {
          console.log('[TWILIO SOFTPHONE] Call connected! 2-way WebRTC audio active.');
          setCallState('connected');
          showToast('Call connected! Microphone active.', 'success');
        });

        call.on('disconnect', () => {
          console.log('[TWILIO SOFTPHONE] Call disconnected.');
          handleCallEnded();
        });

        call.on('error', (err: any) => {
          console.error('[TWILIO SOFTPHONE CALL ERROR]', err);
          showToast(err.message || 'Twilio softphone call error', 'error');
          handleCallEnded();
        });

      } else {
        // 2. Fallback to REST API / Simulator mode
        showToast(`Initiating call to ${targetNum}...`, 'info');

        const res = await fetch('/api/twilio/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: targetNum,
            employeeId: user?.id
          })
        });

        const data = await res.json();

        if (data.success) {
          setCallState('ringing');
          if (data.to) setPhoneNumber(data.to);
          showToast(`Calling ${data.to}...`, 'success');

          setTimeout(() => {
            setCallState('connected');
          }, 3000);
        } else {
          console.error('[DIALER] Twilio Call failed:', data.error);
          setCallState('ended');
          showToast(data.error || 'Failed to place call via Twilio', 'error');
          setTimeout(() => setCallState('idle'), 2000);
        }
      }
    } catch (err: any) {
      console.error('[DIALER] Exception placing call:', err);
      setCallState('ended');
      showToast('Error placing Twilio call', 'error');
      setTimeout(() => setCallState('idle'), 2000);
    }
  };

  const handleCallEnded = () => {
    const finalDuration = callDuration;
    const finalContact = activeContact;
    const finalNum = phoneNumber;

    activeCallRef.current = null;
    setCallState('ended');

    setLastCallData({
      phoneNumber: finalNum,
      contactName: finalContact?.name,
      companyName: finalContact?.company,
      clientId: finalContact?.client_id,
      duration: finalDuration,
      direction: 'outbound'
    });

    setTimeout(() => {
      setCallState('idle');
      setCallDuration(0);
      setPostCallModalOpen(true);
    }, 800);
  };

  const endCall = () => {
    if (activeCallRef.current) {
      try {
        activeCallRef.current.disconnect();
      } catch (e) {}
    } else if (deviceRef.current) {
      try {
        deviceRef.current.disconnectAll();
      } catch (e) {}
    }
    handleCallEnded();
  };

  const acceptIncomingCall = () => {
    if (activeCallRef.current) {
      try {
        activeCallRef.current.accept();
      } catch (e) {}
    }
    setCallState('connected');
    setCallDuration(0);
    showToast('Incoming call accepted', 'success');
  };

  const declineIncomingCall = () => {
    if (activeCallRef.current) {
      try {
        activeCallRef.current.reject();
      } catch (e) {}
    }
    setCallState('ended');
    setTimeout(() => setCallState('idle'), 600);
  };

  const toggleMute = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    if (activeCallRef.current) {
      try {
        activeCallRef.current.mute(newMute);
      } catch (e) {}
    }
    showToast(newMute ? 'Microphone Muted' : 'Microphone Unmuted', 'info');
  };

  const toggleHold = () => {
    setIsOnHold(prev => !prev);
    showToast(!isOnHold ? 'Call Placed on Hold' : 'Call Resumed', 'info');
  };

  const sendDtmf = (digit: string) => {
    setDtmfString(prev => prev + digit);
    if (activeCallRef.current) {
      try {
        activeCallRef.current.sendDigits(digit);
      } catch (e) {}
    }
  };

  const savePostCallNotes = async (notesData: {
    outcome: string;
    notes: string;
    followupRequired: boolean;
    followupDate?: string;
    tags: string[];
  }) => {
    if (!lastCallData || !user) return;

    try {
      await fetch('/api/twilio/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: user.id,
          clientId: lastCallData.clientId,
          contactName: lastCallData.contactName,
          companyName: lastCallData.companyName,
          phoneNumber: lastCallData.phoneNumber,
          direction: lastCallData.direction,
          duration: lastCallData.duration,
          status: 'completed',
          outcome: notesData.outcome,
          notes: notesData.notes,
          followupRequired: notesData.followupRequired,
          followupDate: notesData.followupDate,
          tags: notesData.tags
        })
      });
    } catch (err) {
      console.error('Error persisting call notes:', err);
    }
  };

  return (
    <DialerContext.Provider
      value={{
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
        openDialerWithNumber,
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
      }}
    >
      {children}
    </DialerContext.Provider>
  );
}

export function useDialer() {
  const context = useContext(DialerContext);
  if (!context) {
    throw new Error('useDialer must be used within a DialerProvider');
  }
  return context;
}

