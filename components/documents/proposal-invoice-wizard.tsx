'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { emailTemplates } from '@/lib/email/resend';
import { db } from '@/lib/db';
import { useStore } from '@/lib/store/use-store';
import { 
  FileText, DollarSign, Send, CheckCircle2, Eye, Plus, Trash2, 
  Building, User, Calendar, ShieldCheck, Download, Sparkles, Layers,
  FileCheck, ScrollText, Receipt
} from 'lucide-react';

interface ProposalInvoiceWizardProps {
  isOpen: boolean;
  onClose: () => void;
  clientData?: {
    id: string;
    client_name: string;
    company_name: string;
    email?: string;
    phone?: string;
  } | null;
  onSuccess?: () => void;
}

interface LineItem {
  id: string;
  serviceName: string;
  description: string;
  quantity: number;
  rate: number;
}

export function ProposalInvoiceWizard({ isOpen, onClose, clientData, onSuccess }: ProposalInvoiceWizardProps) {
  const { user } = useStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSending, setIsSending] = useState(false);

  // Document Type Selection
  const [docType, setDocType] = useState<'proposal' | 'contract' | 'invoice' | 'combined'>('combined');

  // Metadata
  const [proposalTitle, setProposalTitle] = useState('Enterprise CRM Softphone & Lead Automation Solution');
  const [clientName, setClientName] = useState(clientData?.client_name || 'Client Prospect');
  const [companyName, setCompanyName] = useState(clientData?.company_name || 'Prospect Company');
  const [recipientEmail, setRecipientEmail] = useState(clientData?.email || 'client@company.com');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [dueDate, setDueDate] = useState('2026-08-25');

  // Commercial Line Items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', serviceName: 'QEVN CRM Platform Setup & Architecture', description: 'Multi-tenant database configuration, RBAC, and user provisioning', quantity: 1, rate: 120000 },
    { id: '2', serviceName: 'Twilio Softphone & WebRTC Voice Integration', description: 'Direct PSTN call bridging, call intelligence logging, and status webhooks', quantity: 1, rate: 80000 },
    { id: '3', serviceName: 'WhatsApp API & Workflow Automation Engine', description: 'Meta Business verification, automated abandoned cart bot, and trigger rules', quantity: 1, rate: 40000 }
  ]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: `item_${Date.now()}`, serviceName: 'Additional CRM Module', description: 'Custom feature setup', quantity: 1, rate: 25000 }
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, val: any) => {
    setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const subtotal = lineItems.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
  const gstAmount = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + gstAmount;

  // PDF Download Engine
  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow popups to download PDF', 'warning');
      return;
    }

    const docTitle = docType === 'invoice' ? `Invoice_${invoiceNumber}` : docType === 'contract' ? `Contract_${invoiceNumber}` : `Proposal_${proposalTitle.replace(/\s+/g, '_')}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 0; margin: 0; color: #1e293b; background: #fff; line-height: 1.6; }
            .cover-page { background: linear-gradient(180deg, #ffffff 0%, #f7fee7 100%); padding: 60px 50px; border-bottom: 8px solid #84cc16; page-break-after: always; text-align: left; min-height: 800px; box-sizing: border-box; }
            .brand-header { font-size: 26px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
            .brand-sub { font-size: 14px; font-weight: bold; color: #65a30d; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
            .cover-title { font-size: 32px; font-weight: 900; color: #0f172a; margin-top: 140px; line-height: 1.2; max-width: 600px; }
            .cover-meta { margin-top: 160px; font-size: 13px; color: #475569; border-top: 2px solid #bef264; pt-15px; }
            .page { padding: 50px; page-break-after: always; box-sizing: border-box; }
            .page-header { border-bottom: 2px solid #84cc16; padding-bottom: 10px; margin-bottom: 30px; display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; color: #65a30d; }
            .section-title { font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 25px; margin-bottom: 15px; }
            p { font-size: 13px; color: #334155; line-height: 1.7; }
            ul { font-size: 13px; color: #334155; line-height: 1.8; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background: #f7fee7; padding: 12px; text-align: left; border: 1px solid #d97706; color: #365314; font-weight: bold; }
            td { padding: 12px; border: 1px solid #cbd5e1; color: #334155; }
            .total-card { background: #f7fee7; border: 2px solid #84cc16; padding: 18px; border-radius: 12px; width: 320px; margin-left: auto; margin-top: 25px; }
            .bank-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; font-size: 11px; margin-top: 30px; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          ${(docType === 'proposal' || docType === 'combined') ? `
            <div class="cover-page">
              <div class="brand-header">Qevn <span style="color:#84cc16;">×</span> infinium</div>
              <div class="brand-sub">AUGUST 2026</div>
              <div class="cover-title">
                AI-Powered Outbound Growth Engine Proposal
              </div>
              <div class="cover-meta">
                <p><strong>Prepared for:</strong> ${companyName} (${clientName})</p>
                <p><strong>Presented by:</strong> Qevn AI Engineering & Solutions Team</p>
                <p><strong>Ref Code:</strong> ${invoiceNumber}</p>
              </div>
            </div>
            <div class="page">
              <div class="page-header">
                <span>Qevn × infinium</span>
                <span>AUGUST 2026</span>
              </div>
              <h2 class="section-title">Executive Summary</h2>
              <p><strong>${companyName}</strong> is a forward-thinking enterprise with a clear vision for scalable revenue growth. As market dynamics become increasingly competitive, the ability to consistently identify, reach, and convert high-quality leads determines which businesses scale and which stagnate.</p>
              <p><strong>QEVN</strong> has conducted a thorough architectural review of ${companyName}'s current outbound workflows. We recognize that ${companyName} requires a modern, scalable, intelligent lead generation pipeline that moves beyond manual prospecting into fully automated AI-driven outbound engines.</p>
              <h3 style="font-size:15px; font-weight:bold; color:#0f172a; margin-top:20px;">Why Outbound Matters Now</h3>
              <p>Traditional manual lead generation is broken. Manually sourcing contacts, sending generic emails, and hoping for responses is no longer viable. Modern buyers expect hyper-personalized outreach. AI-powered outbound systems empower businesses to reach thousands of qualified prospects with personalized messaging at a fraction of the traditional cost and time.</p>
              <h3 style="font-size:15px; font-weight:bold; color:#0f172a; margin-top:20px;">Why QEVN</h3>
              <p>QEVN is an AI engineering company that builds production-grade intelligent business operating systems. We don't configure off-the-shelf software; we architect custom AI pipelines built around your specific business requirements, combining multi-agent AI architectures, Twilio softphone voice bridging, and deep automation.</p>
            </div>
          ` : ''}
          <div class="page">
            <div class="page-header">
              <span>QEVN TECHNOLOGIES</span>
              <span>Ref: ${invoiceNumber}</span>
            </div>
            <h2 class="section-title">${docType === 'invoice' ? 'GST Tax Invoice' : docType === 'contract' ? 'Legal SLA Service Contract' : 'Commercial Investment Schedule'}</h2>
            <p><strong>Client Entity:</strong> ${companyName} (${clientName})</p>
            <p><strong>Email:</strong> ${recipientEmail}</p>
            <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
            <p><strong>Payment Due Date:</strong> ${dueDate}</p>
            <table>
              <thead>
                <tr>
                  <th>Service Deliverable</th>
                  <th>Qty</th>
                  <th>Rate (₹)</th>
                  <th style="text-align: right;">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${lineItems.map(item => `
                  <tr>
                    <td><strong>${item.serviceName}</strong><br/><span style="color:#64748b; font-size:11px;">${item.description}</span></td>
                    <td>${item.quantity}</td>
                    <td>₹${item.rate.toLocaleString()}</td>
                    <td style="text-align: right;"><strong>₹${(item.quantity * item.rate).toLocaleString()}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total-card">
              <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:6px;"><span>Subtotal:</span><strong>₹${subtotal.toLocaleString()}</strong></div>
              <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:6px;"><span>GST (18% IGST/CGST):</span><strong>₹${gstAmount.toLocaleString()}</strong></div>
              <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:bold; color:#15803d; border-top:2px solid #84cc16; padding-top:8px; margin-top:8px;"><span>Grand Total:</span><span>₹${grandTotal.toLocaleString()}</span></div>
            </div>
            <div class="bank-box">
              <p style="margin:0 0 5px 0; font-weight:bold; color:#0f172a;">BANK NEFT / RTGS TRANSFER DETAILS:</p>
              <p style="margin:2px 0;"><strong>Bank Name:</strong> HDFC Bank Ltd</p>
              <p style="margin:2px 0;"><strong>Account Name:</strong> QEVN TECHNOLOGIES PRIVATE LIMITED</p>
              <p style="margin:2px 0;"><strong>Account Number:</strong> 50200088991122</p>
              <p style="margin:2px 0;"><strong>IFSC Code:</strong> HDFC0001234</p>
              <p style="margin:2px 0;"><strong>GSTIN:</strong> 27AAAAA0000A1Z5</p>
            </div>
            <div class="footer">
              <p>© 2026 QEVN Technologies • Official Commercial Document • Support: hello@qevn.in</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast(`PDF Preview opened for ${docTitle}`, 'success');
  };

  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      showToast('Please enter a valid recipient email address', 'warning');
      return;
    }

    setIsSending(true);

    try {
      const emailContent = emailTemplates.proposalInvoice(
        proposalTitle,
        invoiceNumber,
        grandTotal,
        clientName
      );

      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          clientId: clientData?.id,
          employeeId: user?.id || 'usr_emp_1',
          template: `Commercial ${docType.toUpperCase()}`
        })
      });

      const data = await res.json();

      if (data.success) {
        await db.createActivity({
          client_id: clientData?.id,
          employee_id: user?.id || 'usr_emp_1',
          action: `${docType.toUpperCase()} Dispatched`,
          description: `Sent ${docType.toUpperCase()} document #${invoiceNumber} (₹${grandTotal.toLocaleString()}) to ${recipientEmail}`
        });

        showToast(`Document sent successfully to ${recipientEmail}!`, 'success');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        showToast(data.error || 'Failed to send email', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error sending email', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Enterprise Document Studio & Generator"
      description="Create, customize, download PDF, and send Proposals, Contracts, and Tax Invoices."
    >
      <div className="space-y-6 max-h-[82vh] overflow-y-auto pr-2 max-w-4xl w-full">
        
        {/* Document Mode Selection Bar */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Select Document To Generate</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'combined', label: 'Complete Package', sub: 'Proposal + Contract + Invoice', icon: Layers },
              { id: 'proposal', label: 'Technical Proposal', sub: '8-Page Proposal Document', icon: FileCheck },
              { id: 'contract', label: 'Legal SLA Contract', sub: 'Service Terms & Agreement', icon: ScrollText },
              { id: 'invoice', label: 'GST Tax Invoice', sub: 'Tax Invoice & Payment Link', icon: Receipt },
            ].map((d) => {
              const IconComp = d.icon;
              return (
                <button
                  key={d.id}
                  onClick={() => setDocType(d.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    docType === d.id
                      ? 'bg-primary/15 border-primary text-primary shadow-sm'
                      : 'bg-secondary/20 border-border/30 text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                  }`}
                >
                  <IconComp className="h-4 w-4 mb-1" />
                  <p className="text-xs font-bold text-foreground">{d.label}</p>
                  <p className="text-[10px] text-muted-foreground">{d.sub}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Indicator Bar */}
        <div className="flex items-center justify-between bg-secondary/30 p-3 rounded-xl border border-border/30 text-xs">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center space-x-2 font-bold cursor-pointer transition-colors ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">1</span>
            <span>Configure Pricing & Line Items</span>
          </button>
          <span className="text-muted-foreground">→</span>
          <button
            onClick={() => setStep(2)}
            className={`flex items-center space-x-2 font-bold cursor-pointer transition-colors ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">2</span>
            <span>Document Preview & Download</span>
          </button>
          <span className="text-muted-foreground">→</span>
          <button
            onClick={() => setStep(3)}
            className={`flex items-center space-x-2 font-bold cursor-pointer transition-colors ${step === 3 ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">3</span>
            <span>Direct Email Delivery</span>
          </button>
        </div>

        {/* STEP 1: Configure Pricing */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Document Title</label>
                <input
                  type="text"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Client & Company Name</label>
                <input
                  type="text"
                  value={`${clientName} (${companyName})`}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Commercial Deliverables</h4>
                <button onClick={addLineItem} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                  <Plus className="h-3.5 w-3.5" /> Add Deliverable
                </button>
              </div>

              {lineItems.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl border border-border/30 bg-secondary/20 grid grid-cols-1 md:grid-cols-6 gap-3 items-center text-xs">
                  <div className="md:col-span-3 space-y-1">
                    <input
                      type="text"
                      placeholder="Deliverable Name"
                      value={item.serviceName}
                      onChange={(e) => updateLineItem(item.id, 'serviceName', e.target.value)}
                      className="w-full bg-background border border-border/30 rounded px-2.5 py-1 font-bold text-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Scope Details"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      className="w-full bg-background border border-border/30 rounded px-2.5 py-1 text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block">Qty</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                      className="w-full bg-background border border-border/30 rounded px-2.5 py-1 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block">Rate (₹)</label>
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateLineItem(item.id, 'rate', Number(e.target.value))}
                      className="w-full bg-background border border-border/30 rounded px-2.5 py-1 text-foreground font-semibold"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">₹{(item.quantity * item.rate).toLocaleString()}</span>
                    <button onClick={() => removeLineItem(item.id)} className="text-rose-400 hover:text-rose-300 ml-2">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-secondary/30 p-4 rounded-xl border border-border/30 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span className="font-bold text-foreground">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>GST Tax (18%):</span>
                <span className="font-bold text-foreground">₹{gstAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-foreground pt-2 border-t border-border/20">
                <span>Total Commercial Investment:</span>
                <span className="text-emerald-400">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button onClick={() => setStep(2)}>
                Proceed to Document Preview & Download →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Preview & Download PDF */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-card p-3 rounded-xl border border-border/30">
              <span className="text-xs font-bold text-foreground">
                Document Type: <strong className="text-primary uppercase">{docType}</strong>
              </span>
              <Button size="sm" variant="outline" onClick={handleDownloadPDF}>
                <Download className="mr-1.5 h-3.5 w-3.5 text-primary" /> Download Crisp PDF
              </Button>
            </div>

            {/* Document Render Container */}
            <div className="bg-background border border-border/50 p-6 rounded-2xl space-y-6 text-xs">
              <div className="text-center pb-6 border-b border-border/30">
                <h2 className="text-xl font-extrabold text-foreground">QEVN TECHNOLOGIES</h2>
                <p className="text-primary font-bold mt-1">{proposalTitle}</p>
                <p className="text-muted-foreground">Ref: {invoiceNumber} • Date: {new Date().toLocaleDateString()}</p>
              </div>

              {(docType === 'proposal' || docType === 'combined') && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-primary border-l-2 border-primary pl-2">Technical Scope & Solution Architecture</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Deploying custom Next.js 16 CRM platform for <strong>{companyName}</strong> featuring Twilio Softphone WebRTC integration, Call Intelligence, Support Ticketing, and EOD analytics.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary border-l-2 border-primary pl-2">Commercial Financial Breakdown</h3>
                <div className="border border-border/30 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/40">
                      <tr>
                        <th className="p-2">Deliverable</th>
                        <th className="p-2">Qty</th>
                        <th className="p-2 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item) => (
                        <tr key={item.id} className="border-t border-border/20">
                          <td className="p-2 font-medium">{item.serviceName}</td>
                          <td className="p-2">{item.quantity}</td>
                          <td className="p-2 text-right font-bold">₹{(item.quantity * item.rate).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-secondary/20 border border-border/30 flex justify-between items-center">
                <div>
                  <p className="font-bold text-foreground">Tax Invoice #{invoiceNumber}</p>
                  <p className="text-[11px] text-muted-foreground">Due Date: {dueDate} • GST: 18%</p>
                </div>
                <span className="text-lg font-black text-emerald-400">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between pt-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                ← Back to Config
              </Button>
              <Button onClick={() => setStep(3)}>
                Proceed to Direct Email Dispatch →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Direct Email Dispatch */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-card border border-border/40 p-6 rounded-2xl space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
                <Send className="h-4 w-4 text-primary" />
                <span>Direct CRM Email Dispatch</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-muted-foreground block mb-1 font-semibold">Recipient Email Address *</label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
                    placeholder="client@company.com"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 space-y-1 text-xs">
                  <p className="font-bold text-primary">Dispatch Package Summary:</p>
                  <p className="text-muted-foreground">
                    Sending <strong>{docType.toUpperCase()}</strong> for <strong>"{proposalTitle}"</strong> (Ref: {invoiceNumber}, Total: ₹{grandTotal.toLocaleString()}) via Resend server API.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t border-border/20">
              <Button variant="outline" onClick={() => setStep(2)}>
                ← Back to Preview
              </Button>
              <Button onClick={handleSendEmail} isLoading={isSending} className="shadow-lg shadow-primary/25">
                <Send className="mr-2 h-4 w-4" /> Send Document Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
