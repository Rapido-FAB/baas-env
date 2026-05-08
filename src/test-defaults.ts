/**
 * Post-processes an .openclaw/config/openclaw.json to configure the
 * claude-cli OAuth provider as the default model source. Used by test
 * fixtures that shouldn't require an ANTHROPIC_API_KEY.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

export interface AgentDefaults {
  primary: string
  fallbacks: string[]
}

export const CLAUDE_CLI_AGENT_DEFAULTS: AgentDefaults = {
  primary: 'claude-cli/claude-sonnet-4-6',
  fallbacks: [
    'claude-cli/claude-haiku-4-5',
    'claude-cli/claude-opus-4-6',
    'claude-cli/claude-opus-4-7',
  ],
}

export function applyClaudeCliAgentDefaults(
  configPath: string,
  overrides: Partial<AgentDefaults> = {},
): void {
  if (!existsSync(configPath)) {
    throw new Error(`applyClaudeCliAgentDefaults: config not found at ${configPath}`)
  }

  const raw = readFileSync(configPath, 'utf8')
  const cfg = JSON.parse(raw) as Record<string, unknown>

  const wanted: AgentDefaults = {
    primary: overrides.primary ?? CLAUDE_CLI_AGENT_DEFAULTS.primary,
    fallbacks: overrides.fallbacks ?? CLAUDE_CLI_AGENT_DEFAULTS.fallbacks,
  }

  const agents = (cfg.agents ??= {}) as Record<string, unknown>
  const defaults = (agents.defaults ??= {}) as Record<string, unknown>
  defaults.model = { primary: wanted.primary, fallbacks: wanted.fallbacks }

  const auth = (cfg.auth ??= {}) as Record<string, unknown>
  const profiles = (auth.profiles ??= {}) as Record<string, unknown>
  profiles['anthropic:claude-cli'] ??= { provider: 'claude-cli', mode: 'oauth' }

  writeFileSync(configPath, JSON.stringify(cfg, null, 2) + '\n')
}
