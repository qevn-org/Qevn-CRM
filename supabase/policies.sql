-- Row Level Security (RLS) Policies for QEVN CRM

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.meetings enable row level security;
alter table public.client_notes enable row level security;
alter table public.documents enable row level security;
alter table public.activities enable row level security;
alter table public.email_logs enable row level security;
alter table public.calendar_integrations enable row level security;

-- Helper function to check if the current user is an admin
-- Uses jwt metadata or checks profiles directly to determine admin status
create or replace function public.is_admin()
returns boolean as $$
begin
  return (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin' or
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );
end;
$$ language plpgsql security definer;

-- =========================================================================
-- PROFILES POLICIES
-- =========================================================================
drop policy if exists "Allow admins all access to profiles" on public.profiles;
create policy "Allow admins all access to profiles" on public.profiles
  for all using (public.is_admin());

drop policy if exists "Allow employees to view profiles" on public.profiles;
create policy "Allow employees to view profiles" on public.profiles
  for select using (auth.uid() is not null);

drop policy if exists "Allow employees to update own profile" on public.profiles;
create policy "Allow employees to update own profile" on public.profiles
  for update using (auth.uid() = id);

-- =========================================================================
-- CLIENTS POLICIES
-- =========================================================================
drop policy if exists "Allow admins all access to clients" on public.clients;
create policy "Allow admins all access to clients" on public.clients
  for all using (public.is_admin());

drop policy if exists "Allow employees to manage their own clients" on public.clients;
create policy "Allow employees to manage their own clients" on public.clients
  for all using (employee_id = auth.uid());

-- =========================================================================
-- MEETINGS POLICIES
-- =========================================================================
drop policy if exists "Allow admins all access to meetings" on public.meetings;
create policy "Allow admins all access to meetings" on public.meetings
  for all using (public.is_admin());

drop policy if exists "Allow employees to manage their own meetings" on public.meetings;
create policy "Allow employees to manage their own meetings" on public.meetings
  for all using (employee_id = auth.uid());

-- =========================================================================
-- CLIENT NOTES POLICIES
-- =========================================================================
drop policy if exists "Allow admins all access to notes" on public.client_notes;
create policy "Allow admins all access to notes" on public.client_notes
  for all using (public.is_admin());

drop policy if exists "Allow employees to manage their own notes" on public.client_notes;
create policy "Allow employees to manage their own notes" on public.client_notes
  for all using (employee_id = auth.uid());

-- =========================================================================
-- DOCUMENTS POLICIES
-- =========================================================================
drop policy if exists "Allow admins all access to documents" on public.documents;
create policy "Allow admins all access to documents" on public.documents
  for all using (public.is_admin());

drop policy if exists "Allow employees to manage their own documents" on public.documents;
create policy "Allow employees to manage their own documents" on public.documents
  for all using (employee_id = auth.uid());

-- =========================================================================
-- ACTIVITIES POLICIES
-- =========================================================================
drop policy if exists "Allow admins all access to activities" on public.activities;
create policy "Allow admins all access to activities" on public.activities
  for all using (public.is_admin());

drop policy if exists "Allow employees to view their own activities" on public.activities;
create policy "Allow employees to view their own activities" on public.activities
  for select using (employee_id = auth.uid());

drop policy if exists "Allow employees to insert activities" on public.activities;
create policy "Allow employees to insert activities" on public.activities
  for insert with check (employee_id = auth.uid());

-- =========================================================================
-- EMAIL LOGS POLICIES
-- =========================================================================
drop policy if exists "Allow admins to view email logs" on public.email_logs;
create policy "Allow admins to view email logs" on public.email_logs
  for all using (public.is_admin());

drop policy if exists "Allow employees to view their own email logs" on public.email_logs;
create policy "Allow employees to view their own email logs" on public.email_logs
  for select using (employee_id = auth.uid());

drop policy if exists "Allow employees to insert email logs" on public.email_logs;
create policy "Allow employees to insert email logs" on public.email_logs
  for insert with check (employee_id = auth.uid());

-- =========================================================================
-- CALENDAR INTEGRATION POLICIES
-- =========================================================================
drop policy if exists "Allow employees to manage their own integrations" on public.calendar_integrations;
create policy "Allow employees to manage their own integrations" on public.calendar_integrations
  for all using (employee_id = auth.uid());
