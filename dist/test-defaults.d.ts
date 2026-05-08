export interface AgentDefaults {
    primary: string;
    fallbacks: string[];
}
export declare const CLAUDE_CLI_AGENT_DEFAULTS: AgentDefaults;
export declare function applyClaudeCliAgentDefaults(configPath: string, overrides?: Partial<AgentDefaults>): void;
//# sourceMappingURL=test-defaults.d.ts.map