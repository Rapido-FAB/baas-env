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

```bash
npm install --save-dev github:RupertBarrow/baas-env
```
