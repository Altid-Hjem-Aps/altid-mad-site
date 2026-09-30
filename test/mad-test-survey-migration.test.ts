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
  it('creates the table idempotently with the ten columns', () => {
    expect(statements).toContain('create table if not exists public.mad_test_survey')
    expect(statements).toMatch(
      /public_id\s+text\s+primary key references public\.signup \(public_id\) on delete cascade,/,
    )
    expect(statements).toMatch(/created_at\s+timestamptz\s+not null default now\(\),/)
    expect(statements).toMatch(/copy_version\s+text\s+not null\s+constraint mad_test_survey_copy_version_check check \(copy_version <> ''\),/)
    for (const col of ['plan_fit', 'easy_to_use']) {
      expect(statements).toMatch(
        new RegExp(`${col}\\s+text\\s+not null\\s+constraint mad_test_survey_${col}_check check \\(${col} in \\('ja', 'delvist', 'nej'\\)\\),`),
      )
    }
    for (const col of ['plan_fit_note', 'easy_note', 'missing', 'other_feedback']) {
      expect(statements).toMatch(
        new RegExp(
          `\\n\\s+${col}\\s+text\\s+constraint mad_test_survey_${col}_check check \\(length\\(${col}\\) between 1 and 2000\\s+and ${col} = btrim\\(${col}, e' \\\\t\\\\n\\\\r'\\)\\),`,
        ),
      )
    }
    expect(statements).toMatch(/,\s+panel\s+boolean\s+not null\s*\);/)
  })

  it('the columns in order, and nothing else in the table', () => {
    const body = statements.slice(statements.indexOf('create table'), statements.indexOf(');'))
    const cols = [...body.matchAll(/\n\s+(\w+)\s+(text|timestamptz|boolean)\b/g)].map((m) => m[1])
    expect(cols).toEqual([
      'public_id',
      'created_at',
      'copy_version',
      'plan_fit',
      'plan_fit_note',
      'easy_to_use',
      'easy_note',
      'missing',
      'other_feedback',
      'panel',
    ])
  })

  it('the four text answers may be null (optional); the rest may not', () => {
    const body = statements.slice(statements.indexOf('create table'), statements.indexOf(');'))
    // created_at, copy_version, the two ratings and panel; public_id is the primary key.
    expect(body.match(/not null/g)).toHaveLength(5)
    for (const col of ['plan_fit_note', 'easy_note', 'missing', 'other_feedback']) {
      expect(body).not.toMatch(new RegExp(`\\n\\s+${col}\\s+text\\s+not null`))
    }
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

  it('documents retention, the one use and what panel means on the table itself', () => {
    expect(statements).toMatch(/comment on table public\.mad_test_survey is\s+'[^']*delete all rows when the mad-testen ends/)
    expect(statements).toMatch(/comment on table public\.mad_test_survey is\s+'[^']*read only for the mad-testen summary/)
    expect(statements).toMatch(
      /comment on table public\.mad_test_survey is\s+'[^']*panel = true means the person asked to be invited to future tests/,
    )
  })
})
