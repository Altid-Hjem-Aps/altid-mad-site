-- Atomic redemption of a double opt-in confirmation token.
--
-- Why one function instead of the app's previous three statements (lookup,
-- evidence insert, flag merge): a failure between insert and merge left consent
-- recorded-but-not-applied — the audit table said "granted" while the signup
-- row's flags stayed false, so the person had consented but would never receive
-- mails. And a withdrawal landing between the app's eligibility check and its
-- flag merge was silently overwritten. One transaction closes both holes: the
-- row lock serializes redemption against withdrawal, and evidence + applied
-- state commit together or not at all.
--
-- Outcomes (typed, replacing message-string matching on 23505 in the app):
--   'applied'       consent written, evidence row inserted
--   'already_used'  this token was redeemed before (unique index on token_id)
--   'ineligible'    row missing, unsubscribed, or the token grants nothing
--
-- Rollback: DROP FUNCTION public.redeem_consent_token(text, text, boolean, boolean, text);
-- Only safe if every app deploy that calls it has been reverted first — the
-- function is additive and harmless to leave in place otherwise.
--
-- p_public_id is TEXT, not uuid: signup.public_id is a text column (verified
-- against production 4 Aug — a uuid parameter fails the row lookup with
-- "operator does not exist: text = uuid"). Only consent_event.public_id is
-- uuid, hence the explicit cast at the insert below.
create or replace function public.redeem_consent_token(
  p_public_id text,
  p_token_id  text,
  p_mad       boolean,
  p_group     boolean,
  p_version   text
) returns text
language plpgsql
set search_path = public
as $$
declare
  v_row        public.signup%rowtype;
  v_mad        boolean;
  v_group      boolean;
  v_constraint text;
begin
  -- A grants-nothing event row must be impossible even if an app-side
  -- pre-check regresses.
  if p_token_id is null or length(p_token_id) = 0
     or not (coalesce(p_mad, false) or coalesce(p_group, false)) then
    return 'ineligible';
  end if;

  -- FOR UPDATE: a concurrent withdrawal (preference centre / unsubscribe runs a
  -- plain UPDATE on this row) serializes against this transaction, so it can
  -- never be silently overwritten by the merge below.
  select * into v_row
    from public.signup
   where public_id = p_public_id
     for update;

  -- NULL-safe: unsubscribed is nullable and NULL means "never unsubscribed".
  if not found or v_row.unsubscribed is true then
    return 'ineligible';
  end if;

  -- OR-merge, never a downgrade: a re-consent is not a withdrawal.
  v_mad   := coalesce(v_row.marketing_consent_mad, false)   or coalesce(p_mad, false);
  v_group := coalesce(v_row.marketing_consent_group, false) or coalesce(p_group, false);

  -- Evidence first, in the same transaction as the flags. The exception (not
  -- ON CONFLICT) is deliberate: the unique index on token_id is PARTIAL
  -- (WHERE token_id IS NOT NULL), and a plain ON CONFLICT (token_id) target
  -- would not match it. Do not "simplify" this into ON CONFLICT.
  begin
    insert into public.consent_event
      (public_id, method, consent_version, marketing_consent_mad, marketing_consent_group, token_id)
    values
      (p_public_id::uuid, 'double-opt-in-email', p_version, v_mad, v_group, p_token_id);
  exception when unique_violation then
    -- Only the token index means "replayed". Any OTHER uniqueness failure
    -- (e.g. a desynced id sequence after a manual import) must fail loudly:
    -- mapping it to 'already_used' would tell the user they are confirmed
    -- while neither evidence nor flags were written.
    get stacked diagnostics v_constraint = constraint_name;
    if v_constraint = 'consent_event_token_id_key' then
      return 'already_used';
    end if;
    raise;
  end;

  update public.signup
     set marketing_consent_mad   = v_mad,
         marketing_consent_group = v_group,
         consent_version         = p_version,
         consent_at              = now()
   where public_id = p_public_id;

  return 'applied';
end;
$$;

-- Functions are EXECUTE-able by PUBLIC by default, and public_id values double
-- as public referral codes — an anon-key caller must not be able to mint
-- consent for arbitrary rows. Only the service role (which the three sites'
-- servers use) may call this.
revoke execute on function public.redeem_consent_token(text, text, boolean, boolean, text)
  from public, anon, authenticated;
grant execute on function public.redeem_consent_token(text, text, boolean, boolean, text)
  to service_role;
