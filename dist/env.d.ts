/**
 * Environment-variable hygiene helpers used whenever baas-env spawns the
 * openclaw CLI. Strips vitest env vars that make openclaw silently no-op
 * when spawned from a vitest worker.
 */
export declare function stripVitestEnv(env?: NodeJS.ProcessEnv): Record<string, string>;
//# sourceMappingURL=env.d.ts.map