'use client';

import React from 'react';
import { useDialer } from '@/components/dialer/dialer-context';
import { PhoneCall, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClickToCallProps {
  phone: string;
  name?: string;
  company?: string;
  email?: string;
  clientId?: string;
  variant?: 'button' | 'link' | 'icon';
  className?: string;
  label?: string;
}

export function ClickToCall({
  phone,
  name,
  company,
  email,
  clientId,
  variant = 'link',
  className = '',
  label
}: ClickToCallProps) {
  const { openDialerWithNumber, startCall } = useDialer();

  if (!phone) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    openDialerWithNumber(phone, {
      client_id: clientId,
      name,
      company,
      email,
      phone
    });
    startCall(phone, {
      client_id: clientId,
      name,
      company,
      email,
      phone
    });
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        className={`p-1.5 rounded-full hover:bg-primary/20 text-primary transition-colors cursor-pointer ${className}`}
        title={`Call ${name || phone}`}
      >
        <PhoneCall className="h-4 w-4" />
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <Button
        size="sm"
        onClick={handleClick}
        className={`flex items-center space-x-1.5 ${className}`}
      >
        <Phone className="h-3.5 w-3.5" />
        <span>{label || 'Call'}</span>
      </Button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center space-x-1 text-primary hover:underline font-semibold cursor-pointer ${className}`}
      title={`Click to call ${name || phone}`}
    >
      <PhoneCall className="h-3.5 w-3.5 flex-shrink-0" />
      <span>{label || phone}</span>
    </button>
  );
}
