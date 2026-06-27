import { type ObsEvent, type FindingsRecord, type SignatureThresholds } from './index.js';
export interface FleetTenant {
    id: string;
    /** the tenant's isolated OPENCLAW_STATE_DIR (never `~/.openclaw`). */
    stateDir: string;
    /** FA-RECORDS-EVENT-LOG path glob (only `*` segments). */
    eventLogGlob?: string;
    expectedRoutines?: Record<string, string>;
    rhythms?: Record<string, string>;
    thresholds?: SignatureThresholds;
}
export interface FleetRegistry {
    tenants: FleetTenant[];
}
/** Resolve a simple `*`-segment glob to concrete file paths under `root` (read-only). */
export declare function globFiles(root: string, glob: string): string[];
/** Read + parse a tenant's JSONL event log(s). Malformed lines are skipped, not thrown. */
export declare function readTenantEvents(stateDir: string, eventLogGlob?: string): ObsEvent[];
/**
 * Run the observer over the whole fleet: one scoped findings record per tenant. The
 * records are independent — a tenant's report is built only from its own state dir, so
 * no cross-tenant contamination is possible (FT-26 isolation).
 */
export declare function runFleet(registry: FleetRegistry, observerRunId: string, checkedAt?: string | null): FindingsRecord[];
//# sourceMappingURL=fleet.d.ts.map