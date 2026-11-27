-- Admin switches for automated marketing email (read by src/lib/email/switches.ts).
-- Both start OFF:
--   tutor_marketing_emails  pauses the tutor engagement/newsletter emails
--   student_speak_emails    holds the new student "speak" sequence until go-ahead
-- Transactional mail is not affected by either.

insert into public.app_settings (category, key, value, value_type, description, is_secret)
select v.category, v.key, v.value, v.value_type, v.description, false
  from (values
    ('features', 'tutor_marketing_emails', 'false', 'boolean',
     'Send tutor engagement/marketing emails (win-back, assign homework, newsletter themes). Booking, reminder and student-request emails always send.'),
    ('features', 'student_speak_emails', 'false', 'boolean',
     'Send the student "speak" sequence (live lessons with tutors, speaking practice with Léon).')
  ) as v(category, key, value, value_type, description)
 where not exists (
   select 1 from public.app_settings s where s.category = v.category and s.key = v.key
 );
