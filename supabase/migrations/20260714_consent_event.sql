-- Append-only history of every consent change.
--
-- Why: the signup row holds only the CURRENT state, and it has one
-- consent_version / consent_at pair shared by BOTH consent flags. So recording a
-- later Mad consent overwrites the wording-version and timestamp that documented
-- an earlier group consent. The row therefore cannot answer the only question a
-- regulator actually asks: "did you hold this person's consent for this brand at
-- the moment you sent that mail?"
--
-- This table can. Each row is one change: what the flags became, under which
-- exact wording, when, and how ownership of the address was proven.

create table if not exists public.consent_event (
  id                       bigserial primary key,
  public_id                uuid        not null,
  -- How ownership of the address was proven for THIS change:
  --   double-opt-in-email  clicked a confirmation link we mailed to the address
  --   preference-centre    used the tokenised link in a mail we sent them
  --   unsubscribe-all      withdrew everything from that same link
  method                   text        not null,
  -- The exact wording accepted, e.g. '2026-07-14.2-mad'. Not a free-text label:
  -- it resolves to the verbatim text in lib/copy.ts.
  consent_version          text        not null,
  -- The state AFTER the change, per brand — never the delta. A regulator reads
  -- the latest row to answer "did you hold this consent when you sent that mail?"
  -- A delta row would answer it wrong for anyone who already held one flag.
  marketing_consent_mad    boolean     not null,
  marketing_consent_group  boolean     not null,
  -- Only for the double-opt-in path: the confirmation token's identity. The
  -- unique index below is what makes a confirmation SINGLE-USE. Without it the
  -- emailed link stays redeemable for its whole 7-day life, so a forwarded mail,
  -- a scanner's log, a shared browser or the back button could re-grant consent
  -- the person had since revoked in the preference centre.
  token_id                 text,
  created_at               timestamptz not null default now()
);

create unique index if not exists consent_event_token_id_key
  on public.consent_event (token_id) where token_id is not null;

create index if not exists consent_event_public_id_idx
  on public.consent_event (public_id, created_at desc);

-- Append-only for real, not just by convention. The app writes with the
-- service-role key, which could otherwise rewrite or delete its own audit trail —
-- and an "immutable" log that the writer can edit is not evidence of anything.
create or replace function public.consent_event_is_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'consent_event is append-only: % is not permitted', tg_op;
end;
$$;

drop trigger if exists consent_event_no_update on public.consent_event;
create trigger consent_event_no_update
  before update or delete on public.consent_event
  for each row execute function public.consent_event_is_append_only();

-- A row-level trigger does not fire on TRUNCATE, so without this the writer could
-- empty its own audit trail in one statement.
drop trigger if exists consent_event_no_truncate on public.consent_event;
create trigger consent_event_no_truncate
  before truncate on public.consent_event
  for each statement execute function public.consent_event_is_append_only();

-- Honest limit: a service-role holder is still DDL-omnipotent (it can DROP the
-- trigger). Real tamper-evidence needs a separate role or a replication sink.
-- These triggers stop accidental and casual rewrites, not a determined insider.

alter table public.consent_event enable row level security;
-- No policies: only the service-role key (which bypasses RLS) may insert. The
-- anon key must never reach this table.
