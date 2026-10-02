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
-- Free text is null when empty, otherwise at most 2000 characters, with no
-- space, tab or line break at either end and line breaks stored as \n (never \r).
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
-- Safe to re-run, and a re-run brings a live table up to this file: the four
-- text checks are dropped and added again below, in one statement, so the
-- table either gets the current checks or (when a stored row breaks them)
-- keeps its old ones and the run fails, naming the check.
--
-- What the checks guarantee: a row the table accepts never makes the page
-- fail for that tester. The page reads a text answer back as whatever string
-- is stored and checks only plan_fit, easy_to_use and panel, which the checks
-- and not null below already hold.
-- What they do not guarantee: that a row typed into the SQL editor or
-- imported looks exactly like one the page wrote. The page trims only spaces,
-- tabs and line breaks (the btrim set below), so other invisible characters
-- at either end (a no-break space, a byte order mark, a zero-width space) are
-- kept and stored as typed, and the checks let them through too.

create table if not exists public.mad_test_survey (
  public_id       text        primary key references public.signup (public_id) on delete cascade,
  created_at      timestamptz not null default now(),
  copy_version    text        not null
                  constraint mad_test_survey_copy_version_check check (copy_version <> ''),
  plan_fit        text        not null
                  constraint mad_test_survey_plan_fit_check check (plan_fit in ('ja', 'delvist', 'nej')),
  plan_fit_note   text,
  easy_to_use     text        not null
                  constraint mad_test_survey_easy_to_use_check check (easy_to_use in ('ja', 'delvist', 'nej')),
  easy_note       text,
  missing         text,
  other_feedback  text,
  panel           boolean     not null
);

-- The four text checks (see the header). Kept out of the create table so a
-- re-run replaces them on the live table. position(E'\r' in x) = 0 came after
-- the first run (1/10): the page has always stored line breaks as \n, and now
-- the table refuses a \r inside an answer too, as the page would.
alter table public.mad_test_survey
  drop constraint if exists mad_test_survey_plan_fit_note_check,
  drop constraint if exists mad_test_survey_easy_note_check,
  drop constraint if exists mad_test_survey_missing_check,
  drop constraint if exists mad_test_survey_other_feedback_check,
  add constraint mad_test_survey_plan_fit_note_check check (length(plan_fit_note) between 1 and 2000
    and plan_fit_note = btrim(plan_fit_note, E' \t\n\r') and position(E'\r' in plan_fit_note) = 0),
  add constraint mad_test_survey_easy_note_check check (length(easy_note) between 1 and 2000
    and easy_note = btrim(easy_note, E' \t\n\r') and position(E'\r' in easy_note) = 0),
  add constraint mad_test_survey_missing_check check (length(missing) between 1 and 2000
    and missing = btrim(missing, E' \t\n\r') and position(E'\r' in missing) = 0),
  add constraint mad_test_survey_other_feedback_check check (length(other_feedback) between 1 and 2000
    and other_feedback = btrim(other_feedback, E' \t\n\r') and position(E'\r' in other_feedback) = 0);

comment on table public.mad_test_survey is
  'Mad-testen day-5 survey answers (ALT-345). panel = true means the person asked to be invited to future tests. Retention: read only for the Mad-testen summary. Delete all rows when the Mad-testen ends.';

alter table public.mad_test_survey enable row level security;
-- No policies: only the service-role key (which bypasses RLS) may read or
-- write. The anon key must never reach this table, so its table privileges go
-- too (Supabase grants them to anon and authenticated by default).
revoke all on public.mad_test_survey from anon, authenticated;
