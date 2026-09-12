# Plan — Native live chat + help center

Status: **planned, not started.** Written 2026-09-07.

## Why this doc exists

The groundwork for support was laid in `20260717_roles_support.sql` and then
never finished. What exists today:

| Piece | State |
|---|---|
| `support_tickets` + `ticket_messages` + RLS | **built** |
| `POST /api/support/tickets`, `/api/support/tickets/[id]/reply` | **built, unreachable** — no user-facing UI calls them |
| `/admin/support` inbox + `ticket-reply.tsx` | **built** |
| `digistack` source badge in the admin inbox | **built, renders for a source nothing emits** |
| `/faq` (DB-backed via `getFaqs()` → `site_faqs`) | **built** — a single page, the entire "help center" |
| Live chat widget | **does not exist** |
| Help center | **does not exist** |

The original intent was to embed the sibling Digistack widget — hence the
`digistack` value in the `source` enum and the comment in
`src/app/api/support/tickets/route.ts`. **That is no longer the plan.** Chat is
being built natively in FrancoLink, on top of the tables above.

## Decisions

1. **Native chat**, not the Digistack embed. Same-origin, one auth model, one
   admin inbox, conversations stay in the FrancoLink database.
2. **A real `/help` section**, DB-backed, not an expanded FAQ. It has to serve
   three jobs at once: indexable pages for organic search, self-serve deflection
   before the widget opens, and the retrieval corpus the bot answers from. An
   expanded `/faq` serves only the second, and weakly.
3. **Open to logged-out visitors.** The widget goes on marketing pages too,
   which is where pre-sale questions actually get asked.

## Data model

A chat conversation **is** a ticket with `source = 'chat'`. No parallel
conversation table — that would fork the admin inbox, which is the one piece of
this already working.

### Migration `2026xxxx_support_chat.sql`

```sql
-- Anonymous visitors. user_id is already nullable ("null for anon/embedded").
alter table public.support_tickets
  add column if not exists visitor_token_hash text,
  add column if not exists visitor_meta       jsonb   not null default '{}'::jsonb,
  add column if not exists unread_for_agent   boolean not null default false;

create index if not exists support_tickets_visitor_idx
  on public.support_tickets (visitor_token_hash) where visitor_token_hash is not null;

-- 'bot' joins requester | agent.
-- ticket_messages.sender_role stays free text; the check lives in the API.
```

- `source` gains `'chat'`. Update `ALLOWED_SOURCES` in the tickets route and the
  badge map in `src/app/(admin)/admin/support/page.tsx`.
- `visitor_token_hash` stores a SHA-256 of the visitor token, never the token.
- **No new RLS policies for anonymous access.** Anonymous reads and writes go
  through API routes using the service role, which verify the visitor cookie
  first. Opening RLS to `anon` on a ticket table is how support inboxes leak;
  the existing agent/requester policies stay exactly as they are.

## Identity

- Signed-in: `auth.getUser()`, ticket carries `user_id`. Unchanged from today.
- Logged-out: on first message the server mints a random 32-byte token, sets it
  as an **httpOnly, SameSite=Lax, 90-day cookie** (`fl_support`), and stores
  only its hash. Every later read/write re-derives the hash from the cookie.
  Not `localStorage` — a token readable by any script on the page is a
  conversation any script on the page can read.
- On sign-up/sign-in, if `fl_support` is present, claim the visitor's open
  tickets onto the new `user_id` and clear the cookie. Without this, a visitor
  who asks a pre-sale question and then registers loses the thread.

## API surface

All under `/api/support/chat/`:

| Route | Auth | Purpose |
|---|---|---|
| `POST /start` | anon ok | Create ticket + first message, set cookie, return `{ ticketId }`. Rate limited. |
| `POST /[id]/message` | cookie or session | Append a `requester` message. |
| `GET  /[id]/messages?after=<iso>` | cookie or session | Poll for new messages. |
| `GET  /config` | public | Widget config: hours, greeting, whether an agent is online. |

The existing `POST /api/support/tickets` stays as the "contact support" form
path and keeps its 401 — it is not the chat entry point.

**Abuse controls, required before this ships open to anonymous users:**
- Per-IP rate limit on `/start` (e.g. 5 conversations/hour) and per-ticket limit
  on `/message`.
