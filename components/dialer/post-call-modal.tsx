'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { showToast } from '@/components/ui/toast';
import { PhoneCall, CheckCircle, Calendar, Tag, FileText, Clock, Brain, AlertCircle, DollarSign, Target } from 'lucide-react';

interface PostCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callData: {
    phoneNumber: string;
    contactName?: string;
    companyName?: string;
    clientId?: string;
    duration: number;
    direction: 'inbound' | 'outbound';
  } | null;
  onSave: (notesData: {
    outcome: string;
    notes: string;
    followupRequired: boolean;
    followupDate?: string;
    tags: string[];
    customerRequirement?: string;
    painPoints?: string;
    customerInterest?: 'High' | 'Medium' | 'Low' | 'None';
    buyingIntent?: 'Immediate' | 'This Week' | 'This Month' | '1-3 Months' | 'Later' | 'Unknown';
    budget?: string;
    objections?: string;
    competitor?: string;
    nextAction?: string;
    nextActionOwner?: string;
    nextActionDate?: string;
  }) => Promise<void>;
}

const OUTCOMES = [
  { value: 'Connected - Interested', label: 'Connected - Interested' },
  { value: 'Connected - Qualified Lead', label: 'Connected - Qualified Lead' },
  { value: 'Connected - Meeting Booked', label: 'Connected - Meeting Booked' },
  { value: 'Connected - Proposal Requested', label: 'Connected - Proposal Requested' },
  { value: 'Connected - Follow-up Needed', label: 'Connected - Follow-up Needed' },
  { value: 'Left Voicemail', label: 'Left Voicemail' },
  { value: 'Call Back Later', label: 'Call Back Later' },
  { value: 'Not Interested', label: 'Not Interested' },
  { value: 'Wrong Number', label: 'Wrong Number' },
  { value: 'No Answer', label: 'No Answer' },
];

const INTEREST_LEVELS = [
  { value: 'High', label: 'High Interest 🔥' },
  { value: 'Medium', label: 'Medium Interest ⚡' },
  { value: 'Low', label: 'Low Interest ❄️' },
  { value: 'None', label: 'No Interest 🚫' },
];

const BUYING_INTENTS = [
  { value: 'Immediate', label: 'Immediate Purchase' },
  { value: 'This Week', label: 'This Week' },
  { value: 'This Month', label: 'This Month' },
  { value: '1-3 Months', label: '1–3 Months' },
  { value: 'Later', label: 'Later / Future' },
  { value: 'Unknown', label: 'Unknown' },
];

