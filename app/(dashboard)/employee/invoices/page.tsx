'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/use-store';
import { InvoiceRecord } from '@/lib/mock-db';
import { Receipt, Plus, Download, Send, Eye, CheckCircle2, DollarSign, Building } from 'lucide-react';
import { showToast } from '@/components/ui/toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ProposalInvoiceWizard } from '@/components/documents/proposal-invoice-wizard';

export default function InvoicesPage() {
  const { user } = useStore();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([
    {
      id: 'inv1',
      invoice_number: 'QEVN-Invoice-2026-032',
      client_id: 'c1',
      employee_id: user?.id || 'usr_emp_1',
      amount: 240000,
      tax_amount: 43200,
      status: 'Paid',
      due_date: '2026-08-10',
      paid_at: '2026-08-09',
      created_at: new Date().toISOString()
    },
    {
      id: 'inv2',
      invoice_number: 'QEVN-Invoice-2026-033',
      client_id: 'c2',
      employee_id: user?.id || 'usr_emp_1',
      amount: 180000,
      tax_amount: 32400,
      status: 'Sent',
      due_date: '2026-08-20',
      created_at: new Date().toISOString()
    }
  ]);

  const totalCollected = invoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/40 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">GST Tax Invoices Studio</h1>
              <p className="text-sm text-muted-foreground">Generate official Tax Invoices matching QEVN-Invoice-2026-032 with Bank NEFT details</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className="text-xs text-muted-foreground block">Collected Revenue</span>
            <span className="text-xl font-black text-emerald-400">₹{totalCollected.toLocaleString()}</span>
          </div>
          <Button onClick={() => setWizardOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/25 cursor-pointer">
            <Plus className="mr-1.5 h-4 w-4" /> Create Qevn Tax Invoice
          </Button>
        </div>
      </div>

      <ProposalInvoiceWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Invoices & Billing Records</CardTitle>
          <CardDescription>Official GST Tax Invoices, IGST/CGST breakdowns, and Bank NEFT payment status</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client Company</TableHead>
                <TableHead>Subtotal (₹)</TableHead>
                <TableHead>GST (18%)</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-bold text-emerald-400">{inv.invoice_number}</TableCell>
                  <TableCell className="font-bold text-foreground">INFINIUM GLOBAL RESEARCH</TableCell>
                  <TableCell className="text-xs text-muted-foreground">₹{inv.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">₹{inv.tax_amount?.toLocaleString()}</TableCell>
                  <TableCell className="font-bold text-emerald-400">₹{(inv.amount + (inv.tax_amount || 0)).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={inv.status === 'Paid' ? 'success' : 'outline'}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setWizardOpen(true)} className="text-xs text-emerald-400 hover:text-emerald-300">
                      <Eye className="mr-1 h-3.5 w-3.5" /> Preview / PDF
                    </Button>
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
