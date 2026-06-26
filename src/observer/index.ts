// FA-OBSERVER (M4) — the external-tenant observer's build-verifiable core.
//
// The observer is a read-only, platform-side reader over each tenant's append-only
// JSONL event log (FA-RECORDS-EVENT-LOG). It enumerates a fleet registry and, per
// tenant, asserts routine liveness, A2A envelope validity, the six failure-mode
// signatures and cadence rhythm — emitting a per-tenant findings record scoped to
// that tenant (never merged across tenants, never written back into any tenant).
//
// This module is the PURE core (decision over an in-memory event array). The
// production form is the Operations-process worker in the `baas-platform-operations`
// tenant; the `baas-env` `observer-*` e2e harness is the test form that reads the
// isolated OPENCLAW_STATE_DIR of ≥2 `createFixture` tenants. Reading the JSONL off
// disk + the byte-identical guarantee live in that harness; here we only decide.

/** The six failure-mode signatures (shared yardstick with the auditor + detector). */
export const SIX_SIGNATURES = [
  'sycophancy',
  'empire-building',
  'context-drift',
  'worker-overrun',
  'contamination',
  'cos-capture',
] as const
export type Signature = (typeof SIX_SIGNATURES)[number]

/** A parsed event-log line (only the fields the observer reads). */
export interface ObsEvent {
  type?: string
  event?: string
  source?: string
  target?: string
  intent?: string
  allowListResult?: 'pass' | 'reject' | 'allow' | 'deny'
  direction?: string
  routine?: string
  ts?: string
  [k: string]: unknown
}

const evType = (e: ObsEvent): string => e.type ?? e.event ?? ''

export interface RoutineLiveness {
  routine: string
  expectedCron: string
  lastFiredAt: string | null
  status: 'live' | 'missed'
}

/**
 * Routine liveness: for each expected cron routine, find its most recent
 * `routine.execution` and decide live vs missed (no execution at all → missed).
 * A missed run is *reported to builders*, never escalated into the tenant (FT-26).
 */
export function routineLiveness(events: ObsEvent[], expected: Record<string, string>): RoutineLiveness[] {
  return Object.entries(expected).map(([routine, expectedCron]) => {
    const runs = events.filter((e) => evType(e) === 'routine.execution' && e.routine === routine)
    const last = runs.reduce<string | null>((acc, e) => (e.ts && (!acc || e.ts > acc) ? e.ts : acc), null)
    return { routine, expectedCron, lastFiredAt: last, status: last ? 'live' : 'missed' }
  })
}

export interface A2aFinding {
  eventId: unknown
  envelopeValid: boolean
  allowListResult: 'allow' | 'deny'
  fourStepShape: 'ok' | 'malformed'
}

/**
 * A2A validation: over every `a2a.intent` event, report whether the envelope is
 * well-shaped (has source/target/intent) and its allow-list verdict. Read-only —
 * the observer flags patterns, it does not re-run the allow-list gate.
 */
export function a2aValidation(events: ObsEvent[]): A2aFinding[] {
  return events
    .filter((e) => evType(e) === 'a2a.intent')
    .map((e) => {
      const envelopeValid = Boolean(e.source && e.target && e.intent)
      const reject = e.allowListResult === 'reject' || e.allowListResult === 'deny'
      return {
        eventId: e.event_id ?? e.eventId ?? null,
        envelopeValid,
        allowListResult: reject ? 'deny' : 'allow',
        fourStepShape: envelopeValid && Boolean(e.direction) ? 'ok' : 'malformed',
      }
    })
}

export interface SignatureFinding {
  signature: Signature
  present: boolean
  value: number | null
  threshold: number | null
}

export interface SignatureThresholds {
  /** cos comms-share red band (cos-capture). */ cosCaptureShare?: number
  /** escalations-from-one-source (empire-building). */ empireBuilding?: number
  /** worker-overrun queue depth. */ workerOverrun?: number
}
const DEFAULT_THRESH: Required<SignatureThresholds> = { cosCaptureShare: 0.4, empireBuilding: 3, workerOverrun: 1 }

/**
 * Failure-mode signature detection over a tenant's events (the M4 six-signature
 * pass; values from config). Each signature reports present/value/threshold so a
 * green reading is auditable too. Heuristics are intentionally simple + read-only.
 */
