-- Lesson worker: an admin-driven pipeline that validates, critiques and repairs
-- tutor_lessons content with OpenAI, one section at a time.
--
-- A "run" is one sweep over a selection of lessons. Each lesson in the sweep is
-- an "item" that is processed independently, so a run can be paused, resumed or
-- cancelled without losing work. Every write to tutor_lessons.content is
-- preceded by a revision row, so any AI edit can be reverted.

-- ── runs ────────────────────────────────────────────────────────────────────

do $$ begin
  create type lesson_worker_status as enum ('queued', 'running', 'done', 'failed', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.lesson_worker_runs (
  id            uuid primary key default gen_random_uuid(),
  status        lesson_worker_status not null default 'queued',
  -- What was swept: { language, levels[], statuses[], only_stale }
  scope         jsonb not null default '{}'::jsonb,
  -- How it ran: { auto_apply, critique_model, repair_model, include_missing }
  options       jsonb not null default '{}'::jsonb,
  total_items   int not null default 0,
  done_items    int not null default 0,
  failed_items  int not null default 0,
  applied_count int not null default 0,
  cost_usd      numeric(10, 4) not null default 0,
  error         text,
  started_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  finished_at   timestamptz
);

create index if not exists lesson_worker_runs_created_idx
  on public.lesson_worker_runs (created_at desc);

-- ── items (one lesson per row) ──────────────────────────────────────────────

do $$ begin
  create type lesson_worker_item_status as enum ('pending', 'running', 'done', 'failed', 'skipped');
exception when duplicate_object then null; end $$;

create table if not exists public.lesson_worker_items (
  id          uuid primary key default gen_random_uuid(),
  run_id      uuid not null references public.lesson_worker_runs(id) on delete cascade,
  -- Null for a "missing lesson" item, which has no row to point at yet.
  lesson_id   uuid references public.tutor_lessons(id) on delete cascade,
  slug        text not null,
  title       text not null,
  level       text,
  -- 'repair' for an existing lesson, 'create' for a syllabus gap.
  kind        text not null default 'repair',
  status      lesson_worker_item_status not null default 'pending',
  -- Deterministic defects found in stage 1: [{ code, severity, path, message }]
  defects     jsonb not null default '[]'::jsonb,
  -- AI findings from stage 2: [{ section_index, severity, issue, suggestion }]
  findings    jsonb not null default '[]'::jsonb,
  -- What stage 3 actually rewrote: [{ section_index, kind, reason }]
  repairs     jsonb not null default '[]'::jsonb,
  applied     boolean not null default false,
  cost_usd    numeric(10, 4) not null default 0,
  error       text,
  created_at  timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists lesson_worker_items_run_idx    on public.lesson_worker_items (run_id, status);
create index if not exists lesson_worker_items_lesson_idx on public.lesson_worker_items (lesson_id);

-- ── revisions (the undo log) ────────────────────────────────────────────────

create table if not exists public.tutor_lesson_revisions (
  id         uuid primary key default gen_random_uuid(),
  lesson_id  uuid not null references public.tutor_lessons(id) on delete cascade,
  run_id     uuid references public.lesson_worker_runs(id) on delete set null,
  item_id    uuid references public.lesson_worker_items(id) on delete set null,
  -- The content as it was BEFORE the write this revision precedes.
  content    jsonb not null,
  reason     text,
  created_at timestamptz not null default now(),
  -- Set when this revision has been restored, so we don't offer it twice.
  reverted_at timestamptz
);

create index if not exists tutor_lesson_revisions_lesson_idx
  on public.tutor_lesson_revisions (lesson_id, created_at desc);

-- ── staleness marker on the lesson itself ───────────────────────────────────
-- Lets a run skip lessons whose content hasn't changed since the last pass,
-- which is what keeps a repeat sweep over the whole catalogue cheap.

alter table public.tutor_lessons
  add column if not exists ai_pass_hash text,
  add column if not exists ai_pass_at   timestamptz;

-- ── RLS: admin-only, service role bypasses ─────────────────────────────────

alter table public.lesson_worker_runs     enable row level security;
alter table public.lesson_worker_items    enable row level security;
alter table public.tutor_lesson_revisions enable row level security;

do $$ begin
  create policy lesson_worker_runs_admin on public.lesson_worker_runs
    for all using (
      exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN')
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy lesson_worker_items_admin on public.lesson_worker_items
    for all using (
      exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN')
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy tutor_lesson_revisions_admin on public.tutor_lesson_revisions
    for all using (
      exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN')
    );
exception when duplicate_object then null; end $$;
