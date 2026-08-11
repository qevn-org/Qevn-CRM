// Safe server-only import wrapper for bundler compatibility
const getNodeModule = (name: string) => {
  if (typeof window === 'undefined') {
    return eval("require")(name);
  }
  return null;
};

// Define DB file path inside project root (will be added to gitignore)
const getDbFilePath = () => {
  const pathLib = getNodeModule('path');
  if (pathLib) {
    return pathLib.join(process.cwd(), 'mock_db.json');
  }
  return 'mock_db.json';
};

// Interface definitions
export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'employee';
  profile_image?: string;
  status: 'active' | 'disabled';
  created_at: string;
}

export interface Client {
  id: string;
  employee_id: string | null;
  company_name: string;
  client_name: string;
  designation?: string;
  email?: string;
  phone?: string;
  website?: string;
  linkedin?: string;
  industry?: string;
  city?: string;
  country?: string;
  lead_source?: string;
  status: 'Lead' | 'Contacted' | 'Meeting Scheduled' | 'Meeting Completed' | 'Feedback Pending' | 'Feedback Sent' | 'Follow-up Pending' | 'Negotiation' | 'Won' | 'Lost';
  priority: 'Low' | 'Medium' | 'High';
  notes?: string;
  archived: boolean;
  created_at: string;
  owner_name?: string;
}

export interface Meeting {
  id: string;
  client_id: string;
  employee_id: string;
  meeting_title: string;
  meeting_link?: string;
  platform?: string;
  meeting_type?: string;
  status?: 'Draft' | 'Scheduled' | 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show' | 'Rescheduled';
  meeting_date: string;
  meeting_start: string;
  meeting_end: string;
  timezone: string;
  calendar_event_id?: string;
  meeting_notes?: string;
  attendees?: string;
  deal_id?: string;
  created_by?: string;
  updated_by?: string;
  feedback_sent: boolean;
  followup_sent: boolean;
  feedback_reminder_sent: boolean;
  followup_reminder_sent: boolean;
  created_at: string;
}

export interface ClientNote {
  id: string;
  client_id: string;
  employee_id: string;
  content: string;
  created_at: string;
}

export interface Document {
  id: string;
  client_id: string;
  employee_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  client_id?: string;
  employee_id: string;
  action: string;
  description: string;
  timestamp: string;
}

export interface EmailLog {
  id: string;
  client_id?: string;
  employee_id: string;
  template: string;
  recipient: string;
  status: string;
  sent_at: string;
}

export interface CalendarIntegration {
  id: string;
  employee_id: string;
  provider: 'google' | 'outlook';
  access_token: string;
  refresh_token?: string;
  expires_at: string;
  created_at: string;
}

export interface TwilioIntegration {
  id: string;
  employee_id: string;
  account_sid: string;
  auth_token: string;
  phone_number: string;
  twiml_app_sid?: string;
  api_key_sid?: string;
  api_secret?: string;
  voice_region?: string;
  recording_enabled: boolean;
  status: 'Connected' | 'Not Connected' | 'Invalid Credentials';
  updated_at: string;
}

export interface CallLog {
  id: string;
  call_sid?: string;
  client_id?: string;
  employee_id: string;
  contact_name?: string;
  company_name?: string;
  phone_number: string;
  direction: 'inbound' | 'outbound';
  duration: number;
  status: 'completed' | 'busy' | 'no-answer' | 'failed' | 'canceled' | 'missed' | 'in-progress';
  outcome?: string;
  notes?: string;
  recording_url?: string;
  recording_duration?: number;
  followup_required?: boolean;
  followup_date?: string;
  tags?: string[];
  customer_requirement?: string;
  pain_points?: string;
  customer_interest?: 'High' | 'Medium' | 'Low' | 'None';
  buying_intent?: 'Immediate' | 'This Week' | 'This Month' | '1-3 Months' | 'Later' | 'Unknown';
  decision_maker?: string;
  budget?: string;
  timeline?: string;
  objections?: string;
  competitor?: string;
  next_action?: string;
  next_action_owner?: string;
  next_action_date?: string;
  transcript?: string;
  created_at: string;
}

export interface EODWorkItem {
  id: string;
  eod_report_id: string;
  task_name: string;
  description?: string;
  project?: string;
  client_id?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Completed' | 'In Progress' | 'Blocked' | 'Cancelled';
  time_spent_minutes?: number;
  start_time?: string;
  end_time?: string;
  reference_link?: string;
  created_at: string;
}

