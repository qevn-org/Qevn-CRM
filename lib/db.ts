import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase';
import { logAuth, purgeClientSession } from './auth/auth-guard';
import { 
  getMockDB, 
  saveMockDB, 
  Profile, 
  Client, 
  Meeting, 
  ClientNote, 
  Document, 
  Activity, 
  EmailLog, 
  CalendarIntegration,
  TwilioIntegration,
  CallLog,
  EODReport,
  EODWorkItem
} from './mock-db';

// Helper to generate IDs when in mock mode
const genId = (prefix: string) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

// Helper to check valid UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUUID = (id?: string) => {
  if (!id) return false;
  return UUID_REGEX.test(id);
};

// Dynamic Router: checks if Supabase is available and ID format is valid UUID
const useSupabase = (id?: string) => {
  if (!isSupabaseConfigured() || !supabase) return false;
  if (id && !isUUID(id)) return false;
  return true;
};

// =========================================================================
// DATA ACCESS LAYER INTERFACE
// =========================================================================
export const db = {
  // -----------------------------------------------------------------------
  // AUTHENTICATION & PROFILES
  // -----------------------------------------------------------------------
  async login(email: string, password: string): Promise<{ profile: Profile | null; error: string | null }> {
    if (isSupabaseConfigured() && supabase) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!authError && authData.user) {
        const { data: profile, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (!profError && profile) {
          return { profile, error: null };
        }
      }
    }
    // Fallback to local DB login for demo/mock users
    const mockDb = getMockDB();
    const profile = mockDb.profiles.find(p => p.email.toLowerCase() === email.toLowerCase()) || null;
    if (profile) {
      return { profile, error: null };
    }
    return { profile: null, error: 'Invalid email or password' };
  },

  async logout(): Promise<boolean> {
    logAuth('Executing complete session logout and cache invalidation');
    try {
      if (isSupabaseConfigured() && supabase) {
        await supabase.auth.signOut({ scope: 'global' });
      }
    } catch (e) {
      console.error('[AUTH_LOGOUT] Error signing out from Supabase:', e);
    }
    
    // Purge cookies, localStorage, and sessionStorage
    purgeClientSession();
    return true;
  },

  async validateSession(userId: string): Promise<{ valid: boolean; profile: Profile | null }> {
    try {
      if (!userId) return { valid: false, profile: null };
      const profile = await this.getProfile(userId);
      if (!profile || profile.status === 'disabled') {
        logAuth(`Session validation failed for userId ${userId}: profile disabled or missing`);
        return { valid: false, profile: null };
      }
      return { valid: true, profile };
    } catch (e) {
      console.error('[AUTH_VALIDATION] Exception during session validation:', e);
      return { valid: false, profile: null };
    }
  },

  async getProfile(userId: string): Promise<Profile | null> {
    if (useSupabase(userId) && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) return null;
      return data;
    } else {
      const mockDb = getMockDB();
      return mockDb.profiles.find(p => p.id === userId) || null;
    }
  },

  async listProfiles(userId?: string): Promise<Profile[]> {
    if (useSupabase(userId) && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    } else {
      const mockDb = getMockDB();
      return mockDb.profiles;
    }
  },

  async createProfile(name: string, email: string, phone: string, role: 'admin' | 'employee', userId?: string): Promise<Profile | null> {
    if (isSupabaseConfigured() && supabaseAdmin) {
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: 'password',
          email_confirm: true,
          user_metadata: { name, role, phone }
        });

        if (!authError && authData.user) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (profile) return profile;

          // If trigger didn't fire, manually upsert profile
          const { data: newProfile } = await supabaseAdmin
            .from('profiles')
            .upsert({
              id: authData.user.id,
              name,
              email,
              phone,
              role,
              status: 'active'
            })
            .select()
            .single();

          return newProfile;
        }
      } catch (err) {
        console.error('[DB] Supabase admin create user error:', err);
      }
    }

    const mockDb = getMockDB();
    if (mockDb.profiles.some(p => p.email.toLowerCase() === email.toLowerCase())) {
      return null;
    }
    const newProfile: Profile = {
      id: genId('usr_emp'),
      name,
      email,
      phone,
      role,
      status: 'active',
      created_at: new Date().toISOString()
    };
    mockDb.profiles.push(newProfile);
    saveMockDB(mockDb);
    return newProfile;
  },

  async updateProfileStatus(userId: string, status: 'active' | 'disabled'): Promise<boolean> {
    if (useSupabase(userId) && supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);
      return !error;
    } else {
      const mockDb = getMockDB();
      const idx = mockDb.profiles.findIndex(p => p.id === userId);
      if (idx !== -1) {
        mockDb.profiles[idx].status = status;
        saveMockDB(mockDb);
        return true;
      }
      return false;
    }
  },

  async deleteProfile(userId: string): Promise<boolean> {
    if (useSupabase(userId) && supabase) {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      return !error;
    } else {
      const mockDb = getMockDB();
      mockDb.profiles = mockDb.profiles.filter(p => p.id !== userId);
      saveMockDB(mockDb);
      return true;
    }
  },

  // -----------------------------------------------------------------------
  // CLIENTS
  // -----------------------------------------------------------------------
  async getClients(userId: string, role: string, showArchived = false): Promise<Client[]> {
    if (useSupabase(userId) && supabase) {
      let query = supabase
        .from('clients')
        .select('*, profiles:employee_id(name)')
        .eq('archived', showArchived);
      
      if (role !== 'admin') {
        query = query.eq('employee_id', userId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) return [];
      return (data || []).map(c => ({
        ...c,
        owner_name: (c.profiles as any)?.name || 'Unknown'
      }));
    } else {
      const mockDb = getMockDB();
      let clients = mockDb.clients.filter(c => c.archived === showArchived);
      if (role !== 'admin') {
        clients = clients.filter(c => c.employee_id === userId);
      }
      const profilesMap = new Map(mockDb.profiles.map(p => [p.id, p.name]));
      return clients.map(c => ({
        ...c,
        owner_name: c.employee_id ? (profilesMap.get(c.employee_id) || 'Unknown') : 'Unknown'
      }));
    }
  },

  async getClient(clientId: string): Promise<Client | null> {
    if (useSupabase(clientId) && supabase) {
      const { data, error } = await supabase
        .from('clients')
        .select('*, profiles:employee_id(name)')
        .eq('id', clientId)
        .single();
      if (error) return null;
      return {
        ...data,
        owner_name: (data.profiles as any)?.name || 'Unknown'
      };
    } else {
      const mockDb = getMockDB();
      const client = mockDb.clients.find(c => c.id === clientId);
      if (!client) return null;
      const profile = client.employee_id ? mockDb.profiles.find(p => p.id === client.employee_id) : null;
      return {
        ...client,
        owner_name: profile?.name || 'Unknown'
      };
    }
  },

  async createClient(client: Omit<Client, 'id' | 'created_at' | 'archived'>): Promise<Client | null> {
    let created: Client | null = null;
    if (useSupabase(client.employee_id || undefined) && supabase) {
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...client, archived: false })
        .select()
        .single();
      if (error) {
        console.error('Error creating client in Supabase:', error);
        return null;
      }
      created = data;
    } else {
      const mockDb = getMockDB();
      const newClient: Client = {
        ...client,
        id: genId('cli'),
        archived: false,
        created_at: new Date().toISOString()
      };
      mockDb.clients.push(newClient);
      saveMockDB(mockDb);
      created = newClient;
    }

    if (created && client.employee_id) {
      await this.createActivity({
        client_id: created.id,
        employee_id: client.employee_id,
        action: 'Lead Created',
        description: `New lead created: ${created.client_name} (${created.company_name})`
      });
    }

    return created;
  },

  async updateClient(clientId: string, clientData: Partial<Client>): Promise<Client | null> {
    let updated: Client | null = null;
    if (useSupabase(clientId) && supabase) {
      const { data, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', clientId)
        .select()
        .single();
      if (error) return null;
      updated = data;
    } else {
      const mockDb = getMockDB();
      const idx = mockDb.clients.findIndex(c => c.id === clientId);
      if (idx === -1) return null;
      
      mockDb.clients[idx] = {
        ...mockDb.clients[idx],
        ...clientData
      };
      saveMockDB(mockDb);
      updated = mockDb.clients[idx];
    }

    if (updated && updated.employee_id) {
      const desc = clientData.status 
        ? `Lead status updated to "${clientData.status}" for ${updated.client_name}`
        : `Lead details updated for ${updated.client_name}`;
      await this.createActivity({
        client_id: updated.id,
        employee_id: updated.employee_id,
        action: 'Lead Updated',
        description: desc
      });
    }

    return updated;
  },

  async deleteClient(clientId: string): Promise<boolean> {
    if (useSupabase(clientId) && supabase) {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);
      return !error;
    } else {
      const mockDb = getMockDB();
      mockDb.clients = mockDb.clients.filter(c => c.id !== clientId);
      saveMockDB(mockDb);
      return true;
    }
  },

  async bulkImportRecords(
    employeeId: string,
    target: 'Leads' | 'Contacts' | 'Clients' | 'Companies',
    records: Array<{
      client_name: string;
      company_name: string;
      email?: string;
      phone?: string;
      designation?: string;
      website?: string;
      linkedin?: string;
      industry?: string;
      city?: string;
      country?: string;
      lead_source?: string;
      status?: Client['status'];
      priority?: 'Low' | 'Medium' | 'High';
      notes?: string;
    }>,
    duplicateAction: 'skip' | 'update' | 'create',
    duplicateCheckFields: Array<'email' | 'phone' | 'company'>
  ): Promise<{
    totalProcessed: number;
    imported: number;
    updated: number;
    skipped: number;
    failed: number;
    errors: Array<{ row: number; reason: string }>;
  }> {
    let defaultStatus: Client['status'] = 'Lead';
    if (target === 'Contacts') defaultStatus = 'Contacted';
    if (target === 'Clients') defaultStatus = 'Won';
    if (target === 'Companies') defaultStatus = 'Lead';

    const result = {
      totalProcessed: records.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [] as Array<{ row: number; reason: string }>
    };

    const mockDb = getMockDB();
    const existingClients = mockDb.clients;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const rowNum = i + 1;

      try {
        let existing: Client | undefined = undefined;

        if (duplicateCheckFields.includes('email') && rec.email?.trim()) {
          existing = existingClients.find(c => c.email && c.email.toLowerCase() === rec.email?.toLowerCase().trim());
        }
        if (!existing && duplicateCheckFields.includes('phone') && rec.phone?.trim()) {
          existing = existingClients.find(c => c.phone && c.phone.trim() === rec.phone?.trim());
        }
        if (!existing && duplicateCheckFields.includes('company') && rec.company_name?.trim()) {
          existing = existingClients.find(c => c.company_name && c.company_name.toLowerCase() === rec.company_name?.toLowerCase().trim());
        }

        if (existing) {
          if (duplicateAction === 'skip') {
            result.skipped++;
            continue;
          } else if (duplicateAction === 'update') {
            const updatedData: Partial<Client> = {
              client_name: rec.client_name || existing.client_name,
              company_name: rec.company_name || existing.company_name,
              email: rec.email || existing.email,
              phone: rec.phone || existing.phone,
              designation: rec.designation || existing.designation,
              website: rec.website || existing.website,
              linkedin: rec.linkedin || existing.linkedin,
              industry: rec.industry || existing.industry,
              city: rec.city || existing.city,
              country: rec.country || existing.country,
              lead_source: rec.lead_source || existing.lead_source,
              notes: rec.notes ? `${existing.notes ? existing.notes + '\n' : ''}${rec.notes}` : existing.notes
            };

            await this.updateClient(existing.id, updatedData);
            result.updated++;
            continue;
          }
        }

        const newRecordData: Omit<Client, 'id' | 'created_at' | 'archived'> = {
          employee_id: employeeId,
          client_name: rec.client_name || rec.company_name || 'Imported Contact',
          company_name: rec.company_name || 'N/A',
          designation: rec.designation || '',
          email: rec.email || '',
          phone: rec.phone || '',
          website: rec.website || '',
          linkedin: rec.linkedin || '',
          industry: rec.industry || '',
          city: rec.city || '',
          country: rec.country || '',
          lead_source: rec.lead_source || 'Import',
          status: rec.status || defaultStatus,
          priority: rec.priority || 'Medium',
          notes: rec.notes || ''
        };

        const created = await this.createClient(newRecordData);
        if (created) {
          result.imported++;
        } else {
          result.failed++;
          result.errors.push({ row: rowNum, reason: 'Failed to create record in database' });
        }
      } catch (err: any) {
        result.failed++;
        result.errors.push({ row: rowNum, reason: err.message || 'Unknown import error' });
      }
    }

    return result;
  },

  // -----------------------------------------------------------------------
  // MEETINGS
  // -----------------------------------------------------------------------
  async getMeetings(userId: string, role: string): Promise<Meeting[]> {
    if (useSupabase(userId) && supabase) {
      try {
        let query = supabase.from('meetings').select('*');
        if (role !== 'admin' && userId) {
          query = query.eq('employee_id', userId);
        }
        const { data, error } = await query.order('meeting_date', { ascending: false });
        if (!error && data) {
          const mockDb = getMockDB();
          const mockMeetings = (role === 'admin' || !userId)
            ? mockDb.meetings
            : mockDb.meetings.filter(m => m.employee_id === userId);
          const existingIds = new Set(data.map(m => m.id));
          const extra = mockMeetings.filter(m => !existingIds.has(m.id));
          return [...data, ...extra];
        }
      } catch (e) {
        console.warn('[DB] Supabase getMeetings failed, falling back to local DB:', e);
      }
    }
    const mockDb = getMockDB();
    if (role === 'admin' || !userId) {
      return mockDb.meetings;
    }
    return mockDb.meetings.filter(m => m.employee_id === userId);
  },

  async getMeeting(meetingId: string): Promise<Meeting | null> {
    if (useSupabase(meetingId) && supabase) {
      try {
        const { data, error } = await supabase
          .from('meetings')
          .select('*')
          .eq('id', meetingId)
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('[DB] Supabase getMeeting failed:', e);
      }
    }
    const mockDb = getMockDB();
    return mockDb.meetings.find(m => m.id === meetingId) || null;
  },

  async createMeeting(meeting: Omit<Meeting, 'id' | 'created_at' | 'feedback_sent' | 'followup_sent' | 'feedback_reminder_sent' | 'followup_reminder_sent'>): Promise<Meeting | null> {
    const defaultPayload = {
      ...meeting,
      platform: meeting.platform || 'Google Meet',
      status: meeting.status || 'Scheduled',
      feedback_sent: false,
      followup_sent: false,
      feedback_reminder_sent: false,
      followup_reminder_sent: false
    };

    if (useSupabase(meeting.employee_id) && supabase) {
      try {
        const { data, error } = await supabase
          .from('meetings')
          .insert(defaultPayload)
          .select()
          .single();
        if (!error && data) {
          // Keep local mock DB in sync as well
          const mockDb = getMockDB();
          mockDb.meetings.unshift(data);
          saveMockDB(mockDb);
          return data;
        }
        console.warn('[DB] Supabase createMeeting insert error, falling back to local DB:', error?.message);
      } catch (e) {
        console.warn('[DB] Supabase createMeeting exception, falling back to local DB:', e);
      }
    }

    const mockDb = getMockDB();
    const newMeeting: Meeting = {
      ...defaultPayload,
      id: genId('meet'),
      created_at: new Date().toISOString()
    };
    mockDb.meetings.unshift(newMeeting);
    saveMockDB(mockDb);
    return newMeeting;
  },

  async updateMeeting(meetingId: string, meetingData: Partial<Meeting>): Promise<Meeting | null> {
    if (useSupabase(meetingId) && supabase) {
      try {
        const { data, error } = await supabase
          .from('meetings')
          .update(meetingData)
          .eq('id', meetingId)
          .select()
          .single();
        if (!error && data) {
          const mockDb = getMockDB();
          const idx = mockDb.meetings.findIndex(m => m.id === meetingId);
          if (idx !== -1) {
            mockDb.meetings[idx] = { ...mockDb.meetings[idx], ...meetingData };
            saveMockDB(mockDb);
          }
          return data;
        }
      } catch (e) {
        console.warn('[DB] Supabase updateMeeting error:', e);
      }
    }
    const mockDb = getMockDB();
    const idx = mockDb.meetings.findIndex(m => m.id === meetingId);
    if (idx === -1) return null;
    mockDb.meetings[idx] = {
      ...mockDb.meetings[idx],
      ...meetingData
    };
    saveMockDB(mockDb);
    return mockDb.meetings[idx];
  },

  async deleteMeeting(meetingId: string): Promise<boolean> {
    if (useSupabase(meetingId) && supabase) {
      try {
        await supabase
          .from('meetings')
          .delete()
          .eq('id', meetingId);
      } catch (e) {
        console.warn('[DB] Supabase deleteMeeting error:', e);
      }
    }
    const mockDb = getMockDB();
    mockDb.meetings = mockDb.meetings.filter(m => m.id !== meetingId);
    saveMockDB(mockDb);
    return true;
  },

  // -----------------------------------------------------------------------
  // CLIENT NOTES
  // -----------------------------------------------------------------------
  async getClientNotes(clientId: string): Promise<ClientNote[]> {
    if (useSupabase(clientId) && supabase) {
      const { data, error } = await supabase
        .from('client_notes')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    } else {
      const mockDb = getMockDB();
      return mockDb.client_notes
        .filter(n => n.client_id === clientId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async createClientNote(clientId: string, employeeId: string, content: string): Promise<ClientNote | null> {
    if (useSupabase(employeeId) && supabase) {
      const { data, error } = await supabase
        .from('client_notes')
        .insert({ client_id: clientId, employee_id: employeeId, content })
        .select()
        .single();
      if (error) return null;
      return data;
    } else {
      const mockDb = getMockDB();
      const newNote: ClientNote = {
        id: genId('note'),
        client_id: clientId,
        employee_id: employeeId,
        content,
        created_at: new Date().toISOString()
      };
      mockDb.client_notes.push(newNote);
      saveMockDB(mockDb);
      return newNote;
    }
  },

  // -----------------------------------------------------------------------
  // DOCUMENTS
  // -----------------------------------------------------------------------
  async getDocuments(clientId: string): Promise<Document[]> {
    if (useSupabase(clientId) && supabase) {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    } else {
      const mockDb = getMockDB();
      return mockDb.documents.filter(d => d.client_id === clientId);
    }
  },

  async createDocument(document: Omit<Document, 'id' | 'created_at'>): Promise<Document | null> {
    if (useSupabase(document.employee_id) && supabase) {
      const { data, error } = await supabase
        .from('documents')
        .insert(document)
        .select()
        .single();
      if (error) return null;
      return data;
    } else {
      const mockDb = getMockDB();
      const newDoc: Document = {
        ...document,
        id: genId('doc'),
        created_at: new Date().toISOString()
      };
      mockDb.documents.push(newDoc);
      saveMockDB(mockDb);
      return newDoc;
    }
  },

  async deleteDocument(docId: string): Promise<boolean> {
    if (useSupabase(docId) && supabase) {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId);
      return !error;
    } else {
      const mockDb = getMockDB();
      mockDb.documents = mockDb.documents.filter(d => d.id !== docId);
      saveMockDB(mockDb);
      return true;
    }
  },

  // -----------------------------------------------------------------------
  // AUDIT ACTIVITIES
  // -----------------------------------------------------------------------
  async getActivities(userId: string, role: string): Promise<Activity[]> {
    if (useSupabase(userId) && supabase) {
      let query = supabase.from('activities').select('*');
      if (role !== 'admin') {
        query = query.eq('employee_id', userId);
      }
      const { data, error } = await query.order('timestamp', { ascending: false });
      if (error) return [];
      return data || [];
    } else {
      const mockDb = getMockDB();
      const list = role === 'admin' 
        ? mockDb.activities 
        : mockDb.activities.filter(a => a.employee_id === userId);
      return [...list].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  },

  async createActivity(activity: Omit<Activity, 'id' | 'timestamp'>): Promise<Activity | null> {
    if (useSupabase(activity.employee_id) && supabase) {
      const { data, error } = await supabase
        .from('activities')
        .insert(activity)
        .select()
        .single();
      if (error) return null;
      return data;
    } else {
      const mockDb = getMockDB();
      const newAct: Activity = {
        ...activity,
        id: genId('act'),
        timestamp: new Date().toISOString()
      };
      mockDb.activities.push(newAct);
      saveMockDB(mockDb);
      return newAct;
    }
  },

  // -----------------------------------------------------------------------
  // EMAIL LOGS
  // -----------------------------------------------------------------------
  async getEmailLogs(userId: string, role: string): Promise<EmailLog[]> {
    if (useSupabase(userId) && supabase) {
      let query = supabase.from('email_logs').select('*');
      if (role !== 'admin') {
        query = query.eq('employee_id', userId);
      }
      const { data, error } = await query.order('sent_at', { ascending: false });
      if (error) return [];
      return data || [];
    } else {
      const mockDb = getMockDB();
      const logs = role === 'admin' 
        ? mockDb.email_logs 
        : mockDb.email_logs.filter(e => e.employee_id === userId);
      return [...logs].sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
    }
  },

  async createEmailLog(emailLog: Omit<EmailLog, 'id' | 'sent_at'>): Promise<EmailLog | null> {
    if (useSupabase(emailLog.employee_id) && supabase) {
      const { data, error } = await supabase
        .from('email_logs')
        .insert(emailLog)
        .select()
        .single();
      if (error) return null;
      return data;
    } else {
      const mockDb = getMockDB();
      const newLog: EmailLog = {
        ...emailLog,
        id: genId('elog'),
        sent_at: new Date().toISOString()
      };
      mockDb.email_logs.push(newLog);
      saveMockDB(mockDb);
      return newLog;
    }
  },

  // -----------------------------------------------------------------------
  // CALENDAR INTEGRATIONS
  // -----------------------------------------------------------------------
  async getCalendarIntegrations(userId: string): Promise<CalendarIntegration[]> {
    const client = supabaseAdmin || supabase;
    if (client) {
      const { data, error } = await client
        .from('calendar_integrations')
        .select('*')
        .eq('employee_id', userId);
      if (!error && data && data.length > 0) {
        return data;
      }
    }
    const mockDb = getMockDB();
    return mockDb.calendar_integrations.filter(c => c.employee_id === userId);
  },

  async saveCalendarIntegration(integration: Omit<CalendarIntegration, 'id' | 'created_at'>): Promise<CalendarIntegration | null> {
    // 1. Always save in mock DB as well
    const mockDb = getMockDB();
    const idx = mockDb.calendar_integrations.findIndex(
      c => c.employee_id === integration.employee_id && c.provider === integration.provider
    );
    const newIntegration: CalendarIntegration = {
      ...integration,
      id: idx !== -1 ? mockDb.calendar_integrations[idx].id : genId('cal'),
      created_at: idx !== -1 ? mockDb.calendar_integrations[idx].created_at : new Date().toISOString()
    };
    if (idx !== -1) {
      mockDb.calendar_integrations[idx] = newIntegration;
    } else {
      mockDb.calendar_integrations.push(newIntegration);
    }
    saveMockDB(mockDb);

    // 2. Save in Supabase database
    const client = supabaseAdmin || supabase;
    if (client) {
      const { data, error } = await client
        .from('calendar_integrations')
        .upsert(integration, { onConflict: 'employee_id,provider' })
        .select()
        .single();
      if (error) {
        console.error('[DB] saveCalendarIntegration error:', error);
      } else if (data) {
        return data;
      }
    }

    return newIntegration;
  },

  async deleteCalendarIntegration(userId: string, provider: 'google'): Promise<boolean> {
    const mockDb = getMockDB();
    mockDb.calendar_integrations = mockDb.calendar_integrations.filter(
      c => !(c.employee_id === userId && c.provider === provider)
    );
    saveMockDB(mockDb);

    const client = supabaseAdmin || supabase;
    if (client) {
      const { error } = await client
        .from('calendar_integrations')
        .delete()
        .eq('employee_id', userId)
        .eq('provider', provider);
      if (error) {
        console.error('[DB] deleteCalendarIntegration error:', error);
      }
    }
    return true;
  },

  // -------------------------------------------------------------------------
  // TWILIO INTEGRATION METHODS
  // -------------------------------------------------------------------------
  async getTwilioIntegration(userId: string): Promise<TwilioIntegration | null> {
    const client = supabaseAdmin || supabase;
    if (client && useSupabase(userId)) {
      try {
        const { data, error } = await client
          .from('twilio_integrations')
          .select('*')
          .eq('employee_id', userId)
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.error('[DB] getTwilioIntegration error:', err);
      }
    }
    const mockDb = getMockDB();
    const found = mockDb.twilio_integrations?.find(t => t.employee_id === userId);
    if (found) return found;

    // Fall back to environment variables if present
    const envSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const envToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    const envPhone = process.env.TWILIO_PHONE_NUMBER?.trim();
    const envApp = process.env.TWIML_APP_SID?.trim();

    if (envSid && envToken && envPhone) {
      return {
        id: `env_tw_${userId}`,
        employee_id: userId,
        account_sid: envSid,
        auth_token: envToken,
        phone_number: envPhone,
        twiml_app_sid: envApp || '',
        recording_enabled: true,
        status: 'Connected',
        updated_at: new Date().toISOString()
      };
    }

    return null;
  },

  async saveTwilioIntegration(integration: Omit<TwilioIntegration, 'id' | 'updated_at'>): Promise<TwilioIntegration | null> {
    const now = new Date().toISOString();
    const mockDb = getMockDB();
    if (!mockDb.twilio_integrations) mockDb.twilio_integrations = [];

    const idx = mockDb.twilio_integrations.findIndex(t => t.employee_id === integration.employee_id);
    const newIntegration: TwilioIntegration = {
      ...integration,
      id: idx !== -1 ? mockDb.twilio_integrations[idx].id : genId('tw'),
      updated_at: now
    };

    if (idx !== -1) {
      mockDb.twilio_integrations[idx] = newIntegration;
    } else {
      mockDb.twilio_integrations.push(newIntegration);
    }
    saveMockDB(mockDb);

    const client = supabaseAdmin || supabase;
    if (client && useSupabase(integration.employee_id)) {
      try {
        const { data, error } = await client
          .from('twilio_integrations')
          .upsert({ ...integration, updated_at: now }, { onConflict: 'employee_id' })
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.error('[DB] saveTwilioIntegration error:', err);
      }
    }

    return newIntegration;
  },

  // -------------------------------------------------------------------------
  // CALL LOGS METHODS
  // -------------------------------------------------------------------------
  async getCallLogs(userId: string, role: string = 'employee'): Promise<CallLog[]> {
    const client = supabaseAdmin || supabase;
    if (client) {
      try {
        let query = client.from('call_logs').select('*');
        if (role !== 'admin') {
          query = query.eq('employee_id', userId);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (err) {
        console.error('[DB] getCallLogs error:', err);
      }
    }
    const mockDb = getMockDB();
    const logs = mockDb.call_logs || [];
    if (role === 'admin') return logs;
    return logs.filter(l => l.employee_id === userId);
  },

  async createCallLog(call: Omit<CallLog, 'id' | 'created_at'>): Promise<CallLog | null> {
    const now = new Date().toISOString();
    const newLog: CallLog = {
      ...call,
      id: genId('call'),
      created_at: now
    };

    const mockDb = getMockDB();
    if (!mockDb.call_logs) mockDb.call_logs = [];
    mockDb.call_logs.unshift(newLog);
    saveMockDB(mockDb);

    const client = supabaseAdmin || supabase;
    if (client && useSupabase(call.employee_id)) {
      try {
        const { data, error } = await client
          .from('call_logs')
          .insert({ ...call, created_at: now })
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.error('[DB] createCallLog error:', err);
      }
    }

    return newLog;
  },

  async updateCallLog(callId: string, updates: Partial<CallLog>): Promise<CallLog | null> {
    const mockDb = getMockDB();
    if (!mockDb.call_logs) mockDb.call_logs = [];
    const idx = mockDb.call_logs.findIndex(l => l.id === callId);

    let updated: CallLog | null = null;
    if (idx !== -1) {
      mockDb.call_logs[idx] = { ...mockDb.call_logs[idx], ...updates };
      updated = mockDb.call_logs[idx];
      saveMockDB(mockDb);
    }

    const client = supabaseAdmin || supabase;
    if (client && useSupabase(callId)) {
      try {
        const { data, error } = await client
          .from('call_logs')
          .update(updates)
          .eq('id', callId)
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.error('[DB] updateCallLog error:', err);
      }
    }

    return updated;
  },

  // -------------------------------------------------------------------------
  // EOD REPORTING & PERFORMANCE MODULE METHODS
  // -------------------------------------------------------------------------
  async getDailyCRMActivity(employeeId: string, targetDateStr?: string) {
    const dateStr = targetDateStr || new Date().toISOString().split('T')[0];
    
    // 1. Fetch Call Logs
    const callLogs = await this.getCallLogs(employeeId, 'employee');
    const dayCalls = callLogs.filter(c => c.created_at && c.created_at.startsWith(dateStr));
    
    const calls_made = dayCalls.length;
    const outbound_calls = dayCalls.filter(c => c.direction === 'outbound').length;
    const inbound_calls = dayCalls.filter(c => c.direction === 'inbound').length;
    const connected_calls = dayCalls.filter(c => c.status === 'completed').length;
    const total_call_duration = dayCalls.reduce((acc, c) => acc + (c.duration || 0), 0);

    // 2. Fetch Clients / Leads
    const clients = await this.getClients(employeeId, 'employee');
    const leads_created = clients.filter(c => c.created_at && c.created_at.startsWith(dateStr) && c.status === 'Lead').length;
    const leads_contacted = clients.filter(c => c.status === 'Contacted').length;

    // 3. Fetch Meetings
    const meetings = await this.getMeetings(employeeId, 'employee');
    const meetings_scheduled = meetings.filter(m => m.created_at && m.created_at.startsWith(dateStr)).length;
    const meetings_completed = meetings.filter(m => m.meeting_date === dateStr && m.status === 'Completed').length;

    // 4. Fetch Audit Activities
    const activities = await this.getActivities(employeeId, 'employee');
    const activities_count = activities.filter(a => a.timestamp && a.timestamp.startsWith(dateStr)).length;

    return {
      date: dateStr,
      calls_made,
      outbound_calls,
      inbound_calls,
      connected_calls,
      total_call_duration,
      leads_created,
      leads_contacted,
      meetings_scheduled,
      meetings_completed,
      activities_count
    };
  },

  async getEODReport(employeeId: string, dateStr?: string): Promise<EODReport | null> {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const client = supabaseAdmin || supabase;

    if (client && useSupabase(employeeId)) {
      try {
        const { data, error } = await client
          .from('eod_reports')
          .select('*, eod_work_items(*), profiles:employee_id(name)')
          .eq('employee_id', employeeId)
          .eq('report_date', targetDate)
          .single();

        if (!error && data) {
          const activitySummary = await this.getDailyCRMActivity(employeeId, targetDate);
          return {
            ...data,
            work_items: data.eod_work_items || [],
            employee_name: (data.profiles as any)?.name || 'Unknown',
            crm_activity_summary: activitySummary
          };
        }
      } catch (err) {
        console.error('[DB] getEODReport Supabase error:', err);
      }
    }

    const mockDb = getMockDB();
    if (!mockDb.eod_reports) mockDb.eod_reports = [];
    if (!mockDb.eod_work_items) mockDb.eod_work_items = [];

    const foundReport = mockDb.eod_reports.find(r => r.employee_id === employeeId && r.report_date === targetDate);
    if (foundReport) {
      const items = mockDb.eod_work_items.filter(w => w.eod_report_id === foundReport.id);
      const activitySummary = await this.getDailyCRMActivity(employeeId, targetDate);
      const profile = mockDb.profiles.find(p => p.id === employeeId);
      return {
        ...foundReport,
        work_items: items,
        employee_name: profile?.name || 'Unknown',
        crm_activity_summary: activitySummary
      };
    }

    return null;
  },

  async saveEODReport(
    reportPayload: Omit<EODReport, 'id' | 'created_at' | 'updated_at' | 'work_items'>,
    workItems: Array<Omit<EODWorkItem, 'id' | 'eod_report_id' | 'created_at'>>
  ): Promise<EODReport | null> {
    const now = new Date().toISOString();
    const mockDb = getMockDB();
    if (!mockDb.eod_reports) mockDb.eod_reports = [];
    if (!mockDb.eod_work_items) mockDb.eod_work_items = [];

    let reportId = genId('eod');
    const existingIdx = mockDb.eod_reports.findIndex(
      r => r.employee_id === reportPayload.employee_id && r.report_date === reportPayload.report_date
    );

    if (existingIdx !== -1) {
      reportId = mockDb.eod_reports[existingIdx].id;
    }

    const newReport: EODReport = {
      ...reportPayload,
      id: reportId,
      created_at: existingIdx !== -1 ? mockDb.eod_reports[existingIdx].created_at : now,
      updated_at: now
    };

    if (existingIdx !== -1) {
      mockDb.eod_reports[existingIdx] = newReport;
    } else {
      mockDb.eod_reports.unshift(newReport);
    }

    // Save work items
    mockDb.eod_work_items = mockDb.eod_work_items.filter(w => w.eod_report_id !== reportId);
    const savedItems: EODWorkItem[] = workItems.map(item => ({
      ...item,
      id: genId('wi'),
      eod_report_id: reportId,
      created_at: now
    }));
    mockDb.eod_work_items.push(...savedItems);

    saveMockDB(mockDb);

    // Save to Supabase
    const client = supabaseAdmin || supabase;
    if (client && useSupabase(reportPayload.employee_id)) {
      try {
        const { data: upsertedReport } = await client
          .from('eod_reports')
          .upsert({ ...reportPayload, updated_at: now }, { onConflict: 'employee_id,report_date' })
          .select()
          .single();

        if (upsertedReport) {
          reportId = upsertedReport.id;
          await client.from('eod_work_items').delete().eq('eod_report_id', reportId);
          if (savedItems.length > 0) {
            await client.from('eod_work_items').insert(savedItems.map(i => ({ ...i, eod_report_id: reportId })));
          }
        }
      } catch (err) {
        console.error('[DB] saveEODReport Supabase error:', err);
      }
    }

    const activitySummary = await this.getDailyCRMActivity(reportPayload.employee_id, reportPayload.report_date);
    
    // Log Activity Timeline
    await this.createActivity({
      employee_id: reportPayload.employee_id,
      action: reportPayload.status === 'Submitted' ? 'EOD Submitted' : 'EOD Draft Saved',
      description: `EOD Report for ${reportPayload.report_date} ${reportPayload.status.toLowerCase()}`
    });

    return {
      ...newReport,
      work_items: savedItems,
      crm_activity_summary: activitySummary
    };
  },

  async listEODReports(filters: { employeeId?: string; role?: string; date?: string; status?: string }): Promise<EODReport[]> {
    const client = supabaseAdmin || supabase;
    if (client) {
      try {
        let query = client.from('eod_reports').select('*, profiles:employee_id(name)');
        if (filters.employeeId && filters.role !== 'admin') {
          query = query.eq('employee_id', filters.employeeId);
        }
        if (filters.date) {
          query = query.eq('report_date', filters.date);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        const { data, error } = await query.order('report_date', { ascending: false });
        if (!error && data) {
          return data.map(r => ({
            ...r,
            employee_name: (r.profiles as any)?.name || 'Unknown'
          }));
        }
      } catch (err) {
        console.error('[DB] listEODReports Supabase error:', err);
      }
    }

    const mockDb = getMockDB();
    if (!mockDb.eod_reports) mockDb.eod_reports = [];
    let list = mockDb.eod_reports;
    if (filters.employeeId && filters.role !== 'admin') {
      list = list.filter(r => r.employee_id === filters.employeeId);
    }
    if (filters.date) {
      list = list.filter(r => r.report_date === filters.date);
    }
    if (filters.status) {
      list = list.filter(r => r.status === filters.status);
    }
    const profilesMap = new Map((mockDb.profiles || []).map(p => [p.id, p.name]));
    return list.map(r => ({
      ...r,
      employee_name: profilesMap.get(r.employee_id) || 'Unknown'
    }));
  },

  async reviewEODReport(reportId: string, status: 'Approved' | 'Changes Requested', managerFeedback: string, reviewerId: string): Promise<boolean> {
    const now = new Date().toISOString();
    const mockDb = getMockDB();
    if (!mockDb.eod_reports) mockDb.eod_reports = [];
    const idx = mockDb.eod_reports.findIndex(r => r.id === reportId);
    if (idx !== -1) {
      mockDb.eod_reports[idx] = {
        ...mockDb.eod_reports[idx],
        status,
        manager_feedback: managerFeedback,
        reviewed_by: reviewerId,
        reviewed_at: now,
        updated_at: now
      };
      saveMockDB(mockDb);
    }

    const client = supabaseAdmin || supabase;
    if (client) {
      try {
        await client
          .from('eod_reports')
          .update({
            status,
            manager_feedback: managerFeedback,
            reviewed_by: reviewerId,
            reviewed_at: now,
            updated_at: now
          })
          .eq('id', reportId);
      } catch (err) {
        console.error('[DB] reviewEODReport Supabase error:', err);
      }
    }

    return true;
  }
};
