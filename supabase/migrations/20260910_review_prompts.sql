-- Asking for a review, once, at the right moment.
--
-- One row per user, not one per prompt. The interesting question is never "how
-- many times did we ask" on its own -- it is "where does this user currently
-- stand", and a state row answers that in a single indexed read on every
-- dashboard load. The ask count rides along as a counter.
--
-- The two-step design is the point. We ask a cheap in-app question first
-- ("how's it going?") and only route the happy answers on to Trustpilot. That
-- is not review-gating: nothing here stops an unhappy user posting publicly,
-- and we deliberately keep their written feedback so somebody can reply. We
-- simply don't spend our finite invitation budget driving a bad week onto a
-- permanent public page.

create table if not exists public.review_prompts (
  user_id      uuid primary key references public.users(id) on delete cascade,

  -- Where this user has got to. 'pending' means eligible and not yet answered.
  status       text not null default 'pending'
               check (status in ('pending', 'snoozed', 'positive', 'negative', 'declined')),

  -- Free-text from the thumbs-down branch. Null for everyone else.
  feedback     text,

  -- How many times the card has actually been rendered to them. Two strikes and
  -- we stop: a third unanswered ask is nagging, not asking.
  times_shown  int  not null default 0,

  -- Set when they hit "Later". Nothing is shown again before this.
  snooze_until timestamptz,

  -- Set the moment they click through to Trustpilot. We can never confirm they
  -- actually posted -- Trustpilot does not tell us -- so this is "sent", not
  -- "reviewed", and the naming should keep anyone from believing otherwise.
  sent_at      timestamptz,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- The admin view is "who left feedback lately, worst first", so index the
-- write time rather than the primary key.
create index if not exists review_prompts_status_idx
  on public.review_prompts (status, updated_at desc);

alter table public.review_prompts enable row level security;

-- Strictly the user's own row. Staff read this through the service role, the
-- same way every other admin surface in this codebase does.
drop policy if exists "user manages own review prompt" on public.review_prompts;
create policy "user manages own review prompt" on public.review_prompts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
