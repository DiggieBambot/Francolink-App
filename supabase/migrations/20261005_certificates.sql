-- Certificates of completion: one per student per level, issued only by the
-- server, verifiable by anyone who holds the number.
--
-- The table already existed (created outside the migrations folder) and was
-- written by /api/certificates/issue as the student. That left the rules to
-- whatever RLS happened to be on it -- if a student could insert their own
-- row, they could award themselves any level. This migration states the
-- rules instead of assuming them:
--
--   read    a student reads their own certificates; nobody reads anyone
--           else's through the table
--   write   nobody, except the service role. Issuing goes through
--           /api/certificates/issue, which checks every active lesson in the
--           level is passed and then inserts with the service key.
--   verify  verify_certificate(number) returns one certificate's public face
--           (name, level, date). It powers francolink.net/certificates/<n>,
--           the link students share. Numbers carry 40 random bits, so that
--           page cannot be walked to list everyone who holds one.

create table if not exists public.certificates (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  language           text not null,
  level              text not null,
  course_title       text,
  certificate_number text not null,
  issued_at          timestamptz not null default now(),
  score              int,
  total_xp           int,
  created_at         timestamptz not null default now()
);

-- One certificate per student per level, and numbers are unique. The issue
-- route checks first; these make a double tap or a retry harmless.
create unique index if not exists certificates_one_per_level
  on public.certificates (user_id, language, level);
create unique index if not exists certificates_number_key
  on public.certificates (certificate_number);

alter table public.certificates enable row level security;

-- Replace whatever policies exist with exactly these.
do $$
declare p record;
begin
  for p in select policyname from pg_policies
            where schemaname = 'public' and tablename = 'certificates'
  loop
    execute format('drop policy %I on public.certificates', p.policyname);
  end loop;
end $$;

create policy "students read own certificates" on public.certificates
  for select using (auth.uid() = user_id);

-- The public face of one certificate. Security definer so it can read the
-- holder's name; returns nothing at all for a number that doesn't exist.
create or replace function public.verify_certificate(p_number text)
returns table (
  certificate_number text,
  holder_name        text,
  language           text,
  level              text,
  course_title       text,
  score              int,
  total_xp           int,
  issued_at          timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select c.certificate_number,
         coalesce(nullif(trim(u.name), ''), 'FrancoLink student'),
         c.language, c.level, c.course_title, c.score, c.total_xp, c.issued_at
    from public.certificates c
    join public.users u on u.id = c.user_id
   where c.certificate_number = p_number
   limit 1;
$$;

revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated, service_role;

comment on function public.verify_certificate is
  'Public verification of one certificate by its number, for the shared link.';
