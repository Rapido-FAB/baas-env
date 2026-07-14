# @rapido-fab/baas-env

## 1.4.0

### Minor Changes

- e4a6de5: Export `fixturePath` and `OPENCLAW_2026_6_11_PATH` from the package root, pin the fixture to OpenClaw 2026.6.11, and update the Claude CLI agent test defaults (v2 consolidation). Retroactive changeset for PR #5, which was merged without one and left the `main` CI red on the Require-changeset gate.

## 1.3.0

### Minor Changes

- d0b68ab: feat(fixture): pin the e2e fixture to OpenClaw 2026.5.28 via the spawn PATH. `createFixture` now sets the `openclaw` spawn `PATH` to the Homebrew `node@24` location (where 2026.5.28 — the `/workboard` task-flag API + FA-CONCURRENCY — lives), exposed as `fixturePath()` / `OPENCLAW_2026_5_28_PATH`. Precedence: an explicit `BAAS_FIXTURE_PATH` override wins; else the pinned PATH when that `openclaw` is actually present; else the inherited `process.env.PATH` — so CI and other machines never break. Adds a `.env.example` test-fixture environment template carrying the `export PATH=…` line (source it to make the surrounding test process + the skip-gate's `openclaw --version` probe use 2026.5.28 too). The default OpenClaw version label is bumped to `2026.5.28`.

## 1.2.0

### Minor Changes

- 6394c3b: feat(observer): FA-OBSERVER fleet reader (Stage 4 / M4) — FT-26/28. Adds `src/observer/fleet.ts`: `runFleet(registry)` iterates a fleet registry (tenant → isolated OPENCLAW_STATE_DIR), reads each tenant's append-only JSONL event log **read-only** (`readTenantEvents` + a `*`-segment `globFiles` over the `agents/*/events/*.jsonl` FA-RECORDS-EVENT-LOG path), and produces one **scoped** findings record per tenant — never merging one tenant's events into another's report (FT-26 isolation). Pure reader (no write path): the tests prove the tenant state dirs are **byte-identical** before/after repeated runs (FT-28), the observer never appears as a source/target, and malformed JSONL lines are skipped not thrown. +3 tests.

## 1.1.0

### Minor Changes

- 7c67e7e: feat(observer): FA-OBSERVER core (Stage 4 / M4). Adds the external-tenant observer's build-verifiable core in `src/observer/` — the six failure-mode signatures + the four read-only checks (routine-liveness, A2A envelope validation, failure-signature detection, cadence rhythm) over a tenant's in-memory event array, plus `buildFindings` (a per-tenant findings record scoped to one tenant — never merged across tenants, FT-26 isolation) and `observerNeverParticipates` (the under-the-radar guarantee: the observer is never a `source`/`target` of any tenant event, FT-26/28). Pure decision core; the ≥2-fixture cross-tenant read + the byte-identical guarantee land in the `tests/e2e/observer-*` harness. Also pins vitest to `src/` (excludes the `dist/` mirror). +12 tests.

## 1.0.1

### Patch Changes

- 13ff013: Add CI and release workflows, changesets, and GitHub Packages publishing

  - Add `.github/workflows/ci.yml` (build, test, changeset enforcement, artifact upload), adapted from baas-core
  - Add `.github/workflows/release.yml` (changeset version, build, publish to GitHub Packages, tag, GitHub Release), adapted from baas-core
  - Add `.changeset/config.json` with `@rapido-fab` scope and restricted access
  - Add `.npmrc` pointing `@rapido-fab` scope at GitHub Packages
  - Add `publishConfig.access: "restricted"` and `changeset` script to package.json
  - Document the new install + release flow in README
