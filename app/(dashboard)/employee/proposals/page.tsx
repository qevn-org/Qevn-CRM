'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/use-store';
import { ProposalContract } from '@/lib/mock-db';
import { 
  FileText, Plus, Download, Send, Eye, Copy, RefreshCw, 
  Trash2, CheckCircle2, XCircle, Clock, Search, Layers, Sparkles 
} from 'lucide-react';
import { showToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ProposalEditorWorkspace } from '@/components/proposals/proposal-editor-workspace';

export default function ProposalsPage() {
  const router = useRouter();
  const { user } = useStore();
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<ProposalContract | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [proposals, setProposals] = useState<ProposalContract[]>([
    {
      id: 'prop1',
      document_number: 'PROP-2026-001',
      title: 'AI-Powered Outbound Growth Engine Proposal',
      type: 'Proposal',
      client_id: 'c1',
      employee_id: user?.id || 'usr_emp_1',
      company_name: 'INFINIUM GLOBAL RESEARCH',
      client_name: 'Shrikant',
      recipient_email: 'shrikant@infiniumresearch.com',
      value: 283200,
      currency: 'INR',
      status: 'Sent',
      version: 1,
      views_count: 3,
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
      company_name: 'Prospect Company',
      client_name: 'Client Prospect',
      recipient_email: 'client@company.com',
      value: 180000,
      currency: 'INR',
      status: 'Draft',
      version: 1,
      views_count: 0,
      expires_at: '2026-08-30',
      created_at: new Date().toISOString()
    }
  ]);

  const totalValue = proposals.reduce((acc, p) => acc + p.value, 0);
  const sentCount = proposals.filter(p => p.status === 'Sent' || p.status === 'Viewed').length;
  const acceptedCount = proposals.filter(p => p.status === 'Accepted').length;

  const handleEditProposal = (p: ProposalContract) => {
    router.push(`/employee/proposals/builder?id=${p.id}`);
  };

  const handleCreateNewProposal = () => {
    router.push(`/employee/proposals/builder?id=prop_${Date.now()}`);
  };

  const handleDuplicateProposal = (p: ProposalContract) => {
    const duplicated: ProposalContract = {
      ...p,
      id: `prop_${Date.now()}`,
      document_number: `PROP-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: `${p.title} (Copy)`,
      status: 'Draft',
      version: 1,
      views_count: 0,
      created_at: new Date().toISOString()
    };
    setProposals([duplicated, ...proposals]);
    showToast(`Duplicated proposal: ${duplicated.document_number}`, 'success');
  };

  const handleDeleteProposal = (id: string, docNum: string) => {
    setProposals(proposals.filter(p => p.id !== id));
    showToast(`Deleted proposal ${docNum}`, 'info');
  };

  const handleSaveProposal = (saved: ProposalContract) => {
    const exists = proposals.find(p => p.id === saved.id);
    if (exists) {
      setProposals(proposals.map(p => p.id === saved.id ? saved : p));
    } else {
      setProposals([saved, ...proposals]);
    }
  };

  const filteredProposals = proposals.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
              <p className="text-sm text-muted-foreground">3-Part visual builder & multi-page proposals matching Shrikant/Infinium format</p>
            </div>
          </div>
        </div>

        <Button onClick={handleCreateNewProposal} className="bg-lime-600 hover:bg-lime-500 text-white font-bold shadow-lg shadow-lime-600/25 cursor-pointer">
          <Plus className="mr-1.5 h-4 w-4" /> Create Qevn Proposal
        </Button>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-card border border-border/40 space-y-1">
          <span className="text-muted-foreground block">Total Proposals</span>
          <span className="text-2xl font-bold text-foreground">{proposals.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border/40 space-y-1">
          <span className="text-muted-foreground block">Sent / Delivered</span>
          <span className="text-2xl font-bold text-blue-400">{sentCount}</span>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border/40 space-y-1">
          <span className="text-muted-foreground block">Accepted</span>
          <span className="text-2xl font-bold text-emerald-400">{acceptedCount}</span>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border/40 space-y-1">
          <span className="text-muted-foreground block">Total Pipeline Value</span>
          <span className="text-2xl font-bold text-lime-400">₹{totalValue.toLocaleString()}</span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by proposal # or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary/35 border border-border/40 rounded-xl pl-9 pr-4 py-2 text-xs text-foreground focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-secondary/35 border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Viewed">Viewed</option>
            <option value="Accepted">Accepted</option>
          </select>
        </div>
      </div>

      {/* Proposals List */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Proposal Management</CardTitle>
          <CardDescription>Visual builder, version tracking, A4 PDF exports, and public client links</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proposal #</TableHead>
                <TableHead>Title & Client</TableHead>
                <TableHead>Value (₹)</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProposals.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-bold text-lime-400">{p.document_number}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{p.title}</span>
                      <span className="text-[11px] text-muted-foreground">{p.client_name} • {p.company_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-foreground">₹{p.value.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">v{p.version || 1}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'Sent' || p.status === 'Viewed' ? 'success' : p.status === 'Accepted' ? 'success' : 'secondary'}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditProposal(p)} className="text-xs text-lime-400 hover:text-lime-300">
                      <Eye className="mr-1 h-3.5 w-3.5" /> Edit / Preview
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDuplicateProposal(p)} className="text-xs text-muted-foreground hover:text-foreground">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteProposal(p.id, p.document_number)} className="text-xs text-rose-400 hover:text-rose-300">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProposalEditorWorkspace
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        proposal={selectedProposal}
        onSave={handleSaveProposal}
      />
    </div>
  );
}
