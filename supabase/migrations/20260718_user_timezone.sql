-- ============================================
-- Migration: capture user timezone for locally-timed emails
--
-- The engagement campaign sends at each user's LOCAL time (Tue/Thu/Sun ~10am).
-- The browser reports its IANA timezone (e.g. "America/New_York") on the
-- activity ping; we store the latest here. Users we've never seen fall back to
-- UTC at send time.
-- ============================================

alter table public.users add column if not exists timezone text;

-- Rollback:
--   alter table public.users drop column if exists timezone;
