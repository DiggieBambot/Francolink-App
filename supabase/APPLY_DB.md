# Apply the FrancoLink lesson + session schema

You need to run the two migrations once against your Supabase project. The CLI
isn't linked in this repo, so we paste the SQL into the dashboard.

## 1. Open the SQL Editor

1. Go to https://supabase.com/dashboard
2. Pick the FrancoLink project (URL host: `biwacllbpdxzdxtmqtpw.supabase.co`)
3. Sidebar → **SQL Editor** → **+ New query**

## 2. Paste & run

Open [`supabase/migrations/COMBINED.sql`](./migrations/COMBINED.sql) in your
editor, copy the whole thing, paste into the SQL Editor, click **Run**.

Should report `Success. No rows returned.`

## 3. Sanity check

In the SQL Editor, run:

```sql
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('tutor_lessons', 'tutor_lesson_sessions', 'tutor_lesson_highlights')
order by table_name;
```

Expect 3 rows.

Then:

```sql
select status, count(*) from public.tutor_lessons group by status;
```

Empty result is fine — we haven't imported any lessons yet.

## 4. Import your first lesson

```bash
cd /Users/pc/Documents/Projects/francolink
node scripts/convert-lesson-doc.mjs 1T3i0baTLc2DkJBsuTnpYYE1op02i0rvT
```

Then visit `/admin/tutor-lessons` while logged in as an admin user. The row
should appear under **Review**.

## 5. Test the live room

From the tutor dashboard, create a session (`/tutor/sessions/new`), pick a
student + a published lesson, and you get a `/room/<id>` link. Open it in two
browsers logged in as each side.

## Rollback (if needed)

```sql
drop table if exists public.tutor_lesson_highlights cascade;
drop table if exists public.tutor_lesson_sessions cascade;
drop table if exists public.tutor_lessons cascade;
drop type if exists tutor_lesson_session_status;
drop type if exists tutor_lesson_status;
drop function if exists public.tutor_lessons_set_updated_at();
```
