-- Rotate every tutor invite code, because the old ones are public.
--
-- The public directory built its "Book" button as /join/<tutor_invite_code>
-- (src/app/site/tutors/[slug]/page.tsx), and getPublicTutorSlugs() feeds those
-- profile pages into our sitemap. So every tutor's invite code has been served
-- on a crawlable, indexable page: harvesting them needed no exploit, just a
-- sitemap fetch. That is the door the bot signups walked through.
--
-- The leak is closed in application code, but a bearer credential that has been
-- published stays compromised until it is replaced. Anyone who scraped the
-- directory still holds a working code for every tutor, and search engine
-- caches will serve them for a while yet.
--
-- Codes are also re-minted here with gen_random_bytes rather than the old
-- Math.random(), whose PRNG state is recoverable from a few observed outputs —
-- so old codes were derivable from each other even without the scrape.
--
-- COST OF RUNNING THIS: every invite link a tutor has already shared stops
-- working. Tutors must re-share from their dashboard. That is the point; tell
-- them before you run it. Students already connected are unaffected — the
-- tutor_students rows are untouched.

-- Base32 without I/O/0/1: these codes get read aloud and retyped.
create or replace function public.gen_invite_code()
returns text
language plpgsql
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  out text := '';
  i int;
begin
  for i in 1..10 loop
    out := out || substr(alphabet, (get_byte(gen_random_bytes(1), 0) % 32) + 1, 1);
  end loop;
  return out;
end;
$$;

do $$
declare
  r record;
  candidate text;
  tries int;
begin
  for r in select id from public.users where tutor_invite_code is not null loop
    tries := 0;
    loop
      candidate := public.gen_invite_code();
      tries := tries + 1;
      exit when not exists (select 1 from public.users where tutor_invite_code = candidate);
      if tries > 20 then
        raise exception 'could not find a free invite code for %', r.id;
      end if;
    end loop;
    update public.users set tutor_invite_code = candidate, updated_at = now() where id = r.id;
  end loop;
end;
$$;

-- Codes are a credential: no client role may read them. The app reads them
-- only through the service role, in lib/auth/join-target.ts.
revoke execute on function public.gen_invite_code() from authenticated, anon, public;
