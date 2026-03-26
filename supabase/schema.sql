-- ============================================================
-- FutureFace — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Organizations ─────────────────────────────────────────────
create table if not exists orgs (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  domain      text,
  country     text default 'SA',
  currency    text default 'SAR',
  plan_impactor text default 'free',
  plan_robox    text default 'free',
  ai_pilot    boolean default false,
  created_at  timestamptz default now()
);

-- ── Members (app users) ───────────────────────────────────────
create table if not exists members (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid references orgs(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  name        text not null,
  email       text not null,
  role        text default 'member', -- owner | admin | member
  avatar_url  text,
  created_at  timestamptz default now()
);

-- ── OKRs ─────────────────────────────────────────────────────
create table if not exists okrs (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid references orgs(id) on delete cascade,
  owner_id    uuid references members(id) on delete set null,
  title       text not null,
  description text,
  quarter     text not null, -- e.g. Q1-2026
  status      text default 'on_track',
  progress    int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists key_results (
  id          uuid primary key default uuid_generate_v4(),
  okr_id      uuid references okrs(id) on delete cascade,
  title       text not null,
  current     numeric default 0,
  target      numeric not null,
  unit        text default '%',
  status      text default 'on_track',
  updated_at  timestamptz default now()
);

-- ── Sales Employees ───────────────────────────────────────────
create table if not exists sales_employees (
  id            uuid primary key default uuid_generate_v4(),
  org_id        uuid references orgs(id) on delete cascade,
  name          text not null,
  email         text not null,
  phone         text,
  role          text default 'Sales Rep', -- Sales Rep | Account Exec | Manager | SDR
  territory     text,
  avatar_url    text,
  teams_user_id text,          -- Microsoft 365 / Teams user principal name
  quota         numeric default 0,
  quota_currency text default 'SAR',
  status        text default 'active', -- active | on_leave | inactive
  joined_date   date,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── Calendar Events (Teams-synced + manual) ───────────────────
create table if not exists calendar_events (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid references orgs(id) on delete cascade,
  employee_id     uuid references sales_employees(id) on delete cascade,
  title           text not null,
  description     text,
  event_type      text default 'meeting', -- meeting | call | demo | follow_up | ooo | training
  start_time      timestamptz not null,
  end_time        timestamptz not null,
  location        text,
  attendees       jsonb default '[]',
  teams_event_id  text unique,  -- Microsoft Graph event ID for sync
  teams_join_url  text,         -- Teams meeting link
  deal_id         text,         -- future CRM link
  is_synced       boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── Row-Level Security ────────────────────────────────────────
alter table orgs             enable row level security;
alter table members          enable row level security;
alter table okrs             enable row level security;
alter table key_results      enable row level security;
alter table sales_employees  enable row level security;
alter table calendar_events  enable row level security;

-- Allow authenticated users to read their own org data
create policy "org members can read" on orgs
  for select using (
    id in (select org_id from members where user_id = auth.uid())
  );

create policy "org members can read members" on members
  for select using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

create policy "org members can manage sales employees" on sales_employees
  for all using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

create policy "org members can manage calendar events" on calendar_events
  for all using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

create policy "org members can read okrs" on okrs
  for select using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

-- ── Indexes ───────────────────────────────────────────────────
create index if not exists idx_members_org     on members(org_id);
create index if not exists idx_okrs_org        on okrs(org_id);
create index if not exists idx_sales_org       on sales_employees(org_id);
create index if not exists idx_events_org      on calendar_events(org_id);
create index if not exists idx_events_employee on calendar_events(employee_id);
create index if not exists idx_events_time     on calendar_events(start_time, end_time);
create index if not exists idx_events_teams_id on calendar_events(teams_event_id);
