-- Premium granted by hand: business pilots and seats (docs/PLAN-business.md).
--
-- users.subscription_plan is what gates lessons (src/lib/utils/lesson-limits.ts),
-- and that check ignores subscription_ends_at. So a grant that is meant to end
-- needs a record of its own and a job that ends it: /api/cron/expire-grants
-- reads this table daily and puts lapsed grantees back on FREE.
--
-- A grant leaves users.subscription_source NULL ("no paid subscription", see
-- 20260930_subscription_source.sql). That is deliberate: if a grantee later
-- buys on the website or in the app, Stripe or RevenueCat takes the row over as
-- usual, and the expiry job, which only touches source-NULL users with no live
-- lesson plan, leaves the paying customer alone.

create table if not exists public.premium_grants (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  plan          text not null default 'PREMIUM'
                  check (plan in ('PREMIUM', 'PREMIUM_PLUS')),
  starts_at     timestamptz not null default now(),
  ends_at       timestamptz not null,
  -- Which customer this seat belongs to, e.g. "Acme Relocation (pilot)".
  organization  text,
  reason        text not null,
  status        text not null default 'active'
                  check (status in ('active', 'expired', 'revoked')),
  granted_by    uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  ended_at      timestamptz,
  check (ends_at > starts_at)
);

create index if not exists premium_grants_user_idx
  on public.premium_grants (user_id);
create index if not exists premium_grants_due_idx
  on public.premium_grants (ends_at) where status = 'active';
create index if not exists premium_grants_org_idx
  on public.premium_grants (organization);

-- Service role only: the admin API and the cron job. No client ever reads this.
alter table public.premium_grants enable row level security;

comment on table public.premium_grants is
  'Hand-granted Premium (business pilots and seats). Ended daily by /api/cron/expire-grants.';
