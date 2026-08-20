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
    'IDE-Tool-1': {
      displayName: 'IDE Tool 1',
      icon: 'fa-brands fa-vs-code',
      color: '#007ACC',
      patterns: ['vscode', 'copilot', 'github-copilot', 'visual-studio-code', 'ide-tool-1']
    },
    'Desktop-App-1': {
      displayName: 'Desktop App 1',
      icon: 'fa-solid fa-robot',
      color: '#D97706',
      patterns: ['claude-desktop', 'claude_desktop', 'anthropic-client', 'desktop-app-1']
    },
    'IDE-Tool-2': {
      displayName: 'IDE Tool 2',
      icon: 'fa-solid fa-i-cursor',
      color: '#7C3AED',
      patterns: ['cursor', 'anysphere', 'cursor-ide', 'ide-tool-2']
    },
    'CLI-Agent-1': {
      displayName: 'CLI Agent 1',
      icon: 'fa-solid fa-terminal',
      color: '#10B981',
      patterns: ['cline', 'saoudrizwan', 'cline-vscode', 'cli-agent-1']
    },
    'Generic-Client-1': {
      displayName: 'Generic Client 1',
      icon: 'fa-solid fa-hand-fist',
      color: '#EF4444',
      patterns: ['openclaw', 'open-claw', 'generic-client-1']
    },
    'Web-Agent-1': {
      displayName: 'Web Agent 1',
      icon: 'fa-solid fa-microchip',
      color: '#F59E0B',
      patterns: ['kilo', 'kilocode', 'kilo-code', 'web-agent-1']
    },
    'Router-Client': {
      displayName: 'Router Client',
      icon: 'fa-solid fa-route',
      color: '#6366F1',
      patterns: ['openrouter', 'router-client']
    },
    'LLM-Agent-1': {
      displayName: 'LLM Agent 1',
      icon: 'fa-solid fa-code',
      color: '#10B981',
      patterns: ['codex', 'openai-codex', 'llm-agent-1']
    },
    'MCP-Client': {
      displayName: 'MCP Client',
      icon: 'fa-solid fa-plug',
      color: '#8B5CF6',
      patterns: ['mcp', 'model-context-protocol']
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
      patterns: ['postman', 'api-tester']
    },
    'curl': {
      displayName: 'cURL / Terminal',
      icon: 'fa-solid fa-terminal',
      color: '#6B7280',
      patterns: ['curl/', 'wget']
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
    'vs-code-copilot': 'IDE-Tool-1',
    'vscode-copilot': 'IDE-Tool-1',
    'vs-code': 'IDE-Tool-1',
    'visual-studio-code': 'IDE-Tool-1',
    'github-copilot': 'IDE-Tool-1',
    'claude-desktop': 'Desktop-App-1',
    'claude_desktop': 'Desktop-App-1',
    'anthropic-client': 'Desktop-App-1',
    'cursor-ide': 'IDE-Tool-2',
    'cline-vscode': 'CLI-Agent-1',
    'kilo-code': 'Web-Agent-1',
    'kilocode': 'Web-Agent-1',
    'open-claw': 'Generic-Client-1',
    'openrouter': 'Router-Client',
    'codex': 'LLM-Agent-1',
    'openai-codex': 'LLM-Agent-1',
    'mcp-client': 'MCP-Client',
    'model-context-protocol': 'MCP-Client',
    'fmc-dashboard': 'Web-Dashboard',
    'free-models-club': 'Web-Dashboard',
    'fmc-ui': 'Web-Dashboard',
    'postman': 'API-Tester',
    'curl': 'curl',
    'wget': 'curl'
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
