/**
 * createFixture — provision an isolated OpenClaw environment for e2e tests.
 *
 * - Creates a temp .openclaw/ state dir (no ~/.openclaw pollution)
 * - Sets NODE_PATH to include ~/.openclaw/npm/node_modules so peer deps
 *   (typebox, etc.) resolve when OpenClaw loads installed plugins
 * - Applies claude-cli OAuth agent defaults
 * - Builds the plugin under test and installs it from dist/
 *
 * The openclaw version is parameterised; the default is the version declared
 * in this package's baas-env.defaultOpenclawVersion field (2026.5.7).
 * The fixture uses whichever `openclaw` binary is on PATH — it does not
 * install openclaw itself.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import {
  mkdtempSync, rmSync, mkdirSync, existsSync,
  copyFileSync, writeFileSync, readFileSync,
} from 'node:fs'
import { resolve, join, dirname } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { stripVitestEnv } from './env.js'
import { applyClaudeCliAgentDefaults } from './test-defaults.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = resolve(__dirname, '..')

/** Default OpenClaw version — matches the tested stable release */
export const DEFAULT_OPENCLAW_VERSION = '2026.5.28'

/**
 * The PATH the fixture spawns `openclaw` with. The live-integration tier targets
 * **openclaw 2026.5.28** (the `/workboard` task-flag API + FA-CONCURRENCY land
 * there), pinned under Homebrew `node@24`. This is the `export PATH=…` from the
 * test-fixture .env template, applied programmatically so every consumer of
 * `createFixture` resolves the same binary.
 *
 * Precedence: an explicit `BAAS_FIXTURE_PATH` override wins; else the pinned
 * node@24 PATH when that `openclaw` is actually present (a dev machine); else the
 * inherited `process.env.PATH` — so CI and other machines never break.
 */
export const OPENCLAW_2026_5_28_PATH =
  '/opt/homebrew/opt/node@24/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'

export function fixturePath(): string {
  if (process.env.BAAS_FIXTURE_PATH) return process.env.BAAS_FIXTURE_PATH
  if (existsSync('/opt/homebrew/opt/node@24/bin/openclaw')) return OPENCLAW_2026_5_28_PATH
  return process.env.PATH ?? ''
}

export interface FixtureOptions {
  /**
   * Expected openclaw version. Printed in fixture logs; the binary on PATH
   * is used regardless (baas-env does not install openclaw itself).
   * Default: DEFAULT_OPENCLAW_VERSION.
   */
  openclawVersion?: string
  /** Root of /tmp fixture area. Default: /tmp/baas */
  fixtureRoot?: string
}

export interface Fixture {
  /** Temp root (parent of .openclaw state dir) */
  base: string
  /** Isolated .openclaw state dir */
  stateDir: string
  /** Path to the isolated openclaw.json config */
  configPath: string
  /** Environment vars that isolate OpenClaw to the fixture */
  env: Record<string, string>
  /** Run openclaw <args> in the fixture */
  run(args: string[], opts?: { timeoutMs?: number }): RunResult
  /** Tear down everything */
  cleanup(): void
}

export interface RunResult {
  stdout: string
  stderr: string
  exitCode: number
}

export function createFixture(pluginRoot: string, opts: FixtureOptions = {}): Fixture {
  const fixtureRoot = opts.fixtureRoot ?? '/tmp/baas'
  const openclawVersion = opts.openclawVersion ?? DEFAULT_OPENCLAW_VERSION

  mkdirSync(fixtureRoot, { recursive: true })
  const base = mkdtempSync(join(fixtureRoot, 'e2e-'))
  const stateDir = join(base, '.openclaw')
  const configDir = join(stateDir, 'config')
  const configPath = join(configDir, 'openclaw.json')
  let tornDown = false

  const keep = process.env.E2E_KEEP_FIXTURE === '1'

  const cleanup = () => {
    if (tornDown) return
    tornDown = true
    if (keep) {
      console.log(`[baas-env] fixture preserved at: ${base}`)
      return
    }
    try { rmSync(base, { recursive: true, force: true }) } catch { /* best-effort */ }
  }

  process.on('exit', cleanup)
  process.on('SIGINT', () => { cleanup(); process.exit(130) })
  process.on('SIGTERM', () => { cleanup(); process.exit(143) })

  try {
    // 1. Provision isolated OpenClaw state dir
    mkdirSync(configDir, { recursive: true })

    const templateConfig = join(PACKAGE_ROOT, 'config', 'openclaw.json')
    if (existsSync(templateConfig)) {
      copyFileSync(templateConfig, configPath)
    } else {
      writeFileSync(
        configPath,
        JSON.stringify({ meta: { lastTouchedAt: new Date().toISOString() } }, null, 2),
      )
    }

    // 2. Apply claude-cli agent defaults (no API key needed)
    applyClaudeCliAgentDefaults(configPath)

    // 3. Build the env with NODE_PATH pointing at OpenClaw's own npm modules
    //    so peer deps (typebox, etc.) resolve when plugins load.
    const openclawNpmModules = join(homedir(), '.openclaw', 'npm', 'node_modules')
    const existingNodePath = process.env.NODE_PATH ?? ''
    const nodePath = existingNodePath
      ? `${openclawNpmModules}:${existingNodePath}`
      : openclawNpmModules

    const fixtureEnv: Record<string, string> = {
      ...stripVitestEnv(),
      PATH: fixturePath(),
      OPENCLAW_STATE_DIR: stateDir,
      OPENCLAW_CONFIG_PATH: configPath,
      NODE_PATH: nodePath,
    }

    const run = (args: string[], runOpts?: { timeoutMs?: number }): RunResult => {
      const result = spawnSync('openclaw', args, {
        timeout: runOpts?.timeoutMs ?? 30_000,
        stdio: 'pipe',
        encoding: 'utf8',
        env: fixtureEnv,
      })
      return {
        stdout: (result.stdout ?? '').toString(),
        stderr: (result.stderr ?? '').toString(),
        exitCode: result.status ?? 1,
      }
    }

    // 4. Build plugin from source
    execFileSync('npm', ['run', 'build'], {
      cwd: pluginRoot,
      timeout: 60_000,
      stdio: 'pipe',
    })

    // 5. Install plugin from dist/
    const distDir = resolve(pluginRoot, 'dist')
    const installResult = run(['plugins', 'install', distDir])
    console.log(`[baas-env] openclaw@${openclawVersion} fixture install: ${installResult.stdout.trim() || installResult.stderr.trim()}`)
    const installOut = installResult.stdout + installResult.stderr
    if (installResult.exitCode !== 0 && !installOut.includes('already')) {
      throw new Error(
        `Plugin install failed (exit ${installResult.exitCode}):\n${installResult.stderr}\n${installResult.stdout}`,
      )
    }

    return { base, stateDir, configPath, env: fixtureEnv, run, cleanup }
  } catch (err) {
    cleanup()
    throw err
  }
}
