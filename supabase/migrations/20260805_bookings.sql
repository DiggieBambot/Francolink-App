-- Paid lesson booking: FrancoLink sells the lesson, owns the calendar, and
-- pays the tutor a fixed per-lesson rate set by their tier.
--
-- This is student-pull (student books an open slot and pays), which is a
-- different shape from the existing tutor_sessions flow (tutor creates a
-- session and assigns students). Both can coexist: tutor_sessions serves
-- tutors who bring their own students, bookings serves the marketplace.
--
-- Money rules encoded here:
--   * Price and tutor pay are SNAPSHOT onto each booking. Tier rates change;
--     a booking made last month must still pay out at last month's rate.
--   * Free cancellation up to 12h before start. Inside 12h, no refund.
--   * A student gets one discounted trial lesson, ever.

create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Tutor tier — drives what the lesson sells for and what the tutor is paid
-- ---------------------------------------------------------------------------
alter table public.tutor_public_profiles
  add column if not exists tier text not null default 'community'
    check (tier in ('community', 'certified', 'professional')),
  -- Off by default: a tutor only becomes bookable when an admin says so.
  add column if not exists accepts_bookings boolean not null default false;

comment on column public.tutor_public_profiles.tier is
  'Set by an admin from credentials at onboarding. Drives lesson_pricing. '
  'Deliberately NOT derived from reviews — reliability is tracked separately '
  'so one bad review cannot cut a tutor''s pay.';

-- ---------------------------------------------------------------------------
-- Platform price list. FrancoLink sets these, not tutors.
-- ---------------------------------------------------------------------------
create table if not exists public.lesson_pricing (
  tier             text not null check (tier in ('community', 'certified', 'professional')),
  duration_minutes int  not null check (duration_minutes in (25, 50)),
  is_trial         boolean not null default false,
  price_cents      int  not null check (price_cents >= 0),
  tutor_pay_cents  int  not null check (tutor_pay_cents >= 0),
  currency         text not null default 'USD',
  primary key (tier, duration_minutes, is_trial)
);

-- Never sell a normal lesson for less than the tutor is paid. Trials are the
-- one deliberate exception: the discount is the platform's cost of acquiring
-- the student, and the tutor is still paid their full rate for teaching it.
--
-- Stated as one constraint created up front — an earlier version of this file
-- added a stricter anonymous check inline and only relaxed it after the seed
-- insert, which failed. The drops below clean that up if it was ever applied.
alter table public.lesson_pricing drop constraint if exists lesson_pricing_check;
alter table public.lesson_pricing drop constraint if exists lesson_pricing_check1;
alter table public.lesson_pricing drop constraint if exists lesson_pricing_margin_ok;
alter table public.lesson_pricing add constraint lesson_pricing_margin_ok
  check (is_trial or tutor_pay_cents <= price_cents);

-- Launch prices. Trial is a one-off discounted 25-minute lesson; the tutor is
-- still paid their normal rate for it — the discount is the platform's cost of
-- acquisition, not the tutor's.
insert into public.lesson_pricing (tier, duration_minutes, is_trial, price_cents, tutor_pay_cents) values
  ('professional', 25, false, 1499, 900),
  ('professional', 50, false, 2500, 1600),
  ('professional', 25, true,   799, 900),
  ('certified',    25, false, 1299, 750),
  ('certified',    50, false, 2200, 1300),
  ('certified',    25, true,   799, 750),
  ('community',    25, false, 1099, 600),
  ('community',    50, false, 1900, 1000),
  ('community',    25, true,   799, 600)
on conflict (tier, duration_minutes, is_trial) do nothing;

