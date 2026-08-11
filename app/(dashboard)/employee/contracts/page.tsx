'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/use-store';
import { ProposalContract } from '@/lib/mock-db';
import { ScrollText, Plus, Download, Send, Eye, CheckCircle2, ShieldCheck } from 'lucide-react';
import { showToast } from '@/components/ui/toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ProposalInvoiceWizard } from '@/components/documents/proposal-invoice-wizard';

export default function ContractsPage() {
  const { user } = useStore();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [contracts, setContracts] = useState<ProposalContract[]>([
    {
      id: 'cont1',
      document_number: 'CONT-2026-001',
      title: 'Annual CRM SaaS Maintenance & Twilio SLA Agreement',
      type: 'Contract',
      client_id: 'c1',
      employee_id: user?.id || 'usr_emp_1',
      value: 180000,
      status: 'Active',
      signed_at: '2026-08-01',
      created_at: new Date().toISOString()
    }
  ]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/40 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <ScrollText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">SLA & Service Contracts Studio</h1>
              <p className="text-sm text-muted-foreground">Generate legal service level agreements, confidentiality, and signature terms</p>
            </div>
          </div>
        </div>

        <Button onClick={() => setWizardOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/25 cursor-pointer">
          <Plus className="mr-1.5 h-4 w-4" /> Create Qevn Contract
        </Button>
      </div>

      <ProposalInvoiceWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />

      {/* Contracts List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Client Contracts</CardTitle>
          <CardDescription>Legal SLA agreements, signature statuses, and active service contracts</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract #</TableHead>
                <TableHead>Title & Client</TableHead>
                <TableHead>Value (₹)</TableHead>
                <TableHead>Signed Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-bold text-blue-400">{c.document_number}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{c.title}</span>
                      <span className="text-[11px] text-muted-foreground">INFINIUM GLOBAL RESEARCH</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-foreground">₹{c.value.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.signed_at || 'Pending'}</TableCell>
                  <TableCell>
                    <Badge variant="success">
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setWizardOpen(true)} className="text-xs text-blue-400 hover:text-blue-300">
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