export function failureSignatures(events: ObsEvent[], thresholds: SignatureThresholds = {}): SignatureFinding[] {
  const t = { ...DEFAULT_THRESH, ...thresholds }
  const a2a = events.filter((e) => evType(e) === 'a2a.intent')
  const fromCos = a2a.filter((e) => e.source === 'cos').length
  const cosShare = a2a.length ? fromCos / a2a.length : 0
  // empire-building: any single source issuing > threshold downward delegates.
  const downBySource = new Map<string, number>()
  for (const e of a2a) if (e.intent === 'delegate' && e.direction === 'downward' && typeof e.source === 'string')
    downBySource.set(e.source, (downBySource.get(e.source) ?? 0) + 1)
  const empireMax = Math.max(0, ...downBySource.values())
  // cos-capture: cos emitting any downward-command intent OR crossing the share band.
  const cosCommands = a2a.some((e) => e.source === 'cos' && e.direction === 'downward' && e.intent === 'delegate')
  // worker-overrun: a concurrency.queued depth signal.
  const overrun = Math.max(0, ...events.filter((e) => evType(e) === 'concurrency.queued').map((e) => Number(e.depth ?? 0)))
  // contamination: a flagged contaminated/duplicated context entry.
  const contaminated = events.filter((e) => evType(e) === 'context.change' && (e.contaminated || e.contradictsSealed)).length
  // context-drift: a charter.update that supersedes nothing repeatedly (proxy: count).
  const drift = events.filter((e) => evType(e) === 'charter.update' && !e.supersedes).length
  // sycophancy: zero refusals/escalations across many decisions (proxy: decisions w/o any escalate).
  const decisions = events.filter((e) => evType(e) === 'decision.recorded').length
  const escalations = events.filter((e) => evType(e) === 'escalation.decision').length
  const sycophancy = decisions >= 5 && escalations === 0

  const f = (signature: Signature, present: boolean, value: number | null, threshold: number | null): SignatureFinding => ({ signature, present, value, threshold })
  return [
    f('sycophancy', sycophancy, decisions, null),
    f('empire-building', empireMax > t.empireBuilding, empireMax, t.empireBuilding),
    f('context-drift', drift > 0, drift, 0),
    f('worker-overrun', overrun > t.workerOverrun, overrun, t.workerOverrun),
    f('contamination', contaminated > 0, contaminated, 0),
    f('cos-capture', cosCommands || cosShare >= t.cosCaptureShare, Number(cosShare.toFixed(2)), t.cosCaptureShare),
  ]
}

export interface CadenceFinding { rhythm: string; ranAsConfigured: boolean }

/** Cadence verification: each expected rhythm fired at least once in the window. */
export function cadenceVerification(events: ObsEvent[], rhythms: Record<string, string>): CadenceFinding[] {
  return Object.keys(rhythms).map((rhythm) => ({
    rhythm,
    ranAsConfigured: events.some((e) => evType(e) === 'routine.execution' && e.routine === rhythms[rhythm]),
  }))
}

/**
 * The under-the-radar guarantee (FT-26/FT-28): the observer must never appear as the
 * `source` or `target` of any tenant event. Returns the offending events (empty = ok).
 */
export function observerNeverParticipates(events: ObsEvent[], observerId: string): ObsEvent[] {
  return events.filter((e) => e.source === observerId || e.target === observerId)
}

export interface FindingsRecord {
  observerRunId: string
  tenant: string
  checkedAt: string | null
  routineLiveness: RoutineLiveness[]
  a2aValidation: A2aFinding[]
  failureSignatures: SignatureFinding[]
  cadenceVerification: CadenceFinding[]
}

export interface FindingsInput {
  observerRunId: string
  tenant: string
  events: ObsEvent[]
  expectedRoutines?: Record<string, string>
  rhythms?: Record<string, string>
  thresholds?: SignatureThresholds
  checkedAt?: string | null
}

/**
 * Build one per-tenant findings record — the observer's platform-side debug output.
 * Scoped to `tenant`; never merges another tenant's events in (FT-26 isolation).
 */
export function buildFindings(input: FindingsInput): FindingsRecord {
  return {
    observerRunId: input.observerRunId,
    tenant: input.tenant,
    checkedAt: input.checkedAt ?? null,
    routineLiveness: routineLiveness(input.events, input.expectedRoutines ?? {}),
    a2aValidation: a2aValidation(input.events),
    failureSignatures: failureSignatures(input.events, input.thresholds),
    cadenceVerification: cadenceVerification(input.events, input.rhythms ?? {}),
  }
}
