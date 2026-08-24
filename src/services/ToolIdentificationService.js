/**
 * ToolIdentificationService.js
 * Purpose: Identifies which AI tool/client is making each API request by parsing headers
 *          (X-Tool-Name, User-Agent, X-Client-Id) and matching against known tool signatures.
 *          Provides tool fingerprinting for API distribution logging and conflict detection.
 */

class ToolIdentificationService {
  /**
   * Known tool registry — patterns used for regex matching against User-Agent / headers.
   * Each entry: { displayName, icon (FontAwesome), color (hex), patterns (regex fragments) }
   */
  static KNOWN_TOOLS = {
    'vscode': {
      displayName: 'VS Code',
      icon: 'fa-solid fa-code',
      color: '#007ACC',
      patterns: ['vscode', 'copilot', 'github-copilot', 'visual-studio-code', 'ide-tool-1']
    },
    'cursor': {
      displayName: 'Cursor IDE',
      icon: 'fa-solid fa-i-cursor',
      color: '#7C3AED',
      patterns: ['cursor', 'anysphere', 'cursor-ide', 'ide-tool-2']
    },
    'windsurf': {
      displayName: 'Windsurf IDE',
      icon: 'fa-solid fa-water',
      color: '#F97316',
      patterns: ['windsurf', 'codeium']
    },
    'cline': {
      displayName: 'Cline',
      icon: 'fa-solid fa-terminal',
      color: '#3B82F6',
      patterns: ['cline', 'saoudrizwan', 'cline-vscode', 'cli-agent-1']
    },
    'zencode': {
      displayName: 'ZenCode',
      icon: 'fa-solid fa-brain',
      color: '#8B5CF6',
      patterns: ['zencode', 'zen-code']
    },
    'pearai': {
      displayName: 'PearAI',
      icon: 'fa-solid fa-leaf',
      color: '#14B8A6',
      patterns: ['pearai', 'pear-ai']
    },
    'codex': {
      displayName: 'Codex CLI',
      icon: 'fa-solid fa-microchip',
      color: '#10B981',
      patterns: ['codex', 'openai-codex', 'llm-agent-1']
    },
    'openclaw': {
      displayName: 'OpenClaw',
      icon: 'fa-solid fa-hand-fist',
      color: '#EF4444',
      patterns: ['openclaw', 'open-claw', 'generic-client-1']
    },
    'ollama': {
      displayName: 'Ollama Proxy',
      icon: 'fa-solid fa-cube',
      color: '#F59E0B',
      patterns: ['ollama', 'ollama-bridge']
    },
    'curl': {
      displayName: 'Terminal / cURL',
      icon: 'fa-solid fa-terminal',
      color: '#6B7280',
      patterns: ['curl/', 'wget', 'httpie']
    },
    'claude': {
      displayName: 'Claude Desktop',
      icon: 'fa-solid fa-message',
      color: '#D97706',
      patterns: ['claude-desktop', 'claude_desktop', 'anthropic-client', 'desktop-app-1']
    },
    'jan': {
      displayName: 'Jan.ai',
      icon: 'fa-solid fa-robot',
      color: '#F43F5E',
      patterns: ['jan', 'jan-ai', 'jan.ai']
    },
    'anythingllm': {
      displayName: 'AnythingLLM',
      icon: 'fa-solid fa-database',
      color: '#A855F7',
      patterns: ['anythingllm', 'anything-llm']
    },
    'openwebui': {
      displayName: 'Open WebUI',
      icon: 'fa-solid fa-globe',
      color: '#E2E8F0',
      patterns: ['openwebui', 'open-webui', 'ollama-webui']
    },
    'openrouter': {
      displayName: 'OpenRouter Bridge',
      icon: 'fa-solid fa-route',
      color: '#6366F1',
      patterns: ['openrouter', 'router-client']
    },
    'lovable': {
      displayName: 'Lovable',
      icon: 'fa-solid fa-heart',
      color: '#EF4444',
      patterns: ['lovable', 'lovable-dev']
    },
    'bolt': {
      displayName: 'Bolt.new',
      icon: 'fa-solid fa-bolt',
      color: '#EAB308',
      patterns: ['bolt.new', 'bolt-new', 'stackblitz']
    },
    'mcp': {
      displayName: 'MCP Server',
      icon: 'fa-solid fa-network-wired',
      color: '#8B5CF6',
      patterns: ['mcp', 'model-context-protocol', 'mcp-server', 'mcp-client']
    },
    'Web-Dashboard': {
      displayName: 'Web Dashboard',
      icon: 'fa-solid fa-gauge-high',
      color: '#06B6D4',
      patterns: ['fmc-dashboard', 'free-models-club', 'fmc-ui', 'web-dashboard']
    },
    'API-Tester': {
      displayName: 'API Tester',
      icon: 'fa-solid fa-paper-plane',
      color: '#FF6C37',
      patterns: ['postman', 'api-tester', 'insomnia']
    }
  };

  static UNKNOWN_TOOL = {
    displayName: 'Unknown Client',
    icon: 'fa-solid fa-question-circle',
    color: '#6B7280',
    patterns: []
  };

