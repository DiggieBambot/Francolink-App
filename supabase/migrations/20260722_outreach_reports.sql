-- ============================================
-- Growth-team outreach logging (replaces WhatsApp copy-paste reporting).
--
-- One row per outreach action (a comment dropped in a FB group, a DM to a
-- creator, a Reddit post). Logged by the growth/community manager in the admin
-- panel; readable in full by admins.
--
-- Conversion attribution is MEASURED, not self-reported: every row gets a
-- unique `tracking_code` which is embedded as `utm_content` in the link the
-- manager shares. The existing first-touch attribution capture
-- (/api/attribution/capture -> users.utm_content) then lets us count real
-- signups per outreach row with a join — no manual "converted" checkbox.
-- ============================================

create table if not exists public.outreach_reports (
  id            uuid primary key default gen_random_uuid(),
  manager_id    uuid not null references public.users(id) on delete cascade,

  platform      text not null
                check (platform in ('facebook','reddit','instagram','tiktok',
                                    'youtube','linkedin','forum','other')),
  -- Name of the FB group / subreddit / creator handle targeted.
  target_name   text not null,

  -- Where the shared link points (app-relative), e.g. '/' or '/become-tutor'.
  destination_path text not null default '/',
  -- Short unique code embedded as utm_content in the shared link.
  tracking_code text not null unique,

  -- URL of the comment/post she left. Null for DMs (nothing public to link).
  link_dropped  text,
  notes         text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists outreach_manager_time_idx on public.outreach_reports (manager_id, created_at desc);
create index if not exists outreach_time_idx         on public.outreach_reports (created_at desc);
create index if not exists outreach_platform_idx     on public.outreach_reports (platform);

-- Join target for conversion counting (users.utm_content = tracking_code).
create index if not exists users_utm_content_idx on public.users (utm_content);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- A manager sees and edits ONLY her own rows. Admins see everything.
-- (Admin dashboards read via the service role; these are defense-in-depth for
--  any direct client access, same convention as the support tables.)
alter table public.outreach_reports enable row level security;

drop policy if exists outreach_own_select on public.outreach_reports;
create policy outreach_own_select on public.outreach_reports
  for select using (manager_id = auth.uid() or public.is_admin());

drop policy if exists outreach_own_insert on public.outreach_reports;
create policy outreach_own_insert on public.outreach_reports
  for insert with check (manager_id = auth.uid());

drop policy if exists outreach_own_update on public.outreach_reports;
create policy outreach_own_update on public.outreach_reports
  for update using (manager_id = auth.uid() or public.is_admin());

drop policy if exists outreach_admin_delete on public.outreach_reports;
create policy outreach_admin_delete on public.outreach_reports
  for delete using (public.is_admin());

-- Rollback:
--   drop table if exists public.outreach_reports cascade;
--   drop index if exists public.users_utm_content_idx;
