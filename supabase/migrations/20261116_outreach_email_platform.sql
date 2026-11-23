-- Personal cold email becomes a logged outreach channel (docs/PLAN-business.md §5).
alter table public.outreach_reports
  drop constraint if exists outreach_reports_platform_check;
alter table public.outreach_reports
  add constraint outreach_reports_platform_check
  check (platform in ('facebook','reddit','instagram','tiktok',
                      'youtube','linkedin','email','forum','other'));
