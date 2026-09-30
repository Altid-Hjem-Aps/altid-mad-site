-- Mad-testen day-5 survey (ALT-345).
--
-- One row per tester who answered the five questions on
-- altidmad.dk/api/mad-testen/survey (the link in the day-5 survey mail). Only
-- testers can answer: an active altidmad.dk signup with a row in
-- mad_test_optin. The row holds who (public_id, the signup row's own id), when
-- (created_at), under which wording (copy_version, resolves to the text in
-- lib/mad-test-survey.ts) and the answers:
--   plan_fit        did the meal plan fit the household's needs: 'ja', 'delvist', 'nej'
--   plan_fit_note   why, free text, optional
--   easy_to_use     was Altid Mad easy to use: 'ja', 'delvist', 'nej'
--   easy_note       what was hard or unclear, free text, optional
--   missing         what was missing in Altid Mad, free text, optional
--   other_feedback  anything else we should know, free text, optional
--   panel           true = join the user panel: invite this person to future tests
-- Free text is null when empty, otherwise trimmed and at most 2000 characters.
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
  public_id       text        primary key references public.signup (public_id) on delete cascade,
  created_at      timestamptz not null default now(),
  copy_version    text        not null
                  constraint mad_test_survey_copy_version_check check (copy_version <> ''),
  plan_fit        text        not null
                  constraint mad_test_survey_plan_fit_check check (plan_fit in ('ja', 'delvist', 'nej')),
  plan_fit_note   text
                  constraint mad_test_survey_plan_fit_note_check check (length(plan_fit_note) between 1 and 2000
                    and plan_fit_note = btrim(plan_fit_note, E' \t\n\r')),
  easy_to_use     text        not null
                  constraint mad_test_survey_easy_to_use_check check (easy_to_use in ('ja', 'delvist', 'nej')),
  easy_note       text
                  constraint mad_test_survey_easy_note_check check (length(easy_note) between 1 and 2000
                    and easy_note = btrim(easy_note, E' \t\n\r')),
  missing         text
                  constraint mad_test_survey_missing_check check (length(missing) between 1 and 2000
                    and missing = btrim(missing, E' \t\n\r')),
  other_feedback  text
                  constraint mad_test_survey_other_feedback_check check (length(other_feedback) between 1 and 2000
                    and other_feedback = btrim(other_feedback, E' \t\n\r')),
  panel           boolean     not null
);

comment on table public.mad_test_survey is
  'Mad-testen day-5 survey answers (ALT-345). panel = true means the person asked to be invited to future tests. Retention: read only for the Mad-testen summary. Delete all rows when the Mad-testen ends.';

alter table public.mad_test_survey enable row level security;
-- No policies: only the service-role key (which bypasses RLS) may read or
-- write. The anon key must never reach this table, so its table privileges go
-- too (Supabase grants them to anon and authenticated by default).
revoke all on public.mad_test_survey from anon, authenticated;
