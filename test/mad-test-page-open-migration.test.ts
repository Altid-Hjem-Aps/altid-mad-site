import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// The page-open table holds who opened a Mad-testen page from their personal
// link. It must be reachable only with the service-role key, vanish with its
// signup row (erasure), hold one row per person and page, and carry no
// callable code. A report script outside this repo reads it by name and
// columns, so those are pinned exactly.
const sql = readFileSync(
  path.resolve(__dirname, '../supabase/migrations/20261002_mad_test_page_open.sql'),
  'utf8',
)
// Comments explain intent in prose; only the statements count.
const statements = sql
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')
  .toLowerCase()

describe('20261002_mad_test_page_open migration', () => {
  it('creates the table idempotently with the three columns', () => {
    expect(statements).toContain('create table if not exists public.mad_test_page_open')
    expect(statements).toMatch(
      /public_id\s+text\s+not null references public\.signup \(public_id\) on delete cascade,/,
    )
    expect(statements).toMatch(
      /page\s+text\s+not null\s+constraint mad_test_page_open_page_check check \(page in \('optin', 'survey'\)\),/,
    )
    expect(statements).toMatch(/created_at\s+timestamptz\s+not null default now\(\),/)
  })

  it('one row per person and page: the primary key is (public_id, page)', () => {
    expect(statements).toMatch(/constraint mad_test_page_open_pkey primary key \(public_id, page\)\s*\);/)
    expect(statements.match(/primary key/g)).toHaveLength(1)
  })

  it('the columns in order, and nothing else in the table', () => {
    const body = statements.slice(statements.indexOf('create table'), statements.indexOf(');'))
    const cols = [...body.matchAll(/\n\s+(\w+)\s+(text|timestamptz|boolean)\b/g)].map((m) => m[1])
    expect(cols).toEqual(['public_id', 'page', 'created_at'])
  })

  it('enables row level security, grants no policy, revokes the public roles', () => {
    expect(statements).toContain('alter table public.mad_test_page_open enable row level security')
    expect(statements).not.toContain('create policy')
    expect(statements).not.toMatch(/\bgrant\b/)
    expect(statements).toContain('revoke all on public.mad_test_page_open from anon, authenticated;')
  })

  it('defines no function or trigger, and exactly one foreign key (to signup, cascading)', () => {
    expect(statements).not.toMatch(/create (or replace )?function/)
    expect(statements).not.toContain('trigger')
    expect(statements.match(/references/g)).toHaveLength(1)
    expect(statements.match(/on delete cascade/g)).toHaveLength(1)
  })

  it('every statement is safe to re-run: one create if not exists, no add or drop', () => {
    expect(statements.match(/create table/g)).toHaveLength(1)
    expect(statements).not.toMatch(/\b(add|drop|insert|update|delete from)\b/)
  })

  it('touches no other table', () => {
    const tables = [...statements.matchAll(/public\.(\w+)/g)].map((m) => m[1])
    expect(new Set(tables)).toEqual(new Set(['mad_test_page_open', 'signup']))
  })

  it('documents retention on the table itself', () => {
    expect(statements).toMatch(
      /comment on table public\.mad_test_page_open is\s+'[^']*delete all rows when the mad-testen ends/,
    )
  })

  it('the page values are the ones the endpoint accepts', async () => {
    const { MAD_TEST_PAGES } = await import('@/lib/mad-test')
    const listed = statements.match(/check \(page in \(([^)]*)\)\)/)?.[1]
    expect(listed?.split(',').map((v) => v.trim().replace(/'/g, ''))).toEqual([...MAD_TEST_PAGES])
  })
})
