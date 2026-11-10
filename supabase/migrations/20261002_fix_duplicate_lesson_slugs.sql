-- Two French A1 lessons shared the slug "family-members" (unit 2 and unit 6),
-- so /learn/french/a1/family-members could not resolve to a single lesson.
-- Keep the unit 2 lesson on the original slug and rename the unit 6 one.
update lessons
set slug = 'family-members-relationships'
where id = '5b3a7095-83cd-470b-b778-18fd29e2b037'
  and slug = 'family-members';
