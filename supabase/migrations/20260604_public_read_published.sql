-- Allow guests (anon role) to read published tutor lessons, so the public
-- catalogue is visible without logging in. Idempotent.

drop policy if exists "tutor_lessons_read_published_anon" on public.tutor_lessons;
create policy "tutor_lessons_read_published_anon"
  on public.tutor_lessons for select
  to anon
  using (status = 'published');
