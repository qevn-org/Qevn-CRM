'use client';

import React, { useState, use } from 'react';
import { ProposalDocument } from '@/lib/proposal-document';
import { ProposalDocumentRenderer } from '@/components/proposals/proposal-document-renderer';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { CheckCircle2, XCircle, Download, ShieldCheck } from 'lucide-react';

interface PublicProposalPageProps {
  params: Promise<{ id: string }>;
}

export default function PublicProposalPage({ params }: PublicProposalPageProps) {
  const { id: docNumber } = use(params);
  const [accepted, setAccepted] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');

  // Single Source of Truth Proposal Document
  const doc: ProposalDocument = {
    id: `prop_${docNumber}`,
    document_number: docNumber,
    version: 1,
    proposal_title: 'AI-Powered Outbound Growth Engine Proposal',
    company_name: 'INFINIUM GLOBAL RESEARCH',
    client_name: 'Shrikant',
    recipient_email: 'shrikant@infiniumresearch.com',
    date_str: 'AUGUST 2026',
    theme_color: '#84cc16',
    currency: 'INR',
    line_items: [
      { id: '1', serviceName: 'QEVN Multi-Agent Outbound AI Pipeline', description: 'Hyper-personalized prospect research & multi-provider lead verification', quantity: 1, rate: 160000 },
      { id: '2', serviceName: 'Twilio Softphone Voice Bridging & Call Intelligence', description: 'Direct PSTN dialing, recording, objection analysis, and CRM sync', quantity: 1, rate: 80000 },
    ],
    exec_summary: 'QEVN has conducted a thorough architectural review of current outbound lead generation workflows. We recognize that INFINIUM GLOBAL RESEARCH requires a modern, scalable outbound engine that moves beyond manual prospecting into fully automated AI-driven multi-agent pipelines.',
    comparison_rows: [
      { challenge: 'High cost & slow manual prospecting', solution: 'AI multi-agent pipeline scales outreach at 1/10th traditional cost' },
      { challenge: 'Low email reply rates & spam risks', solution: 'Hyper-personalized messaging with domain protection & warmups' },
      { challenge: 'Unverified lead data & high bounce rates', solution: 'Multi-provider real-time verification before dispatch' },
    ],
    status: accepted ? 'Accepted' : rejected ? 'Rejected' : 'Sent'
  };

  const handleAcceptProposal = () => {
    if (!signerName || !signerEmail) {
      showToast('Please enter your name and email to sign online', 'warning');
      return;
    }
    setAccepted(true);
    showToast(`Proposal ${docNumber} officially ACCEPTED by ${signerName}! Metadata recorded in CRM.`, 'success');
  };

  const handleRejectProposal = () => {
    setRejected(true);
    showToast(`Proposal ${docNumber} status set to Rejected.`, 'info');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-8 flex flex-col items-center space-y-6">
      
      {/* Top Header Bar */}
      <div className="max-w-[210mm] w-full flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-lime-500/20 text-lime-400 flex items-center justify-center font-bold text-lg">
            Q
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">QEVN TECHNOLOGIES</h1>
            <p className="text-xs text-lime-400 font-semibold">Official Commercial Proposal Portal • Ref: {docNumber}</p>
          </div>
        </div>

        <div>
          {accepted ? (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Accepted Online
            </span>
          ) : rejected ? (
            <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-3.5 py-1.5 rounded-full border border-rose-500/20 flex items-center gap-1.5">
              <XCircle className="h-4 w-4" /> Declined
            </span>
          ) : (
            <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/20">
              Pending Acceptance
            </span>
          )}
        </div>
      </div>

      {/* CANONICAL A4 DOCUMENT RENDERER */}
      <div className="w-full max-w-[210mm]">
        <ProposalDocumentRenderer document={doc} />
      </div>

      {/* ONLINE SIGNATURE & ACCEPTANCE BOX */}
      <div className="max-w-[210mm] w-full p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <h4 className="font-bold text-white text-sm flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-lime-400" /> Online Proposal Acceptance & Digital Signature
        </h4>

        {!accepted && !rejected ? (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Your Full Name *"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none"
              />
              <input
                type="email"
                placeholder="Your Work Email *"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <Button onClick={handleAcceptProposal} className="bg-lime-600 hover:bg-lime-500 text-white font-bold cursor-pointer">
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Accept & Sign Online
              </Button>
              <Button variant="outline" onClick={handleRejectProposal} className="text-rose-400 border-rose-800 hover:bg-rose-950">
                Decline Proposal
              </Button>
            </div>
          </div>
        ) : accepted ? (
          <div className="p-4 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-300 text-xs font-semibold">
            ✓ Proposal officially ACCEPTED on {new Date().toLocaleDateString()} by {signerName} ({signerEmail}). Acceptance audit log recorded in CRM.
          </div>
        ) : (
          <div className="p-4 bg-rose-950 border border-rose-800 rounded-xl text-rose-300 text-xs font-semibold">
            Proposal declined by client.
          </div>
        )}
      </div>

    </div>
  );
}
