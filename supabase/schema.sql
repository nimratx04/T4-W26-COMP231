-- RescueBridge Supabase Schema
-- Iteration Planning 1 & 2 Prototype

create table if not exists help_requests (
  id uuid primary key default gen_random_uuid(),
  help_type text not null,
  location text not null,
  description text not null,
  priority text not null,
  status text default 'Pending',
  assigned_volunteer text,
  created_at timestamptz default now()
);

create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  beds_available integer default 0,
  food_available integer default 0,
  water_available integer default 0,
  blankets_available integer default 0,
  supplies_available text,
  medical_support text,
  contact_number text,
  operating_hours text,
  created_at timestamptz default now()
);

create table if not exists organization_status (
  id uuid primary key default gen_random_uuid(),
  status text not null,
  note text,
  updated_at timestamptz default now()
);

create table if not exists volunteers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  address text,
  emergency_contact text,
  police_check text,
  safety_agreement boolean default false,
  verification_status text default 'Pending',
  verification_result text default 'Pending',
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  task_type text,
  priority text,
  location text,
  status text default 'Available',
  assigned_volunteer text,
  created_at timestamptz default now()
);

create table if not exists reporters (
  id uuid primary key default gen_random_uuid(),
  incident_type text,
  description text,
  location text,
  urgency text,
  photo_name text,
  status text default 'Pending Verification',
  created_at timestamptz default now()
);

-- Prototype permissions for classroom testing only
grant usage on schema public to anon, authenticated;

grant select, insert, update on table help_requests to anon, authenticated;
grant select, insert, update on table resources to anon, authenticated;
grant select, insert, update on table organization_status to anon, authenticated;
grant select, insert, update on table volunteers to anon, authenticated;
grant select, insert, update on table tasks to anon, authenticated;
grant select, insert, update on table reporters to anon, authenticated;

-- incident_reports table
create table if not exists incident_reports (
  id uuid primary key default gen_random_uuid(),
  incident_type text not null,
  description text not null,
  location text not null,
  urgency text not null,
  photo_name text,
  status text default 'Pending Verification',
  created_at timestamptz default now()
);

-- broadcasts table
create table if not exists broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  target_area text not null,
  priority text not null,
  sender_id uuid,
  created_at timestamptz default now()
);

-- alerts table
create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  area text not null,
  priority text not null,
  type text not null,
  instructions text,
  created_at timestamptz default now()
);

-- Storage bucket for photos
insert into storage.buckets (id, name) 
values ('incident-photos', 'incident-photos')
on conflict (id) do nothing;

-- Storage policies
create policy "Public Access" on storage.objects
  for all using (bucket_id = 'incident-photos');