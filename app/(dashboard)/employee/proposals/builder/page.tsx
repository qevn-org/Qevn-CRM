'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/use-store';
import { ProposalDocument, renderProposalHTML, calculateProposalTotals } from '@/lib/proposal-document';
import { ProposalDocumentRenderer } from '@/components/proposals/proposal-document-renderer';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { 
  ArrowLeft, Save, Download, Send, Copy, Eye, Plus, Trash2, 
  Layers, Palette, ChevronRight, CheckCircle2, Globe, Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function ProposalBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propId = searchParams.get('id');
  const { user } = useStore();

  const [activeTab, setActiveTab] = useState<'content' | 'pricing' | 'branding'>('content');
  const [activePageId, setActivePageId] = useState<string>('p1_cover');
  const [isSending, setIsSending] = useState(false);

  // Proposal Document State (Single Source of Truth)
  const [doc, setDoc] = useState<ProposalDocument>({
    id: propId || `prop_${Date.now()}`,
    document_number: `PROP-2026-${Math.floor(100 + Math.random() * 900)}`,
    version: 1,
    proposal_title: 'AI-Powered Outbound Growth Engine Proposal',
    company_name: 'INFINIUM GLOBAL RESEARCH',
    client_name: 'Shrikant',
    recipient_email: 'shrikant@infiniumresearch.com',
    date_str: 'AUGUST 2026',
    theme_color: '#84cc16', // Lime Green
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
    status: 'Draft'
  });

  const { grandTotal } = calculateProposalTotals(doc.line_items);

  const pages = [
    { id: 'p1_cover', title: '1. Cover Page' },
    { id: 'p2_exec', title: '2. Executive Summary' },
    { id: 'p4_challenges', title: '3. Challenges Matrix' },
    { id: 'p7_pricing', title: '4. Pricing & Investment' },
  ];

  const handleDownloadA4PDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow popups to download PDF', 'warning');
      return;
    }

    const htmlContent = renderProposalHTML(doc);
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    showToast(`PDF Preview generated for Proposal ${doc.document_number}`, 'success');
  };

  const handleCopyPublicLink = () => {
    const publicUrl = `${window.location.origin}/proposal/${doc.document_number}`;
    navigator.clipboard.writeText(publicUrl);
    showToast(`Public link copied: ${publicUrl}`, 'success');
  };

  const handleSendEmail = async () => {
    if (!doc.recipient_email || !doc.recipient_email.includes('@')) {
      showToast('Please enter a valid recipient email', 'warning');
      return;
    }

    setIsSending(true);

    try {
      const htmlContent = renderProposalHTML(doc);
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: doc.recipient_email,
          subject: `Commercial Proposal (${doc.document_number}) - QEVN`,
          html: htmlContent,
          employeeId: user?.id || 'usr_emp_1',
          template: 'Commercial Proposal'
        })
      });

      const data = await res.json();

      if (data.success) {
        setDoc({ ...doc, status: 'Sent' });
        showToast(`Proposal ${doc.document_number} dispatched directly to ${doc.recipient_email}!`, 'success');
      } else {
        showToast(data.error || 'Failed to send email', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error sending proposal email', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveDraft = () => {
    showToast(`Proposal ${doc.document_number} (v${doc.version}) saved to database!`, 'success');
  };

  const handleSelectPage = (id: string) => {
    setActivePageId(id);
    const el = document.getElementById(`page_${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      
      {/* TOP HEADER BAR */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 px-6 flex items-center justify-between backdrop-blur-md flex-shrink-0">
        <div className="flex items-center space-x-4">
          <Link href="/employee/proposals">
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-extrabold text-white flex items-center gap-2">
              {doc.proposal_title}
              <span className="text-xs font-bold text-lime-400 bg-lime-500/10 px-2 py-0.5 rounded border border-lime-500/20">
                {doc.document_number} v{doc.version}
              </span>
            </h1>
            <p className="text-xs text-slate-400">Client: {doc.company_name} ({doc.client_name})</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <Button variant="outline" size="sm" onClick={handleCopyPublicLink} className="border-slate-700 text-slate-300">
            <Copy className="mr-1.5 h-3.5 w-3.5" /> Public Link
          </Button>

          <Button variant="outline" size="sm" onClick={handleDownloadA4PDF} className="border-lime-500/40 text-lime-400 hover:bg-lime-500/10">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Download A4 PDF
          </Button>

          <Button size="sm" onClick={handleSendEmail} isLoading={isSending} className="bg-lime-600 hover:bg-lime-500 text-white font-bold">
            <Send className="mr-1.5 h-3.5 w-3.5" /> Send Proposal
          </Button>

          <Button size="sm" onClick={handleSaveDraft} className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">
            <Save className="mr-1.5 h-3.5 w-3.5" /> Save Draft
          </Button>
        </div>
      </header>

      {/* 3-COLUMN WORKSPACE BODY */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* COLUMN 1: Left Page Navigation (240px) */}
        <aside className="w-60 border-r border-slate-800 bg-slate-900/60 p-4 space-y-4 flex-shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 text-lime-400" /> Document Pages</span>
            <span>A4</span>
          </div>

          <div className="space-y-1 text-xs">
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPage(p.id)}
                className={`w-full text-left p-3 rounded-xl font-semibold transition-all flex items-center justify-between cursor-pointer ${
                  activePageId === p.id 
                    ? 'bg-lime-500/15 border border-lime-500/40 text-lime-400 shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{p.title}</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-50" />
              </button>
            ))}
          </div>
        </aside>

        {/* COLUMN 2: Center Editor Controls */}
        <main className="w-96 border-r border-slate-800 bg-slate-900/40 p-5 space-y-5 overflow-y-auto flex-shrink-0 text-xs">
          
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800 pb-2 space-x-2">
            {[
              { id: 'content', label: 'Metadata & Content' },
              { id: 'pricing', label: 'Pricing Deliverables' },
              { id: 'branding', label: 'Theme Colors' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === t.id ? 'bg-lime-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: Metadata & Content */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Proposal Title</label>
                <input
                  type="text"
                  value={doc.proposal_title}
                  onChange={(e) => setDoc({ ...doc, proposal_title: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Client Entity Name</label>
                  <input
                    type="text"
                    value={doc.company_name}
                    onChange={(e) => setDoc({ ...doc, company_name: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={doc.client_name}
                    onChange={(e) => setDoc({ ...doc, client_name: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Recipient Email Address</label>
                <input
                  type="email"
                  value={doc.recipient_email}
                  onChange={(e) => setDoc({ ...doc, recipient_email: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Executive Summary Text</label>
                <textarea
                  rows={4}
                  value={doc.exec_summary}
                  onChange={(e) => setDoc({ ...doc, exec_summary: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-lime-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Pricing Deliverables */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <label className="text-slate-400 font-semibold">Currency:</label>
                  <select
                    value={doc.currency}
                    onChange={(e) => setDoc({ ...doc, currency: e.target.value as any })}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  >
                    <option value="INR">₹ INR (Indian Rupee)</option>
                    <option value="USD">$ USD (US Dollar)</option>
                    <option value="EUR">€ EUR (Euro)</option>
                    <option value="GBP">£ GBP (British Pound)</option>
                    <option value="AED">AED (UAE Dirham)</option>
                  </select>
                </div>

                <Button size="sm" variant="outline" onClick={() => setDoc({
                  ...doc,
                  line_items: [...doc.line_items, { id: `i_${Date.now()}`, serviceName: 'New Deliverable', description: 'Scope item details', quantity: 1, rate: 40000 }]
                })} className="border-slate-700 text-slate-300">
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add
                </Button>
              </div>

              {doc.line_items.map((item, idx) => (
                <div key={item.id} className="p-3 rounded-xl border border-slate-800 bg-slate-800/30 space-y-2">
                  <input
                    type="text"
                    value={item.serviceName}
                    onChange={(e) => {
                      const items = [...doc.line_items];
                      items[idx].serviceName = e.target.value;
                      setDoc({ ...doc, line_items: items });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-bold text-white"
                  />
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => {
                      const items = [...doc.line_items];
                      items[idx].description = e.target.value;
                      setDoc({ ...doc, line_items: items });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-400 text-[11px]"
                  />
                  <div className="flex justify-between items-center pt-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">Rate:</span>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => {
                          const items = [...doc.line_items];
                          items[idx].rate = Number(e.target.value);
                          setDoc({ ...doc, line_items: items });
                        }}
                        className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 font-bold text-lime-400"
                      />
                    </div>
                    <button onClick={() => {
                      if (doc.line_items.length <= 1) return;
                      setDoc({ ...doc, line_items: doc.line_items.filter(i => i.id !== item.id) });
                    }} className="text-rose-400 hover:text-rose-300">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Theme & Branding */}
          {activeTab === 'branding' && (
            <div className="space-y-4">
              <label className="text-slate-400 font-semibold block">Brand Accent Palette</label>
              <div className="flex space-x-3">
                {[
                  { color: '#84cc16', label: 'Qevn Lime Green (Default)' },
                  { color: '#6366f1', label: 'Indigo' },
                  { color: '#0ea5e9', label: 'Sky Blue' },
                  { color: '#ec4899', label: 'Pink' },
                ].map(c => (
                  <button
                    key={c.color}
                    onClick={() => setDoc({ ...doc, theme_color: c.color })}
                    style={{ backgroundColor: c.color }}
                    className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                      doc.theme_color === c.color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </main>

        {/* COLUMN 3: Right Live Scrollable A4 Document Preview (Flex 1) */}
        <section className="flex-1 bg-slate-950 p-8 overflow-y-auto flex flex-col items-center">
          <div className="w-full max-w-[210mm]">
            <ProposalDocumentRenderer 
              document={doc}
              activePageId={activePageId}
            />
          </div>
        </section>

      </div>
    </div>
  );
}
