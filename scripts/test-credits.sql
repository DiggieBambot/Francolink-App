-- Self-checking test for the lesson credit ledger.
--
-- Run it anywhere you can execute SQL against the project (the Supabase SQL
-- editor is fine). It is SAFE: everything happens inside one DO block that
-- deliberately raises at the end, so the whole thing rolls back. Nothing it
-- writes survives. Success looks like this error:
--
--     ERROR:  ALL 18 ASSERTIONS PASSED - rolling back
--
-- Any other error is a real failure, and the message says which assertion.
--
-- It borrows the first user row it finds rather than creating one, because
-- public.users predates these migrations and may be keyed to auth.users.

do $$
declare
  u          uuid;
  sub_id     uuid;
  start_bal  numeric;
  bal        numeric;
  n          int := 0;
  caught     boolean;
  cents      int;
begin
  select id into u from public.users order by created_at limit 1;
  if u is null then
    raise exception 'no users in this database - nothing to test against';
  end if;

  -- Preflight. Without this, an unapplied migration surfaces as a baffling
  -- arithmetic failure in A1: delta is still integer, Postgres rounds an
  -- inserted 2.5 up to 3, and the test reports a maths error rather than the
  -- deployment problem it actually found.
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'lesson_credits'
       and column_name = 'delta' and data_type = 'numeric'
  ) then
    raise exception
      'lesson_credits.delta is not numeric - migration 20260823_credits_simplify.sql has not been applied';
  end if;

  if not exists (select 1 from public.subscription_plans where plan_key = 'professional') then
    raise exception
      'no "professional" plan - migration 20260823_credits_simplify.sql has not been applied';
  end if;

  start_bal := public.credit_balance(u);

  -- 1 ── fractional credits survive a round trip -----------------------------
  insert into public.lesson_credits (user_id, delta, reason, note)
  values (u, 2.5, 'admin_adjustment', 'test');
  bal := public.credit_balance(u);
  if bal <> start_bal + 2.5 then
    raise exception 'A1 fractional grant: expected %, got %', start_bal + 2.5, bal;
  end if;
  n := n + 1;

  -- 2 ── a 25-minute lesson costs half a credit ------------------------------
  perform public.spend_credits(u, 0.5, null, 'booking');
  bal := public.credit_balance(u);
  if bal <> start_bal + 2.0 then
    raise exception 'A2 half-lesson spend: expected %, got %', start_bal + 2.0, bal;
  end if;
  n := n + 1;

  -- 3 ── a 50-minute lesson costs a whole one --------------------------------
  perform public.spend_credits(u, 1.0, null, 'booking');
  if public.credit_balance(u) <> start_bal + 1.0 then
    raise exception 'A3 full-lesson spend failed';
  end if;
  n := n + 1;

  -- 4 ── overspending is refused, not silently allowed -----------------------
  caught := false;
  begin
    perform public.spend_credits(u, 9999, null, 'booking');
  exception when others then
    caught := true;
  end;
  if not caught then
    raise exception 'A4 overspend was ALLOWED - this mints free lessons';
  end if;
  n := n + 1;

  -- 5 ── a zero or negative spend is refused ---------------------------------
  caught := false;
  begin
    perform public.spend_credits(u, -1, null, 'booking');
  exception when others then
    caught := true;
  end;
  if not caught then
    raise exception 'A5 negative spend was allowed - that is a credit grant';
  end if;
  n := n + 1;

  -- 6 ── the weekly grant issues credits with a 30-day expiry ---------------
  -- Clear any live subscription first: one per user is enforced by a partial
  -- unique index, and this all rolls back regardless.
  delete from public.user_subscriptions
   where user_id = u and status in ('active', 'past_due');

  insert into public.user_subscriptions
    (user_id, plan_key, lessons_per_week, term_months, status, started_at)
  values (u, 'professional', 3, 1, 'active', now())
  returning id into sub_id;

  bal := public.credit_balance(u);
  perform public.grant_weekly_credits(sub_id, current_date);

  if public.credit_balance(u) <> bal + 3 then
    raise exception 'A6 weekly grant: expected %, got %', bal + 3, public.credit_balance(u);
  end if;

  if not exists (
    select 1 from public.lesson_credits
     where user_id = u and reason = 'weekly_grant'
       and expires_at between now() + interval '29 days' and now() + interval '31 days'
  ) then
    raise exception 'A6b granted credits carry no 30-day expiry';
  end if;
  n := n + 2;

  -- 7 ── the same week does not grant twice ----------------------------------
  bal := public.credit_balance(u);
  perform public.grant_weekly_credits(sub_id, current_date);
  if public.credit_balance(u) <> bal then
    raise exception 'A7 double grant in one week: balance moved to %',
      public.credit_balance(u);
  end if;
  n := n + 1;

  -- 8 ── the ledger never goes negative through normal use -------------------
  if exists (
    select 1 from (
      select sum(delta) over (order by id) running
        from public.lesson_credits where user_id = u
    ) t where running < 0
  ) then
    raise exception 'A8 running balance went negative at some point';
  end if;
  n := n + 1;

  -- 9 ── a loss-making plan price is rejected --------------------------------
  -- professional pays $13.00 for 50 minutes; a 90% discount sells it for $2.50.
  -- 7 lessons/week is deliberately NOT in the seed: a combination that already
  -- existed would raise a unique violation and pass this test without the
  -- margin trigger ever running.
  caught := false;
  begin
    insert into public.subscription_plan_prices
      (plan_key, lessons_per_week, term_months, discount_bps)
    values ('professional', 7, 12, 9000);
  exception when others then
    caught := true;
  end;
  if not caught then
    raise exception 'A9 a below-cost plan price was ACCEPTED';
  end if;
  n := n + 1;

  -- 10 ── seeded prices are what we think they are ---------------------------
  select total_cents into cents from public.subscription_plan_prices
   where plan_key = 'professional' and lessons_per_week = 1 and term_months = 12;
  -- $25.00 less 20% = $20.00, x 1 lesson x 4.33 weeks x 12 months = $1,039.20
  if cents <> 103920 then
    raise exception 'A10 professional annual 1/wk: expected 103920c, got %c', cents;
  end if;
  n := n + 1;

  -- 11 ── a monthly plan owes nothing back ----------------------------------
  -- The test subscription is term_months = 1 and started just now, so one
  -- month is consumed and there is no unused remainder to refund. The annual
  -- case is exercised below it.
  cents := public.subscription_refund_due(sub_id);
  if cents <> 0 then
    raise exception 'A11 monthly plan should owe no refund, got %c', cents;
  end if;
  n := n + 1;

  -- 12 ── an annual plan cancelled in month 1 refunds the other 11 ----------
  -- The subscription created in A6 is 3 lessons/week, so:
  --   annual  = $25.00 less 20% = $20.00 x 3 x 4.33 x 12 = $3,117.60 paid
  --   monthly = $25.00          x 3 x 4.33 x  1 =   $324.75 consumed
  --   refund  = $3,117.60 - $324.75            = $2,792.85
  -- The student loses the discount they were only entitled to by committing
  -- to the term, and keeps the rest.
  update public.user_subscriptions set term_months = 12 where id = sub_id;
  cents := public.subscription_refund_due(sub_id);
  if cents <> 279285 then
    raise exception 'A12 annual refund: expected 279285c, got %c', cents;
  end if;
  n := n + 1;

  -- 13 ── expiry is FIFO, and a partly-spent lapsed grant does not go negative
  -- This is the case that killed the naive `where expires_at > now()` design:
  --   +3 lapsed, -1 spent from it  ->  a filtered balance reads -1.
  -- Here it must read 2, and expiry must take exactly the 2 that are left.
  delete from public.lesson_credits where user_id = u;

  insert into public.lesson_credits (user_id, delta, reason, expires_at)
  values (u, 3, 'weekly_grant', now() - interval '1 day');   -- lapsed
  insert into public.lesson_credits (user_id, delta, reason)
  values (u, -1, 'booking');                                  -- spent from it

  if public.credit_balance(u) <> 2 then
    raise exception 'A13 balance before expiry: expected 2, got %',
      public.credit_balance(u);
  end if;
  n := n + 1;

  -- 14 ── the sweep takes only the unspent remainder -------------------------
  bal := public.expire_stale_credits(u);
  if bal <> 2 then
    raise exception 'A14 expired amount: expected 2, got %', bal;
  end if;
  if public.credit_balance(u) <> 0 then
    raise exception 'A14b balance after expiry: expected 0, got %',
      public.credit_balance(u);
  end if;
  n := n + 2;

  -- 15 ── running it again takes nothing more --------------------------------
  if public.expire_stale_credits(u) <> 0 then
    raise exception 'A15 second sweep expired credits twice';
  end if;
  n := n + 1;

  -- 16 ── live credits are untouched by the sweep ----------------------------
  delete from public.lesson_credits where user_id = u;

  insert into public.lesson_credits (user_id, delta, reason, expires_at)
  values (u, 2, 'weekly_grant', now() - interval '1 day');    -- lapsed
  insert into public.lesson_credits (user_id, delta, reason, expires_at)
  values (u, 3, 'weekly_grant', now() + interval '20 days');  -- still good
  insert into public.lesson_credits (user_id, delta, reason)
  values (u, -1, 'booking');

  -- FIFO: the spend came out of the lapsed grant, leaving 1 of it to expire.
  if public.expire_stale_credits(u) <> 1 then
    raise exception 'A16 FIFO expiry took the wrong amount';
  end if;
  if public.credit_balance(u) <> 3 then
    raise exception 'A16b live credits were swept: expected 3, got %',
      public.credit_balance(u);
  end if;
  n := n + 1;

  raise exception 'ALL % ASSERTIONS PASSED - rolling back', n;
end $$;
