-- Tutor marketplace analytics.
--
-- Bookings already record everything from "started checkout" onward. This
-- adds the part before money changes hands -- directory and profile views,
-- booking clicks, favourites -- for anonymous visitors as well as signed-in
-- ones, so admin can see where people drop off and each tutor can see how
-- their profile performs.
--
-- Also: tutor_apply_invites, so an admin can invite a user to apply to teach
-- on FrancoLink without emailing the same person twice in a week.

create table if not exists public.tutor_profile_events (
  id          bigserial primary key,
  -- Null for directory_view, which isn't about one tutor.
  tutor_id    uuid references public.users(id) on delete cascade,
  kind        text not null check (kind in (
                'directory_view', 'profile_view', 'slot_selected',
                'favorite_added', 'favorite_removed', 'message_started')),
  -- Random first-party cookie (fl_vid). Not personal data on its own; it
  -- exists so one visitor refreshing a profile counts as one view.
  visitor_id  text not null,
  user_id     uuid references public.users(id) on delete set null,
  -- utm_source, else referrer host, else 'direct'.
  source      text,
  created_at  timestamptz not null default now()
);

create index if not exists tutor_profile_events_tutor_idx
  on public.tutor_profile_events (tutor_id, kind, created_at desc);
create index if not exists tutor_profile_events_created_idx
  on public.tutor_profile_events (created_at desc);
-- The once-per-visitor-per-day check on profile views.
create index if not exists tutor_profile_events_dedupe_idx
  on public.tutor_profile_events (visitor_id, tutor_id, kind, created_at desc);

-- Server-only. No policies: anon and authenticated roles can neither read nor
-- write; the track endpoint and the analytics pages use the service key.
alter table public.tutor_profile_events enable row level security;


create table if not exists public.tutor_apply_invites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  invited_by  uuid references public.users(id) on delete set null,
  sent_at     timestamptz not null default now()
);

create index if not exists tutor_apply_invites_user_idx
  on public.tutor_apply_invites (user_id, sent_at desc);

alter table public.tutor_apply_invites enable row level security;
