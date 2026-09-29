import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// The survey table holds what testers answered on day 5. It must be reachable
// only with the service-role key, vanish with its signup row (erasure), accept
// only the values the page can send, and carry no callable code.
const sql = readFileSync(
  path.resolve(__dirname, '../supabase/migrations/20260929_mad_test_survey.sql'),
  'utf8',
)
// Comments explain intent in prose; only the statements count.
const statements = sql
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')
  .toLowerCase()

describe('20260929_mad_test_survey migration', () => {
  it('creates the table idempotently with the eight columns', () => {
    expect(statements).toContain('create table if not exists public.mad_test_survey')
    expect(statements).toMatch(
      /public_id\s+text\s+primary key references public\.signup \(public_id\) on delete cascade,/,
    )
    expect(statements).toMatch(/created_at\s+timestamptz\s+not null default now\(\),/)
    expect(statements).toMatch(/copy_version\s+text\s+not null\s+constraint mad_test_survey_copy_version_check check \(copy_version <> ''\),/)
    expect(statements).toMatch(
      /days_used\s+text\s+not null\s+constraint mad_test_survey_days_used_check check \(days_used in \('0', '1', '2-3', '4\+'\)\),/,
    )
    expect(statements).toMatch(
      /progress\s+text\s+not null\s+constraint mad_test_survey_progress_check check \(progress in \('plan', 'shopped', 'none'\)\),/,
    )
    expect(statements).toMatch(
      /recommend\s+smallint\s+not null\s+constraint mad_test_survey_recommend_check check \(recommend between 0 and 10\),/,
    )
    expect(statements).toMatch(
      /worked_best\s+text\s+constraint mad_test_survey_worked_best_check check \(length\(worked_best\) between 1 and 2000\s+and worked_best = btrim\(worked_best, e' \\t\\n\\r'\)\),/,
    )
    expect(statements).toMatch(
      /fix_first\s+text\s+constraint mad_test_survey_fix_first_check check \(length\(fix_first\) between 1 and 2000\s+and fix_first = btrim\(fix_first, e' \\t\\n\\r'\)\)\s*\);/,
    )
  })

  it('the two text answers may be null (optional questions); the rest may not', () => {
    const body = statements.slice(statements.indexOf('create table'), statements.indexOf(');'))
    // created_at, copy_version and the three required answers; public_id is the primary key.
    expect(body.match(/not null/g)).toHaveLength(5)
    expect(body).not.toMatch(/worked_best\s+text\s+not null/)
    expect(body).not.toMatch(/fix_first\s+text\s+not null/)
  })

  it('enables row level security, grants no policy, revokes the public roles', () => {
    expect(statements).toContain('alter table public.mad_test_survey enable row level security')
    expect(statements).not.toContain('create policy')
    expect(statements).not.toMatch(/\bgrant\b/)
    expect(statements).toContain('revoke all on public.mad_test_survey from anon, authenticated;')
  })

  it('defines no function or trigger, and exactly one foreign key (to signup, cascading)', () => {
    expect(statements).not.toMatch(/create (or replace )?function/)
    expect(statements).not.toContain('trigger')
    expect(statements.match(/references/g)).toHaveLength(1)
    expect(statements.match(/on delete cascade/g)).toHaveLength(1)
  })

  it('touches no other table', () => {
    const tables = [...statements.matchAll(/public\.(\w+)/g)].map((m) => m[1])
    expect(new Set(tables)).toEqual(new Set(['mad_test_survey', 'signup']))
  })

  it('documents retention and the one use on the table itself', () => {
    expect(statements).toMatch(/comment on table public\.mad_test_survey is\s+'[^']*delete all rows when the mad-testen ends/)
    expect(statements).toMatch(/comment on table public\.mad_test_survey is\s+'[^']*read only for the mad-testen summary/)
  })
})
