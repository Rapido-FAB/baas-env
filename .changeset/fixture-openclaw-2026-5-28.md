---
"@rapido-fab/baas-env": minor
---

feat(fixture): pin the e2e fixture to OpenClaw 2026.5.28 via the spawn PATH. `createFixture` now sets the `openclaw` spawn `PATH` to the Homebrew `node@24` location (where 2026.5.28 — the `/workboard` task-flag API + FA-CONCURRENCY — lives), exposed as `fixturePath()` / `OPENCLAW_2026_5_28_PATH`. Precedence: an explicit `BAAS_FIXTURE_PATH` override wins; else the pinned PATH when that `openclaw` is actually present; else the inherited `process.env.PATH` — so CI and other machines never break. Adds a `.env.example` test-fixture environment template carrying the `export PATH=…` line (source it to make the surrounding test process + the skip-gate's `openclaw --version` probe use 2026.5.28 too). The default OpenClaw version label is bumped to `2026.5.28`.
