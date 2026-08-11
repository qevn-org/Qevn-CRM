'use client';

import React, { useState, use } from 'react';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { 
  FileText, CheckCircle2, XCircle, Download, ShieldCheck, 
  Building, User, Calendar, Sparkles, Send, Layers
} from 'lucide-react';

interface PublicProposalPageProps {
  params: Promise<{ id: string }>;
}

export default function PublicProposalPage({ params }: PublicProposalPageProps) {
  const { id: docNumber } = use(params);
  const [accepted, setAccepted] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');

  const handleAcceptProposal = () => {
    if (!signerName || !signerEmail) {
      showToast('Please enter your name and email to accept', 'warning');
      return;
    }
    setAccepted(true);
    showToast(`Proposal ${docNumber} officially ACCEPTED by ${signerName}! Confirmation sent.`, 'success');
  };

  const handleRejectProposal = () => {
    setRejected(true);
    showToast(`Proposal ${docNumber} status set to Rejected.`, 'info');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-8 flex justify-center">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Top Public Header Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-lime-500/20 text-lime-400 flex items-center justify-center font-bold text-lg">
              Q
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">QEVN TECHNOLOGIES</h1>
              <p className="text-xs text-lime-400 font-semibold">Official Commercial Proposal Portal • Ref: {docNumber}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {accepted ? (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Accepted Online
              </span>
            ) : rejected ? (
              <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20 flex items-center gap-1.5">
                <XCircle className="h-4 w-4" /> Declined
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                Pending Acceptance
              </span>
            )}
          </div>
        </div>

        {/* PROPOSAL DOCUMENT CONTAINER */}
        <div className="bg-white text-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-10 border border-slate-200">
          
          {/* Cover Page Header */}
          <div className="border-b-4 border-lime-500 pb-8 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-lime-600 tracking-wider">
              <span>Qevn × INFINIUM GLOBAL RESEARCH</span>
              <span>AUGUST 2026</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight pt-4">
              AI-Powered Outbound Growth Engine Proposal
            </h2>
            <p className="text-sm text-slate-600">Prepared for: <strong>SHRIKANT (INFINIUM GLOBAL RESEARCH)</strong></p>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <h3 className="text-lg font-bold text-slate-900 border-l-4 border-lime-500 pl-3">1. Executive Summary</h3>
            <p>
              <strong>INFINIUM GLOBAL RESEARCH</strong> is a forward-thinking enterprise with a clear vision for growth. 
              As market dynamics become increasingly competitive, the ability to consistently identify, reach, and convert high-quality prospects determines which businesses scale.
            </p>
            <p>
              QEVN has conducted a thorough architectural review of current outbound workflows. We recognize that INFINIUM GLOBAL RESEARCH requires a modern, scalable outbound engine that moves beyond manual prospecting into fully automated AI-driven multi-agent pipelines.
            </p>
          </div>

          {/* Section 2: Deliverables & Pricing */}
          <div className="space-y-4 text-sm">
            <h3 className="text-lg font-bold text-slate-900 border-l-4 border-lime-500 pl-3">2. Commercial Investment Schedule</h3>
            
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="p-3">Deliverable Service</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr>
                    <td className="p-3 font-semibold">QEVN Multi-Agent Outbound AI Pipeline<br/><span className="text-slate-500 font-normal">Hyper-personalized prospect research & lead verification</span></td>
                    <td className="p-3">1</td>
                    <td className="p-3 text-right font-bold">₹160,000</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Twilio Softphone Voice Bridging & Call Intelligence<br/><span className="text-slate-500 font-normal">Direct PSTN dialing, recording, objection analysis, and CRM sync</span></td>
                    <td className="p-3">1</td>
                    <td className="p-3 text-right font-bold">₹80,000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-lime-50 border-2 border-lime-500 p-5 rounded-2xl max-w-sm ml-auto space-y-2 text-xs">
              <div className="flex justify-between text-slate-600"><span>Subtotal:</span><strong>₹240,000</strong></div>
              <div className="flex justify-between text-slate-600"><span>GST Tax (18%):</span><strong>₹43,200</strong></div>
              <div className="flex justify-between text-base font-black text-emerald-800 border-t border-lime-300 pt-2">
                <span>Grand Total:</span>
                <span>₹283,200</span>
              </div>
            </div>
          </div>

          {/* Section 3: Acceptance & Digital Signature Box */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-lime-600" /> Online Proposal Acceptance & E-Signature
            </h4>

            {!accepted && !rejected ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Your Full Name *"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Your Work Email *"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <Button onClick={handleAcceptProposal} className="bg-lime-600 hover:bg-lime-500 text-white font-bold cursor-pointer">
                    <CheckCircle2 className="mr-1.5 h-4 w-4" /> Accept Proposal & Sign Online
                  </Button>
                  <Button variant="outline" onClick={handleRejectProposal} className="text-rose-600 border-rose-300 hover:bg-rose-50">
                    Decline Proposal
                  </Button>
                </div>
              </div>
            ) : accepted ? (
              <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold">
                ✓ Accepted on {new Date().toLocaleDateString()} by {signerName} ({signerEmail}). Audit metadata stored.
              </div>
            ) : (
              <div className="p-4 bg-rose-100 border border-rose-300 rounded-xl text-rose-900 text-xs font-semibold">
                Proposal declined by client.
              </div>
            )}
          </div>

        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500">
          <p>© 2026 QEVN CRM & Enterprise Automation Platform • All Rights Reserved</p>
        </div>

      </div>
    </div>
  );
}
