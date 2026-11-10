-- Lesson reviews now wait for an admin before they reach a tutor's profile.
--
-- Until now every review was published the moment the student submitted it
-- (`is_published default true`). It stays the single switch the public read
-- policy and the tutor directory look at, but it now starts false and only an
-- admin approving the review turns it on.

-- Column + backfill together, and only the first time. The backfill reads
-- `is_published` as "was it live before moderation existed?" -- run again after
-- go-live it would read every review still waiting in the queue as rejected.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'lesson_reviews'
       and column_name = 'review_status'
  ) then
    alter table public.lesson_reviews
      add column review_status text not null default 'pending'
        check (review_status in ('pending', 'approved', 'rejected'));

    -- Anything already published was published before moderation existed;
    -- keep it visible and mark it approved so it does not enter the queue.
    update public.lesson_reviews set review_status = 'approved' where is_published;
    update public.lesson_reviews set review_status = 'rejected' where not is_published;
  end if;
end $$;

alter table public.lesson_reviews
  add column if not exists moderated_at timestamptz,
  add column if not exists moderated_by uuid references public.users(id) on delete set null;

alter table public.lesson_reviews alter column is_published set default false;

create index if not exists lesson_reviews_pending_idx
  on public.lesson_reviews (created_at desc) where review_status = 'pending';

-- A student may write their own review, but never publish it themselves.
drop policy if exists "student writes own review" on public.lesson_reviews;
create policy "student writes own review" on public.lesson_reviews for insert
  with check (auth.uid() = student_id and is_published = false);

-- The pay ladder reads ratings too. A review an admin rejected (abuse, a fake,
-- a rating left by mistake) must stop counting against the tutor. Pending ones
-- still count: they are real ratings from real lessons, only the words await
-- a check. Body otherwise identical to 20260828_tutor_ladder.sql.
create or replace function public.tutor_metrics(p_tutor uuid)
returns table (
  completed      int,
  tutor_faults   int,
  reliability_bps int,
  students       int,
  rebooked       int,
  rebooking_bps  int,
  avg_rating     numeric,
  rated_count    int
) language sql stable as $$
  with b as (
    select status, student_id
      from public.bookings
     where tutor_id = p_tutor
  ),
  done as (
    select student_id, count(*) as n
      from b where status = 'completed'
     group by student_id
  ),
  agg as (
    select
      coalesce((select sum(n)::int from done), 0)                      as completed,
      (select count(*)::int from b
        where status in ('no_show_tutor', 'cancelled_by_tutor'))       as tutor_faults,
      (select count(*)::int from done)                                 as students,
      (select count(*)::int from done where n >= 2)                    as rebooked
  ),
  r as (
    select round(avg(rating)::numeric, 2) as avg_rating, count(*)::int as rated_count
      from public.lesson_reviews
     where tutor_id = p_tutor
       and review_status <> 'rejected'
  )
  select
    agg.completed,
    agg.tutor_faults,
    -- No history yet reads as perfect, not as zero: a new tutor must not be
    -- gated out of step 1 by a denominator of nothing.
    case when agg.completed + agg.tutor_faults = 0 then 10000
         else (10000 - round(10000.0 * agg.tutor_faults
                             / (agg.completed + agg.tutor_faults)))::int end,
    agg.students,
    agg.rebooked,
    case when agg.students = 0 then 0
         else round(10000.0 * agg.rebooked / agg.students)::int end,
    coalesce(r.avg_rating, 0),
    coalesce(r.rated_count, 0)
  from agg, r;
$$;
