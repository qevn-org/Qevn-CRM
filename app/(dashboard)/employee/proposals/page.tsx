'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/use-store';
import { ProposalContract } from '@/lib/mock-db';
import { FileText, Plus, Download, Send, Eye, CheckCircle2, Clock, Calendar, Sparkles } from 'lucide-react';
import { showToast } from '@/components/ui/toast';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ProposalInvoiceWizard } from '@/components/documents/proposal-invoice-wizard';

export default function ProposalsPage() {
  const { user } = useStore();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [proposals, setProposals] = useState<ProposalContract[]>([
    {
      id: 'prop1',
      document_number: 'PROP-2026-001',
      title: 'AI-Powered Outbound Growth Engine Proposal',
      type: 'Proposal',
      client_id: 'c1',
      employee_id: user?.id || 'usr_emp_1',
      value: 240000,
      status: 'Sent',
      expires_at: '2026-08-28',
      created_at: new Date().toISOString()
    },
    {
      id: 'prop2',
      document_number: 'PROP-2026-002',
      title: 'Enterprise CRM Softphone & Lead Automation Solution',
      type: 'Proposal',
      client_id: 'c2',
      employee_id: user?.id || 'usr_emp_1',
      value: 180000,
      status: 'Draft',
      expires_at: '2026-08-30',
      created_at: new Date().toISOString()
    }
  ]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/40 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-lime-500/10 text-lime-500">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Technical Proposals Studio</h1>
              <p className="text-sm text-muted-foreground">Generate 13-page Qevn brand proposals matching Shrikant/Infinium format</p>
            </div>
          </div>
        </div>

        <Button onClick={() => setWizardOpen(true)} className="bg-lime-600 hover:bg-lime-500 text-white font-bold shadow-lg shadow-lime-600/25 cursor-pointer">
          <Plus className="mr-1.5 h-4 w-4" /> Create Qevn Proposal
        </Button>
      </div>

      <ProposalInvoiceWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />

      {/* Proposals List */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Proposal History</CardTitle>
          <CardDescription>Official multi-page Qevn technical proposals and commercial scopes</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proposal #</TableHead>
                <TableHead>Title & Client</TableHead>
                <TableHead>Value (₹)</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-bold text-lime-400">{p.document_number}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{p.title}</span>
                      <span className="text-[11px] text-muted-foreground">SHRIKANT • INFINIUM GLOBAL RESEARCH</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-foreground">₹{p.value.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.expires_at}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'Sent' ? 'success' : 'secondary'}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setWizardOpen(true)} className="text-xs text-lime-400 hover:text-lime-300">
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
