-- ============================================
-- Migration 1 (analytics): tracking foundation
--
-- Adds the data needed for Active Users, cohort Retention, and Acquisition
-- source — none of which are currently captured (session_events is empty,
-- last_activity_date is set on almost no one, and there is no source tracking).
--
-- NOTE: these are FORWARD-LOOKING. They start collecting once deployed; the
-- existing users can't be backfilled with a source or activity history.
-- ============================================

-- 1. Append-only activity event log. One row per meaningful action, plus a
--    daily "active" ping. Retention/DAU are computed from this.
create table if not exists public.user_activity (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  kind        text not null,                 -- 'active' | 'login' | 'lesson_view' | 'homework_submit' | ...
  path        text,                          -- route, when relevant
  metadata    jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists user_activity_user_time_idx on public.user_activity (user_id, occurred_at desc);
create index if not exists user_activity_time_idx      on public.user_activity (occurred_at);
create index if not exists user_activity_kind_time_idx on public.user_activity (kind, occurred_at);

-- 2. Fast "recently active" lookups without scanning the log.
alter table public.users add column if not exists last_seen_at timestamptz;
create index if not exists users_last_seen_idx on public.users (last_seen_at);

-- 3. First-touch acquisition attribution (captured at signup from a landing cookie).
alter table public.users
  add column if not exists signup_source text,   -- normalised bucket: organic|paid|social|referral|direct|other
  add column if not exists utm_source    text,
  add column if not exists utm_medium    text,
  add column if not exists utm_campaign  text,
  add column if not exists utm_term      text,
  add column if not exists utm_content   text,
  add column if not exists landing_path  text,
  add column if not exists referrer_host text;

create index if not exists users_signup_source_idx on public.users (signup_source);
create index if not exists users_created_at_idx     on public.users (created_at);

-- 4. RLS: writes/reads go through service-role API routes and dashboards.
alter table public.user_activity enable row level security;

-- Rollback:
--   drop table if exists public.user_activity cascade;
--   alter table public.users
--     drop column if exists last_seen_at, drop column if exists signup_source,
--     drop column if exists utm_source, drop column if exists utm_medium,
--     drop column if exists utm_campaign, drop column if exists utm_term,
--     drop column if exists utm_content, drop column if exists landing_path,
--     drop column if exists referrer_host;
