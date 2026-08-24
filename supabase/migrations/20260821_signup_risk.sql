-- Stop spam accounts at registration, not after they've emailed a tutor.
--
-- The signup forms POST straight to Supabase Auth from the browser, so nothing
-- in this Next.js app sits between a bot and a new user row. Turnstile
-- (20260820) removed the volume floods; what still lands are scripted signups
-- with solved captchas — names like 'Wnzvb Qzrbbq' on burner mailboxes, which
-- then fire "X asked to join your class" at real tutors.
--
-- The only gate that runs *before the account exists* is a Supabase auth hook,
-- which is what this migration installs. The scoring mirrors
-- src/lib/auth/signup-risk.ts — change one, change the other.
--
-- ACTIVATION (required — the function is inert until this is done):
--   Supabase Dashboard → Authentication → Hooks → "Before User Created"
--   → Postgres → schema `public`, function `check_signup_risk`.

-- ---------------------------------------------------------------------------
-- Where rejected and flagged signups are recorded, so we can tune thresholds
-- instead of guessing, and see a block that shouldn't have happened.
-- ---------------------------------------------------------------------------
create table if not exists public.signup_risk_log (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  name       text,
  score      integer not null,
  -- 'allow' | 'review' | 'block'
  verdict    text not null,
  -- Rule ids that fired, e.g. {name_all_words_gibberish,email_disposable_domain}
  reasons    text[] not null default '{}',
  -- Set when a human overturns a block, so the pattern can be re-tuned.
  overturned boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists signup_risk_log_created_idx on public.signup_risk_log (created_at desc);
create index if not exists signup_risk_log_verdict_idx on public.signup_risk_log (verdict, created_at desc);
create index if not exists signup_risk_log_email_idx on public.signup_risk_log (lower(email));

-- Service-role only. No client ever reads this.
alter table public.signup_risk_log enable row level security;

-- ---------------------------------------------------------------------------
-- Manual overrides, so blocking a newly-seen burner domain is a row insert and
-- not a deploy. `kind` is 'domain' (exact) or 'email' (exact, canonicalised).
-- ---------------------------------------------------------------------------
create table if not exists public.signup_blocklist (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('domain', 'email')),
  value      text not null,
  note       text,
  created_at timestamptz not null default now()
);

create unique index if not exists signup_blocklist_unique on public.signup_blocklist (kind, lower(value));
alter table public.signup_blocklist enable row level security;

-- ---------------------------------------------------------------------------
-- Risk carried on the account itself, so a signup that scored "review" can be
-- held back from tutors without a second lookup on every request.
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists risk_score integer not null default 0,
  add column if not exists risk_reasons text[] not null default '{}',
  -- 'clear' | 'review' — 'review' accounts can browse but cannot reach a tutor
  -- as an active student until a tutor or admin accepts them.
  add column if not exists risk_status text not null default 'clear';

create index if not exists users_risk_status_idx on public.users (risk_status)
  where risk_status <> 'clear';

-- Accent folding without depending on the `unaccent` extension being installed.
create or replace function public.unaccent_fallback(input text)
returns text
language sql
immutable
as $$
  select translate(
    coalesce(input, ''),
    'àâäáãåÀÂÄÁÃÅéèêëÉÈÊËïîíìÏÎÍÌôöòóõÔÖÒÓÕùûüúÙÛÜÚÿýÇçñÑœŒæÆ',
    'aaaaaaAAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUyyCcnNoOaA'
  );
$$;

-- ---------------------------------------------------------------------------
-- How much a single word looks like keyboard noise, 0..1.
-- Mirrors gibberishScore() in src/lib/auth/signup-risk.ts.
-- ---------------------------------------------------------------------------
create or replace function public.signup_gibberish_score(raw_word text)
returns numeric
language plpgsql
immutable
as $$
declare
  w            text;
  len          integer;
  vowel_count  integer;
  vowel_ratio  numeric;
  score        numeric := 0;
