/**
 * Environment-variable hygiene helpers used whenever baas-env spawns the
 * openclaw CLI. Strips vitest env vars that make openclaw silently no-op
 * when spawned from a vitest worker.
 */
export function stripVitestEnv(
  env: NodeJS.ProcessEnv = process.env,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) continue
    if (k === 'VITEST' || k === 'VITEST_WORKER_ID' || k === 'VITEST_POOL_ID' || k.startsWith('VITEST_')) continue
    out[k] = v
  }
  out['NODE_ENV'] = 'development'
  return out
}
