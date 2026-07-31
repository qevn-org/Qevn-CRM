-- QEVN CRM SQL Schema Definition

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text,
  role text not null check (role in ('admin', 'employee')) default 'employee',
  profile_image text,
  status text not null check (status in ('active', 'disabled')) default 'active',
  created_at timestamptz not null default now()
);

-- CLIENTS TABLE
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.profiles(id) on delete set null,
  company_name text not null,
  client_name text not null,
  designation text,
  email text,
  phone text,
  website text,
  linkedin text,
  industry text,
  city text,
  country text,
  lead_source text,
  status text not null check (status in (
    'Lead', 'Contacted', 'Meeting Scheduled', 'Meeting Completed', 
    'Feedback Pending', 'Feedback Sent', 'Follow-up Pending', 
    'Negotiation', 'Won', 'Lost'
  )) default 'Lead',
  priority text not null check (priority in ('Low', 'Medium', 'High')) default 'Medium',
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- MEETINGS TABLE
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  meeting_title text not null,
  meeting_link text,
  meeting_date date not null,
  meeting_start time not null,
  meeting_end time not null,
  timezone text not null default 'UTC',
  calendar_event_id text,
  meeting_notes text,
  feedback_sent boolean not null default false,
  followup_sent boolean not null default false,
  feedback_reminder_sent boolean not null default false,
  followup_reminder_sent boolean not null default false,
  created_at timestamptz not null default now()
);

-- CLIENT NOTES TABLE (for detail timeline view)
create table if not exists public.client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- DOCUMENTS TABLE (for uploaded file references)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_size integer,
  file_type text,
  created_at timestamptz not null default now()
);

-- ACTIVITIES TABLE (audit log)
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  description text not null,
  timestamp timestamptz not null default now()
);

-- EMAIL LOGS TABLE
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  template text not null,
  recipient text not null,
  status text not null,
  sent_at timestamptz not null default now()
);

-- CALENDAR INTEGRATION TABLE
create table if not exists public.calendar_integrations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('google')),
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (employee_id, provider)
);

-- Trigger to sync new user signups from auth.users to public.profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'New Employee'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'employee'),
    'active'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
