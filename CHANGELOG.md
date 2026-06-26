# @rapido-fab/baas-env

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
