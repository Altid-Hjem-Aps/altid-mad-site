-- Mad-testen page opens (ALT-345).
--
-- One row per person and page, the first time a real browser showed that
-- person a Mad-testen page from their personal link:
--   optin   the yes-page (altidmad.dk/api/mad-testen): the two-button form, the
--           iPhone route or the Android Google-account step
--   survey  the day-5 survey form (altidmad.dk/api/mad-testen/survey)
-- The row holds who (public_id, the signup row's own id), which page, and when
-- (created_at). Compared with mad_test_optin and mad_test_survey it shows who
-- opened a page and left without answering.
--
-- The browser writes it, not the page's GET: the page sends a beacon to
-- altidmad.dk/api/mad-testen/open when it is shown (lib/mad-test.ts,
-- reportOpen), so a mail scanner that only fetches the link is never counted.
-- The beacon goes out on every open; the page inserts with ON CONFLICT DO
-- NOTHING, so the first time stays.
--
-- public_id references signup with ON DELETE CASCADE: erasing a signup row
-- (GDPR erasure) removes its opens in the same statement, and an open can only
-- exist for a real signup.
--
-- Run in the Supabase SQL editor, before the page that sends the beacon is
-- deployed: until the table exists, every beacon is a logged 500 and that
-- open is lost (the page itself and the answers are not affected).
-- Safe to re-run. A report script outside this repo reads this table by its
-- name and columns: rename nothing.

create table if not exists public.mad_test_page_open (
  public_id   text        not null references public.signup (public_id) on delete cascade,
  page        text        not null
              constraint mad_test_page_open_page_check check (page in ('optin', 'survey')),
  created_at  timestamptz not null default now(),
  constraint mad_test_page_open_pkey primary key (public_id, page)
);

comment on table public.mad_test_page_open is
  'Mad-testen page opens (ALT-345): the first time a real browser showed a person the yes-page (optin) or the survey form (survey). Retention: only needed to see who opened a page without answering. Delete all rows when the Mad-testen ends.';

alter table public.mad_test_page_open enable row level security;
-- No policies: only the service-role key (which bypasses RLS) may read or
-- write. The anon key must never reach this table, so its table privileges go
-- too (Supabase grants them to anon and authenticated by default).
revoke all on public.mad_test_page_open from anon, authenticated;
