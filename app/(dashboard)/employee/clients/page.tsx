'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { Client } from '@/lib/mock-db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { showToast } from '@/components/ui/toast';
import { 
  Plus, Search, Download, Edit3, Trash2, Archive, 
  ExternalLink, Building2, User, Mail, Tag 
} from 'lucide-react';
import Link from 'next/link';

// Component inside suspense boundary to handle Search Params correctly
function ClientsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useStore();

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');

  // Dialog States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form Fields
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [industry, setIndustry] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [leadSource, setLeadSource] = useState('');
  const [status, setStatus] = useState<'Lead' | 'Contacted' | 'Meeting Scheduled' | 'Meeting Completed' | 'Feedback Pending' | 'Feedback Sent' | 'Follow-up Pending' | 'Negotiation' | 'Won' | 'Lost'>('Lead');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [notes, setNotes] = useState('');

  const fetchClients = async () => {
    if (!user) return;
    try {
      const list = await db.getClients(user.id, user.role);
      setClients(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user]);

  // Open "Add Client" dialog if query params has add=true
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      openAddModal();
      // Remove query param without refresh
      router.replace('/employee/clients');
    }
  }, [searchParams, router]);

  const openAddModal = () => {
    setEditingClient(null);
    setClientName('');
    setCompanyName('');
    setDesignation('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setLinkedin('');
    setIndustry('');
    setCity('');
    setCountry('');
    setLeadSource('');
    setStatus('Lead');
    setPriority('Medium');
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setClientName(client.client_name);
    setCompanyName(client.company_name);
    setDesignation(client.designation || '');
    setEmail(client.email || '');
    setPhone(client.phone || '');
    setWebsite(client.website || '');
    setLinkedin(client.linkedin || '');
    setIndustry(client.industry || '');
    setCity(client.city || '');
    setCountry(client.country || '');
    setLeadSource(client.lead_source || '');
    setStatus(client.status);
    setPriority(client.priority);
    setNotes(client.notes || '');
    setModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !companyName) {
      showToast('Name and Company Name are required', 'warning');
      return;
    }

    const payload = {
      employee_id: user!.id,
      company_name: companyName,
      client_name: clientName,
      designation,
      email,
      phone,
      website,
      linkedin,
      industry,
      city,
      country,
      lead_source: leadSource,
      status,
      priority,
      notes
    };

    try {
      if (editingClient) {
        // Edit Action
        const updated = await db.updateClient(editingClient.id, payload);
        if (updated) {
          showToast(`Updated profile for ${clientName}`, 'success');
          await db.createActivity({
            client_id: editingClient.id,
            employee_id: user!.id,
            action: 'Client Updated',
            description: `Modified core information parameters`
          });
        }
      } else {
        // Add Action
        const created = await db.createClient(payload);
        if (created) {
          showToast(`Successfully added client ${clientName}`, 'success');
          await db.createActivity({
            client_id: created.id,
            employee_id: user!.id,
            action: 'Client Created',
            description: `Added client profile ${clientName} (${companyName}) to database`
          });
        }
      }
      setModalOpen(false);
      fetchClients();
    } catch (err) {
      console.error(err);
      showToast('Error saving client records', 'error');
    }
  };

  const handleDeleteClient = async (clientId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const success = await db.deleteClient(clientId);
      if (success) {
        showToast(`Deleted ${name} from CRM`, 'success');
        fetchClients();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchiveClient = async (client: Client) => {
    try {
      const updated = await db.updateClient(client.id, { archived: true });
      if (updated) {
        showToast(`Archived client ${client.client_name}`, 'success');
        fetchClients();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CSV Export Utility
  const handleExportCSV = () => {
    if (filteredClients.length === 0) {
      showToast('No clients to export', 'warning');
      return;
    }

    const headers = ['Client Name', 'Company', 'Designation', 'Email', 'Phone', 'Industry', 'Status', 'Priority', 'Country'];
    const csvRows = [headers.join(',')];

    filteredClients.forEach(c => {
      const row = [
        `"${c.client_name}"`,
        `"${c.company_name}"`,
        `"${c.designation || ''}"`,
        `"${c.email || ''}"`,
        `"${c.phone || ''}"`,
        `"${c.industry || ''}"`,
        `"${c.status}"`,
        `"${c.priority}"`,
        `"${c.country || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `QEVN_CRM_Clients_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV file successfully', 'success');
  };

  const uniqueIndustries = Array.from(new Set(clients.map(c => c.industry).filter(Boolean)));

  const filteredClients = clients.filter(c => {
    const text = `${c.client_name} ${c.company_name} ${c.email || ''} ${c.industry || ''} ${c.country || ''}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || c.priority === priorityFilter;
    const matchesIndustry = industryFilter === 'All' || c.industry === industryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesIndustry;
  });

  const getPriorityColor = (p: string) => {
    if (p === 'High') return 'danger';
    if (p === 'Medium') return 'warning';
    return 'info';
  };

  const getStatusColor = (s: string) => {
    if (s === 'Won') return 'success';
    if (s === 'Lost') return 'danger';
    if (s.startsWith('Meeting')) return 'info';
    if (s.includes('Pending')) return 'warning';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Clients Directory</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage, filter, and review client relationships in your catalog.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button className="flex items-center" onClick={openAddModal}>
            <Plus className="mr-2 h-4 w-4" /> Add Client
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client, company, email, country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full md:w-auto">
            <Select
              options={[
                { value: 'All', label: 'All Statuses' },
                ...['Lead', 'Contacted', 'Meeting Scheduled', 'Meeting Completed', 'Feedback Pending', 'Feedback Sent', 'Follow-up Pending', 'Negotiation', 'Won', 'Lost'].map(s => ({ value: s, label: s }))
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 text-xs py-1"
            />
            <Select
              options={[
                { value: 'All', label: 'All Priorities' },
                { value: 'High', label: 'High Priority' },
                { value: 'Medium', label: 'Medium Priority' },
                { value: 'Low', label: 'Low Priority' }
              ]}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-10 text-xs py-1"
            />
            <Select
              options={[
                { value: 'All', label: 'All Industries' },
                ...uniqueIndustries.map(ind => ({ value: ind as string, label: ind as string }))
              ]}
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="h-10 text-xs py-1 col-span-2 sm:col-span-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main client table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-10 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-secondary/30 animate-pulse rounded-lg w-full" />
              ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/60 mb-3" />
              <h3 className="text-md font-bold">No clients found</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Try clearing filters or add a new client to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Details</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <Link href={`/employee/clients/${client.id}`} className="font-bold text-foreground hover:text-primary transition-colors flex items-center">
                          {client.client_name}
                          <ExternalLink className="h-3 w-3 ml-1 opacity-0 hover:opacity-100 transition-opacity" />
                        </Link>
                        {client.designation && (
                          <span className="text-[11px] text-muted-foreground">{client.designation}</span>
                        )}
                        {client.email && (
                          <span className="text-[10px] text-muted-foreground flex items-center mt-0.5">
                            <Mail className="h-2.5 w-2.5 mr-1" /> {client.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground">{client.company_name}</span>
                      {client.country && (
                        <span className="text-[10px] text-muted-foreground block">{client.city ? `${client.city}, ` : ''}{client.country}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{client.industry || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(client.status)}>{client.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(client.priority)}>{client.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1.5">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(client)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleArchiveClient(client)}>
                          <Archive className="h-4 w-4 text-amber-400" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClient(client.id, client.client_name)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Client Dialog */}
      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingClient ? 'Edit Client Profile' : 'Add New Client'}
        description={editingClient ? 'Modify contact parameters and pipeline stages.' : 'Enter details to add this lead to your pipeline.'}
        className="max-w-2xl"
      >
        <form onSubmit={handleSaveClient} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Client Name *"
              placeholder="e.g. Aditya Sen"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
            <Input
              label="Company Name *"
              placeholder="e.g. Stripe Inc"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
            <Input
              label="Designation"
              placeholder="e.g. VP of Product"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. aditya@stripe.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Phone Number"
              placeholder="e.g. +91 98765 00000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label="Website"
              placeholder="e.g. https://stripe.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
            <Input
              label="LinkedIn URL"
              placeholder="e.g. https://linkedin.com/in/username"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
            />
            <Input
              label="Industry"
              placeholder="e.g. Fintech"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
            <Input
              label="City"
              placeholder="e.g. Bangalore"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              label="Country"
              placeholder="e.g. India"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
            <Input
              label="Lead Source"
              placeholder="e.g. Direct Inbound"
              value={leadSource}
              onChange={(e) => setLeadSource(e.target.value)}
            />
            <Select
              label="Priority *"
              options={[
                { value: 'Low', label: 'Low Priority' },
                { value: 'Medium', label: 'Medium Priority' },
                { value: 'High', label: 'High Priority' }
              ]}
              value={priority}
              onChange={(e: any) => setPriority(e.target.value)}
            />
            <Select
              label="Funnel Status *"
              options={['Lead', 'Contacted', 'Meeting Scheduled', 'Meeting Completed', 'Feedback Pending', 'Feedback Sent', 'Follow-up Pending', 'Negotiation', 'Won', 'Lost'].map(s => ({ value: s, label: s }))}
              value={status}
              onChange={(e: any) => setStatus(e.target.value)}
              className="sm:col-span-2"
            />
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Initial notes</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-border/40 bg-secondary/35 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Provide background context for the lead..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-border/10">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Client
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

// Wrapping layout with Suspense for build compatibility
export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Loading directory view...</div>}>
      <ClientsContent />
    </Suspense>
  );
}
