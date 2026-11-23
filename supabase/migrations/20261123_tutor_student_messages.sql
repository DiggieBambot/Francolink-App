-- ============================================
-- Migration: 1:1 tutor <-> student messaging (/messages)
--
-- One conversation per (tutor, student) pair, only for pairs with an ACTIVE
-- tutor_students connection. Only the two participants can read it, and only
-- while the connection is active can either of them write to it. Past
-- messages stay readable to both after a connection ends.
--
-- The app writes through its API routes (service role, which authorizes the
-- caller first); the RLS below is what protects the tables from everything
-- else, and is what lets the browser subscribe to new messages via realtime.
--
-- Safe to re-run.
-- ============================================

-- Guard: stop with a clear error, rather than silently skipping a
-- `create table if not exists`, if an unrelated table already uses one of
-- these names.
do $$
begin
  if to_regclass('public.conversations') is not null and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'conversations' and column_name = 'tutor_last_read_at'
  ) then
    raise exception 'public.conversations already exists with a different shape; not touching it';
  end if;
  if to_regclass('public.messages') is not null and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'messages' and column_name = 'conversation_id'
  ) then
    raise exception 'public.messages already exists with a different shape; not touching it';
  end if;
end $$;

create table if not exists public.conversations (
  id                    uuid primary key default gen_random_uuid(),
  tutor_id              uuid not null references public.users(id) on delete cascade,
  student_id            uuid not null references public.users(id) on delete cascade,
  created_at            timestamptz not null default now(),
  last_message_at       timestamptz,
  last_message_preview  text,
  last_sender_id        uuid references public.users(id) on delete set null,
  -- Read markers: a message is unread for a participant when it is newer than
  -- their marker and they didn't send it.
  tutor_last_read_at    timestamptz,
  student_last_read_at  timestamptz,
  -- Email throttle: when we last emailed each side about this conversation, so
  -- a burst of messages sends one email, not one per message.
  tutor_emailed_at      timestamptz,
  student_emailed_at    timestamptz,
  constraint conversations_pair_unique unique (tutor_id, student_id),
  constraint conversations_not_self check (tutor_id <> student_id)
);

create index if not exists conversations_tutor_idx
  on public.conversations (tutor_id, last_message_at desc);
create index if not exists conversations_student_idx
  on public.conversations (student_id, last_message_at desc);

create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  sender_id        uuid not null references public.users(id) on delete cascade,
  body             text not null,
  created_at       timestamptz not null default now(),
  constraint messages_body_length check (char_length(btrim(body)) between 1 and 4000)
);

create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at desc);

-- ── Helpers ──────────────────────────────────────────────────────────────────
-- security definer so policies can look at conversations/tutor_students
-- without recursing through their own RLS.

create or replace function public.is_conversation_participant(conv_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = conv_id
      and (c.tutor_id = auth.uid() or c.student_id = auth.uid())
  );
$$;

create or replace function public.conversation_is_active(conv_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.conversations c
    join public.tutor_students ts
      on ts.tutor_id = c.tutor_id
     and ts.student_id = c.student_id
     and ts.status = 'active'
    where c.id = conv_id
  );
$$;

revoke all on function public.is_conversation_participant(uuid) from public;
revoke all on function public.conversation_is_active(uuid) from public;
grant execute on function public.is_conversation_participant(uuid) to authenticated;
grant execute on function public.conversation_is_active(uuid) to authenticated;

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

drop policy if exists "conversations_participants_read" on public.conversations;
create policy "conversations_participants_read"
  on public.conversations for select
  to authenticated
  using (tutor_id = auth.uid() or student_id = auth.uid());

-- Either side may open the conversation, only for an active connection.
drop policy if exists "conversations_participants_insert" on public.conversations;
create policy "conversations_participants_insert"
  on public.conversations for insert
  to authenticated
  with check (
    (tutor_id = auth.uid() or student_id = auth.uid())
    and exists (
      select 1 from public.tutor_students ts
      where ts.tutor_id = conversations.tutor_id
        and ts.student_id = conversations.student_id
        and ts.status = 'active'
    )
  );

-- No update policy: read markers, the last-message summary and the email
-- throttle are maintained server-side, so a user can't rewrite the pair.
drop policy if exists "conversations_participants_update" on public.conversations;

drop policy if exists "messages_participants_read" on public.messages;
create policy "messages_participants_read"
  on public.messages for select
  to authenticated
  using (public.is_conversation_participant(conversation_id));

drop policy if exists "messages_participants_insert" on public.messages;
create policy "messages_participants_insert"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_conversation_participant(conversation_id)
    and public.conversation_is_active(conversation_id)
  );

-- No update/delete policies: messages are immutable for users.

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- Lets an open thread receive new messages instantly (RLS still applies to
-- what each subscriber receives). The app falls back to polling without it.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
     ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end $$;

-- Check it worked (expect 2 rows: conversations, messages):
--   select table_name from information_schema.tables
--   where table_schema = 'public' and table_name in ('conversations', 'messages');

-- Rollback:
--   alter publication supabase_realtime drop table public.messages;
--   drop table if exists public.messages cascade;
--   drop table if exists public.conversations cascade;
--   drop function if exists public.is_conversation_participant(uuid);
--   drop function if exists public.conversation_is_active(uuid);
