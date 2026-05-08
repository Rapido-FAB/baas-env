/** Default OpenClaw version — matches the tested stable release */
export declare const DEFAULT_OPENCLAW_VERSION = "2026.5.7";
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