begin
  -- Fold accents, then keep letters only: 'Émile' and 'emile' must score alike.
  w := lower(regexp_replace(unaccent_fallback(raw_word), '[^a-zA-Z]', '', 'g'));
  len := length(w);
  if len < 3 then
    return 0;
  end if;

  vowel_count := len - length(regexp_replace(w, '[aeiouy]', '', 'g'));
  vowel_ratio := vowel_count::numeric / len;

  -- No vowels at all in a 3+ letter word is decisive ('Wnzvb', 'Qzrbbq').
  if vowel_count = 0 then
    score := score + 1;
  elsif vowel_ratio < 0.2 then
    score := score + 0.6;
  elsif vowel_ratio > 0.8 then
    score := score + 0.4;
  end if;

  -- French and English tolerate a run of 3 ('strong'), not 4.
  if w ~ '[bcdfghjklmnpqrstvwxz]{4,}' then
    score := score + 0.5;
  end if;

  -- 'q' not followed by 'u' is near-impossible in the languages we serve.
  -- (Postgres regex has no lookahead, so match the positive form instead.)
  if w ~ 'q([^u]|$)' then
    score := score + 0.4;
  end if;

  -- Same letter three times running.
  if w ~ '(.)\1{2,}' then
    score := score + 0.4;
  end if;

  -- A digit inside a name word.
  if raw_word ~ '\d' then
    score := score + 0.3;
  end if;

  return least(1, score);
end;
$$;

