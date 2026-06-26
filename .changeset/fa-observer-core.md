---
"@rapido-fab/baas-env": minor
---

feat(observer): FA-OBSERVER core (Stage 4 / M4). Adds the external-tenant observer's build-verifiable core in `src/observer/` — the six failure-mode signatures + the four read-only checks (routine-liveness, A2A envelope validation, failure-signature detection, cadence rhythm) over a tenant's in-memory event array, plus `buildFindings` (a per-tenant findings record scoped to one tenant — never merged across tenants, FT-26 isolation) and `observerNeverParticipates` (the under-the-radar guarantee: the observer is never a `source`/`target` of any tenant event, FT-26/28). Pure decision core; the ≥2-fixture cross-tenant read + the byte-identical guarantee land in the `tests/e2e/observer-*` harness. Also pins vitest to `src/` (excludes the `dist/` mirror). +12 tests.
