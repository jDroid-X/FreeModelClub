/**
 * PromptOrchestratorService.js
 * Purpose: Antigravity-class Prompt Orchestrator — constructs structured multi-section prompts
 *          via parallel context hydration from session, workspace, rules, tools, and attachments.
 * Dependencies: AntigravityToolExecutionEngine, fs, path
 * Architecture: Dimension 2 (Services & Agents) — Execution Engine Layer
 */

const fs = require('fs');
const path = require('path');

class PromptOrchestratorService {

  // ── Agent Persona Identity ──
  static AGENT_IDENTITY = `You are jDroid-X-FMC, an advanced AI coding and productivity agent built for FreeModelsClub.
You have access to a set of tools to help you accomplish tasks. When a task requires file operations,
web searches, code execution, or image generation, you MUST use the appropriate tool instead of guessing.
You operate in a strict OOPS-based MVC architecture following the 7-Stage Waterfall Closed-Loop Workflow.
Format all responses in GitHub-Flavored Markdown with rich formatting (code blocks, tables, Mermaid diagrams, alerts).
When reasoning through complex problems, wrap your thinking in <think>...</think> tags.`;

  // ── Tool Schemas (JSON definitions the model can call) ──
  static TOOL_SCHEMAS = [
    {
      type: 'function',
      function: {
        name: 'web_search',
        description: 'Search the web for real-time information using DuckDuckGo. Use for current events, documentation, or any factual queries.',
        parameters: {
          type: 'object',
          properties: { query: { type: 'string', description: 'The search query to look up.' } },
          required: ['query']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'read_file',
        description: 'Read the contents of a file from the local workspace filesystem.',
        parameters: {
          type: 'object',
          properties: { filePath: { type: 'string', description: 'Absolute or relative path to the file to read.' } },
          required: ['filePath']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'write_file',
        description: 'Write or overwrite content to a file at the specified path. Creates parent directories if needed.',
        parameters: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Target file path (absolute or relative).' },
            content: { type: 'string', description: 'The full file content to write.' }
          },
          required: ['filePath', 'content']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'run_command',
        description: 'Execute a Windows PowerShell command safely. Use for running scripts, npm commands, git operations, etc.',
        parameters: {
          type: 'object',
          properties: { commandLine: { type: 'string', description: 'The exact command to execute in PowerShell.' } },
          required: ['commandLine']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'grep_search',
        description: 'Search for a text pattern across files in the workspace using grep/ripgrep.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The text pattern or regex to search for.' },
            searchPath: { type: 'string', description: 'The directory or file path to search within.' }
          },
          required: ['query']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'generate_image',
        description: 'Generate an AI image or graphic asset based on a text prompt. Returns a URL to the generated image.',
        parameters: {
          type: 'object',
          properties: {
            prompt: { type: 'string', description: 'Text prompt describing the image to generate.' },
            imageName: { type: 'string', description: 'Short name for the generated image file (lowercase, underscores).' }
          },
          required: ['prompt']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'browse_url',
        description: 'Fetch and extract text content from a web URL. Converts HTML to readable text.',
        parameters: {
          type: 'object',
          properties: { url: { type: 'string', description: 'The URL to fetch content from.' } },
          required: ['url']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'youtube_transcript',
        description: 'Extract transcript/captions from a YouTube video URL.',
        parameters: {
          type: 'object',
          properties: { videoUrl: { type: 'string', description: 'The YouTube video URL.' } },
          required: ['videoUrl']
        }
      }
    }
  ];

  /**
   * Build the full Antigravity-style structured prompt from parallel context threads.
   * @param {Object} opts
   * @param {Array} opts.messages - Chat messages array [{role, content}]
   * @param {string} opts.userText - Current user input
   * @param {string} opts.systemPrompt - Session-level system prompt override
   * @param {Object} opts.workspaceContext - {openFiles, cursorPosition, workspacePath}
   * @param {Array} opts.attachments - [{name, type, data}]
   * @param {string} opts.agentMode - 'Agent' | 'Ask' | 'Plan'
   * @param {number} opts.maxContextTokens - Token budget for context window
   * @returns {Object} {messages: Array, tools: Array, metadata: Object}
   */
  static async buildPrompt(opts = {}) {
    const startTime = Date.now();
    const {
      messages = [],
      userText = '',
      systemPrompt = '',
      workspaceContext = {},
      attachments = [],
      agentMode = 'Agent',
      maxContextTokens = 120000
    } = opts;

    // ── Phase 1: Parallel Context Hydration ──
    const [sessionCtx, workspaceCtx, rulesCtx, attachCtx] = await Promise.all([
      this._hydrateSessionContext(messages, systemPrompt),
      this._hydrateWorkspaceContext(workspaceContext),
      this._hydrateRulesContext(agentMode),
      this._hydrateAttachmentContext(attachments)
    ]);

    // ── Phase 2: Sequential Prompt Assembly ──
    const systemSections = [];

    // Section 1: Identity
    systemSections.push(`<identity>\n${this.AGENT_IDENTITY}\n</identity>`);

    // Section 2: Agent Mode
    const modeDirective = this._getAgentModeDirective(agentMode);
    if (modeDirective) systemSections.push(`<agent_mode>\n${modeDirective}\n</agent_mode>`);

    // Section 3: Workspace Context
    if (workspaceCtx) systemSections.push(`<workspace_context>\n${workspaceCtx}\n</workspace_context>`);

    // Section 4: Rules
    if (rulesCtx) systemSections.push(`<rules>\n${rulesCtx}\n</rules>`);

    // Section 5: Custom System Prompt
    if (sessionCtx.customSystemPrompt) {
      systemSections.push(`<custom_instructions>\n${sessionCtx.customSystemPrompt}\n</custom_instructions>`);
    }

    // Section 6: Attachment Context
    if (attachCtx) systemSections.push(`<attachments>\n${attachCtx}\n</attachments>`);

    // Section 7: Response Guidelines
    systemSections.push(`<response_guidelines>
- Format responses in GitHub-Flavored Markdown
- Use fenced code blocks with language specification for syntax highlighting
- Use Mermaid diagrams (fenced code blocks with \`mermaid\` language) for architectural flows
- Use GitHub-style alerts: > [!NOTE], > [!WARNING], > [!IMPORTANT], > [!TIP], > [!CAUTION]
- Use tables for structured data comparisons
- Wrap complex reasoning in <think>...</think> tags
- When writing code, always specify the file path and language
- For multi-step tasks, create numbered step lists
</response_guidelines>`);

    // Assemble final system message
    const fullSystemPrompt = systemSections.join('\n\n');

    // ── Phase 3: Message Assembly with Token Budget ──
    const assembledMessages = this._assembleMessages(
      fullSystemPrompt,
      sessionCtx.conversationHistory,
      userText,
      maxContextTokens
    );

    // Decide whether to include tools based on agent mode
    const tools = agentMode === 'Ask' ? undefined : this.TOOL_SCHEMAS;

    const metadata = {
      contextHydrationMs: Date.now() - startTime,
      sectionsInjected: systemSections.length,
      messagesCount: assembledMessages.length,
      estimatedTokens: this._estimateTokens(JSON.stringify(assembledMessages)),
      agentMode,
      hasTools: !!tools
    };

    return { messages: assembledMessages, tools, metadata };
  }

  // ── Context Hydration Threads (Parallel) ──

  static async _hydrateSessionContext(messages, customSystemPrompt) {
    const conversationHistory = (messages || [])
      .filter(m => m.role && m.content)
      .map(m => ({ role: m.role, content: m.content }));
    return { conversationHistory, customSystemPrompt: customSystemPrompt || '' };
  }

  static async _hydrateWorkspaceContext(ctx) {
    if (!ctx || (!ctx.workspacePath && !ctx.openFiles)) return '';
    const parts = [];
    if (ctx.workspacePath) parts.push(`Workspace Root: ${ctx.workspacePath}`);
    if (ctx.openFiles && ctx.openFiles.length > 0) {
      parts.push(`Open Files: ${ctx.openFiles.join(', ')}`);
    }
    if (ctx.cursorPosition) parts.push(`Active Cursor: Line ${ctx.cursorPosition.line}, File: ${ctx.cursorPosition.file}`);
    parts.push(`OS: Windows`);
    return parts.join('\n');
  }

  static async _hydrateRulesContext(agentMode) {
    const rules = [
      'Follow OOPS-based MVC architecture for all code generation.',
      'Never generate placeholder or hardcoded credentials.',
      'Reuse existing modules — avoid regenerating identical code.',
      'Keep source files under 2000 lines maximum.',
      'All branches must logically close or merge back into the main workflow.'
    ];
    if (agentMode === 'Plan') {
      rules.push('Create a detailed implementation plan before writing any code.');
      rules.push('Break complex tasks into numbered steps with file-level granularity.');
    }
    return rules.map((r, i) => `${i + 1}. ${r}`).join('\n');
  }

  static async _hydrateAttachmentContext(attachments) {
    if (!attachments || attachments.length === 0) return '';
    return attachments.map(att => {
      if (att.type && att.type.startsWith('image/')) {
        return `[Image Attachment: ${att.name}] (visual content provided)`;
      }
      if (att.extractedText) return `[File: ${att.name}]\n${att.extractedText.substring(0, 5000)}`;
      return `[Attached: ${att.name} (${att.type || 'unknown type'})]`;
    }).join('\n\n');
  }

  // ── Agent Mode Directives ──

  static _getAgentModeDirective(mode) {
    const directives = {
      'Agent': 'You are in AGENT mode. You can read/write files, execute commands, search the web, and generate images. Use tools proactively to accomplish tasks. For write operations, explain what you\'re doing before executing.',
      'Ask': 'You are in ASK mode. Answer questions directly using your knowledge. Do NOT use any tools. Provide thorough explanations with code examples.',
      'Plan': 'You are in PLAN mode. Create detailed implementation plans with step-by-step breakdowns. Use read-only tools (web search, file read, grep) for research but do NOT write files or execute commands until the user approves the plan.'
    };
    return directives[mode] || directives['Agent'];
  }

  // ── Message Assembly with Token Budget (Sliding Window Context) ──

  static _assembleMessages(systemPrompt, history, userText, maxTokens = 4000) {
    const result = [{ role: 'system', content: systemPrompt }];

    // Filter out trailing user message if it matches userText to prevent duplication
    const cleanHistory = [...history];
    if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === 'user') {
      cleanHistory.pop();
    }

    let usedTokens = this._estimateTokens(systemPrompt);
    const userTokens = this._estimateTokens(userText);
    const reserveTokens = userTokens + 800;

    // Sliding window of most recent messages
    const reversedHistory = cleanHistory.reverse();
    const historyToInclude = [];

    for (const msg of reversedHistory) {
      const msgTokens = this._estimateTokens(msg.content);
      if (usedTokens + msgTokens + reserveTokens > maxTokens) break;
      historyToInclude.unshift(msg);
      usedTokens += msgTokens;
    }

    result.push(...historyToInclude);
    if (userText) {
      result.push({ role: 'user', content: userText });
    }
    return result;
  }

  // ── Token Estimation (chars/4 heuristic) ──
  static _estimateTokens(text) {
    if (!text) return 0;
    return Math.max(1, Math.round(text.length / 4));
  }
}

module.exports = PromptOrchestratorService;