  /**
   * Main identification method — extracts tool info from an incoming HTTP request.
   * Priority: X-Tool-Name header → User-Agent regex → default 'Direct-UI'
   *
   * @param {Object} req - Express request object
   * @returns {{ toolId: string, toolName: string, toolVersion: string, toolIcon: string, toolColor: string, clientSessionId: string, detectionMethod: string }}
   */
  static identifyTool(req) {
    // 1. Explicit X-Tool-Name header (highest priority)
    const explicitToolName = req.headers['x-tool-name'] || req.headers['x-tool_name'];
    if (explicitToolName) {
      const normalized = this._normalizeToolName(explicitToolName);
      const known = this.KNOWN_TOOLS[normalized];
      return {
        toolId: normalized,
        toolName: known ? known.displayName : explicitToolName,
        toolVersion: req.headers['x-tool-version'] || req.headers['x-tool_version'] || '',
        toolIcon: known ? known.icon : this.UNKNOWN_TOOL.icon,
        toolColor: known ? known.color : this.UNKNOWN_TOOL.color,
        clientSessionId: req.headers['x-client-id'] || req.headers['x-client_id'] || this._generateSessionId(req),
        detectionMethod: 'header-explicit'
      };
    }

    // 2. User-Agent pattern matching
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    if (userAgent) {
      for (const [toolId, toolInfo] of Object.entries(this.KNOWN_TOOLS)) {
        for (const pattern of toolInfo.patterns) {
          if (userAgent.includes(pattern.toLowerCase())) {
            // Extract version from User-Agent if present (e.g. "cursor/1.2.0")
            const versionMatch = userAgent.match(new RegExp(`${pattern}[\\/\\s]v?([\\d.]+)`, 'i'));
            return {
              toolId,
              toolName: toolInfo.displayName,
              toolVersion: versionMatch ? versionMatch[1] : '',
              toolIcon: toolInfo.icon,
              toolColor: toolInfo.color,
              clientSessionId: req.headers['x-client-id'] || this._generateSessionId(req),
              detectionMethod: 'user-agent'
            };
          }
        }
      }
    }

    // 3. Referer-based detection (some tools set Referer)
    const referer = (req.headers['referer'] || '').toLowerCase();
    if (referer) {
      for (const [toolId, toolInfo] of Object.entries(this.KNOWN_TOOLS)) {
        for (const pattern of toolInfo.patterns) {
          if (referer.includes(pattern.toLowerCase())) {
            return {
              toolId,
              toolName: toolInfo.displayName,
              toolVersion: '',
              toolIcon: toolInfo.icon,
              toolColor: toolInfo.color,
              clientSessionId: req.headers['x-client-id'] || this._generateSessionId(req),
              detectionMethod: 'referer'
            };
          }
        }
      }
    }

    // 4. Default — Direct UI or unknown
    return {
      toolId: 'Direct-UI',
      toolName: 'Web Dashboard',
      toolVersion: '',
      toolIcon: this.KNOWN_TOOLS['Web-Dashboard'].icon,
      toolColor: this.KNOWN_TOOLS['Web-Dashboard'].color,
      clientSessionId: req.headers['x-client-id'] || `ui_${Date.now()}`,
      detectionMethod: 'default'
    };
  }

  /**
   * Alias map: normalized raw input → KNOWN_TOOLS key.
   * Handles multi-word tool names sent via X-Tool-Name header
   * (e.g. "VS Code Copilot" → "VSCode-Copilot")
   */
  static TOOL_ALIASES = {
    'vs-code-copilot': 'vscode',
    'vscode-copilot': 'vscode',
    'vs-code': 'vscode',
    'visual-studio-code': 'vscode',
    'github-copilot': 'vscode',
    'cursor-ide': 'cursor',
    'cursor': 'cursor',
    'windsurf-ide': 'windsurf',
    'windsurf': 'windsurf',
    'cline-vscode': 'cline',
    'cline': 'cline',
    'zencode': 'zencode',
    'zen-code': 'zencode',
    'pearai': 'pearai',
    'pear-ai': 'pearai',
    'codex-cli': 'codex',
    'codex': 'codex',
    'openai-codex': 'codex',
    'open-claw': 'openclaw',
    'openclaw': 'openclaw',
    'ollama-proxy': 'ollama',
    'ollama': 'ollama',
    'curl': 'curl',
    'wget': 'curl',
    'terminal-curl': 'curl',
    'claude-desktop': 'claude',
    'claude_desktop': 'claude',
    'anthropic-client': 'claude',
    'jan-ai': 'jan',
    'jan': 'jan',
    'anythingllm': 'anythingllm',
    'anything-llm': 'anythingllm',
    'openwebui': 'openwebui',
    'open-webui': 'openwebui',
    'openrouter-bridge': 'openrouter',
    'openrouter': 'openrouter',
    'lovable': 'lovable',
    'bolt-new': 'bolt',
    'bolt': 'bolt',
    'mcp-server': 'mcp',
    'mcp-client': 'mcp',
    'mcp': 'mcp',
    'model-context-protocol': 'mcp',
    'fmc-dashboard': 'Web-Dashboard',
    'free-models-club': 'Web-Dashboard',
    'fmc-ui': 'Web-Dashboard',
    'postman': 'API-Tester',
    'api-tester': 'API-Tester'
  };

  /**
   * Normalize a tool name string to a consistent kebab-case ID.
   * Also checks the TOOL_ALIASES map for known multi-word names.
   */
  static _normalizeToolName(raw) {
    const slug = raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    // Check alias map first, then return the slug
    return this.TOOL_ALIASES[slug] || slug;
  }

  /**
   * Generate a pseudo-session ID from request IP + User-Agent hash.
   */
  static _generateSessionId(req) {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const ua = req.headers['user-agent'] || 'no-ua';
    const hash = `${ip}_${ua}`.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
    return `sess_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Get all known tool definitions (for dashboard dropdowns / filters).
   */
  static getKnownTools() {
    return Object.entries(this.KNOWN_TOOLS).map(([id, info]) => ({
      toolId: id,
      displayName: info.displayName,
      icon: info.icon,
      color: info.color
    }));
  }
}

module.exports = ToolIdentificationService;
