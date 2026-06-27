// FA-OBSERVER (M4) — the fleet reader. Iterates a fleet registry (tenant → isolated
// OPENCLAW_STATE_DIR), reads each tenant's append-only JSONL event log READ-ONLY, and
// produces a per-tenant findings record. Scoped per tenant — never merges one tenant's
// events into another's report (FT-26). Pure reader: no write path (FT-28 byte-identical).
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { buildFindings, } from './index.js';
const DEFAULT_GLOB = 'agents/*/events/*.jsonl';
/** Resolve a simple `*`-segment glob to concrete file paths under `root` (read-only). */
export function globFiles(root, glob) {
    const segments = glob.split('/').filter(Boolean);
    let dirs = [root];
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const isLast = i === segments.length - 1;
        const next = [];
        for (const d of dirs) {
            if (!existsSync(d))
                continue;
            let entries;
            try {
                entries = readdirSync(d);
            }
            catch {
                continue;
            }
            for (const name of entries) {
                if (!segMatches(seg, name))
                    continue;
                const p = join(d, name);
                let st;
                try {
                    st = statSync(p);
                }
                catch {
                    continue;
                }
                if (isLast ? st.isFile() : st.isDirectory())
                    next.push(p);
            }
        }
        dirs = next;
    }
    return dirs.sort();
}
/** Match one path segment against a glob segment supporting `*` wildcards. */
function segMatches(seg, name) {
    if (seg === '*')
        return true;
    if (!seg.includes('*'))
        return seg === name;
    const re = new RegExp('^' + seg.split('*').map(escapeRe).join('.*') + '$');
    return re.test(name);
}
const escapeRe = (s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
/** Read + parse a tenant's JSONL event log(s). Malformed lines are skipped, not thrown. */
export function readTenantEvents(stateDir, eventLogGlob = DEFAULT_GLOB) {
    const events = [];
    for (const file of globFiles(stateDir, eventLogGlob)) {
        let body;
        try {
            body = readFileSync(file, 'utf8');
        }
        catch {
            continue;
        }
        for (const line of body.split('\n')) {
            const t = line.trim();
            if (!t)
                continue;
            try {
                events.push(JSON.parse(t));
            }
            catch { /* skip malformed */ }
        }
    }
    return events;
}
/**
 * Run the observer over the whole fleet: one scoped findings record per tenant. The
 * records are independent — a tenant's report is built only from its own state dir, so
 * no cross-tenant contamination is possible (FT-26 isolation).
 */
export function runFleet(registry, observerRunId, checkedAt = null) {
    return registry.tenants.map((t) => buildFindings({
        observerRunId,
        tenant: t.id,
        checkedAt,
        events: readTenantEvents(t.stateDir, t.eventLogGlob),
        expectedRoutines: t.expectedRoutines,
        rhythms: t.rhythms,
        thresholds: t.thresholds,
    }));
}
//# sourceMappingURL=fleet.js.map