export interface EODReport {
  id: string;
  employee_id: string;
  report_date: string;
  department?: string;
  reporting_manager?: string;
  submission_deadline?: string;
  primary_objective?: string;
  day_status: 'Productive' | 'Partially Productive' | 'Blocked';
  overall_progress?: number;
  biggest_achievement?: string;
  important_work?: string;
  has_blockers: boolean;
  blocker_type?: string;
  blocker_description?: string;
  needs_help: boolean;
  help_details?: string;
  learnings?: string;
  tomorrow_priority_1?: string;
  tomorrow_priority_2?: string;
  tomorrow_priority_3?: string;
  planned_vs_completed?: Array<{
    title: string;
    target: number;
    actual: number;
    achievement_percentage: number;
  }>;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Changes Requested' | 'Approved' | 'Late' | 'Missing';
  submitted_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  manager_feedback?: string;
  created_at: string;
  updated_at: string;
  work_items?: EODWorkItem[];
  crm_activity_summary?: {
    calls_made: number;
    outbound_calls: number;
    inbound_calls: number;
    connected_calls: number;
    total_call_duration: number;
    leads_created: number;
    leads_contacted: number;
    meetings_scheduled: number;
    meetings_completed: number;
    activities_count: number;
    revenue_generated?: number;
    pipeline_moved?: number;
  };
  employee_name?: string;
}

export interface MockSchema {
  profiles: Profile[];
  clients: Client[];
  meetings: Meeting[];
  client_notes: ClientNote[];
  documents: Document[];
  activities: Activity[];
  email_logs: EmailLog[];
  calendar_integrations: CalendarIntegration[];
  twilio_integrations?: TwilioIntegration[];
  call_logs?: CallLog[];
  eod_reports?: EODReport[];
  eod_work_items?: EODWorkItem[];
}

