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
    const targetNum = (num || phoneNumber).trim();
    if (!targetNum) {
      showToast('Please enter a valid phone number', 'warning');
      return;
    }

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

    // Simulate WebRTC Twilio Voice Connection workflow
    setTimeout(() => {
      setCallState('ringing');
    }, 1200);

    setTimeout(() => {
      setCallState('connected');
      showToast(`Call Connected with ${activeContact?.name || targetNum}`, 'success');
    }, 3200);
  };

  const endCall = () => {
    const finalDuration = callDuration;
    const finalContact = activeContact;
    const finalNum = phoneNumber;

    setCallState('ended');

    // Save metadata for Post-Call Notes Modal
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

  const acceptIncomingCall = () => {
    setCallState('connected');
    setCallDuration(0);
    showToast('Incoming call accepted', 'success');
  };

  const declineIncomingCall = () => {
    setCallState('ended');
    setTimeout(() => setCallState('idle'), 600);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    showToast(!isMuted ? 'Microphone Muted' : 'Microphone Unmuted', 'info');
  };

  const toggleHold = () => {
    setIsOnHold(prev => !prev);
    showToast(!isOnHold ? 'Call Placed on Hold' : 'Call Resumed', 'info');
  };

  const sendDtmf = (digit: string) => {
    setDtmfString(prev => prev + digit);
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
