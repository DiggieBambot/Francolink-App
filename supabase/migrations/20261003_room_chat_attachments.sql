-- Media in live-class chat: an image or file can ride along with (or instead
-- of) a text message. The file itself lives in the public `assets` bucket under
-- room-chat/<session>/; the row keeps only the pointer.

alter table public.tutor_lesson_messages
  add column if not exists attachment_url  text,
  add column if not exists attachment_name text,
  add column if not exists attachment_type text;
