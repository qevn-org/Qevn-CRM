'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { showToast } from '@/components/ui/toast';
import { sendEmail, emailTemplates } from '@/lib/email/resend';
import { db } from '@/lib/db';
import { useStore } from '@/lib/store/use-store';
import { 
  FileText, DollarSign, Send, CheckCircle2, Eye, Plus, Trash2, 
  Building, User, Calendar, ShieldCheck, Download, Sparkles, Layers
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

  // Proposal Metadata
  const [proposalTitle, setProposalTitle] = useState('Enterprise CRM Softphone & Lead Automation Solution');
  const [clientName, setClientName] = useState(clientData?.client_name || 'Client Prospect');
  const [companyName, setCompanyName] = useState(clientData?.company_name || 'Prospect Company');
  const [recipientEmail, setRecipientEmail] = useState(clientData?.email || 'client@company.com');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [dueDate, setDueDate] = useState('2026-08-25');

  // Commercial Line Items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', serviceName: 'QEVN CRM Platform Setup & Architecture', description: 'Multi-tenant database configuration, RBAC, and user provisioning', quantity: 1, rate: 120000 },
    { id: '2', serviceName: 'Twilio Softphone & WebRTC Voice Integration', description: 'Direct PSTN bridging, call intelligence logging, and status webhooks', quantity: 1, rate: 80000 },
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

  const handleSendProposalAndInvoice = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      showToast('Please enter a valid recipient email address', 'warning');
      return;
    }

    setIsSending(true);

    try {
      // 1. Dispatch Email via Resend integration
      const emailContent = emailTemplates.proposalInvoice(
        proposalTitle,
        invoiceNumber,
        grandTotal,
        clientName
      );

      const emailResult = await sendEmail({
        to: recipientEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        clientId: clientData?.id,
        employeeId: user?.id || 'usr_emp_1',
        template: 'Commercial Proposal & Invoice Package'
      });

      if (emailResult.success) {
        // 2. Audit Timeline Event
        await db.createActivity({
          client_id: clientData?.id,
          employee_id: user?.id || 'usr_emp_1',
          action: 'Proposal & Tax Invoice Sent',
          description: `Dispatched Proposal "${proposalTitle}" and Tax Invoice ${invoiceNumber} (₹${grandTotal.toLocaleString()}) to ${recipientEmail}`
        });

        showToast(`Proposal & Tax Invoice ${invoiceNumber} sent directly to ${recipientEmail}!`, 'success');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        showToast('Failed to send email. Please check Resend API configuration.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error dispatching documents', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Lead → Proposal → Invoice Automation Engine"
      description="Configure commercial line items, preview 8-page Technical Proposal & Tax Invoice, and send directly from CRM."
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
        {/* Wizard Steps Header */}
        <div className="flex items-center justify-between bg-secondary/30 p-3 rounded-xl border border-border/30 text-xs">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center space-x-1.5 font-bold cursor-pointer transition-colors ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">1</span>
            <span>Commercial Pricing</span>
          </button>
          <span className="text-muted-foreground">→</span>
          <button
            onClick={() => setStep(2)}
            className={`flex items-center space-x-1.5 font-bold cursor-pointer transition-colors ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">2</span>
            <span>Proposal & Invoice Preview</span>
          </button>
          <span className="text-muted-foreground">→</span>
          <button
            onClick={() => setStep(3)}
            className={`flex items-center space-x-1.5 font-bold cursor-pointer transition-colors ${step === 3 ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">3</span>
            <span>Direct CRM Send</span>
          </button>
        </div>

        {/* STEP 1: Commercial Pricing & Line Items */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Proposal Title</label>
                <input
                  type="text"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Client Name / Company</label>
                <input
                  type="text"
                  value={`${clientName} (${companyName})`}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-secondary/35 border border-border/40 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Commercial Line Items</h4>
                <button onClick={addLineItem} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                  <Plus className="h-3.5 w-3.5" /> Add Line Item
                </button>
              </div>

              {lineItems.map((item, idx) => (
                <div key={item.id} className="p-3 rounded-xl border border-border/30 bg-secondary/20 grid grid-cols-1 md:grid-cols-6 gap-2 items-center text-xs">
                  <div className="md:col-span-3 space-y-1">
                    <input
                      type="text"
                      placeholder="Service Name"
                      value={item.serviceName}
                      onChange={(e) => updateLineItem(item.id, 'serviceName', e.target.value)}
                      className="w-full bg-background border border-border/30 rounded px-2 py-1 font-bold text-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      className="w-full bg-background border border-border/30 rounded px-2 py-1 text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block">Qty</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                      className="w-full bg-background border border-border/30 rounded px-2 py-1 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block">Rate (₹)</label>
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateLineItem(item.id, 'rate', Number(e.target.value))}
                      className="w-full bg-background border border-border/30 rounded px-2 py-1 text-foreground font-semibold"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-3 md:pt-0">
                    <span className="font-bold text-emerald-400">₹{(item.quantity * item.rate).toLocaleString()}</span>
                    <button onClick={() => removeLineItem(item.id)} className="text-rose-400 hover:text-rose-300 ml-2">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Calculation Card */}
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
                <span>Grand Total Commercial Value:</span>
                <span className="text-emerald-400">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button onClick={() => setStep(2)}>
                Proceed to 8-Page Document Preview →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Interactive 8-Page Proposal & Tax Invoice Preview */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-background border border-border/50 p-6 rounded-2xl space-y-6 shadow-inner text-xs">
              
              {/* Proposal Cover Page Header */}
              <div className="text-center pb-6 border-b border-border/30">
                <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  8-Page Technical & Commercial Proposal
                </span>
                <h2 className="text-xl font-extrabold text-foreground mt-3">{proposalTitle}</h2>
                <p className="text-muted-foreground mt-1">Prepared for: <strong>{companyName}</strong> ({clientName})</p>
                <p className="text-[11px] text-muted-foreground">Prepared by: QEVN Solutions Architect • Ref: {invoiceNumber}</p>
              </div>

              {/* Section 1: Executive Summary */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary border-l-2 border-primary pl-2">1. Executive Summary & Objective</h3>
                <p className="text-muted-foreground leading-relaxed">
                  QEVN CRM is deploying a unified SaaS Sales & Softphone Business Operating System tailored for <strong>{companyName}</strong>. 
                  This solution integrates Twilio WebRTC softphone capabilities, multi-tenant RBAC security, automated lead pipelines, and real-time EOD activity tracking.
                </p>
              </div>

              {/* Section 2: Scope of Work & Deliverables */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary border-l-2 border-primary pl-2">2. Technical Scope of Work & Key Deliverables</h3>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Custom Next.js 16 App Router CRM Deployment with Supabase Auth & RLS.</li>
                  <li>Twilio Softphone WebRTC Integration with direct PSTN call bridging (`+17167275053`).</li>
                  <li>Call Intelligence Engine with prospect pain point logging and intent ratings.</li>
                  <li>Support Ticketing Console with SLA breach alerts and Customer 360 health indicators.</li>
                </ul>
              </div>

              {/* Section 3: Commercial Investment Schedule */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary border-l-2 border-primary pl-2">3. Commercial Investment Schedule</h3>
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

              {/* Section 4: Tax Invoice Breakdown */}
              <div className="p-4 rounded-xl bg-secondary/20 border border-border/30 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-foreground">Official Tax Invoice #{invoiceNumber}</h4>
                  <span className="text-emerald-400 font-bold">Total: ₹{grandTotal.toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">GSTIN: 27AAAAA0000A1Z5 • Payment Due Date: {dueDate}</p>
              </div>

            </div>

            <div className="flex justify-between pt-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                ← Edit Line Items
              </Button>
              <Button onClick={() => setStep(3)}>
                Proceed to Direct Send →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Direct Send from CRM */}
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

                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1 text-xs">
                  <p className="font-bold text-primary">Dispatch Summary:</p>
                  <p className="text-muted-foreground">
                    Sending Proposal <strong>"{proposalTitle}"</strong> and Tax Invoice <strong>#{invoiceNumber}</strong> (Total ₹{grandTotal.toLocaleString()}) directly via Resend email infrastructure.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t border-border/20">
              <Button variant="outline" onClick={() => setStep(2)}>
                ← Back to Preview
              </Button>
              <Button onClick={handleSendProposalAndInvoice} isLoading={isSending} className="shadow-lg shadow-primary/25">
                <Send className="mr-2 h-4 w-4" /> Send Directly From CRM
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