-- ---------------------------------------------------------------------------
-- The gate. Supabase calls this with the pending user before the row is
-- written; returning an `error` object rejects the signup with that message.
-- Mirrors assessSignup() in src/lib/auth/signup-risk.ts.
-- ---------------------------------------------------------------------------
create or replace function public.check_signup_risk(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user         jsonb;
  v_meta         jsonb;
  v_email        text;
  v_name         text;
  v_local        text;
  v_local_core   text;
  v_domain       text;
  v_canonical    text;
  v_digits       integer;
  v_word         text;
  v_word_score   numeric;
  v_worst        numeric := 0;
  v_all_noise    boolean := true;
  v_word_count   integer := 0;
  score          integer := 0;
  -- NB: every append below casts to ::text. Without it Postgres resolves the
  -- untyped literal against the text[] operand and dies with
  -- 'malformed array literal', which would throw on every flagged signup.
  reasons        text[] := '{}';
  verdict        text;
  -- Thresholds, kept identical to REVIEW_THRESHOLD / BLOCK_THRESHOLD in TS.
  review_at      constant integer := 4;
  block_at       constant integer := 7;
begin
  -- Supabase nests the pending account under `user`; tolerate a flat payload
  -- too, so a hook-format change degrades into "score it anyway" rather than
  -- "wave everything through".
  v_user := coalesce(event -> 'user', event);
  v_meta := coalesce(v_user -> 'raw_user_meta_data', v_user -> 'user_metadata', '{}'::jsonb);

  v_email := lower(trim(coalesce(v_user ->> 'email', '')));
  v_name  := trim(coalesce(v_meta ->> 'name', v_meta ->> 'full_name', ''));

  -- No email (phone signup, or a shape we don't score): let it through rather
  -- than blocking a flow this function wasn't written for.
  if v_email = '' or position('@' in v_email) = 0 then
    return '{}'::jsonb;
  end if;

  v_local  := split_part(v_email, '@', 1);
  v_domain := split_part(v_email, '@', 2);

  -- Canonical form collapses Gmail dots and +aliases to one identity.
  v_canonical := case
    when v_domain in ('gmail.com', 'googlemail.com')
      then replace(split_part(v_local, '+', 1), '.', '') || '@gmail.com'
    else split_part(v_local, '+', 1) || '@' || v_domain
  end;

  -- --- Manual blocklist first: an explicit human decision outranks scoring ---
  if exists (
    select 1 from public.signup_blocklist
    where (kind = 'domain' and lower(value) = v_domain)
       or (kind = 'email'  and lower(value) = v_canonical)
  ) then
    insert into public.signup_risk_log (email, name, score, verdict, reasons)
    values (v_email, nullif(v_name, ''), 100, 'block', array['blocklisted']::text[]);
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 400,
      'message', 'We can''t create an account with this email address. Please use a different one.'
    ));
  end if;

  -- --- Email domain ---------------------------------------------------------
  if public.signup_gibberish_score(split_part(v_domain, '.', 1)) >= 0.6
     and v_domain not in (
       'gmail.com','googlemail.com','yahoo.com','yahoo.fr','hotmail.com','hotmail.fr',
       'outlook.com','outlook.fr','live.com','live.fr','icloud.com','me.com','aol.com',
       'proton.me','protonmail.com','gmx.com','gmx.de','mail.com','orange.fr','free.fr',
       'laposte.net','wanadoo.fr','sfr.fr','hotmail.co.uk','yandex.ru','mail.ru'
     ) then
    score := score + 4;
    reasons := reasons || 'email_domain_gibberish'::text;
  end if;

  -- --- Email local part -----------------------------------------------------
  -- Drop a leading initial: 'jsmith' and 'm.alrashid' are how half the world
  -- writes a real address, and read as vowel-poor noise otherwise.
  v_local_core := regexp_replace(v_local, '[._+-]', '', 'g');
  if length(v_local_core) >= 5 and left(v_local_core, 1) ~ '[bcdfghjklmnpqrstvwxz]' then
    v_local_core := substr(v_local_core, 2);
  end if;
  if public.signup_gibberish_score(v_local_core) >= 0.8 then
    score := score + 3;
    reasons := reasons || 'email_local_gibberish'::text;
  end if;

  v_digits := length(v_local) - length(regexp_replace(v_local, '\d', '', 'g'));
  if v_digits >= 6 then
    score := score + 2;
    reasons := reasons || 'email_local_digit_heavy'::text;
  end if;
  if length(v_local) >= 6 and v_digits::numeric / length(v_local) > 0.5 then
    score := score + 2;
    reasons := reasons || 'email_local_mostly_digits'::text;
  end if;
  if position('+' in v_local) > 0 then
    score := score + 1;
    reasons := reasons || 'email_plus_alias'::text;
  end if;

  -- --- Display name ---------------------------------------------------------
  if v_name = '' then
    score := score + 2;
    reasons := reasons || 'name_missing'::text;
  else
    foreach v_word in array regexp_split_to_array(v_name, '\s+') loop
      if length(v_word) > 0 then
        v_word_count := v_word_count + 1;
        v_word_score := public.signup_gibberish_score(v_word);
        v_worst := greatest(v_worst, v_word_score);
        if v_word_score < 0.6 then
          v_all_noise := false;
        end if;
      end if;
    end loop;

    if v_word_count > 0 and v_all_noise then
      score := score + 6;
      reasons := reasons || 'name_all_words_gibberish'::text;
    elsif v_worst >= 0.9 then
      score := score + 4;
      reasons := reasons || 'name_word_gibberish'::text;
    elsif v_worst >= 0.6 then
      score := score + 2;
      reasons := reasons || 'name_word_suspicious'::text;
    end if;

    if v_name ~* '(https?://|www\.|\.(com|net|ru|xyz|top)\y)' then
      score := score + 6;
      reasons := reasons || 'name_contains_url'::text;
    end if;
    if length(v_name) > 60 then
      score := score + 2;
      reasons := reasons || 'name_too_long'::text;
    end if;
  end if;

  verdict := case
    when score >= block_at  then 'block'
    when score >= review_at then 'review'
    else 'allow'
  end;

  -- Log everything that isn't clean, so thresholds can be tuned from evidence.
  if verdict <> 'allow' then
    insert into public.signup_risk_log (email, name, score, verdict, reasons)
    values (v_email, nullif(v_name, ''), score, verdict, reasons);
  end if;

  if verdict = 'block' then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 400,
      -- Deliberately vague: a precise reason tells a bot operator exactly which
      -- field to vary next.
      'message', 'We couldn''t create your account. Please check your name and email address, or contact support@francolink.net.'
    ));
  end if;

  -- 'review' accounts are created but carried through with their score, so the
  -- app can hold them back from tutors. Auth hooks can inject metadata.
  if verdict = 'review' then
    return jsonb_build_object('decision', 'continue', 'user_metadata',
      v_meta || jsonb_build_object('risk_score', score, 'risk_status', 'review'));
  end if;

  return '{}'::jsonb;
end;
$$;

-- Supabase's auth service runs hooks as `supabase_auth_admin`.
grant execute on function public.check_signup_risk(jsonb) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
grant insert, select on table public.signup_risk_log to supabase_auth_admin;
grant select on table public.signup_blocklist to supabase_auth_admin;

-- Nobody else may call the hook directly.
revoke execute on function public.check_signup_risk(jsonb) from authenticated, anon, public;

-- The scorer is pure maths and touches no data, but leaving it callable lets
-- someone tune spam names against it for free. No client needs it.
revoke execute on function public.signup_gibberish_score(text) from authenticated, anon, public;
grant execute on function public.signup_gibberish_score(text) to supabase_auth_admin;
