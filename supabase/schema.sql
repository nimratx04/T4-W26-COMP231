-- RescueBridge Supabase Schema
-- Iteration Planning 1 and Iteration 2 Prototype

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

create table if not exists shelters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  city text not null,
  contact_number text not null,
  available_beds integer not null default 0,
  total_capacity integer not null default 0,
  food_support integer not null default 0,
  water_support integer not null default 0,
  medical_support text not null,
  supplies text not null,
  operating_hours text not null,
  status text not null default 'Open',
  is_published boolean not null default true,
  latitude double precision not null,
  longitude double precision not null,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Prototype permissions for classroom testing only

grant usage on schema public to anon, authenticated;

grant select, insert, update on table help_requests to anon, authenticated;
grant select, insert, update on table resources to anon, authenticated;
grant select, insert, update on table organization_status to anon, authenticated;
grant select, insert, update on table volunteers to anon, authenticated;
grant select, insert, update on table tasks to anon, authenticated;
grant select, insert, update, delete on table shelters to anon, authenticated;