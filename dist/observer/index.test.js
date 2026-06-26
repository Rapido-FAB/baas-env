// FA-OBSERVER core — unit tests over in-memory event arrays (the e2e harness adds
// the ≥2-fixture cross-tenant read + byte-identical guarantee).
import { describe, it, expect } from 'vitest';
import { SIX_SIGNATURES, routineLiveness, a2aValidation, failureSignatures, cadenceVerification, observerNeverParticipates, buildFindings, } from './index.js';
describe('FA-OBSERVER core', () => {
    it('routine liveness: an executed routine is live, an un-run expected routine is missed', () => {
        const events = [
            { type: 'routine.execution', routine: 'daily-brief', ts: '2026-05-01T07:00:12Z' },
            { type: 'routine.execution', routine: 'daily-brief', ts: '2026-05-02T07:00:09Z' },
        ];
        const out = routineLiveness(events, { 'daily-brief': '0 7 * * *', 'weekly-sync': '0 10 * * 1' });
        expect(out.find((r) => r.routine === 'daily-brief')).toMatchObject({ status: 'live', lastFiredAt: '2026-05-02T07:00:09Z' });
        expect(out.find((r) => r.routine === 'weekly-sync')).toMatchObject({ status: 'missed', lastFiredAt: null });
    });
    it('a2a validation: a well-formed envelope is valid+allow, a reject is deny, a malformed one is flagged', () => {
        const events = [
            { type: 'a2a.intent', source: 'ceo', target: 'cos', intent: 'delegate', direction: 'downward', allowListResult: 'pass' },
            { type: 'a2a.intent', source: 'x', target: 'cos', intent: 'delegate', direction: 'lateral', allowListResult: 'reject' },
            { type: 'a2a.intent', source: 'y', intent: 'inform' }, // no target → malformed
        ];
        const out = a2aValidation(events);
        expect(out[0]).toMatchObject({ envelopeValid: true, allowListResult: 'allow', fourStepShape: 'ok' });
        expect(out[1].allowListResult).toBe('deny');
        expect(out[2]).toMatchObject({ envelopeValid: false, fourStepShape: 'malformed' });
    });
    it('failure signatures: cos-capture fires on a cos downward command; a clean tenant is all-green', () => {
        const dirty = [{ type: 'a2a.intent', source: 'cos', target: 'marketing', intent: 'delegate', direction: 'downward' }];
        const cosCapture = failureSignatures(dirty).find((s) => s.signature === 'cos-capture');
        expect(cosCapture.present).toBe(true);
        const clean = [{ type: 'a2a.intent', source: 'marketing', target: 'ceo', intent: 'request', direction: 'upward', allowListResult: 'pass' }];
        const out = failureSignatures(clean);
        expect(out).toHaveLength(SIX_SIGNATURES.length);
        expect(out.every((s) => s.present === false)).toBe(true);
    });
    it('cadence verification: an expected rhythm that fired is ran-as-configured', () => {
        const events = [{ type: 'routine.execution', routine: 'monthly-review', ts: '2026-05-01T10:00:00Z' }];
        const out = cadenceVerification(events, { monthly: 'monthly-review', weekly: 'weekly-sync' });
        expect(out.find((c) => c.rhythm === 'monthly').ranAsConfigured).toBe(true);
        expect(out.find((c) => c.rhythm === 'weekly').ranAsConfigured).toBe(false);
    });
    it('FT-26/28 under-the-radar: the observer must never be a source/target of any tenant event', () => {
        const clean = [{ type: 'a2a.intent', source: 'ceo', target: 'cos', intent: 'inform' }];
        expect(observerNeverParticipates(clean, 'observer')).toEqual([]);
        const leaked = [...clean, { type: 'a2a.intent', source: 'cos', target: 'observer', intent: 'inform' }];
        expect(observerNeverParticipates(leaked, 'observer')).toHaveLength(1); // would fail the confusion-guard
    });
    it('FT-26 isolation: a findings record is scoped to its tenant and never merges another tenant', () => {
        const rapido = buildFindings({
            observerRunId: 'obsrun-1', tenant: 'rapido-fab', checkedAt: '2026-05-01T08:00:00Z',
            events: [{ type: 'routine.execution', routine: 'daily-brief', ts: '2026-05-01T07:00:00Z' }],
            expectedRoutines: { 'daily-brief': '0 7 * * *' },
        });
        const acme = buildFindings({ observerRunId: 'obsrun-1', tenant: 'acme', events: [], expectedRoutines: { 'daily-brief': '0 7 * * *' } });
        expect(rapido.tenant).toBe('rapido-fab');
        expect(rapido.routineLiveness[0].status).toBe('live');
        expect(acme.tenant).toBe('acme');
        expect(acme.routineLiveness[0].status).toBe('missed'); // acme's empty log is not contaminated by rapido's events
    });
});
//# sourceMappingURL=index.test.js.map