-- Quarantine for chat attachments.
--
-- A file sent in class lands HERE first: a private bucket nobody can read, not
-- even with the object's URL. The server inspects and rebuilds it
-- (src/lib/storage/sanitize-upload.ts) and only the cleaned copy is published
-- to `assets/room-chat/`. The quarantined original is deleted either way.
--
-- No storage policies on purpose: the browser writes only through a one-off
-- signed upload URL the server issues, and only the service role reads.
-- The size cap is enforced by storage itself, so a signed URL cannot be used
-- to park something larger than the 10 MB the app promises.

insert into storage.buckets (id, name, public, file_size_limit)
values ('room-chat-incoming', 'room-chat-incoming', false, 10485760)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit;
