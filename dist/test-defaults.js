/**
 * Post-processes an .openclaw/config/openclaw.json to configure the
 * claude-cli OAuth provider as the default model source. Used by test
 * fixtures that shouldn't require an ANTHROPIC_API_KEY.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
export const CLAUDE_CLI_AGENT_DEFAULTS = {
    primary: 'claude-cli/claude-sonnet-5',
    fallbacks: [
        'claude-cli/claude-haiku-4-5',
        'claude-cli/claude-opus-4-8',
    ],
};
export function applyClaudeCliAgentDefaults(configPath, overrides = {}) {
    if (!existsSync(configPath)) {
        throw new Error(`applyClaudeCliAgentDefaults: config not found at ${configPath}`);
    }
    const raw = readFileSync(configPath, 'utf8');
    const cfg = JSON.parse(raw);
    const wanted = {
        primary: overrides.primary ?? CLAUDE_CLI_AGENT_DEFAULTS.primary,
        fallbacks: overrides.fallbacks ?? CLAUDE_CLI_AGENT_DEFAULTS.fallbacks,
    };
    const agents = (cfg.agents ??= {});
    const defaults = (agents.defaults ??= {});
    defaults.model = { primary: wanted.primary, fallbacks: wanted.fallbacks };
    const auth = (cfg.auth ??= {});
    const profiles = (auth.profiles ??= {});
    profiles['anthropic:claude-cli'] ??= { provider: 'claude-cli', mode: 'oauth' };
    writeFileSync(configPath, JSON.stringify(cfg, null, 2) + '\n');
}
//# sourceMappingURL=test-defaults.js.map