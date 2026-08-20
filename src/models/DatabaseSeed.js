/**
 * DatabaseSeed.js
 * Purpose: Provides initial seed data records for Users, System Config, Providers, Models, API Keys, User Manual & Help Docs
 * Dependencies: None
 */

class DatabaseSeed {
  static getDefaultUsers() {
    return [
      {
        id: 'usr_default',
        email: 'FreeModelsClub@jdroidxy.com',
        password: 'Admin@1234',
        mustChangePassword: true,
        role: 'admin',
        createdAt: new Date().toISOString()
      }
    ];
  }

  static getDefaultConfig() {
    return {
      appName: 'FreeModelsClub Localhost Smart Chatbot',
      port: 12247,
      baseUrl: 'http://localhost:12247/v1',
      activeProviderId: 'gemini',
      default_fallback_model_id: 'gemini-2.5-flash',
      max_failover_attempts: 3,
      provider_ping_timeout_ms: 5000,
      memoReferenceUrls: [
        'https://ai.google.dev/gemini-api/docs/models/gemini',
        'https://console.groq.com/docs/models',
        'https://openrouter.ai/discover?lane=free'
      ],
      updatedAt: new Date().toISOString()
    };
  }

  static getDefaultProviders() {
    return [
      {
        id: 'gemini',
        displayName: 'Google Gemini AI Studio (OpenAI Endpoint)',
        protocol: 'Gemini API',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        apiKey: '',
        isActive: false,
        freeOnly: true,
        docsUrl: 'https://ai.google.dev/gemini-api/docs/models/gemini',
        registeredAt: new Date().toISOString()
      },
      {
        id: 'groq',
        displayName: 'Groq Cloud API (Ultra-Fast Free Tier)',
        protocol: 'OpenAI Compatible',
        baseUrl: 'https://api.groq.com/openai/v1',
        apiKey: '',
        isActive: false,
        freeOnly: true,
        docsUrl: 'https://console.groq.com/docs/models',
        registeredAt: new Date().toISOString()
      },
      {
        id: 'openrouter',
        displayName: 'OpenRouter Free Models',
        protocol: 'OpenAI Compatible',
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKey: '',
        isActive: false,
        freeOnly: true,
        docsUrl: 'https://openrouter.ai/discover?lane=free',
        registeredAt: new Date().toISOString()
      },
      {
        id: 'ollama',
        displayName: 'Ollama / Localhost Models',
        protocol: 'Ollama Local API',
        baseUrl: 'http://localhost:11434/v1',
        apiKey: 'ollama-local',
        isActive: false,
        freeOnly: true,
        docsUrl: 'https://ollama.ai',
        registeredAt: new Date().toISOString()
      }
    ];
  }

  static getDefaultModels() {
    return [
      {
        id: 'gemini-2.5-pro',
        providerId: 'gemini',
        providerName: 'Google Gemini AI Studio',
        modelId: 'gemini-2.5-pro',
        modelName: 'Gemini 2.5 Pro (Ultra Flagship Free Tier)',
        isFree: true,
        family: 'Gemini Family',
        coreSkill: 'Advanced Reasoning & Coding',
        contextWindow: 1048576,
        maxTokens: 65536,
        latencyMs: 120,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        requestCount: 0,
        status: 'Active',
        metadata: {
          description: 'Google state-of-the-art 1M context multimodal reasoning powerhouse model.',
          speedTokensPerSec: 180,
          freeTierLimit: '5 RPM / 250 RPD'
        }
      },
      {
        id: 'gemini-2.5-flash',
        providerId: 'gemini',
        providerName: 'Google Gemini AI Studio',
        modelId: 'gemini-2.5-flash',
        modelName: 'Gemini 2.5 Flash (Ultra Fast Free Tier)',
        isFree: true,
        family: 'Gemini Family',
        coreSkill: 'High-Speed Multimodal Chat',
        contextWindow: 1048576,
        maxTokens: 65536,
        latencyMs: 80,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        requestCount: 0,
        status: 'Active',
        metadata: {
          description: 'Next-gen lightweight multimodal model offering sub-second latencies and massive context.',
          speedTokensPerSec: 350,
          freeTierLimit: '15 RPM / 1,500 RPD'
        }
      },
      {
        id: 'gemini-2.0-flash',
        providerId: 'gemini',
        providerName: 'Google Gemini AI Studio',
        modelId: 'gemini-2.0-flash',
        modelName: 'Gemini 2.0 Flash (Free)',
        isFree: true,
        family: 'Gemini Family',
        coreSkill: 'Multimodal Chat & Realtime Agents',
        contextWindow: 1048576,
        maxTokens: 8192,
        latencyMs: 95,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        requestCount: 0,
        status: 'Active',
        metadata: {
          description: 'High performance Google Gemini 2.0 generation model with multimodal tool execution.',
          speedTokensPerSec: 320,
          freeTierLimit: '15 RPM / 1,500 RPD'
        }
      },
      {
        id: 'llama-3.3-70b-versatile',
        providerId: 'groq',
        providerName: 'Groq Cloud API',
        modelId: 'llama-3.3-70b-versatile',
        modelName: 'Llama 3.3 70B Versatile (Free)',
        isFree: true,
        family: 'Llama Family',
        coreSkill: 'Coding',
        contextWindow: 128000,
        maxTokens: 32768,
        latencyMs: 180,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        requestCount: 0,
        status: 'Active',
        metadata: {
          description: 'Ultra-fast 70B parameter open weights model hosted on Groq LPU hardware.',
          speedTokensPerSec: 300,
          freeTierLimit: '30 RPM / 14,400 RPD'
        }
      },
      {
        id: 'llama-3.1-8b-instant',
        providerId: 'groq',
        providerName: 'Groq Cloud API',
        modelId: 'llama-3.1-8b-instant',
        modelName: 'Llama 3.1 8B Instant (Free)',
        isFree: true,
        family: 'Llama Family',
        coreSkill: 'Fast Chat & Instruction',
        contextWindow: 128000,
        maxTokens: 8192,
        latencyMs: 90,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        requestCount: 0,
        status: 'Active',
        metadata: {
          description: 'Lightning-fast open weights 8B model for real-time applications.',
          speedTokensPerSec: 750,
          freeTierLimit: '30 RPM / 14,400 RPD'
        }
      }
    ];
  }

