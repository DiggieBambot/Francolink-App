-- Daily News lessons: metadata + run logs for automated news-to-lesson drafts.
-- Generated lesson content is stored in public.tutor_lessons so existing review,
-- preview, publish, and public catalogue flows keep working.

create table if not exists public.daily_news_runs (
  id uuid primary key default gen_random_uuid(),
  mode text not null default 'live',
  categories text[] not null default '{}',
  target_cefr_level text not null default 'B1',
  fetched_count int not null default 0,
  selected_count int not null default 0,
  generated_count int not null default 0,
  failed_count int not null default 0,
  published_count int not null default 0,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_news_lessons (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.tutor_lessons(id) on delete cascade,
  run_id uuid references public.daily_news_runs(id) on delete set null,
  category text not null,
  cefr_level text not null default 'B1',
  source_name text,
  source_url text not null,
  published_at timestamptz,
  content_hash text not null unique,
  feed_rank int,
  score jsonb,
  banner_image jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists daily_news_lessons_lesson_idx
  on public.daily_news_lessons (lesson_id);

create index if not exists daily_news_lessons_category_created_idx
  on public.daily_news_lessons (category, created_at desc);

create index if not exists daily_news_runs_created_idx
  on public.daily_news_runs (created_at desc);

alter table public.daily_news_runs enable row level security;
alter table public.daily_news_lessons enable row level security;

drop policy if exists "daily_news_runs_admin_read" on public.daily_news_runs;
create policy "daily_news_runs_admin_read"
  on public.daily_news_runs for select
  to authenticated
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and upper(u.role) = 'ADMIN')
  );

drop policy if exists "daily_news_lessons_admin_read" on public.daily_news_lessons;
create policy "daily_news_lessons_admin_read"
  on public.daily_news_lessons for select
  to authenticated
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and upper(u.role) = 'ADMIN')
  );

drop policy if exists "daily_news_lessons_public_read_published" on public.daily_news_lessons;
create policy "daily_news_lessons_public_read_published"
  on public.daily_news_lessons for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.tutor_lessons l
      where l.id = daily_news_lessons.lesson_id
        and l.status = 'published'
    )
  );
