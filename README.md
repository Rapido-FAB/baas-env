> [!IMPORTANT]
> **ARCHIVED (2026-07-18).** Development moved to the [Rapido-FAB/baas monorepo](https://github.com/Rapido-FAB/baas) — this package now lives at [`packages/env`](https://github.com/Rapido-FAB/baas/tree/main/packages/env) with full history preserved. This repo is a read-only history mirror.

# @rapido-fab/baas-env

FABaaS e2e test-fixture provisioner for OpenClaw plugins.

Provides `createFixture(pluginRoot, opts?)` — an isolated OpenClaw environment
for running e2e tests against a plugin built from `dist/`.

## Features

- Isolated `.openclaw/` state dir per test run (no `~/.openclaw` pollution)
- Automatic `NODE_PATH` setup so peer deps (typebox, etc.) resolve from OpenClaw's npm store
- Claude-CLI OAuth agent defaults applied out of the box
- Parameterised OpenClaw version (default: `2026.5.7`) — uses whatever `openclaw` is on PATH

## Usage

```typescript
import { createFixture } from '@rapido-fab/baas-env'

const fixture = createFixture('/path/to/your/plugin', {
  openclawVersion: '2026.5.7', // optional, default: '2026.5.7'
})

const { stdout } = fixture.run(['plugins', 'list'])
fixture.cleanup()
```

## Install

From GitHub Packages (requires a `.npmrc` configured with a GitHub token):

```bash
npm install --save-dev @rapido-fab/baas-env
```

Or directly from the git repo:

```bash
npm install --save-dev github:RupertBarrow/baas-env
```

## Releases

Releases are automated via [changesets](https://github.com/changesets/changesets)
and GitHub Actions. Add a changeset with `npx changeset` in your PR; merging to
`main` runs CI and triggers the release workflow, which publishes to GitHub
Packages and creates a tagged GitHub Release.
