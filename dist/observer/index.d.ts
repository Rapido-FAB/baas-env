/** The six failure-mode signatures (shared yardstick with the auditor + detector). */
export declare const SIX_SIGNATURES: readonly ["sycophancy", "empire-building", "context-drift", "worker-overrun", "contamination", "cos-capture"];
export type Signature = (typeof SIX_SIGNATURES)[number];
/** A parsed event-log line (only the fields the observer reads). */
export interface ObsEvent {
    type?: string;
    event?: string;
    source?: string;
    target?: string;
    intent?: string;
    allowListResult?: 'pass' | 'reject' | 'allow' | 'deny';
    direction?: string;
    routine?: string;
    ts?: string;
    [k: string]: unknown;
}
export interface RoutineLiveness {
    routine: string;
    expectedCron: string;
    lastFiredAt: string | null;
    status: 'live' | 'missed';
}
/**
 * Routine liveness: for each expected cron routine, find its most recent
 * `routine.execution` and decide live vs missed (no execution at all → missed).
 * A missed run is *reported to builders*, never escalated into the tenant (FT-26).
 */
export declare function routineLiveness(events: ObsEvent[], expected: Record<string, string>): RoutineLiveness[];
export interface A2aFinding {
    eventId: unknown;
    envelopeValid: boolean;
    allowListResult: 'allow' | 'deny';
    fourStepShape: 'ok' | 'malformed';
}
/**
 * A2A validation: over every `a2a.intent` event, report whether the envelope is
 * well-shaped (has source/target/intent) and its allow-list verdict. Read-only —
 * the observer flags patterns, it does not re-run the allow-list gate.
 */
export declare function a2aValidation(events: ObsEvent[]): A2aFinding[];
export interface SignatureFinding {
    signature: Signature;
    present: boolean;
    value: number | null;
    threshold: number | null;
}
export interface SignatureThresholds {
    /** cos comms-share red band (cos-capture). */ cosCaptureShare?: number;
    /** escalations-from-one-source (empire-building). */ empireBuilding?: number;
    /** worker-overrun queue depth. */ workerOverrun?: number;
}
/**
 * Failure-mode signature detection over a tenant's events (the M4 six-signature
 * pass; values from config). Each signature reports present/value/threshold so a
 * green reading is auditable too. Heuristics are intentionally simple + read-only.
 */
export declare function failureSignatures(events: ObsEvent[], thresholds?: SignatureThresholds): SignatureFinding[];
export interface CadenceFinding {
    rhythm: string;
    ranAsConfigured: boolean;
}
/** Cadence verification: each expected rhythm fired at least once in the window. */
export declare function cadenceVerification(events: ObsEvent[], rhythms: Record<string, string>): CadenceFinding[];
/**
 * The under-the-radar guarantee (FT-26/FT-28): the observer must never appear as the
 * `source` or `target` of any tenant event. Returns the offending events (empty = ok).
 */
export declare function observerNeverParticipates(events: ObsEvent[], observerId: string): ObsEvent[];
export interface FindingsRecord {
    observerRunId: string;
    tenant: string;
    checkedAt: string | null;
    routineLiveness: RoutineLiveness[];
    a2aValidation: A2aFinding[];
    failureSignatures: SignatureFinding[];
    cadenceVerification: CadenceFinding[];
}
export interface FindingsInput {
    observerRunId: string;
    tenant: string;
    events: ObsEvent[];
    expectedRoutines?: Record<string, string>;
    rhythms?: Record<string, string>;
    thresholds?: SignatureThresholds;
    checkedAt?: string | null;
}
/**
 * Build one per-tenant findings record — the observer's platform-side debug output.
 * Scoped to `tenant`; never merges another tenant's events in (FT-26 isolation).
 */
export declare function buildFindings(input: FindingsInput): FindingsRecord;
//# sourceMappingURL=index.d.ts.map