const DEFAULT_DB: MockSchema = {
  profiles: [
    {
      id: 'usr_admin_1',
      name: 'Admin QEVN',
      email: 'admin@qevn.in',
      phone: '+91 98765 43210',
      role: 'admin',
      profile_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256',
      status: 'active',
      created_at: new Date('2026-01-01').toISOString()
    },
    {
      id: 'usr_emp_1',
      name: 'Employee QEVN',
      email: 'employee@qevn.in',
      phone: '+91 99999 88888',
      role: 'employee',
      profile_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256',
      status: 'active',
      created_at: new Date('2026-01-02').toISOString()
    }
  ],
  clients: [
    {
      id: 'cli_1',
      employee_id: 'usr_emp_1',
      company_name: 'Stripe India',
      client_name: 'Aditya Sen',
      designation: 'VP of Engineering',
      email: 'aditya.sen@stripe.com',
      phone: '+91 98765 00001',
      website: 'https://stripe.com',
      linkedin: 'https://linkedin.com/in/aditya-sen',
      industry: 'Fintech',
      city: 'Bangalore',
      country: 'India',
      lead_source: 'LinkedIn Outreach',
      status: 'Negotiation',
      priority: 'High',
      notes: 'Interested in payment infrastructure integration for SaaS.',
      archived: false,
      created_at: new Date('2026-07-20T10:00:00Z').toISOString()
    },
    {
      id: 'cli_2',
      employee_id: 'usr_emp_1',
      company_name: 'Zomato Ltd',
      client_name: 'Neha Roy',
      designation: 'Head of Operations',
      email: 'neha.roy@zomato.com',
      phone: '+91 98765 00002',
      website: 'https://zomato.com',
      linkedin: 'https://linkedin.com/in/neha-roy',
      industry: 'Food Delivery',
      city: 'Gurugram',
      country: 'India',
      lead_source: 'Inbound Inquiry',
      status: 'Lead',
      priority: 'Medium',
      notes: 'Initial contact via contact-us form on QEVN.in.',
      archived: false,
      created_at: new Date('2026-07-25T11:30:00Z').toISOString()
    },
    {
      id: 'cli_3',
      employee_id: 'usr_emp_1',
      company_name: 'Decathlon Sports',
      client_name: 'Marc Dubois',
      designation: 'Director of Procurement',
      email: 'marc.dubois@decathlon.com',
      phone: '+33 1 2345 6789',
      website: 'https://decathlon.com',
      linkedin: 'https://linkedin.com/in/marc-dubois',
      industry: 'Retail',
      city: 'Lille',
      country: 'France',
      lead_source: 'Cold Email',
      status: 'Meeting Scheduled',
      priority: 'High',
      notes: 'Demo scheduled for early August.',
      archived: false,
      created_at: new Date('2026-07-28T09:00:00Z').toISOString()
    },
    {
      id: 'cli_4',
      employee_id: 'usr_admin_1',
      company_name: 'HDFC Bank',
      client_name: 'Rohan Sharma',
      designation: 'SVP Digital Solutions',
      email: 'rohan.sharma@hdfcbank.com',
      phone: '+91 98765 00004',
      website: 'https://hdfcbank.com',
      linkedin: 'https://linkedin.com/in/rohan-sharma',
      industry: 'Banking',
      city: 'Mumbai',
      country: 'India',
      lead_source: 'Referral',
      status: 'Won',
      priority: 'High',
      notes: 'Deal closed for implementation of client pipeline module.',
      archived: false,
      created_at: new Date('2026-07-15T15:00:00Z').toISOString()
    }
  ],
  meetings: [
    {
      id: 'meet_1',
      client_id: 'cli_3',
      employee_id: 'usr_emp_1',
      meeting_title: 'Introductory Discovery Call - Decathlon',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      platform: 'Google Meet',
      status: 'Scheduled',
      meeting_date: '2026-08-05',
      meeting_start: '14:00',
      meeting_end: '14:45',
      timezone: 'Asia/Kolkata',
      calendar_event_id: 'gcal_event_decathlon_1',
      meeting_notes: 'Walkthrough of QEVN client follow-up system.',
      attendees: 'marc.dubois@decathlon.com, employee@qevn.in',
      feedback_sent: false,
      followup_sent: false,
      feedback_reminder_sent: false,
      followup_reminder_sent: false,
      created_at: new Date('2026-07-29T10:00:00Z').toISOString()
    }
  ],
  client_notes: [
    {
      id: 'note_1',
      client_id: 'cli_1',
      employee_id: 'usr_emp_1',
      content: 'Followed up with Aditya over LinkedIn. He mentioned their budget is approved for Q3.',
      created_at: new Date('2026-07-22T14:00:00Z').toISOString()
    }
  ],
  documents: [
    {
      id: 'doc_1',
      client_id: 'cli_1',
      employee_id: 'usr_emp_1',
      file_name: 'Proposal_QEVN_Stripe.pdf',
      file_url: '#',
      file_size: 1542000,
      file_type: 'application/pdf',
      created_at: new Date('2026-07-24T12:00:00Z').toISOString()
    }
  ],
  activities: [
    {
      id: 'act_1',
      client_id: 'cli_1',
      employee_id: 'usr_emp_1',
      action: 'Client Updated',
      description: 'Stage moved from Lead to Negotiation',
      timestamp: new Date('2026-07-21T08:30:00Z').toISOString()
    },
    {
      id: 'act_2',
      client_id: 'cli_3',
      employee_id: 'usr_emp_1',
      action: 'Meeting Created',
      description: 'Scheduled Introductory Discovery Call - Decathlon',
      timestamp: new Date('2026-07-29T10:00:00Z').toISOString()
    }
  ],
  email_logs: [
    {
      id: 'elog_1',
      client_id: 'cli_1',
      employee_id: 'usr_emp_1',
      template: 'Proposal Email',
      recipient: 'aditya.sen@stripe.com',
      status: 'delivered',
      sent_at: new Date('2026-07-24T12:05:00Z').toISOString()
    }
  ],
  calendar_integrations: [],
  twilio_integrations: [],
  call_logs: [
    {
      id: 'call_1',
      call_sid: 'CA_sample_1234567890',
      client_id: 'cli_1',
      employee_id: 'usr_emp_1',
      contact_name: 'Aditya Sen',
      company_name: 'Stripe India',
      phone_number: '+919876543210',
      direction: 'outbound',
      duration: 185,
      status: 'completed',
      outcome: 'Connected - Interested',
      notes: 'Discussed QEVN CRM enterprise features. Requested follow-up call on Friday with engineering team.',
      recording_url: 'https://api.twilio.com/2010-04-01/Accounts/ACmock/Recordings/REmock1.mp3',
      recording_duration: 180,
      followup_required: true,
      followup_date: '2026-08-08',
      tags: ['Product Demo', 'Decision Maker'],
      created_at: new Date('2026-08-01T14:30:00Z').toISOString()
    },
    {
      id: 'call_2',
      call_sid: 'CA_sample_0987654321',
      client_id: 'cli_2',
      employee_id: 'usr_emp_1',
      contact_name: 'Rajesh Sharma',
      company_name: 'Flipkart',
      phone_number: '+919876543211',
      direction: 'inbound',
      duration: 92,
      status: 'completed',
      outcome: 'Call Back Later',
      notes: 'Customer inquired about custom API webhooks for lead synchronization.',
      recording_url: 'https://api.twilio.com/2010-04-01/Accounts/ACmock/Recordings/REmock2.mp3',
      recording_duration: 90,
      followup_required: false,
      tags: ['Inbound Support'],
      created_at: new Date('2026-08-02T11:15:00Z').toISOString()
    }
  ]
};

// Safe Read DB Function
export function getMockDB(): MockSchema {
  try {
    const fsLib = getNodeModule('fs');
    const dbFile = getDbFilePath();
    if (!fsLib) {
      return DEFAULT_DB;
    }
    if (!fsLib.existsSync(dbFile)) {
      fsLib.writeFileSync(dbFile, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
      return DEFAULT_DB;
    }
    const raw = fsLib.readFileSync(dbFile, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading mock DB file, returning defaults', e);
    return DEFAULT_DB;
  }
}

// Safe Write DB Function
export function saveMockDB(data: MockSchema): void {
  try {
    const fsLib = getNodeModule('fs');
    const dbFile = getDbFilePath();
    if (!fsLib) return;
    fsLib.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing mock DB file', e);
  }
}
