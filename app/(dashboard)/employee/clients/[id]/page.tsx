'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/use-store';
import { db } from '@/lib/db';
import { Client, Meeting, ClientNote, Document, Activity, EmailLog } from '@/lib/mock-db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { showToast } from '@/components/ui/toast';
import { sendEmail, emailTemplates } from '@/lib/email/resend';
import { 
  Building2, User, Mail, Phone, Globe, MapPin, 
  Tag, Calendar, FileText, Send, Plus, ArrowLeft, History,
  Trash2, Download
} from 'lucide-react';
import Link from 'next/link';

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  const router = useRouter();
  const { id: clientId } = use(params);
  const { user } = useStore();

  // Data States
  const [client, setClient] = useState<Client | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes' | 'meetings' | 'emails' | 'documents'>('timeline');

  // Input states
  const [newNote, setNewNote] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  // Client Edit Fields
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [industry, setIndustry] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState<Client['status']>('Lead');
  const [priority, setPriority] = useState<Client['priority']>('Medium');

  const fetchData = async () => {
    if (!clientId) return;
    try {
      const data = await db.getClient(clientId);
      if (!data) {
        showToast('Client profile not found', 'error');
        router.push('/employee/clients');
        return;
      }
      setClient(data);
      
      // Initialize edit fields
      setClientName(data.client_name);
      setCompanyName(data.company_name);
      setDesignation(data.designation || '');
      setClientEmail(data.email || '');
      setClientPhone(data.phone || '');
      setWebsite(data.website || '');
      setLinkedin(data.linkedin || '');
      setIndustry(data.industry || '');
      setCity(data.city || '');
      setCountry(data.country || '');
      setStatus(data.status);
      setPriority(data.priority);

      // Load related arrays
      const meetList = await db.getMeetings(user!.id, user!.role);
      setMeetings(meetList.filter(m => m.client_id === clientId));

      const noteList = await db.getClientNotes(clientId);
      setNotes(noteList);

      const docList = await db.getDocuments(clientId);
      setDocuments(docList);

      const actList = await db.getActivities(user!.id, user!.role);
      setActivities(actList.filter(a => a.client_id === clientId));

      const emailList = await db.getEmailLogs(user!.id, user!.role);
      setEmails(emailList.filter(e => e.client_id === clientId));

    } catch (e) {
      console.error(e);
      showToast('Error fetching client details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clientId, user]);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !companyName) return;

    try {
      const updated = await db.updateClient(clientId, {
        client_name: clientName,
        company_name: companyName,
        designation,
        email: clientEmail,
        phone: clientPhone,
        website,
        linkedin,
        industry,
        city,
        country,
        status,
        priority
      });

      if (updated) {
        setClient(updated);
        setIsEditingInfo(false);
        showToast('Core details updated', 'success');

        await db.createActivity({
          client_id: clientId,
          employee_id: user!.id,
          action: 'Client Updated',
          description: 'Modified client contact cards'
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update details', 'error');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const created = await db.createClientNote(clientId, user!.id, newNote);
      if (created) {
        showToast('Note saved to history', 'success');
        setNewNote('');
        
        await db.createActivity({
          client_id: clientId,
          employee_id: user!.id,
          action: 'Meeting Notes Added',
          description: `Logged a note: "${newNote.slice(0, 30)}..."`
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) return;

    try {
      const created = await db.createDocument({
        client_id: clientId,
        employee_id: user!.id,
        file_name: fileToUpload.name,
        file_url: '#', // In real Supabase, upload to storage and store URL
        file_size: fileToUpload.size,
        file_type: fileToUpload.type
      });

      if (created) {
        showToast(`Uploaded ${fileToUpload.name} successfully`, 'success');
        setFileToUpload(null);
        
        await db.createActivity({
          client_id: clientId,
          employee_id: user!.id,
          action: 'Document Uploaded',
          description: `Attached reference file: ${created.file_name}`
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDocument = async (docId: string, name: string) => {
    try {
      const success = await db.deleteDocument(docId);
      if (success) {
        showToast(`Removed attachment: ${name}`, 'success');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dispatch discovery feedback email manually
  const handleSendFeedback = async (meeting: Meeting) => {
    if (!client?.email) {
      showToast('Client does not have a registered email address', 'warning');
      return;
    }

    try {
      const emailContent = emailTemplates.meetingConfirmation(
        client.client_name,
        client.company_name,
        meeting.meeting_title,
        meeting.meeting_date,
        meeting.meeting_start,
        meeting.meeting_link || 'Google Meet'
      );

      const { success } = await sendEmail({
        to: client.email,
        subject: emailContent.subject,
        html: emailContent.html,
        clientId,
        employeeId: user!.id,
        template: 'Meeting Feedback'
      });

      if (success) {
        showToast('Feedback template sent to client', 'success');
        
        // Update meeting state
        await db.updateMeeting(meeting.id, { feedback_sent: true });
        
        // Audit log
        await db.createActivity({
          client_id: clientId,
          employee_id: user!.id,
          action: 'Feedback Sent',
          description: `Dispatched discovery feedback for call: ${meeting.meeting_title}`
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to dispatch feedback', 'error');
    }
  };

  // Dispatch followup email manually
  const handleSendFollowup = async (meeting: Meeting) => {
    if (!client?.email) {
      showToast('Client email missing', 'warning');
      return;
    }

    try {
      const emailContent = emailTemplates.followupReminder(client.company_name);
      const { success } = await sendEmail({
        to: client.email,
        subject: emailContent.subject,
        html: emailContent.html,
        clientId,
        employeeId: user!.id,
        template: 'Follow-up Email'
      });

      if (success) {
        showToast('Follow-up email dispatched', 'success');
        
        // Update meeting state
        await db.updateMeeting(meeting.id, { followup_sent: true });

        // Audit log
        await db.createActivity({
          client_id: clientId,
          employee_id: user!.id,
          action: 'Email Sent',
          description: `Dispatched followup template for call: ${meeting.meeting_title}`
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="text-center py-20 text-muted-foreground animate-pulse">Loading profile detailed workspace...</div>;
  }

  if (!client) return null;

  // Timeline compiler: Merge activities, notes, and emails chronological
  const timelineItems = [
    ...activities.map(a => ({ type: 'activity', date: a.timestamp, title: a.action, desc: a.description })),
    ...notes.map(n => ({ type: 'note', date: n.created_at, title: 'Note Added', desc: n.content })),
    ...emails.map(e => ({ type: 'email', date: e.sent_at, title: `Email: ${e.template}`, desc: `Sent to ${e.recipient} - status: ${e.status}` }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Back button and profile title */}
      <div className="flex items-center space-x-3">
        <Link href="/employee/clients">
          <Button variant="outline" size="sm" className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Client Profile</span>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center">
            {client.client_name}
            <Badge variant="outline" className="ml-3 border-primary/40 bg-primary/10 text-primary">
              {client.status}
            </Badge>
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column: Core parameters cards */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex justify-between items-center flex-row">
            <CardTitle>Client Card</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsEditingInfo(!isEditingInfo)}>
              {isEditingInfo ? 'Cancel' : 'Edit'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingInfo ? (
              <form onSubmit={handleUpdateInfo} className="space-y-4">
                <Input label="Name" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                <Input label="Company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                <Input label="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} />
                <Input label="Email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                <Input label="Phone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
                <Input label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
                <Input label="LinkedIn" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
                <Input label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
                <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
                <Select
                  label="Status"
                  options={['Lead', 'Contacted', 'Meeting Scheduled', 'Meeting Completed', 'Feedback Pending', 'Feedback Sent', 'Follow-up Pending', 'Negotiation', 'Won', 'Lost'].map(s => ({ value: s, label: s }))}
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                />
                <Select
                  label="Priority"
                  options={[{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }]}
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                />
                <Button type="submit" className="w-full">Save Changes</Button>
              </form>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Designation</p>
                    <p className="font-medium">{client.designation || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Company</p>
                    <p className="font-medium">{client.company_name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Email Address</p>
                    <p className="font-medium">{client.email || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Phone Number</p>
                    <p className="font-medium">{client.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Website</p>
                    {client.website ? (
                      <a href={client.website} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">
                        {client.website}
                      </a>
                    ) : (
                      <p className="font-medium">—</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">LinkedIn</p>
                    {client.linkedin ? (
                      <a href={client.linkedin} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">
                        View profile
                      </a>
                    ) : (
                      <p className="font-medium">—</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Location</p>
                    <p className="font-medium">
                      {client.city ? `${client.city}, ` : ''}{client.country || '—'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/20">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Priority</span>
                    <p className="font-semibold text-foreground mt-0.5">{client.priority}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Lead Source</span>
                    <p className="font-semibold text-foreground mt-0.5">{client.lead_source || 'Unknown'}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Columns: Tabbed panels and views */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation tabs */}
          <div className="flex space-x-1 border-b border-border/20 pb-px">
            {([
              { id: 'timeline', label: 'Timeline', icon: History },
              { id: 'notes', label: 'Notes', icon: FileText },
              { id: 'meetings', label: 'Meetings', icon: Calendar },
              { id: 'emails', label: 'Email Logs', icon: Mail },
              { id: 'documents', label: 'Files', icon: Tag }
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 text-xs font-semibold border-b-2 tracking-wide uppercase transition-all duration-150 cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="mr-2 h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Panes */}
          <Card>
            <CardContent className="p-6">
              {activeTab === 'timeline' && (
                <div className="space-y-6">
                  {timelineItems.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-10">No logs found on this lead timeline.</p>
                  ) : (
                    <div className="relative border-l border-border/40 pl-6 space-y-6 ml-2">
                      {timelineItems.map((item, idx) => (
                        <div key={idx} className="relative">
                          {/* Chrono dot */}
                          <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-card">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(item.date).toLocaleString()}
                            </span>
                            <h4 className="text-sm font-semibold text-foreground mt-0.5">{item.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-6">
                  {/* Note Creator Form */}
                  <form onSubmit={handleAddNote} className="space-y-3">
                    <textarea
                      placeholder="Type interactions notes, negotiation progress..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex min-h-[80px] w-full rounded-lg border border-border/40 bg-secondary/35 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      required
                    />
                    <div className="flex justify-end">
                      <Button type="submit" size="sm" className="flex items-center">
                        <Send className="mr-2 h-3 w-3" /> Log Note
                      </Button>
                    </div>
                  </form>

                  {/* Notes Feed */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide border-b border-border/20 pb-2">
                      Historical Notes
                    </h4>
                    {notes.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-6">No historical notes registered.</p>
                    ) : (
                      notes.map((note) => (
                        <div key={note.id} className="p-4 rounded-xl bg-secondary/20 border border-border/20 space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Logged on {new Date(note.created_at).toLocaleString()}
                          </p>
                          <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                            {note.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'meetings' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Meetings History</h4>
                    <Link href={`/employee/meetings?client=${clientId}`}>
                      <Button size="sm" className="flex items-center">
                        <Plus className="mr-2 h-3 w-3" /> Schedule
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {meetings.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-10">No meetings scheduled.</p>
                    ) : (
                      meetings.map((meet) => (
                        <div key={meet.id} className="p-4 rounded-xl border border-border/20 bg-secondary/15 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div className="space-y-1">
                            <h5 className="font-semibold text-sm">{meet.meeting_title}</h5>
                            <p className="text-xs text-muted-foreground">
                              {meet.meeting_date} at {meet.meeting_start} - {meet.meeting_end} ({meet.timezone})
                            </p>
                            {meet.meeting_link && (
                              <a href={meet.meeting_link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center mt-1">
                                Call Join Link: {meet.meeting_link}
                              </a>
                            )}
                          </div>

                          {/* Email notification controllers */}
                          <div className="flex sm:flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs py-1 h-8"
                              onClick={() => handleSendFeedback(meet)}
                              disabled={meet.feedback_sent}
                            >
                              {meet.feedback_sent ? 'Feedback Sent' : 'Send Feedback'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs py-1 h-8"
                              onClick={() => handleSendFollowup(meet)}
                              disabled={meet.followup_sent}
                            >
                              {meet.followup_sent ? 'Followup Sent' : 'Send Follow-up'}
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'emails' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Emails Logs</h4>
                  <div className="space-y-3">
                    {emails.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-10">No logged email triggers.</p>
                    ) : (
                      emails.map((e) => (
                        <div key={e.id} className="p-3 rounded-lg border border-border/20 bg-secondary/10 flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold">{e.template}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Sent to {e.recipient}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] bg-secondary/60 border border-border px-1.5 py-0.5 rounded font-bold uppercase">
                              {e.status}
                            </span>
                            <span className="text-[9px] text-muted-foreground/60 block mt-1">
                              {new Date(e.sent_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-6">
                  {/* File Uploader Form */}
                  <form onSubmit={handleUploadFile} className="flex items-center gap-3 border border-dashed border-border/40 rounded-xl p-4 bg-secondary/5">
                    <Input
                      type="file"
                      onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                      className="border-none bg-transparent hover:bg-secondary/40 text-xs py-1 cursor-pointer"
                    />
                    <Button type="submit" size="sm" disabled={!fileToUpload}>
                      Upload File
                    </Button>
                  </form>

                  {/* Documents list */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Uploaded Attachments</h4>
                    {documents.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-6">No attachments uploaded yet.</p>
                    ) : (
                      documents.map((doc) => (
                        <div key={doc.id} className="flex justify-between items-center p-3 rounded-lg border border-border/20 bg-secondary/10">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-primary/75" />
                            <div>
                              <p className="text-xs font-semibold text-foreground truncate max-w-[200px]">{doc.file_name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : 'Mock Size'} • {doc.file_type || 'Unknown type'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadMock(doc.file_name)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc.id, doc.file_name)}>
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // Helper mock download trigger
  function handleDownloadMock(name: string) {
    showToast(`Downloading mock attachment: ${name}`, 'info');
  }
}
