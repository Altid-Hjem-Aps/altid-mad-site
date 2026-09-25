-- Mad-testen yes-list (ALT-345).
--
-- One row per person who answered on altidmad.dk/api/mad-testen, with one of
-- two buttons: "Ja, jeg har en iPhone" (device 'iphone') or "Ja, men jeg har
-- Android" (device 'android'). The row records only the answer: who (public_id,
-- the signup row's own id), which device, when (created_at) and under which
-- screen wording (copy_version, resolves to the text in lib/mad-test.ts).
--
-- The test runs on iPhone only: the export picks the 'iphone' rows. Android
-- answers stay on the waitlist.
--
-- public_id references signup with ON DELETE CASCADE: erasing a signup row
-- (GDPR erasure) removes its yes-row in the same statement, and a yes can only
-- exist for a real signup.
--
-- Run in the Supabase SQL editor. Safe to re-run, also over the earlier
-- version of this file that created the table without the device column
-- (pushed 25/9, never run anywhere): the statements after the create bring such
-- a table up to this shape.

create table if not exists public.mad_test_optin (
  public_id     text        primary key references public.signup (public_id) on delete cascade,
  created_at    timestamptz not null default now(),
  copy_version  text        not null,
  device        text        not null
                constraint mad_test_optin_device_check check (device in ('iphone', 'android'))
);

-- A table created by the earlier version of this file has no device column.
-- It never held rows, so set not null cannot fail on existing data.
alter table public.mad_test_optin add column if not exists device text;
alter table public.mad_test_optin alter column device set not null;
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'mad_test_optin_device_check'
       and conrelid = 'public.mad_test_optin'::regclass
  ) then
    alter table public.mad_test_optin
      add constraint mad_test_optin_device_check check (device in ('iphone', 'android'));
  end if;
end $$;

comment on table public.mad_test_optin is
  'Mad-testen answers (ALT-345). Retention: only needed to pick testers and send their login mail. Delete all rows when the Mad-testen ends.';

alter table public.mad_test_optin enable row level security;
-- No policies: only the service-role key (which bypasses RLS) may read or
-- write. The anon key must never reach this table, so its table privileges go
-- too (Supabase grants them to anon and authenticated by default).
revoke all on public.mad_test_optin from anon, authenticated;
