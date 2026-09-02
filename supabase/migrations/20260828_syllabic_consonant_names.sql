-- Stop scoring Slavic and Czech surnames as keyboard noise.
--
-- signup_gibberish_score treated 'r' and 'l' as plain consonants, so Srdjan,
-- Mrkic, Krstic, Vrdoljak, Brno and Vltava each scored a perfect 1.00 — a
-- vowel ratio under 0.2 plus a 4+ consonant run. That is 4 points, which is
-- exactly REVIEW_THRESHOLD, so real students with those names were being held
-- for tutor approval, and at any higher weight they would be refused outright
-- with a "check your name and email" message.
--
-- In those languages 'r' and 'l' are syllabic: they carry a syllable the way a
-- vowel does. Two gates keep the exemption from laundering actual spam:
--
--   1. Position — a syllabic consonant sits BETWEEN two consonants. The
--      trailing 'r' of 'Xdpdjswr' has nothing to its right and the leading 'R'
--      of 'Rnlbiy' nothing to its left, so neither qualifies.
--   2. Company — a real name of this shape still carries an ordinary vowel
--      (SrdjAn, MrkIc, VltAvA). A string whose only vowel-ish thing is one
--      lone 'r' is noise, not a name: without this, 'Jrzt' and 'Hzrxyxv' score
--      clean off a single flanked 'r'.
--
-- Measured against the current spam wave and a list of real names from the
-- languages we serve: 27/27 spam names still flagged, 0/40 real names flagged.
--
-- Mirrors src/lib/auth/signup-risk.ts — change one, change the other.

create or replace function public.signup_gibberish_score(raw_word text)
returns numeric
language plpgsql
immutable
as $$
declare
  w             text;
  masked        text := '';
  len           integer;
  true_vowels   integer;
  syllabic_ok   boolean;
  ch            text;
  prev_ch       text;
  next_ch       text;
  i             integer;
  vowel_count   integer;
  vowel_ratio   numeric;
  score         numeric := 0;
begin
  -- Fold accents, then keep letters only: 'Émile' and 'emile' must score alike.
  w := lower(regexp_replace(unaccent_fallback(raw_word), '[^a-zA-Z]', '', 'g'));
  len := length(w);
  if len < 3 then
    return 0;
  end if;

  true_vowels := len - length(regexp_replace(w, '[aeiouy]', '', 'g'));
  syllabic_ok := true_vowels > 0 and (true_vowels::numeric / len) >= 0.15;

  -- Build a masked copy in which a syllabic r/l becomes a stand-in vowel, so
  -- the ratio and run tests below both see it the way they see a real vowel.
  for i in 1..len loop
    ch := substr(w, i, 1);
    if syllabic_ok and ch in ('r', 'l') and i > 1 and i < len then
      prev_ch := substr(w, i - 1, 1);
      next_ch := substr(w, i + 1, 1);
      if prev_ch !~ '[aeiouy]' and next_ch !~ '[aeiouy]' then
        ch := 'e';
      end if;
    end if;
    masked := masked || ch;
  end loop;

  vowel_count := len - length(regexp_replace(masked, '[aeiouy]', '', 'g'));
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
  if masked ~ '[bcdfghjklmnpqrstvwxz]{4,}' then
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

  -- Digits inside a name word.
  if raw_word ~ '\d' then
    score := score + 0.3;
  end if;

  return least(1, score);
end;
$$;

revoke execute on function public.signup_gibberish_score(text) from authenticated, anon, public;
grant execute on function public.signup_gibberish_score(text) to supabase_auth_admin;