export function PostCallModal({ isOpen, onClose, callData, onSave }: PostCallModalProps) {
  const [outcome, setOutcome] = useState('Connected - Qualified Lead');
  const [notes, setNotes] = useState('');
  const [customerRequirement, setCustomerRequirement] = useState('');
  const [painPoints, setPainPoints] = useState('');
  const [customerInterest, setCustomerInterest] = useState<'High' | 'Medium' | 'Low' | 'None'>('High');
  const [buyingIntent, setBuyingIntent] = useState<'Immediate' | 'This Week' | 'This Month' | '1-3 Months' | 'Later' | 'Unknown'>('This Month');
  const [budget, setBudget] = useState('');
  const [objections, setObjections] = useState('');
  const [competitor, setCompetitor] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');
  const [followupRequired, setFollowupRequired] = useState(true);
  const [followupDate, setFollowupDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Outbound Call', 'Call Intelligence']);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOutcome('Connected - Qualified Lead');
      setNotes('');
      setCustomerRequirement('');
      setPainPoints('');
      setCustomerInterest('High');
      setBuyingIntent('This Month');
      setBudget('');
      setObjections('');
      setCompetitor('');
      setNextAction('');
      setNextActionDate('');
      setFollowupRequired(true);
      setFollowupDate('');
      setTags(['Outbound Call', 'Call Intelligence']);
    }
  }, [isOpen]);

  if (!callData) return null;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}m ${remainder}s`;
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim();
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        outcome,
        notes,
        customerRequirement,
        painPoints,
        customerInterest,
        buyingIntent,
        budget,
        objections,
        competitor,
        nextAction,
        nextActionDate,
        followupRequired,
        followupDate: followupRequired ? (followupDate || nextActionDate) : undefined,
        tags
      });
      showToast('Call Intelligence logged successfully', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Error saving call notes', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Post-Call Intelligence & Sales Summary"
      description="Record meeting outcomes, pain points, customer intent, objections, and next actions."
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {/* Call Summary Banner */}
        <div className="p-3 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <PhoneCall className="h-4 w-4 text-primary" />
            <div>
              <p className="font-bold text-foreground">
                {callData.contactName || callData.phoneNumber}
              </p>
              <p className="text-muted-foreground text-[11px]">
                {callData.companyName ? `${callData.companyName} • ` : ''}{callData.phoneNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-primary font-semibold">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDuration(callData.duration)}</span>
          </div>
        </div>

        {/* Outcome Selector */}
        <Select
          label="Call Outcome *"
          options={OUTCOMES}
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          required
        />

        {/* Customer Interest & Buying Intent */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Prospect Interest Level *"
            options={INTEREST_LEVELS}
            value={customerInterest}
            onChange={(e) => setCustomerInterest(e.target.value as any)}
          />
          <Select
            label="Buying Intent Timeline *"
            options={BUYING_INTENTS}
            value={buyingIntent}
            onChange={(e) => setBuyingIntent(e.target.value as any)}
          />
        </div>

        {/* Customer Requirement & Pain Points */}
        <div className="space-y-3 pt-1">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Customer Requirement & Scope
            </label>
            <input
              type="text"
              placeholder="What software/service solution do they need?"
              value={customerRequirement}
              onChange={(e) => setCustomerRequirement(e.target.value)}
              className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Customer Pain Points
            </label>
            <input
              type="text"
              placeholder="What current bottlenecks or challenges are they experiencing?"
              value={painPoints}
              onChange={(e) => setPainPoints(e.target.value)}
              className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Objections & Competitor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Objections Raised
            </label>
            <input
              type="text"
              placeholder="e.g. Budget constraints, implementation time"
              value={objections}
              onChange={(e) => setObjections(e.target.value)}
              className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Competitor Mentioned
            </label>
            <input
              type="text"
              placeholder="e.g. Salesforce, HubSpot, Zoho"
              value={competitor}
              onChange={(e) => setCompetitor(e.target.value)}
              className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
            />
          </div>
        </div>

        {/* Call Summary Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-primary" />
            Executive Conversation Summary
          </label>
          <textarea
            className="flex min-h-[80px] w-full rounded-lg border border-border/40 bg-secondary/35 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Key discussion summary, agreements reached, or pricing discussed..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Next Action & Follow-up */}
        <div className="p-3.5 rounded-xl border border-border/30 bg-secondary/20 space-y-3">
          <h4 className="text-xs font-bold text-foreground flex items-center space-x-1.5">
            <Target className="h-4 w-4 text-primary" />
            <span>Next Action Commitment</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Next Action Required</label>
              <input
                type="text"
                placeholder="e.g. Send technical proposal & schedule demo"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className="w-full bg-background border border-border/40 rounded-lg px-3 py-1.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Next Action Date</label>
              <input
                type="date"
                value={nextActionDate}
                onChange={(e) => {
                  setNextActionDate(e.target.value);
                  setFollowupDate(e.target.value);
                }}
                className="w-full bg-background border border-border/40 rounded-lg px-3 py-1.5 text-xs text-foreground cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-primary" />
            Tags
          </label>
          <div className="flex flex-wrap items-center gap-1.5 min-h-[36px] p-1.5 rounded-lg border border-border/40 bg-secondary/35">
            {tags.map((t, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-primary/15 text-primary font-medium border border-primary/30">
                <span>{t}</span>
                <button type="button" onClick={() => removeTag(t)} className="hover:text-primary/80">×</button>
              </span>
            ))}
            <input
              type="text"
              placeholder="Add tag + Enter..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="bg-transparent border-none text-xs text-foreground focus:outline-none p-1 min-w-[100px]"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-3 border-t border-border/10">
          <Button type="button" variant="outline" onClick={onClose}>
            Skip Notes
          </Button>
          <Button type="submit" isLoading={isSaving}>
            <CheckCircle className="mr-1.5 h-4 w-4" /> Save Call Intelligence
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