-- ---------------------------------------------------------------------------
-- One-off unavailability (holidays, appointments) on top of weekly recurrence
-- ---------------------------------------------------------------------------
create table if not exists public.tutor_blackouts (
  id         uuid primary key default gen_random_uuid(),
  tutor_id   uuid not null references public.users(id) on delete cascade,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  reason     text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists tutor_blackouts_lookup_idx
  on public.tutor_blackouts (tutor_id, starts_at, ends_at);

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id               uuid primary key default gen_random_uuid(),
  tutor_id         uuid not null references public.users(id) on delete restrict,
  student_id       uuid not null references public.users(id) on delete restrict,

  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  duration_minutes int not null check (duration_minutes in (25, 50)),

  status text not null default 'pending_payment' check (status in (
    'pending_payment',      -- slot held while the student is in Stripe checkout
    'expired',              -- held too long without paying; slot released
    'confirmed',            -- paid, upcoming
    'completed',            -- lesson happened
    'cancelled_by_student',
    'cancelled_by_tutor',
    'no_show_student',
    'no_show_tutor'
  )),

  -- Snapshot of the commercials at the moment of booking.
  price_cents      int not null,
  tutor_pay_cents  int not null,
  currency         text not null default 'USD',
  tier             text not null,
  is_trial         boolean not null default false,

  stripe_checkout_session_id text,
  stripe_payment_intent_id   text,
  refund_status text check (refund_status in ('none', 'full', 'partial', 'failed')),

  -- The live room this lesson runs in, created on confirmation.
  room_session_id uuid references public.tutor_lesson_sessions(id) on delete set null,

  -- A pending booking holds the slot only briefly (see expire_stale_bookings).
  expires_at   timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid references public.users(id) on delete set null,
  student_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (ends_at > starts_at)
);

-- The single most important line in this file: the database refuses to hold
-- two overlapping live bookings for the same tutor. Application logic will
-- have races; this will not.
alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings add constraint bookings_no_overlap
  exclude using gist (
    tutor_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('pending_payment', 'confirmed', 'completed'));

create index if not exists bookings_tutor_time_idx  on public.bookings (tutor_id, starts_at);
create index if not exists bookings_student_idx     on public.bookings (student_id, starts_at desc);
create index if not exists bookings_status_idx      on public.bookings (status, starts_at);
create unique index if not exists bookings_checkout_idx
  on public.bookings (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

-- One discounted trial per student, ever — enforced by the database rather
-- than by a check the booking route could forget to run.
create unique index if not exists bookings_one_trial_per_student
  on public.bookings (student_id)
  where is_trial and status <> 'expired' and status <> 'cancelled_by_student';

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
create table if not exists public.lesson_reviews (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null unique references public.bookings(id) on delete cascade,
  student_id   uuid not null references public.users(id) on delete cascade,
  tutor_id     uuid not null references public.users(id) on delete cascade,
  rating       int  not null check (rating between 1 and 5),
  comment      text,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists lesson_reviews_tutor_idx
  on public.lesson_reviews (tutor_id, created_at desc) where is_published;

-- ---------------------------------------------------------------------------
-- Housekeeping: release slots held by abandoned checkouts.
-- Called by the booking cron; also safe to call inline before listing slots.
-- ---------------------------------------------------------------------------
create or replace function public.expire_stale_bookings()
returns integer language plpgsql as $$
declare
  n integer;
begin
  update public.bookings
     set status = 'expired', updated_at = now()
   where status = 'pending_payment'
     and expires_at is not null
     and expires_at < now();
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function public.bookings_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists bookings_touch on public.bookings;
create trigger bookings_touch before update on public.bookings
  for each row execute function public.bookings_touch();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.bookings        enable row level security;
alter table public.lesson_reviews  enable row level security;
alter table public.tutor_blackouts enable row level security;
alter table public.lesson_pricing  enable row level security;

-- Prices are public: the website quotes them before anyone logs in.
drop policy if exists "anyone reads pricing" on public.lesson_pricing;
create policy "anyone reads pricing" on public.lesson_pricing for select using (true);

-- A booking is visible to its two participants. Writes go through the API
-- (service role) so price and status can never be set by the client.
drop policy if exists "participants read bookings" on public.bookings;
create policy "participants read bookings" on public.bookings for select
  using (auth.uid() = student_id or auth.uid() = tutor_id);

drop policy if exists "public reads published reviews" on public.lesson_reviews;
create policy "public reads published reviews" on public.lesson_reviews for select
  using (is_published);

drop policy if exists "student writes own review" on public.lesson_reviews;
create policy "student writes own review" on public.lesson_reviews for insert
  with check (auth.uid() = student_id);

-- Blackouts are readable by anyone (they shape the public calendar) but only
-- the tutor may edit their own.
drop policy if exists "anyone reads blackouts" on public.tutor_blackouts;
create policy "anyone reads blackouts" on public.tutor_blackouts for select using (true);

drop policy if exists "tutor manages own blackouts" on public.tutor_blackouts;
create policy "tutor manages own blackouts" on public.tutor_blackouts for all
  using (auth.uid() = tutor_id) with check (auth.uid() = tutor_id);
