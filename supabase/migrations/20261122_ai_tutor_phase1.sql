-- AI tutor, phase 1: session recaps, long-term memory, and a review deck.
--
-- Run once in the Supabase SQL editor (see supabase/APPLY_DB.md). Every
-- statement is idempotent, so running it twice is harmless. The app degrades
-- without it: the tutor still chats, it just cannot remember, recap, or save.

-- ── Recap on the conversation ───────────────────────────────────────────────
-- Written once when the student ends a session (or in the background when they
-- start a new one without ending the last). `ended_at` doubles as the "already
-- recapped" marker so a session is never summarised twice.
alter table public.ai_tutor_conversations
  add column if not exists recap    jsonb,
  add column if not exists ended_at timestamptz;

-- ── Memory ───────────────────────────────────────────────────────────────────
-- One short note per student and language: who they are, what they like
-- talking about, what they keep getting wrong. Rewritten (not appended) by each
-- recap so it stays a few lines long. That matters: it is prepended to every
-- tutor call, so its size is a recurring cost.
create table if not exists public.ai_tutor_memory (
  user_id    uuid not null references public.users(id) on delete cascade,
  language   text not null default 'fr',
  notes      text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, language)
);

alter table public.ai_tutor_memory enable row level security;

drop policy if exists "ai_tutor_memory_read_own" on public.ai_tutor_memory;
create policy "ai_tutor_memory_read_own"
  on public.ai_tutor_memory for select
  to authenticated
  using (user_id = auth.uid());

-- ── Saved phrases (review deck) ──────────────────────────────────────────────
-- What the student chose to keep from a recap: their corrected sentences and
-- the new words the tutor used. Scheduled with a small SM-2 variant
-- (`interval_days`, `ease`, `due_at`). Students own their rows outright, so
-- they get full CRUD on them under RLS.
create table if not exists public.ai_tutor_saved_phrases (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  language        text not null default 'fr',
  front           text not null,          -- the target-language side
  back            text not null,          -- English meaning / explanation
  note            text,
  source          text not null default 'manual'
                  check (source in ('correction', 'vocab', 'manual')),
  conversation_id uuid references public.ai_tutor_conversations(id) on delete set null,
  due_at          timestamptz not null default now(),
  interval_days   int not null default 0,
  ease            numeric(4, 2) not null default 2.5,
  reps            int not null default 0,
  created_at      timestamptz not null default now(),
  unique (user_id, language, front)
);

create index if not exists ai_tutor_saved_phrases_due_idx
  on public.ai_tutor_saved_phrases (user_id, due_at);

alter table public.ai_tutor_saved_phrases enable row level security;

drop policy if exists "ai_tutor_saved_phrases_own" on public.ai_tutor_saved_phrases;
create policy "ai_tutor_saved_phrases_own"
  on public.ai_tutor_saved_phrases for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
