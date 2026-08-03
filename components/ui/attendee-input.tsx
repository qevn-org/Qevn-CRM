'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Client } from '@/lib/mock-db';
import { X, Plus, User, Check, AlertCircle } from 'lucide-react';

interface AttendeeInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  clients?: Client[];
  placeholder?: string;
  label?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AttendeeInput({
  value = [],
  onChange,
  clients = [],
  placeholder = "Type email or search contact...",
  label = "Attendees"
}: AttendeeInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter CRM contacts based on input search
  const filteredContacts = clients.filter(c => {
    if (!c.email) return false;
    const query = inputValue.toLowerCase().trim();
    if (!query) return true;
    return (
      c.client_name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.company_name.toLowerCase().includes(query)
    );
  }).filter(c => !value.includes(c.email!));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addEmailTag = (email: string) => {
    const clean = email.trim().toLowerCase();
    if (!clean) return;

    if (!EMAIL_REGEX.test(clean)) {
      setErrorMsg(`"${clean}" is not a valid email address`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    if (value.includes(clean)) {
      setErrorMsg(`"${clean}" is already added`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    onChange([...value, clean]);
    setInputValue('');
    setErrorMsg('');
    setIsOpen(false);
  };

  const removeEmailTag = (indexToRemove: number) => {
    onChange(value.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      if (inputValue) {
        addEmailTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeEmailTag(value.length - 1);
    }
  };

  const handleContactSelect = (client: Client) => {
    if (client.email) {
      addEmailTag(client.email);
    }
  };

  return (
    <div className="space-y-1.5 w-full relative">
      <div className="flex justify-between items-center">
        {label && (
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </label>
        )}
        <span className="text-[11px] text-muted-foreground font-medium">
          {value.length} attendee{value.length !== 1 ? 's' : ''} added
        </span>
      </div>

      {/* Main Tag Container Box */}
      <div 
        onClick={() => inputRef.current?.focus()}
        className="min-h-[46px] w-full rounded-lg border border-border/40 bg-secondary/35 p-2 text-sm flex flex-wrap items-center gap-1.5 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary cursor-text"
      >
        {/* Render Tag Chips */}
        {value.map((email, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/15 text-primary border border-primary/30 shadow-xs animate-in fade-in zoom-in-95 duration-100"
          >
            <User className="h-3 w-3 text-primary/80" />
            <span>{email}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeEmailTag(idx);
              }}
              className="rounded-full hover:bg-primary/20 p-0.5 transition-colors cursor-pointer text-primary/70 hover:text-primary"
              title="Remove attendee"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {/* Input element */}
        <div className="flex-1 min-w-[160px] relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : "Add more..."}
            className="w-full bg-transparent border-none p-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Error message tooltip */}
      {errorMsg && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-400 mt-1 font-medium animate-in fade-in">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Contact Search Autocomplete Dropdown */}
      {isOpen && filteredContacts.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto rounded-lg border border-border/40 bg-card shadow-xl p-1 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-150 glass"
        >
          <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/20">
            Suggested CRM Contacts ({filteredContacts.length})
          </div>
          {filteredContacts.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleContactSelect(c)}
              className="w-full text-left flex items-center justify-between p-2 rounded-md hover:bg-secondary/40 transition-colors text-xs cursor-pointer group"
            >
              <div className="flex flex-col">
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {c.client_name}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {c.email} • {c.company_name}
                </span>
              </div>
              <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
            </button>
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground mt-1">
        Type an email and press <kbd className="px-1 py-0.5 rounded bg-secondary text-[10px] font-mono">Enter</kbd> or <kbd className="px-1 py-0.5 rounded bg-secondary text-[10px] font-mono">Tab</kbd> to add attendee chip.
      </p>
    </div>
  );
}
