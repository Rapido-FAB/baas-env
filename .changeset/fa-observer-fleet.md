---
"@rapido-fab/baas-env": minor
---

feat(observer): FA-OBSERVER fleet reader (Stage 4 / M4) — FT-26/28. Adds `src/observer/fleet.ts`: `runFleet(registry)` iterates a fleet registry (tenant → isolated OPENCLAW_STATE_DIR), reads each tenant's append-only JSONL event log **read-only** (`readTenantEvents` + a `*`-segment `globFiles` over the `agents/*/events/*.jsonl` FA-RECORDS-EVENT-LOG path), and produces one **scoped** findings record per tenant — never merging one tenant's events into another's report (FT-26 isolation). Pure reader (no write path): the tests prove the tenant state dirs are **byte-identical** before/after repeated runs (FT-28), the observer never appears as a source/target, and malformed JSONL lines are skipped not thrown. +3 tests.
