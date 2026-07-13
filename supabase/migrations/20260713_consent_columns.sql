-- Marketing-consent columns on the shared `signup` table (Supabase).
-- Backs the consent captured on both altidmad.dk and altidhjem.dk signup forms.
-- Additive and idempotent: safe to run more than once, existing rows get NULL
-- (= no documented consent, which the send-gate treats as "do not send").
--
-- Run once in the Supabase SQL Editor (Project → SQL Editor → New query → Run).
-- Until this runs, mirrorSignup() strips these fields via its column-missing
-- fallback, so signups keep working but consent is NOT stored.

alter table public.signup
  add column if not exists marketing_consent_mad   boolean,
  add column if not exists marketing_consent_group boolean,
  add column if not exists consent_version         text,
  add column if not exists consent_at              timestamptz;

comment on column public.signup.marketing_consent_mad   is 'Active opt-in to Altid Mad marketing (Forbrugerombudsmanden/GDPR). NULL = no documented consent.';
comment on column public.signup.marketing_consent_group is 'Active opt-in to Altid Hjem/Forsikring/Mobil marketing. NULL = no documented consent.';
comment on column public.signup.consent_version         is 'Wording version accepted (lib/copy.ts CONSENT_VERSION), e.g. 2026-07-13.';
comment on column public.signup.consent_at              is 'Timestamp the consent was given (= signup created_at).';
