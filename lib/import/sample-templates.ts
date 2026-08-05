import * as XLSX from 'xlsx';

export type TargetType = 'Leads' | 'Contacts' | 'Clients' | 'Companies';

export const SAMPLE_HEADERS: Record<TargetType, string[]> = {
  Leads: [
    'Full Name',
    'Company Name',
    'Job Title',
    'Email Address',
    'Mobile',
    'Website',
    'LinkedIn Profile',
    'Industry',
    'City',
    'Country',
    'Source',
    'Priority',
    'Notes'
  ],
  Contacts: [
    'Full Name',
    'Company Name',
    'Designation',
    'Email Address',
    'Phone Number',
    'LinkedIn',
    'City',
    'Country',
    'Notes'
  ],
  Clients: [
    'Full Name',
    'Company Name',
    'Job Title',
    'Email Address',
    'Phone',
    'Website',
    'Industry',
    'City',
    'Country',
    'Priority',
    'Notes'
  ],
  Companies: [
    'Company Name',
    'Contact Person',
    'Job Title',
    'Email Address',
    'Phone',
    'Website',
    'Industry',
    'City',
    'Country',
    'Notes'
  ]
};

export const SAMPLE_ROWS: Record<TargetType, Record<string, string>[]> = {
  Leads: [
    {
      'Full Name': 'Sarah Jenkins',
      'Company Name': 'Acme Dynamics',
      'Job Title': 'VP of Business Development',
      'Email Address': 'sarah.j@acmedynamics.com',
      'Mobile': '+1 (555) 234-5678',
      'Website': 'https://acmedynamics.com',
      'LinkedIn Profile': 'https://linkedin.com/in/sarahjenkins',
      'Industry': 'Technology',
      'City': 'San Francisco',
      'Country': 'United States',
      'Source': 'Website Inquiry',
      'Priority': 'High',
      'Notes': 'Interested in enterprise CRM license. Follow up next week.'
    },
    {
      'Full Name': 'David Ross',
      'Company Name': 'Global Logistics Corp',
      'Job Title': 'Operations Director',
      'Email Address': 'd.ross@globallogistics.io',
      'Mobile': '+1 (555) 987-6543',
      'Website': 'https://globallogistics.io',
      'LinkedIn Profile': 'https://linkedin.com/in/davidross',
      'Industry': 'Logistics',
      'City': 'Chicago',
      'Country': 'United States',
      'Source': 'Referral',
      'Priority': 'Medium',
      'Notes': 'Demo requested for team of 20 users.'
    }
  ],
  Contacts: [
    {
      'Full Name': 'Elena Rostova',
      'Company Name': 'Apex Solutions',
      'Designation': 'Head of Product',
      'Email Address': 'elena@apexsolutions.com',
      'Phone Number': '+44 20 7946 0912',
      'LinkedIn': 'https://linkedin.com/in/elenarostova',
      'City': 'London',
      'Country': 'United Kingdom',
      'Notes': 'Primary decision maker for EU region.'
    }
  ],
  Clients: [
    {
      'Full Name': 'Marcus Vance',
      'Company Name': 'Vance & Associates',
      'Job Title': 'Managing Director',
      'Email Address': 'marcus@vancelaw.com',
      'Phone': '+1 (555) 412-8901',
      'Website': 'https://vancelaw.com',
      'Industry': 'Legal Services',
      'City': 'New York',
      'Country': 'United States',
      'Priority': 'High',
      'Notes': 'Contract signed. Onboarding scheduled.'
    }
  ],
  Companies: [
    {
      'Company Name': 'Nexus Innovations',
      'Contact Person': 'Rachel Green',
      'Job Title': 'CEO',
      'Email Address': 'contact@nexusinnovations.com',
      'Phone': '+1 (555) 789-0123',
      'Website': 'https://nexusinnovations.com',
      'Industry': 'Software',
      'City': 'Austin',
      'Country': 'United States',
      'Notes': 'Series B startup, 150 employees.'
    }
  ]
};

export function downloadSampleTemplate(target: TargetType, format: 'csv' | 'xlsx') {
  const headers = SAMPLE_HEADERS[target];
  const rows = SAMPLE_ROWS[target];

  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, target);

  const filename = `QEVN_Import_Template_${target}.${format}`;

  if (format === 'csv') {
    XLSX.writeFile(wb, filename, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, filename, { bookType: 'xlsx' });
  }
}
