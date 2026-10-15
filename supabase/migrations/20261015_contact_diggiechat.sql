-- Contact-form messages relayed to DiggieChat.
--
-- Each website contact message opens a DiggieChat conversation so the bot can
-- answer it and the team can see and take over from the DiggieChat inbox. The
-- owner's inbox replies come back by webhook and are matched on this id.

alter table public.contact_messages
  add column if not exists diggiechat_conversation_id text;

create unique index if not exists contact_messages_diggiechat_conv_idx
  on public.contact_messages (diggiechat_conversation_id)
  where diggiechat_conversation_id is not null;
