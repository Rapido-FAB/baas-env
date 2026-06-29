/** Default OpenClaw version — matches the tested stable release */
export declare const DEFAULT_OPENCLAW_VERSION = "2026.5.28";
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
export declare const OPENCLAW_2026_5_28_PATH = "/opt/homebrew/opt/node@24/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin";
export declare function fixturePath(): string;
export interface FixtureOptions {
    /**
     * Expected openclaw version. Printed in fixture logs; the binary on PATH
     * is used regardless (baas-env does not install openclaw itself).
     * Default: DEFAULT_OPENCLAW_VERSION.
     */
    openclawVersion?: string;
    /** Root of /tmp fixture area. Default: /tmp/baas */
    fixtureRoot?: string;
}
export interface Fixture {
    /** Temp root (parent of .openclaw state dir) */
    base: string;
    /** Isolated .openclaw state dir */
    stateDir: string;
    /** Path to the isolated openclaw.json config */
    configPath: string;
    /** Environment vars that isolate OpenClaw to the fixture */
    env: Record<string, string>;
    /** Run openclaw <args> in the fixture */
    run(args: string[], opts?: {
        timeoutMs?: number;
    }): RunResult;
    /** Tear down everything */
    cleanup(): void;
}
export interface RunResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}
export declare function createFixture(pluginRoot: string, opts?: FixtureOptions): Fixture;
//# sourceMappingURL=fixture.d.ts.map