  static getDefaultApiKeys() {
    return [
      {
        id: 'key_default_admin',
        key: 'fmc-live-key-jdroidxy-2026',
        label: 'Default FMC Tool API Key',
        clientApp: 'Antigravity / VS Code / Claude',
        createdAt: new Date().toISOString(),
        isActive: true
      }
    ];
  }

  static getDefaultSystemLogs() {
    return [
      {
        id: 'sys_init',
        timestamp: new Date().toISOString(),
        category: 'SYSTEM_STARTUP',
        level: 'INFO',
        message: 'FreeModelsClub Localhost Smart Chatbot Server initialized on port 12247.',
        details: { environment: 'Localhost', host: 'localhost:12247' }
      }
    ];
  }

  static getDefaultUserManual() {
    return [
      {
        step: 1,
        title: 'Sign In to Localhost Service',
        description: 'Open http://localhost:12247 in browser. Use pre-filled default credentials: Email: FreeModelsClub@jdroidxy.com, Password: Admin@1234.',
        hilAction: 'Click Sign In button. System verifies session and redirects to Provider Registration screen if no provider is active.'
      },
      {
        step: 2,
        title: 'Register & Configure Free AI Provider',
        description: 'If no provider is active, navigate to Provider Registration. Select API Protocol (Groq, Gemini, OpenRouter, Together, Mistral, Ollama), enter Base URL and API Key.',
        hilAction: 'Click Search Free Models button to fetch available free models, toggle multi-select checkboxes, and click Register Provider.'
      },
      {
        step: 3,
        title: 'Generate Integration Snippets',
        description: 'Go to Integration Code screen to view ready-to-run cURL, Python, Node.js, Go, and PHP scripts pointing to http://localhost:12247/v1.',
        hilAction: 'Copy script snippets or paste reference documentation URLs in the editable Memo box for lookup.'
      },
      {
        step: 4,
        title: 'Test Online Playground Chatbot',
        description: 'Open Playground page. Select an active free model or Model Combo from top dropdown, inspect real-time token telemetry header, and send chat prompts.',
        hilAction: 'Inspect live streaming or non-streaming responses, token counters, and prompt latency.'
      },
      {
        step: 5,
        title: 'Connect External Clients & Tools (Claude, VSCode, Antigravity, Kiro)',
        description: 'Go to Settings page to copy localhost endpoint URLs and generate custom client API Keys.',
        hilAction: 'Configure your IDE extension or tool to point to Base URL http://localhost:12247/v1 with Bearer key.'
      },
      {
        step: 6,
        title: 'Monitor Diagnostic Reports & Logs',
        description: 'Visit Reports screen to inspect API Diagnostic logs (tokens, latency, error root cause) and System audit events.',
        hilAction: 'Use Clear Logs button or view closed-loop diagnostic traces if errors occur.'
      },
      {
        step: 7,
        title: 'Create & Manage Model Combos',
        description: 'Navigate to Model Club -> Model Combo tab. Click "Create Model Combo" or quick-create from any Model Family to build load-balancing pools.',
        hilAction: 'Choose strategy (Round Robin vs. Fallback), select active models, enter a custom identifier name (e.g. claude-opus), and save.'
      },
      {
        step: 8,
        title: 'Sync with Claude Desktop & Anthropic Tools',
        description: 'In Settings -> Tool Connections -> Claude Chatbot, copy the complete configuration JSON snippet into your claude_desktop_config.json file.',
        hilAction: 'Verify that ANTHROPIC_BASE_URL points to http://localhost:12247/v1. The proxy backend automatically translates Anthropic /v1/messages to OpenAI format.'
      },
      {
        step: 9,
        title: 'Manage Dynamic Master Data Config',
        description: 'Navigate to Settings -> Master Data tab to update system-wide defaults, ports, and retry limits dynamically without code modifications.',
        hilAction: 'Input custom Brand Name, Localhost Port, Fallback Model ID, and click Save System Config.'
      }
    ];
  }

