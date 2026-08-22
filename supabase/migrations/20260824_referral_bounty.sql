-- Referral pay on lesson plans: a one-time bounty, not a perpetual cut.
--
-- The existing model pays the referring tutor 10% of a student's first month
-- and 5% of every month after, forever. That was written for self-study
-- subscriptions, where the revenue is nearly all margin.
--
-- Lesson plans are not that. About half of a lesson plan's revenue is already
-- committed to the teaching tutor's wages, so a further 5% off the top comes
-- out of what is left: professional annual runs 32% before breakage, and the
-- recurring cut silently makes it 25%. Nobody would see that happen.
--
-- It is also the wrong shape. Recruiting a student is one act of work; being
-- paid for it every month for years, on revenue that is mostly someone else's
-- wages, is not a commission so much as an annuity.
--
-- So: a flat bounty, once per referred student, on lesson plans only. Flat
-- rather than a percentage because 10% of a first invoice is $4.33 on a
-- monthly community plan and $520 on an annual professional 5/week plan --
-- the same act of referral, wildly different pay.
--
-- The legacy percentage model is untouched and still applies to self-study
-- subscriptions. The webhook decides which one an invoice belongs to.

-- ---------------------------------------------------------------------------
-- commission_ledger predates these migrations, so every change is defensive.
-- ---------------------------------------------------------------------------
alter table public.commission_ledger
  add column if not exists kind text not null default 'subscription_share',
  add column if not exists booking_id uuid;

do $$
begin
  alter table public.commission_ledger
    add constraint commission_ledger_kind_check
    check (kind in ('subscription_share', 'lesson_plan_bounty'));
exception
  when duplicate_object then null;
end $$;

comment on column public.commission_ledger.kind is
  'subscription_share = the legacy percentage of a self-study subscription, '
  'paid every month. lesson_plan_bounty = a one-off payment for recruiting a '
  'student onto a live lesson plan.';

-- The whole point of a bounty is that it is paid once. This index is what
-- makes that true even if the application asks twice.
create unique index if not exists commission_ledger_one_bounty_per_student_idx
  on public.commission_ledger (tutor_id, student_id)
  where kind = 'lesson_plan_bounty';

create index if not exists commission_ledger_kind_idx
  on public.commission_ledger (kind, created_at desc);

-- ---------------------------------------------------------------------------
-- Bounty amounts, per plan, in the settings table the admin UI already reads.
-- ---------------------------------------------------------------------------
-- Sized at roughly half of one month's gross margin on a 1-lesson/week plan,
-- so a referral pays for itself inside three weeks:
--
--   community    $4.64/lesson x 4.33 = ~$20/month margin  ->  $10 bounty
--   professional $11.21/lesson x 4.33 = ~$48/month margin  ->  $20 bounty
-- Inserted with a NOT EXISTS guard rather than ON CONFLICT: app_settings
-- predates these migrations and its unique constraints cannot be assumed from
-- here. This form is correct either way.
insert into public.app_settings (category, key, value, value_type, description, is_secret)
select v.category, v.key, v.value, v.value_type, v.description, false
  from (values
    ('commissions', 'lesson_plan_bounty_enabled', 'true', 'boolean',
     'Pay a one-time bounty when a referred student starts a live lesson plan.'),
    ('commissions', 'lesson_plan_bounty_community', '10.00', 'number',
     'One-time referral bounty for a student on the Community plan, in USD.'),
    ('commissions', 'lesson_plan_bounty_professional', '20.00', 'number',
     'One-time referral bounty for a student on the Professional plan, in USD.')
  ) as v(category, key, value, value_type, description)
 where not exists (
   select 1 from public.app_settings s
    where s.category = v.category and s.key = v.key
 );
