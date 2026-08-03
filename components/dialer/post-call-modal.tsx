'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { showToast } from '@/components/ui/toast';
import { PhoneCall, CheckCircle, Calendar, Tag, FileText, Clock } from 'lucide-react';

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
  }) => Promise<void>;
}

const OUTCOMES = [
  { value: 'Connected - Interested', label: 'Connected - Interested' },
  { value: 'Connected - Follow-up Needed', label: 'Connected - Follow-up Needed' },
  { value: 'Left Voicemail', label: 'Left Voicemail' },
  { value: 'Call Back Later', label: 'Call Back Later' },
  { value: 'Not Interested', label: 'Not Interested' },
  { value: 'Wrong Number', label: 'Wrong Number' },
  { value: 'No Answer', label: 'No Answer' },
];

export function PostCallModal({ isOpen, onClose, callData, onSave }: PostCallModalProps) {
  const [outcome, setOutcome] = useState('Connected - Interested');
  const [notes, setNotes] = useState('');
  const [followupRequired, setFollowupRequired] = useState(false);
  const [followupDate, setFollowupDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Outbound Call']);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOutcome('Connected - Interested');
      setNotes('');
      setFollowupRequired(false);
      setFollowupDate('');
      setTags(['Outbound Call']);
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
        followupRequired,
        followupDate: followupRequired ? followupDate : undefined,
        tags
      });
      showToast('Call notes logged successfully', 'success');
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
      title="Post-Call Summary & Notes"
      description="Record meeting outcome, key notes, and schedule follow-up actions."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Call Summary Banner */}
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/10 flex items-center justify-between text-xs">
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

        {/* Call Notes Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-primary" />
            Call Notes
          </label>
          <textarea
            className="flex min-h-[90px] w-full rounded-lg border border-border/40 bg-secondary/35 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Type key call points, requirements, or next steps..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Follow-up Section */}
        <div className="p-3 rounded-lg border border-border/30 bg-secondary/20 space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium">
            <input
              type="checkbox"
              checked={followupRequired}
              onChange={(e) => setFollowupRequired(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <span className="text-foreground">Requires Follow-up Action</span>
          </label>

          {followupRequired && (
            <div className="pt-2 animate-in fade-in">
              <Input
                label="Follow-up Date"
                type="date"
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
                required={followupRequired}
              />
            </div>
          )}
        </div>

        {/* Tags Section */}
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
            <CheckCircle className="mr-1.5 h-4 w-4" /> Save Call Log
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
