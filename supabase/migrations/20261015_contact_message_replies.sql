-- Keep the team's reply on a website contact message, so the Support inbox
-- shows what was sent and when. Replies are sent from Admin → Support →
-- Website messages (email + notification bell).

alter table public.contact_messages
  add column if not exists last_reply  text,
  add column if not exists replied_at  timestamptz,
  add column if not exists replied_by  uuid references public.users(id) on delete set null;
