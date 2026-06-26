// FA-OBSERVER fleet reader — FT-26 (cross-tenant scoped read) + FT-28 (read-only,
// byte-identical) over hand-written JSONL event logs in isolated temp state dirs
// (genuinely green — no OpenClaw runtime needed; the observer is pure file I/O).
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { runFleet, readTenantEvents, globFiles, type FleetRegistry } from './fleet.js'
import { observerNeverParticipates } from './index.js'

function seedTenant(root: string, tenant: string, agent: string, events: object[]): void {
  const dir = join(root, tenant, '.openclaw', 'agents', agent, 'events')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'log.jsonl'), events.map((e) => JSON.stringify(e)).join('\n') + '\n')
}

/** Content hash of a directory tree — the byte-identical guarantee. */
function hashDir(root: string): string {
  const h = createHash('sha256')
  const walk = (d: string): void => {
    for (const name of readdirSync(d).sort()) {
      const p = join(d, name)
      if (statSync(p).isDirectory()) walk(p)
      else { h.update(p); h.update(readFileSync(p)) }
    }
  }
  walk(root)
  return h.digest('hex')
}

describe('FA-OBSERVER fleet reader (FT-26 / FT-28)', () => {
  let root: string
  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'observer-fleet-'))
    seedTenant(root, 'rapido-fab', 'cos', [
      { type: 'routine.execution', routine: 'daily-brief', ts: '2026-05-01T07:00:00Z' },
      { type: 'a2a.intent', source: 'ceo', target: 'cos', intent: 'inform', direction: 'downward', allowListResult: 'pass' },
    ])
    seedTenant(root, 'acme', 'main', [
      { type: 'a2a.intent', source: 'cos', target: 'marketing', intent: 'delegate', direction: 'downward' }, // cos-capture
    ])
  })
  afterAll(() => rmSync(root, { recursive: true, force: true }))

  const registry = (): FleetRegistry => ({
    tenants: [
      { id: 'rapido-fab', stateDir: join(root, 'rapido-fab', '.openclaw'), expectedRoutines: { 'daily-brief': '0 7 * * *' } },
      { id: 'acme', stateDir: join(root, 'acme', '.openclaw'), expectedRoutines: { 'daily-brief': '0 7 * * *' } },
    ],
  })

  it('FT-26: reads the fleet into one scoped findings record per tenant — never merged across tenants', () => {
    const out = runFleet(registry(), 'obsrun-1', '2026-05-01T08:00:00Z')
    expect(out.map((f) => f.tenant)).toEqual(['rapido-fab', 'acme'])
    const rapido = out.find((f) => f.tenant === 'rapido-fab')!
    const acme = out.find((f) => f.tenant === 'acme')!
    // rapido's daily-brief ran (live); acme's did not (missed) — no contamination either way
    expect(rapido.routineLiveness[0].status).toBe('live')
    expect(acme.routineLiveness[0].status).toBe('missed')
    // acme's cos-capture fires; rapido's does not — signatures scoped per tenant
    expect(acme.failureSignatures.find((s) => s.signature === 'cos-capture')!.present).toBe(true)
    expect(rapido.failureSignatures.find((s) => s.signature === 'cos-capture')!.present).toBe(false)
    // the observer never appears as source/target of any read event (under-the-radar)
    const all = [...readTenantEvents(registry().tenants[0].stateDir), ...readTenantEvents(registry().tenants[1].stateDir)]
    expect(observerNeverParticipates(all, 'observer')).toEqual([])
  })

  it('FT-28: the observer is read-only — tenant state dirs are byte-identical before/after repeated runs', () => {
    const before = registry().tenants.map((t) => hashDir(t.stateDir))
    runFleet(registry(), 'obsrun-2')
    runFleet(registry(), 'obsrun-3')
    expect(registry().tenants.map((t) => hashDir(t.stateDir))).toEqual(before)
  })

  it('the FA-RECORDS-EVENT-LOG glob resolves agent event logs; malformed lines are skipped, not thrown', () => {
    const scratch = mkdtempSync(join(tmpdir(), 'observer-glob-'))
    try {
      seedTenant(scratch, 't', 'a', [{ type: 'a2a.intent', source: 'x', target: 'y', intent: 'inform' }])
      const dir = join(scratch, 't', '.openclaw')
      expect(globFiles(dir, 'agents/*/events/*.jsonl').length).toBe(1)
      const f = join(dir, 'agents', 'a', 'events', 'log.jsonl')
      writeFileSync(f, readFileSync(f, 'utf8') + 'NOT JSON\n')
      expect(() => readTenantEvents(dir)).not.toThrow()
      expect(readTenantEvents(dir)).toHaveLength(1) // the valid line survives, the junk is skipped
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  })
})