- Length caps mirroring the existing route (200 subject / 5000 body).
- A honeypot field, plus reuse of the `signup_risk` heuristics already in the
  repo (`20260821_signup_risk.sql`) to auto-flag junk rather than page an agent.

## Transport

**Polling, not Realtime.** Supabase Realtime is used in this repo
(`use-session.ts`, `live-invite-watcher.tsx`) but only for authenticated
subscribers, and anonymous Realtime would require exactly the permissive RLS
this plan avoids. The widget polls `GET /[id]/messages?after=` on a backoff:
3s while the panel is open and the conversation is active, 10s when idle, stop
when the tab is hidden. Cheap, and it works identically signed-in or not.

## Components

```
src/components/support/
  chat-widget.tsx        launcher bubble + panel, mounted from a client boundary
  chat-thread.tsx        message list, optimistic send, "agent is typing" omitted for v1
  chat-composer.tsx      textarea, enter-to-send, length counter
  use-support-chat.ts    hook: start/send/poll, cookie-agnostic (server owns it)
```

Mounted in the root layout behind a route allowlist so it does **not** appear
inside the lesson room (`/room/*`) — a floating bubble over live video is a
real annoyance, and the room already has its own chat.

## Help center

Model, mirroring the existing `site_faqs` pattern so the admin surface is
familiar:

```sql
create table public.help_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, title text not null,
  description text, icon text, display_order int not null default 0
);

create table public.help_articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.help_categories(id) on delete cascade,
  slug text unique not null, title text not null,
  excerpt text, body_md text not null,
  audience text not null default 'student',   -- student | tutor | all
  is_published boolean not null default false,
  display_order int not null default 0,
  updated_at timestamptz not null default now()
);
```

Routes:
- `/help` — categories + search box
- `/help/[category]`
- `/help/[category]/[article]` — `revalidate = 3600`, canonical, `Article`
  schema; ISR matches how `/faq` already works.
- Search: Postgres full-text over `title + excerpt + body_md` for v1. No vector
  search until there is enough content to justify it.

`/faq` stays where it is (it ranks, and the URL is linked externally) but gains
a link into `/help`. Migrate `site_faqs` rows into `help_articles` only if a
question is substantial enough to deserve its own page — otherwise leave it.

## Bot answering

**Explicitly out of scope for v1.** v1 is human chat plus a searchable help
center, with article suggestions surfaced in the composer as the visitor types
(a full-text query against `help_articles`). That alone deflects a large share
of questions and requires no model calls, no embeddings and no hallucination
risk on pricing or refund questions.

v2 adds retrieval-augmented answers over `help_articles` — at which point the
Digistack approach (`chunkText` / `getEmbedding` / pgvector + an HNSW index in
`20260510_chat_knowledge.sql`) is the reference implementation to port, since it
is already proven in production on the sibling product.

## Agent side

Mostly built. What is missing:
- Real-time-ish refresh on `/admin/support` (poll the list every 15s) so an open
  chat is not answered ten minutes late.
- An "online / offline" toggle backed by `app_settings`, read by
  `/api/support/chat/config`. When offline the widget says so up front and
  collects an email instead of implying someone is waiting.
- Notify agents on a new `source='chat'` ticket via the existing `notifyUser()`
  hook in `@/lib/notifications/create`.

## Sequencing

1. Migration + `source='chat'` plumbing + admin badge.
2. Chat API routes with rate limiting and the visitor cookie.
3. Widget components; mount with the room excluded.
4. Ticket claiming on sign-in.
5. Agent online toggle + inbox polling + new-chat notification.
6. Help center tables, admin CRUD, `/help` routes, full-text search.
7. Article suggestions inside the composer.
8. (v2) Retrieval-augmented bot answers.

Steps 1–5 are a shippable live chat. Step 6–7 are a shippable help center. They
are independent and can land in either order.

## Open questions

- Do tutors get the same widget, or a separate queue? `audience` on articles
  anticipates the split; the ticket table currently does not.
- Email fallback when offline — reuse the existing transactional email path, or
  just create the ticket and reply from the inbox? The latter is less code.
- Retention for anonymous conversations that never convert. Ninety days is
  suggested above by the cookie lifetime, but nothing enforces it yet.
