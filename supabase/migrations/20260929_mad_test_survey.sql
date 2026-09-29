-- Mad-testen day-5 survey (ALT-345).
--
-- One row per tester who answered the five questions on
-- altidmad.dk/api/mad-testen/survey (the link in the day-5 survey mail). Only
-- testers can answer: an active altidmad.dk signup with a row in
-- mad_test_optin. The row holds who (public_id, the signup row's own id), when
-- (created_at), under which wording (copy_version, resolves to the text in
-- lib/mad-test-survey.ts) and the answers:
--   days_used    days with Altid Mad in the last week: '0', '1', '2-3', '4+'
--   progress     how far they got: 'plan', 'shopped' (implies a plan), 'none'
--   recommend    0 to 10, how likely they are to recommend Altid Mad
--   worked_best  free text, optional (null when empty), at most 2000 characters
--   fix_first    free text, optional (null when empty), at most 2000 characters
--
-- One answer per person: public_id is the primary key and the page inserts
-- with ON CONFLICT DO NOTHING, so the first answer stays.
--
-- public_id references signup with ON DELETE CASCADE: erasing a signup row
-- (GDPR erasure) removes its answers in the same statement, and an answer can
-- only exist for a real signup.
--
-- Run in the Supabase SQL editor, before the survey mail
-- (send-mad-test-survey.py in altid-dashboard checks that the table exists).
-- Safe to re-run. The checks hold rows to what the page stores (trimmed,
-- never empty, at most 2000 characters), so a row typed into the SQL editor
-- cannot make the page fail for that tester later.

create table if not exists public.mad_test_survey (
  public_id     text        primary key references public.signup (public_id) on delete cascade,
  created_at    timestamptz not null default now(),
  copy_version  text        not null
                constraint mad_test_survey_copy_version_check check (copy_version <> ''),
  days_used     text        not null
                constraint mad_test_survey_days_used_check check (days_used in ('0', '1', '2-3', '4+')),
  progress      text        not null
                constraint mad_test_survey_progress_check check (progress in ('plan', 'shopped', 'none')),
  recommend     smallint    not null
                constraint mad_test_survey_recommend_check check (recommend between 0 and 10),
  worked_best   text
                constraint mad_test_survey_worked_best_check check (length(worked_best) between 1 and 2000
                  and worked_best = btrim(worked_best, E' \t\n\r')),
  fix_first     text
                constraint mad_test_survey_fix_first_check check (length(fix_first) between 1 and 2000
                  and fix_first = btrim(fix_first, E' \t\n\r'))
);

comment on table public.mad_test_survey is
  'Mad-testen day-5 survey answers (ALT-345). Retention: read only for the Mad-testen summary. Delete all rows when the Mad-testen ends.';

alter table public.mad_test_survey enable row level security;
-- No policies: only the service-role key (which bypasses RLS) may read or
-- write. The anon key must never reach this table, so its table privileges go
-- too (Supabase grants them to anon and authenticated by default).
revoke all on public.mad_test_survey from anon, authenticated;
