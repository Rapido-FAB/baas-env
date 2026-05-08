/**
 * @rapido-fab/baas-env — FABaaS e2e test fixture provisioner.
 *
 * Provides isolated OpenClaw environment helpers for integration and e2e tests.
 * Does NOT install openclaw — uses whatever `openclaw` binary is on PATH.
 */
export { createFixture, DEFAULT_OPENCLAW_VERSION } from './fixture.js';
export { applyClaudeCliAgentDefaults, CLAUDE_CLI_AGENT_DEFAULTS } from './test-defaults.js';
export { stripVitestEnv } from './env.js';
//# sourceMappingURL=index.js.map