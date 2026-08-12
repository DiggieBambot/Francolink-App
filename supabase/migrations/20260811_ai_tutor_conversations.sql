-- AI tutor persistence.
--
-- Until now the AI tutor kept its entire state in React: a refresh wiped the
-- conversation, and the corrections it produced — the one output a tutoring
-- product actually needs to keep — were thrown away the moment they scrolled
-- off screen. These three tables make a session durable, resumable, and
-- reviewable, and give us the per-message cost accounting the tutor has never
-- had (the lesson worker has had it since day one; see lib/lessons/worker/ai.ts).

-- ── Conversations ────────────────────────────────────────────────────────────
-- One row per practice session. `tutor_lesson_id` is set when the student
-- started from a lesson, in which case `section_index` tracks how far through
-- that lesson's ordered sections the tutor has walked, so leaving and coming
-- back resumes in the right place.
create table if not exists public.ai_tutor_conversations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  language        text not null default 'fr',
  tutor_lesson_id uuid references public.tutor_lessons(id) on delete set null,
  -- Denormalised so a resumed session still names its lesson after that lesson
  -- is unpublished or renamed.
  lesson_title    text,
  section_index   int  not null default 0,
  title           text,
  started_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index if not exists ai_tutor_conversations_user_idx
  on public.ai_tutor_conversations (user_id, last_message_at desc);

-- ── Messages ─────────────────────────────────────────────────────────────────
-- Token counts and cost are stored per assistant message. Without this there is
-- no way to know whether the tutor's unit economics hold; with it, the admin
-- user page can show what a given student has actually cost.
create table if not exists public.ai_tutor_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_tutor_conversations(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  model           text,
  tokens_in       int,
  tokens_out      int,
  cost_usd        numeric(10, 6),
  created_at      timestamptz not null default now()
);

create index if not exists ai_tutor_messages_conversation_idx
  on public.ai_tutor_messages (conversation_id, created_at);
create index if not exists ai_tutor_messages_user_cost_idx
  on public.ai_tutor_messages (user_id, created_at desc);

-- ── Corrections ──────────────────────────────────────────────────────────────
-- Extracted from the model's structured output rather than parsed back out of
-- the reply prose. `tag` is a coarse grammar bucket ('gender', 'agreement',
-- 'tense', 'vocabulary', 'spelling', 'word_order', 'other') so a student can be
-- shown what they keep getting wrong, not just a flat list.
create table if not exists public.ai_tutor_corrections (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_tutor_conversations(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  original        text not null,
  corrected       text not null,
  explanation     text,
  tag             text,
  created_at      timestamptz not null default now()
);

create index if not exists ai_tutor_corrections_user_idx
  on public.ai_tutor_corrections (user_id, created_at desc);
create index if not exists ai_tutor_corrections_tag_idx
  on public.ai_tutor_corrections (user_id, tag);

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Students read their own rows. Tutors read their own students' rows, via the
-- same active tutor_students link the rest of the app uses. All writes go
-- through the service-role chat route — the client never inserts directly, so
-- there are deliberately no insert/update policies for `authenticated`.
alter table public.ai_tutor_conversations enable row level security;
alter table public.ai_tutor_messages      enable row level security;
alter table public.ai_tutor_corrections   enable row level security;

create policy "ai_tutor_conversations_read_own"
  on public.ai_tutor_conversations for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.tutor_students ts
      where ts.student_id = ai_tutor_conversations.user_id
        and ts.tutor_id = auth.uid()
        and ts.status = 'active'
    )
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN')
  );

create policy "ai_tutor_messages_read_own"
  on public.ai_tutor_messages for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.tutor_students ts
      where ts.student_id = ai_tutor_messages.user_id
        and ts.tutor_id = auth.uid()
        and ts.status = 'active'
    )
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN')
  );

create policy "ai_tutor_corrections_read_own"
  on public.ai_tutor_corrections for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.tutor_students ts
      where ts.student_id = ai_tutor_corrections.user_id
        and ts.tutor_id = auth.uid()
        and ts.status = 'active'
    )
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN')
  );

-- ── Usage counter ────────────────────────────────────────────────────────────
-- The quota moves from a daily cap to a monthly pool, so the reset marker
-- becomes a 'YYYY-MM' period key rather than a date. The existing counter
-- column keeps its historical name; everything above the data layer calls these
-- messages, because messages is what they have always been.
alter table public.users
  add column if not exists ai_usage_period text;

comment on column public.users.ai_minutes_used_today is
  'AI tutor messages used in the current period. Named "minutes" historically; the counter has only ever incremented once per student message.';
comment on column public.users.ai_usage_period is
  'Period key (YYYY-MM) the message counter belongs to. Rolls the counter over when it no longer matches the current month.';
