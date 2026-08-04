-- Realtime for the in-app notification inbox.
--
-- Lets the browser subscribe to INSERTs on public.notifications for the signed-in
-- user, so a live-class invite pops on the student's dashboard the instant the
-- tutor opens the room instead of on the next poll.
--
-- Realtime honours RLS on postgres_changes: the existing "notifications_own_read"
-- SELECT policy (user_id = auth.uid()) is what confines each subscriber to their
-- own rows. No new policy is needed — but the table MUST have a replica identity
-- for Realtime to evaluate that policy against the row.

alter table public.notifications replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;
