-- Raise the weight of a scrambled display name, so spam is declined rather
-- than queued at the tutor.
--
-- On the traffic we actually get, the name is the ONLY signal. The current wave
-- arrives on genuine harvested mailboxes at real company domains — saks.com,
-- state.gov, fox.com — which score zero and should. So a scrambled name has to
-- be sufficient on its own, or nothing is: at the old weights every one of
-- these signups scored 4 to 6 against a BLOCK_THRESHOLD of 7 and landed in the
-- tutor's queue. That is correct behaviour for a heuristic that isn't sure, and
-- useless to a tutor facing 27 of them at once.
--
--   name_word_gibberish       4 -> 6   (>= AUTO_DECLINE_THRESHOLD)
--   name_all_words_gibberish  6 -> 8   (>= BLOCK_THRESHOLD: no account at all)
--
-- What makes this safe is 20260828_syllabic_consonant_names.sql, which stopped
-- Srdjan, Mrkic, Krstic and Vltava from scoring 1.00. Without that fix these
-- weights would hard-refuse real Slavic and Czech names. Measured after it:
-- 0 false positives across 40 real names, 27/27 of this wave still caught.
-- APPLY THAT MIGRATION FIRST.
--
-- The app mirrors this in src/lib/auth/signup-risk.ts, where a score at or
-- above AUTO_DECLINE_THRESHOLD writes the connection row as 'declined' rather
-- than 'pending' — visible to the tutor under "Automatically declined", and
-- undoable in one click. Change one, change the other.

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
      score := score + 8;
      reasons := reasons || 'name_all_words_gibberish'::text;
    elsif v_worst >= 0.9 then
      score := score + 6;
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

grant execute on function public.check_signup_risk(jsonb) to supabase_auth_admin;
revoke execute on function public.check_signup_risk(jsonb) from authenticated, anon, public;
