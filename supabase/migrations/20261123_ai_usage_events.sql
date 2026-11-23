-- AI usage events: the cost of every AI tutor call that is not a chat reply.
--
-- ai_tutor_messages already records tokens and cost per tutor reply, but the
-- voice (text-to-speech), microphone (transcription), tap-to-translate and
-- end-of-session recap calls spent money silently — voice alone costs more per
-- turn than the reply. One row per call, written by the service role only.
--
-- Safe to run twice.

create table if not exists public.ai_usage_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  -- tts | transcribe | translate | recap
  feature       text not null,
  model         text,
  tokens_in     int,
  tokens_out    int,
  -- Seconds of audio spoken or heard, where the call is billed by audio.
  audio_seconds numeric(8, 2),
  cost_usd      numeric(10, 6) not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists ai_usage_events_user_idx
  on public.ai_usage_events (user_id, created_at desc);
create index if not exists ai_usage_events_created_idx
  on public.ai_usage_events (created_at desc);

alter table public.ai_usage_events enable row level security;

-- Admins read everything (the admin user page sums it). Students have no need
-- to see internal costs. Writes go through the service role only.
drop policy if exists "Admins read AI usage" on public.ai_usage_events;
create policy "Admins read AI usage"
  on public.ai_usage_events for select
  to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN'));
