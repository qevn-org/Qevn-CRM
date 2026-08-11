'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/use-store';
import { ProposalContract, InvoiceRecord } from '@/lib/mock-db';
import { DollarSign, FileText, Plus, CheckCircle2, Clock, Calendar, Download, Send, Tag, AlertCircle } from 'lucide-react';
import { showToast } from '@/components/ui/toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

import { ProposalInvoiceWizard } from '@/components/documents/proposal-invoice-wizard';
import { Button } from '@/components/ui/button';

export default function FinancePage() {
  const { user } = useStore();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [proposals, setProposals] = useState<ProposalContract[]>([
    {
      id: 'prop1',
      document_number: 'PROP-9001',
      title: 'Enterprise CRM Softphone & Lead Automation Solution',
      type: 'Proposal',
      client_id: 'c1',
      employee_id: user?.id || 'usr_emp_1',
      value: 240000,
      status: 'Sent',
      expires_at: '2026-08-20',
      created_at: new Date().toISOString()
    },
    {
      id: 'prop2',
      document_number: 'CONT-9002',
      title: 'Annual CRM SaaS Maintenance & Twilio SLA Agreement',
      type: 'Contract',
      client_id: 'c2',
      employee_id: user?.id || 'usr_emp_1',
      value: 180000,
      status: 'Active',
      signed_at: '2026-08-01',
      created_at: new Date().toISOString()
    }
  ]);

  const [invoices, setInvoices] = useState<InvoiceRecord[]>([
    {
      id: 'inv1',
      invoice_number: 'INV-2026-041',
      client_id: 'c1',
      employee_id: user?.id || 'usr_emp_1',
      amount: 120000,
      tax_amount: 21600,
      status: 'Paid',
      due_date: '2026-08-10',
      paid_at: '2026-08-09',
      created_at: new Date().toISOString()
    },
    {
      id: 'inv2',
      invoice_number: 'INV-2026-042',
      client_id: 'c2',
      employee_id: user?.id || 'usr_emp_1',
      amount: 90000,
      tax_amount: 16200,
      status: 'Sent',
      due_date: '2026-08-18',
      created_at: new Date().toISOString()
    }
  ]);

  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
  const pendingReceivables = invoices.filter(i => i.status === 'Sent' || i.status === 'Overdue').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/40 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Proposals, Contracts & Financial Invoices</h1>
              <p className="text-sm text-muted-foreground">Manage client proposals, active contracts, invoice generation, and revenue collection</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Collected Revenue</span>
              <span className="text-xl font-black text-emerald-400">₹{totalRevenue.toLocaleString()}</span>
            </div>
            <div className="text-right border-l border-border/30 pl-4">
              <span className="text-xs text-muted-foreground block">Pending Receivables</span>
              <span className="text-xl font-black text-amber-300">₹{pendingReceivables.toLocaleString()}</span>
            </div>
          </div>

          <Button onClick={() => setWizardOpen(true)} className="shadow-lg shadow-primary/25 cursor-pointer">
            <Plus className="mr-1.5 h-4 w-4" /> Generate Proposal & Invoice
          </Button>
        </div>
      </div>

      <ProposalInvoiceWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />

      {/* Proposals & Contracts Card */}
      <Card>
        <CardHeader>
          <CardTitle>Proposals & Contracts</CardTitle>
          <CardDescription>Generated proposals and active client contracts</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doc #</TableHead>
                <TableHead>Title & Type</TableHead>
                <TableHead>Value (₹)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-bold text-primary">{p.document_number}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{p.title}</span>
                      <span className="text-[11px] text-muted-foreground">{p.type} • Client Prospect</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-foreground">₹{p.value.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'Active' || p.status === 'Signed' ? 'success' : 'secondary'}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <button className="text-xs text-primary font-semibold hover:underline flex items-center justify-end ml-auto gap-1">
                      <Download className="h-3.5 w-3.5" /> PDF
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoices Card */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices & Payment Records</CardTitle>
          <CardDescription>Client billing invoices, tax breakdowns, and payment status</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Amount (₹)</TableHead>
                <TableHead>GST Tax</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-bold text-foreground">{inv.invoice_number}</TableCell>
                  <TableCell className="font-bold text-emerald-400">₹{inv.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">₹{inv.tax_amount?.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{inv.due_date}</TableCell>
                  <TableCell>
                    <Badge variant={inv.status === 'Paid' ? 'success' : 'outline'}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
