-- ============================================
-- Migration 2 (analytics): community-manager role + support inbox + RLS
--
-- - Adds COMMUNITY_MANAGER as a valid users.role value (role is free text today).
-- - Support tickets + messages, with a `source` so dashboard / Digistack-embed /
--   live-map "talk to a real person" all feed one inbox.
-- - RLS scopes a community manager to moderation + support only (never finance/PII).
--   Admin dashboards read via the service role, so these policies are the
--   defense-in-depth layer for any direct client access.
-- ============================================

-- Helper: is the current auth user an agent (admin or community manager)?
create or replace function public.is_support_agent()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('ADMIN', 'COMMUNITY_MANAGER')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN');
$$;

-- ── Support tickets ──────────────────────────────────────────────────────────
create table if not exists public.support_tickets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.users(id) on delete set null, -- null for anon/embedded
  requester_email text,
  requester_name  text,
  subject         text not null,
  status          text not null default 'open',      -- open | pending | resolved | closed
  priority        text not null default 'normal',    -- low | normal | high
  source          text not null default 'dashboard', -- dashboard | digistack | live_map | email | in_app
  assigned_to     uuid references public.users(id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists support_tickets_status_idx on public.support_tickets (status, last_message_at desc);
create index if not exists support_tickets_user_idx   on public.support_tickets (user_id);

create table if not exists public.ticket_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.support_tickets(id) on delete cascade,
  sender_id   uuid references public.users(id) on delete set null,
  sender_role text not null default 'requester',    -- requester | agent
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists ticket_messages_ticket_idx on public.ticket_messages (ticket_id, created_at);

create or replace function public.support_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists support_tickets_updated_at on public.support_tickets;
create trigger support_tickets_updated_at
  before update on public.support_tickets
  for each row execute function public.support_touch_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.support_tickets  enable row level security;
alter table public.ticket_messages  enable row level security;

-- Agents (admin + community manager) manage all tickets; requesters see their own.
create policy "tickets_agent_all" on public.support_tickets for all
  to authenticated using (public.is_support_agent()) with check (public.is_support_agent());
create policy "tickets_requester_read" on public.support_tickets for select
  to authenticated using (user_id = auth.uid());

create policy "ticket_msgs_agent_all" on public.ticket_messages for all
  to authenticated using (public.is_support_agent()) with check (public.is_support_agent());
create policy "ticket_msgs_requester_read" on public.ticket_messages for select
  to authenticated using (
    exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
  );

-- Moderation: let agents read room chat (user-generated content to moderate).
-- (tutor_lesson_messages already has RLS enabled; add a read policy for agents.)
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='tutor_lesson_messages') then
    execute 'create policy "room_msgs_agent_read" on public.tutor_lesson_messages for select to authenticated using (public.is_support_agent())';
  end if;
exception when duplicate_object then null; end $$;

-- Engagement: agents may read the activity log + notifications (aggregate signals),
-- but NOT commission_ledger / payouts (finance) — those keep their existing
-- admin-only / service-role access.
create policy "activity_agent_read" on public.user_activity for select
  to authenticated using (public.is_support_agent());

-- Rollback:
--   drop table if exists public.ticket_messages cascade;
--   drop table if exists public.support_tickets cascade;
--   drop policy if exists "room_msgs_agent_read" on public.tutor_lesson_messages;
--   drop policy if exists "activity_agent_read" on public.user_activity;
--   drop function if exists public.is_support_agent();
--   drop function if exists public.is_admin();