  static getDefaultHelpDocs() {
    return {
      dashboard: '💡 HINT: Dashboard displays overall provider status, active free models count, total tokens processed, and estimated cost savings.',
      playground: '💡 HINT: Choose any registered free model or Model Combo from the top dropdown. The header telemetry row updates live showing prompt tokens, completion tokens, latency, and context limits.',
      registration: '💡 HINT: Select your provider protocol or enter a custom OpenAI-compatible Base URL. Click "Search Free Models" to query models live before registering.',
      config: '💡 HINT: Copy script snippets in cURL, Python, Node.js, Go, or PHP to connect your local scripts directly to http://localhost:12247/v1.',
      providers: '💡 HINT: View all active providers, check free model counts, edit configurations, or delete inactive providers.',
      'model-club': '💡 HINT: Use the top toggle buttons to switch between Model Family, Core Skills, and Model Combos. Build custom round-robin pools with the Model Combo button.',
      settings: '💡 HINT: Copy all active endpoint URLs, manage themes, and copy the Claude Desktop integration JSON configuration snippet.',
      reports: '💡 HINT: Toggle between API Diagnostic Logs (to inspect request payloads & failure root causes) and System Logs (audit actions).',
      manual: '💡 HINT: Follow the step-by-step HIL (Human-In-Loop) operational guide to configure providers, build combos, and link external AI tools.',
      'master-data': '💡 HINT: Configure dynamic system ports, fallback failover models, connection ping timeouts, and payload limits on the fly.'
    };
  }

  static getDefaultBIMapping() {
    return {
      version: '1.0.0',
      description: 'Lightweight BI Analytical Reporting Dimension & Metric Mapping Schema',
      updatedAt: new Date().toISOString(),
      errorTaxonomy: {
        '400': { code: 'BAD_REQUEST', category: 'Invalid Payload / Invalid Model ID', severity: 'WARN' },
        '401': { code: 'AUTH_FAILURE', category: 'Missing / Invalid Client Bearer Key', severity: 'ERROR' },
        '404': { code: 'MODEL_NOT_FOUND', category: 'Model Endpoint Removed by Provider', severity: 'ERROR' },
        '429': { code: 'RATE_LIMIT_EXCEEDED', category: 'Provider RPM / TPM Limit Reached', severity: 'WARN' },
        '500': { code: 'INTERNAL_SERVER_ERROR', category: 'Provider Upstream Exception', severity: 'ERROR' },
        '502': { code: 'BAD_GATEWAY', category: 'Provider Failover Exhausted', severity: 'ERROR' },
        '503': { code: 'SERVICE_UNAVAILABLE', category: 'Network Timeout / Provider Offline', severity: 'ERROR' }
      },
      commercialBaselineRatesPer1kTokens: {
        'Coding': 0.005,
        'General Knowledge': 0.003,
        'Reasoning & Math': 0.008,
        'Vision & Multimodal': 0.010,
        'Speed & Lightweight': 0.001,
        'default': 0.004
      },
      slaThresholds: {
        excellentMs: 300,
        acceptableMs: 1200,
        degradedMs: 2500
      },
      toolCategories: {
        'vscode': { channelName: 'VS Code Extension', type: 'IDE Extension' },
        'cursor': { channelName: 'Cursor AI Editor', type: 'IDE Extension' },
        'windsurf': { channelName: 'Windsurf AI Editor', type: 'IDE Extension' },
        'kiro': { channelName: 'Kiro CLI Tool', type: 'Terminal / CLI' },
        'antigravity': { channelName: 'Antigravity IDE Agent', type: 'Agent Framework' },
        'direct-ui': { channelName: 'Playground Web Chat UI', type: 'Web Application' },
        'unknown': { channelName: 'External API Client', type: 'Direct API' }
      },
      providerTiers: {
        'groq': 'Tier-1 High-Speed Cloud API',
        'openrouter': 'Tier-1 Free Model Aggregator',
        'gemini': 'Tier-1 Enterprise AI Studio',
        'nvidia': 'Tier-1 GPU Cloud Inference',
        'ollama': 'Tier-3 Local Desktop Inference'
      }
    };
  }
}

module.exports = DatabaseSeed;
