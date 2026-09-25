import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// The yes-list holds who said yes to the Mad-testen. It must be reachable only
// with the service-role key, vanish with its signup row (erasure), and carry no
// callable code: the plan's gate removed the SQL function for exactly that.
const sql = readFileSync(
  path.resolve(__dirname, '../supabase/migrations/20260925_mad_test_optin.sql'),
  'utf8',
)
// Comments explain intent in prose; only the statements count.
const statements = sql
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')
  .toLowerCase()

describe('20260925_mad_test_optin migration', () => {
  it('creates the table idempotently with the four columns', () => {
    expect(statements).toContain('create table if not exists public.mad_test_optin')
    expect(statements).toMatch(
      /public_id\s+text\s+primary key references public\.signup \(public_id\) on delete cascade,/,
    )
    expect(statements).toMatch(/created_at\s+timestamptz\s+not null default now\(\)/)
    expect(statements).toMatch(/copy_version\s+text\s+not null,/)
    expect(statements).toMatch(
      /device\s+text\s+not null\s+constraint mad_test_optin_device_check check \(device in \('iphone', 'android'\)\)\s*\);/,
    )
  })

  it('brings a table from the earlier version (no device column) up to shape on re-run', () => {
    const create = statements.indexOf('create table if not exists public.mad_test_optin')
    const add = statements.indexOf('alter table public.mad_test_optin add column if not exists device text;')
    const notNull = statements.indexOf('alter table public.mad_test_optin alter column device set not null;')
    const guard = statements.search(
      /if not exists \(\s*select 1 from pg_constraint\s+where conname = 'mad_test_optin_device_check'\s+and conrelid = 'public\.mad_test_optin'::regclass\s*\) then\s+alter table public\.mad_test_optin\s+add constraint mad_test_optin_device_check check \(device in \('iphone', 'android'\)\);\s+end if;/,
    )
    expect(create).toBeGreaterThanOrEqual(0)
    expect(add).toBeGreaterThan(create)
    expect(notNull).toBeGreaterThan(add)
    expect(guard).toBeGreaterThan(notNull)
    // Every add is guarded, so a second run cannot fail on "already exists".
    expect(statements.match(/add constraint/g)).toHaveLength(1)
    expect(statements.match(/add column/g)).toHaveLength(1)
    expect(statements.match(/add column if not exists/g)).toHaveLength(1)
  })

  it('enables row level security, grants no policy, revokes the public roles', () => {
    expect(statements).toContain('alter table public.mad_test_optin enable row level security')
    expect(statements).not.toContain('create policy')
    expect(statements).not.toMatch(/\bgrant\b/)
    expect(statements).toContain('revoke all on public.mad_test_optin from anon, authenticated;')
  })

  it('defines no function or trigger, and exactly one foreign key (to signup, cascading)', () => {
    expect(statements).not.toMatch(/create (or replace )?function/)
    expect(statements).not.toContain('trigger')
    expect(statements.match(/references/g)).toHaveLength(1)
    expect(statements.match(/on delete cascade/g)).toHaveLength(1)
  })

  it('documents retention on the table itself', () => {
    expect(statements).toMatch(/comment on table public\.mad_test_optin is\s+'[^']*delete all rows when the mad-testen ends/)
  })
})
