-- Applications submitted from inside the app by someone who already has an
-- account — an existing tutor asking to become a FrancoLink tutor.
--
-- This is a different case from the public /teach form, where the applicant is
-- a stranger with no account. Here the account exists, so accepting must
-- promote it rather than send an invite to a fresh one.
--
-- `created_user_id` already means "the account this application produced".
-- Reusing it for the applicant would make every in-app application look
-- already-accepted, so the applicant gets their own column.

alter table public.tutor_applications
  add column if not exists applicant_user_id uuid
    references public.users(id) on delete set null;

comment on column public.tutor_applications.applicant_user_id is
  'Set when the application came from a signed-in user. Accepting one of these '
  'promotes the existing account instead of inviting a new one.';

create index if not exists tutor_applications_applicant_idx
  on public.tutor_applications (applicant_user_id)
  where applicant_user_id is not null;

-- One open application per account, mirroring the per-email rule. Someone who
-- was rejected may apply again; someone still waiting may not spam us.
create unique index if not exists tutor_applications_one_open_per_user
  on public.tutor_applications (applicant_user_id)
  where applicant_user_id is not null
    and status in ('new', 'reviewing', 'interviewing');

-- Signed-in applicants may read back their own application, so the app can
-- show them "we're reviewing this" instead of an empty form. Everything else
-- about applications stays service-role only.
drop policy if exists "applicant reads own application" on public.tutor_applications;
create policy "applicant reads own application"
  on public.tutor_applications for select
  using (auth.uid() = applicant_user_id);
