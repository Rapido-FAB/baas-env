/** Default OpenClaw version — matches the tested stable release */
export declare const DEFAULT_OPENCLAW_VERSION = "2026.6.11";
/**
 * The PATH the fixture spawns `openclaw` with. The live-integration tier targets
 * **openclaw 2026.6.11** (the plugin's declared compatibility floor), installed
 * via `npm i -g` into the Homebrew prefix (`/opt/homebrew/bin/openclaw`) and run
 * under Homebrew `node@24`. `/opt/homebrew/bin` precedes `node@24/bin` so
 * `openclaw` resolves to the 6.11 global while `node` still resolves to node@24
 * (openclaw's `#!/usr/bin/env node` shebang needs a node >=22 on PATH). Applied
 * programmatically so every consumer of `createFixture` resolves the same binary.
 *
 * Precedence: an explicit `BAAS_FIXTURE_PATH` override wins; else this pinned
 * PATH when that `openclaw` is actually present (a dev machine); else the
 * inherited `process.env.PATH` — so CI and other machines never break.
 */
export declare const OPENCLAW_2026_6_11_PATH = "/opt/homebrew/bin:/opt/homebrew/opt/node@24/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin";
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