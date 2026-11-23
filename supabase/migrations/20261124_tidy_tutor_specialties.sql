-- Tidy tutor specialties onto the fixed list (src/lib/site/specialties.ts).
--
-- Tutors could type their own specialties, which left duplicates that differ
-- only in case ("conversation" next to "Conversation") and one-offs like
-- "TCF Canada". The profile form and API now only accept the fixed list; this
-- brings existing profiles in line so the directory's goal matching and the
-- "Focus" filter see clean values.
--
-- What it does, per profile:
--   - maps every value onto its canonical spelling, case-insensitively
--   - "TCF Canada" becomes "TCF" (same exam)
--   - drops anything not on the list (today: "Adult Learners")
--   - removes duplicates, keeping the original order
-- Safe to run more than once. Only tutor_public_profiles.specialties changes.

with canon(lower_name, name) as (
  values
    ('delf', 'DELF'),
    ('dalf', 'DALF'),
    ('tef', 'TEF'),
    ('tcf', 'TCF'),
    ('tefaq', 'TEFAQ'),
    ('exam prep', 'Exam prep'),
    ('toeic', 'TOEIC'),
    ('ielts', 'IELTS'),
    ('toefl', 'TOEFL'),
    ('conversation', 'Conversation'),
    ('pronunciation', 'Pronunciation'),
    ('travel french', 'Travel French'),
    ('french for beginners', 'French for beginners'),
    ('english for beginners', 'English for beginners'),
    ('grammar', 'Grammar'),
    ('writing and essays', 'Writing and essays'),
    ('reading comprehension', 'Reading comprehension'),
    ('listening comprehension', 'Listening comprehension'),
    ('business french', 'Business French'),
    ('business english', 'Business English'),
    ('interview preparation', 'Interview preparation'),
    ('medical french', 'Medical French'),
    ('legal french', 'Legal French'),
    ('immigration french', 'Immigration French'),
    ('kids and teens', 'Kids and teens'),
    ('academic french', 'Academic French'),
    ('homework help', 'Homework help'),
    ('tcf canada', 'TCF')
),
cleaned as (
  select p.user_id,
         coalesce(
           (select array_agg(c.name order by first_pos)
              from (
                select c.name, min(t.pos) as first_pos
                  from unnest(p.specialties) with ordinality as t(val, pos)
                  join canon c on c.lower_name = lower(trim(t.val))
                 group by c.name
              ) c),
           '{}'::text[]
         ) as specialties
    from public.tutor_public_profiles p
   where p.specialties is not null
)
update public.tutor_public_profiles p
   set specialties = cleaned.specialties
  from cleaned
 where cleaned.user_id = p.user_id
   and p.specialties is distinct from cleaned.specialties;

-- Preview without changing anything: run only the "with … cleaned" part with
--   select p.slug, p.specialties as before, c.specialties as after
--     from public.tutor_public_profiles p join cleaned c using (user_id)
--    where p.specialties is distinct from c.specialties;
