'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { showToast } from '@/components/ui/toast';
import { ProposalContract, ProposalPageSection } from '@/lib/mock-db';
import { useStore } from '@/lib/store/use-store';
import { 
  Layers, Plus, Trash2, Download, Send, Eye, Copy, 
  Palette, Type, FileText, CheckCircle2, RefreshCw, Sparkles,
  ChevronRight, ChevronLeft, ShieldCheck, DollarSign, Calendar, Globe
} from 'lucide-react';

interface ProposalEditorWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  proposal?: ProposalContract | null;
  onSave?: (proposal: ProposalContract) => void;
}

export function ProposalEditorWorkspace({ isOpen, onClose, proposal, onSave }: ProposalEditorWorkspaceProps) {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<'content' | 'pricing' | 'branding' | 'terms'>('content');
  const [activePageId, setActivePageId] = useState<string>('p1_cover');

  // Proposal State
  const [proposalTitle, setProposalTitle] = useState(proposal?.title || 'AI-Powered Outbound Growth Engine Proposal');
  const [clientName, setClientName] = useState(proposal?.client_name || 'Shrikant');
  const [companyName, setCompanyName] = useState(proposal?.company_name || 'INFINIUM GLOBAL RESEARCH');
  const [recipientEmail, setRecipientEmail] = useState(proposal?.recipient_email || 'shrikant@infiniumresearch.com');
  const [docNumber, setDocNumber] = useState(proposal?.document_number || `PROP-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [currency, setCurrency] = useState<'INR' | 'USD' | 'EUR' | 'GBP' | 'AED'>(proposal?.currency || 'INR');
  const [themeColor, setThemeColor] = useState(proposal?.theme_color || '#84cc16'); // Lime Green Default
  const [version, setVersion] = useState(proposal?.version || 1);

  // Commercial Services / Line Items
  const [lineItems, setLineItems] = useState([
    { id: '1', serviceName: 'QEVN Multi-Agent Outbound AI Pipeline', description: 'Hyper-personalized prospect research & multi-provider lead verification', quantity: 1, rate: 160000 },
    { id: '2', serviceName: 'Twilio Softphone Voice Bridging & Call Intelligence', description: 'Direct PSTN dialing, recording, objection analysis, and CRM sync', quantity: 1, rate: 80000 },
  ]);

  // Comparison Rows for Challenges vs Solution
  const [comparisonRows, setComparisonRows] = useState([
    { challenge: 'High cost of manual prospecting', solution: 'AI system scales outreach at 1/10th traditional cost' },
    { challenge: 'Low email reply rates & spam risks', solution: 'Hyper-personalized multi-agent messaging with domain protection' },
    { challenge: 'Unverified lead data & high bounce rates', solution: 'Multi-provider real-time email & phone verification' },
  ]);

  // Page Sections List
  const [sections, setSections] = useState<ProposalPageSection[]>([
    { id: 'p1_cover', title: '1. Cover Page', type: 'cover', enabled: true },
    { id: 'p2_exec', title: '2. Executive Summary', type: 'exec_summary', enabled: true },
    { id: 'p3_scope', title: '3. Scope / About QEVN', type: 'scope', enabled: true },
    { id: 'p4_challenges', title: '4. Challenges & Solutions', type: 'challenges', enabled: true },
    { id: 'p5_solution', title: '5. AI Outbound Solution', type: 'solution', enabled: true },
    { id: 'p6_case_studies', title: '6. Case Studies', type: 'case_studies', enabled: true },
    { id: 'p7_pricing', title: '7. Commercial Investment', type: 'pricing', enabled: true },
    { id: 'p8_timeline', title: '8. Milestone Timeline', type: 'timeline', enabled: true },
    { id: 'p9_deliverables', title: '9. Key Deliverables', type: 'deliverables', enabled: true },
    { id: 'p10_terms', title: '10. SLA & Terms', type: 'terms', enabled: true },
    { id: 'p11_cta', title: '11. Final CTA & Signoff', type: 'cta', enabled: true },
  ]);

  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : 'AED ';

  const subtotal = lineItems.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
  const gstTax = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + gstTax;

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: `item_${Date.now()}`, serviceName: 'Additional AI Module', description: 'Custom feature setup', quantity: 1, rate: 30000 }
    ]);
  };

  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter(i => i.id !== id));
  };

  const handleDownloadA4PDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow popups to download PDF', 'warning');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Proposal_${docNumber}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; color: #0f172a; background: #fff; line-height: 1.6; }
            .cover-page { background: linear-gradient(180deg, #ffffff 0%, #f7fee7 100%); padding: 60px 50px; border-bottom: 8px solid ${themeColor}; page-break-after: always; min-height: 800px; box-sizing: border-box; }
            .brand-header { font-size: 26px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
            .brand-sub { font-size: 14px; font-weight: bold; color: ${themeColor}; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
            .cover-title { font-size: 32px; font-weight: 900; color: #0f172a; margin-top: 140px; line-height: 1.2; max-width: 600px; }
            .cover-meta { margin-top: 160px; font-size: 13px; color: #475569; border-top: 2px solid #bef264; padding-top: 15px; }
            .page { padding: 50px; page-break-after: always; box-sizing: border-box; }
            .page-header { border-bottom: 2px solid ${themeColor}; padding-bottom: 10px; margin-bottom: 30px; display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; color: ${themeColor}; }
            .section-title { font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 25px; margin-bottom: 15px; }
            p { font-size: 13px; color: #334155; line-height: 1.7; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background: #f7fee7; padding: 12px; text-align: left; border: 1px solid #cbd5e1; color: #365314; font-weight: bold; }
            td { padding: 12px; border: 1px solid #cbd5e1; color: #334155; }
            .total-card { background: #f7fee7; border: 2px solid ${themeColor}; padding: 18px; border-radius: 12px; width: 320px; margin-left: auto; margin-top: 25px; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <!-- COVER PAGE -->
          <div class="cover-page">
            <div class="brand-header">Qevn <span style="color:${themeColor};">×</span> ${companyName}</div>
            <div class="brand-sub">AUGUST 2026</div>
            <div class="cover-title">${proposalTitle}</div>
            <div class="cover-meta">
              <p><strong>Prepared for:</strong> ${companyName} (${clientName})</p>
              <p><strong>Presented by:</strong> QEVN Solutions Architecture Team</p>
              <p><strong>Ref Code:</strong> ${docNumber} (v${version})</p>
            </div>
          </div>

          <!-- EXECUTIVE SUMMARY -->
          <div class="page">
            <div class="page-header"><span>Qevn × ${companyName}</span><span>AUGUST 2026</span></div>
            <h2 class="section-title">Executive Summary</h2>
            <p><strong>${companyName}</strong> is a forward-thinking enterprise with a clear vision for growth. As market dynamics become increasingly competitive, the ability to consistently identify, reach, and convert high-quality prospects determines which businesses scale.</p>
            <p>QEVN has conducted a thorough architectural review of ${companyName}'s current outbound lead generation workflows. We recognize that ${companyName} requires a modern, scalable outbound engine that moves beyond manual prospecting into fully automated AI-driven multi-agent pipelines.</p>
          </div>

          <!-- PRICING PAGE -->
          <div class="page">
            <div class="page-header"><span>QEVN TECHNOLOGIES</span><span>Ref: ${docNumber}</span></div>
            <h2 class="section-title">Commercial Investment Schedule</h2>
            <table>
              <thead>
                <tr><th>Deliverable</th><th>Qty</th><th>Rate (${currencySymbol})</th><th style="text-align:right;">Total (${currencySymbol})</th></tr>
              </thead>
              <tbody>
                ${lineItems.map(i => `
                  <tr>
                    <td><strong>${i.serviceName}</strong><br/><span style="color:#64748b; font-size:11px;">${i.description}</span></td>
                    <td>${i.quantity}</td>
                    <td>${currencySymbol}${i.rate.toLocaleString()}</td>
                    <td style="text-align:right;"><strong>${currencySymbol}${(i.quantity * i.rate).toLocaleString()}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total-card">
              <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Subtotal:</span><strong>${currencySymbol}${subtotal.toLocaleString()}</strong></div>
              <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>GST Tax (18%):</span><strong>${currencySymbol}${gstTax.toLocaleString()}</strong></div>
              <div style="display:flex; justify-content:space-between; font-weight:bold; color:#15803d; font-size:15px; border-top:2px solid ${themeColor}; padding-top:6px;"><span>Grand Total:</span><span>${currencySymbol}${grandTotal.toLocaleString()}</span></div>
            </div>
            <div class="footer"><p>© 2026 QEVN Technologies • Official Commercial Document</p></div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast('A4 PDF print preview generated!', 'success');
  };

  const handleCopyPublicLink = () => {
    const publicUrl = `${window.location.origin}/proposal/${docNumber}`;
    navigator.clipboard.writeText(publicUrl);
    showToast(`Public Proposal URL copied: ${publicUrl}`, 'success');
  };

  const handleSaveProposal = () => {
    const updated: ProposalContract = {
      id: proposal?.id || `prop_${Date.now()}`,
      document_number: docNumber,
      title: proposalTitle,
      type: 'Proposal',
      client_id: proposal?.client_id || 'c1',
      employee_id: user?.id || 'usr_emp_1',
      company_name: companyName,
      client_name: clientName,
      recipient_email: recipientEmail,
      value: grandTotal,
      currency,
      status: proposal?.status || 'Draft',
      version,
      theme_color: themeColor,
      sections,
      line_items: lineItems,
      created_at: proposal?.created_at || new Date().toISOString()
    };

    if (onSave) onSave(updated);
    showToast(`Proposal ${docNumber} saved successfully (v${version})!`, 'success');
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="QEVN 3-Part Visual Proposal Builder Workspace"
      description="Visual editor with live A4 preview, dynamic pricing, custom themes, and A4 PDF exporter."
    >
      <div className="flex flex-col lg:flex-row h-[84vh] overflow-hidden -m-6 text-xs">
        
        {/* LEFT COLUMN: Section Tree & Pages */}
        <div className="w-full lg:w-64 border-r border-border/40 bg-card p-4 space-y-3 overflow-y-auto flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-lime-400" /> Proposal Pages
            </span>
            <Badge variant="outline" className="text-[10px] border-lime-500/40 text-lime-400">v{version}</Badge>
          </div>

          <div className="space-y-1">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActivePageId(sec.id)}
                className={`w-full text-left p-2.5 rounded-lg font-medium transition-all flex items-center justify-between cursor-pointer ${
                  activePageId === sec.id
                    ? 'bg-lime-500/15 border border-lime-500/40 text-lime-400 font-bold'
                    : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                }`}
              >
                <span className="truncate">{sec.title}</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-50" />
              </button>
            ))}
          </div>
        </div>

        {/* CENTER COLUMN: Content Editor & Controls */}
        <div className="flex-1 border-r border-border/40 p-5 space-y-5 overflow-y-auto bg-background/50">
          
          {/* Top Control Tabs */}
          <div className="flex items-center justify-between border-b border-border/30 pb-3">
            <div className="flex space-x-2">
              {[
                { id: 'content', label: 'Proposal Content' },
                { id: 'pricing', label: 'Pricing & Line Items' },
                { id: 'branding', label: 'Theme & Colors' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    activeTab === t.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <Button size="sm" onClick={handleSaveProposal} className="bg-lime-600 hover:bg-lime-500 text-white font-bold cursor-pointer">
              Save Proposal
            </Button>
          </div>

          {/* TAB 1: Content Editor */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground font-semibold block mb-1">Proposal Title</label>
                  <input
                    type="text"
                    value={proposalTitle}
                    onChange={(e) => setProposalTitle(e.target.value)}
                    className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground font-semibold block mb-1">Ref Code / Proposal #</label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-muted-foreground font-semibold block mb-1">Client Person Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground font-semibold block mb-1">Client Company Entity</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground font-semibold block mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* Challenges vs Solution Section */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Challenges vs QEVN Solution Rows</h4>
                {comparisonRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2.5 rounded-xl border border-border/30 bg-secondary/20">
                    <input
                      type="text"
                      value={row.challenge}
                      onChange={(e) => {
                        const copy = [...comparisonRows];
                        copy[idx].challenge = e.target.value;
                        setComparisonRows(copy);
                      }}
                      className="bg-background border border-border/30 rounded px-2 py-1 text-foreground"
                    />
                    <input
                      type="text"
                      value={row.solution}
                      onChange={(e) => {
                        const copy = [...comparisonRows];
                        copy[idx].solution = e.target.value;
                        setComparisonRows(copy);
                      }}
                      className="bg-background border border-border/30 rounded px-2 py-1 text-foreground"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Pricing & Line Items */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <label className="text-muted-foreground font-semibold">Currency:</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="bg-secondary/40 border border-border/40 rounded px-2 py-1 text-xs text-foreground"
                  >
                    <option value="INR">₹ INR (Indian Rupee)</option>
                    <option value="USD">$ USD (US Dollar)</option>
                    <option value="EUR">€ EUR (Euro)</option>
                    <option value="GBP">£ GBP (British Pound)</option>
                    <option value="AED">AED (UAE Dirham)</option>
                  </select>
                </div>

                <Button size="sm" variant="outline" onClick={handleAddLineItem}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add Deliverable
                </Button>
              </div>

              {lineItems.map((item) => (
                <div key={item.id} className="p-3 rounded-xl border border-border/30 bg-secondary/20 grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
                  <div className="md:col-span-3 space-y-1">
                    <input
                      type="text"
                      value={item.serviceName}
                      onChange={(e) => setLineItems(lineItems.map(i => i.id === item.id ? { ...i, serviceName: e.target.value } : i))}
                      className="w-full bg-background border border-border/30 rounded px-2 py-1 font-bold text-foreground"
                    />
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => setLineItems(lineItems.map(i => i.id === item.id ? { ...i, description: e.target.value } : i))}
                      className="w-full bg-background border border-border/30 rounded px-2 py-1 text-muted-foreground text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block">Qty</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => setLineItems(lineItems.map(i => i.id === item.id ? { ...i, quantity: Number(e.target.value) } : i))}
                      className="w-full bg-background border border-border/30 rounded px-2 py-1 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block">Rate ({currencySymbol})</label>
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => setLineItems(lineItems.map(i => i.id === item.id ? { ...i, rate: Number(e.target.value) } : i))}
                      className="w-full bg-background border border-border/30 rounded px-2 py-1 text-foreground font-semibold"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">{currencySymbol}{(item.quantity * item.rate).toLocaleString()}</span>
                    <button onClick={() => handleRemoveLineItem(item.id)} className="text-rose-400 hover:text-rose-300 ml-2">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 space-y-2">
                <div className="flex justify-between"><span>Subtotal:</span><span className="font-bold">{currencySymbol}{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>GST Tax (18%):</span><span className="font-bold">{currencySymbol}{gstTax.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm font-black border-t border-border/20 pt-2 text-emerald-400">
                  <span>Grand Total Commercial Investment:</span>
                  <span>{currencySymbol}{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Theme & Colors */}
          {activeTab === 'branding' && (
            <div className="space-y-4">
              <label className="text-muted-foreground font-semibold block">Brand Accent Theme Color</label>
              <div className="flex space-x-3">
                {[
                  { color: '#84cc16', label: 'Qevn Lime Green (Default)' },
                  { color: '#6366f1', label: 'Indigo' },
                  { color: '#0ea5e9', label: 'Sky Blue' },
                  { color: '#ec4899', label: 'Pink' },
                  { color: '#f59e0b', label: 'Amber' },
                ].map(c => (
                  <button
                    key={c.color}
                    onClick={() => setThemeColor(c.color)}
                    style={{ backgroundColor: c.color }}
                    className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                      themeColor === c.color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Reactive A4 Proposal Preview */}
        <div className="w-full lg:w-96 p-4 bg-secondary/15 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-lime-400" /> Live A4 Preview
              </span>
              <span className="text-[10px] text-muted-foreground">Reactive Render</span>
            </div>

            {/* A4 Document Card */}
            <div className="bg-white text-slate-900 rounded-xl p-5 shadow-2xl border border-slate-200 space-y-4 text-[11px] leading-relaxed">
              <div className="border-b-2 border-lime-500 pb-3">
                <h3 className="font-black text-sm tracking-tight">Qevn <span className="text-lime-500">×</span> {companyName}</h3>
                <p className="text-[10px] font-bold text-lime-600 uppercase">AUGUST 2026</p>
                <h4 className="font-extrabold text-xs text-slate-900 mt-3">{proposalTitle}</h4>
              </div>

              <div>
                <p className="font-bold text-slate-900 text-[11px] border-l-2 border-lime-500 pl-1.5">Commercial Investment</p>
                <p className="text-slate-600 mt-1">Ref Code: <strong>{docNumber}</strong></p>
                <div className="mt-2 p-2 rounded bg-lime-50 border border-lime-300 flex justify-between font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-emerald-700">{currencySymbol}{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-border/20">
            <Button onClick={handleDownloadA4PDF} className="w-full bg-lime-600 hover:bg-lime-500 text-white font-bold cursor-pointer">
              <Download className="mr-1.5 h-4 w-4" /> Download A4 PDF
            </Button>
            <Button onClick={handleCopyPublicLink} variant="outline" className="w-full text-xs">
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Public Client Link (/proposal/[id])
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
