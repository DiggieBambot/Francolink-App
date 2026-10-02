-- Streak freezes, and daily reminders for the mobile app (mobile PRD §5.4.3,
-- §5.4.5).
--
-- 1. users.streak_freezes — how many freezes the learner holds (0–2). One is
--    earned per 7-day streak; one missed day spends it instead of resetting
--    the streak. The rule lives in src/lib/streak/advance-streak.ts.
--
-- 2. device_push_tokens — one row per phone with the app installed and
--    reminders on. The hourly push-reminders cron already reminds web
--    subscribers (push_subscriptions); it now also sends to these Expo push
--    tokens, at each row's own reminder time in the user's users.timezone.
--    Kept separate from push_subscriptions: that table holds one Web Push
--    subscription per user, while a learner can have the app on several
--    phones, each with its own token.

alter table public.users
  add column if not exists streak_freezes integer not null default 0
    check (streak_freezes between 0 and 2);

comment on column public.users.streak_freezes is
  'Streak freezes held (0-2). Earned one per 7-day streak; spent on a single missed day.';

create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  -- ExponentPushToken[...] from expo-notifications.
  token text not null unique,
  platform text not null check (platform in ('android', 'ios')),
  -- Local time of day for the daily reminder, in users.timezone.
  notification_time time not null default '19:00',
  notify_reminders boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists device_push_tokens_user_idx on public.device_push_tokens (user_id);

alter table public.device_push_tokens enable row level security;

-- The app manages its own phone's row; the cron reads with the service role.
drop policy if exists "device tokens: own rows" on public.device_push_tokens;
create policy "device tokens: own rows" on public.device_push_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
