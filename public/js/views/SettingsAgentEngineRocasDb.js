/**
 * SettingsAgentEngineRocasDb.js
 * Purpose: ROCAS Specification Memos database for System Engine Agents (< 140 lines).
 */

class SettingsAgentEngineRocasDb {
  static getEngineSpecs() {
    return {
      provider_agent: {
        agentId: 'provider_agent',
        name: 'Provider Agent',
        role: '10-Year Expert in Live AI Provider & Free Model Discovery via Perplexity AI Real-time Search, Frontier Attached Model Engine, and Multi-Tier ChatGPT/Gemini Automated Backups',
        task: 'Execute Comprehensive 5-Stage Discovery Workflow: (1) Live Perplexity AI Online Search & Document Retrieval (Primary: Sonar Search, Backup: ChatGPT GPT-4o / Google Gemini 2.5 Flash), (2) Multi-Engine LLM Structured Extraction using Attached Model Engine (Default: GPT-4o / Gemini 2.5 Flash / Groq Llama 3.3), (3) Strict JSON Output Normalization & Context Window Inference, (4) Unlinked API Key Guard & Missing Key Protection, (5) Automatic 1-Click Staged Model & Provider Form Staging.',
        goal: '1-Click Universal AI Cloud Platform Onboarding with accurate base endpoints, API key portals, protocol connectors, and free-tier model pools with zero search downtime.',
        constraints: 'Mandatory Rule 11 Live Discovery: Never bypass live search for hardcoded catalog. Multi-tier backup failover (Perplexity -> ChatGPT -> Gemini -> Frontier Catalog). Strict JSON output with zero hallucinations. Require active API key with unlinked warning alert.',
        input: 'Target Provider or domain query string (e.g. Gemini, Groq, OpenRouter, NVIDIA, Bynara, OpenAI, Perplexity, Cerebras, SambaNova, DeepSeek, Mistral) with optional attached model/provider specification.',
        output: 'Strict JSON schema: displayName, protocol, baseUrl, apiKeyHelp, apiKeyUrl, keyPrefix, freeTierQuota, description, and models array [modelId, modelName, family, coreSkill, contextWindow, maxTokens, isFree].',
        validation: 'Dynamic Input Sanitization & Output Schema Validation: JSON.parse integrity check, non-empty protocol and baseUrl validation, multi-tier backup failover audit, and unlinked key error signaling.',
        objectives: 'Eliminate manual AI API configuration and discover latest verified free-tier models with full context window and token limit metadata.',
        context: 'ProviderAgent.js, ProviderAgentService.js, ProviderController.js, RegistrationView.js, ProvidersView.js.',
        actions: 'openPopup(query), populateDropdowns(), search(), lookupProvider(query, forceLive, options), performOnlineAiSearch(query, options), applyData(payload), executeMultiTierBackup().',
        systemSpecs: 'Primary Search: Perplexity Sonar. Attached Frontier Engine: GPT-4o (OpenAI Flagship) / Gemini 2.5 Flash (Google Cloud) / Groq Llama 3.3 70B Versatile. Automated Backup: ChatGPT (GPT-4o / GPT-4o-mini) & Gemini (Gemini 2.5 Flash / 1.5 Flash). Timeout: 15000ms. Protocols: OpenAI Compatible, Gemini API, Anthropic Messages.'
      },
      keepalive_agent: {
        agentId: 'keepalive_agent',
        name: 'KeepAlive Socket Agent',
        role: 'Persistent HTTP/HTTPS Socket Connection Pool Manager',
        task: 'Maintain active TCP socket pools to eliminate TLS handshake latency overhead on local & remote proxy completions.',
        goal: 'Reduce API connection latency to sub-50ms.',
        constraints: 'Max 50 idle sockets per target host, max socket idle timeout 15000ms.',
        input: 'Target API endpoint URL.',
        output: 'Reusable Agent socket connection instance.',
        validation: 'Validates active socket health before delegation; creates new socket on connection drop.',
        objectives: 'Maximize HTTP connection reuse.',
        context: 'Operates in src/utils/KeepAliveAgent.js and ProxyExecutionHelper.js.',
        actions: 'getAgent(endpointUrl), reuseSocket(), purgeIdleSockets(), getPoolStats().',
        systemSpecs: 'Native Node.js http/https Agent with keepAlive: true.'
      },
      proxy_engine_agent: {
        agentId: 'proxy_engine_agent',
        name: 'Proxy Engine Failover Agent',
        role: 'OpenAI / Anthropic Hybrid Gateway & Closed-Loop Auto-Failover Router',
        task: 'Translate incoming payloads, route requests across Model Combos, and execute auto-failover on HTTP errors.',
        goal: '100% request completion with zero dropped connections.',
        constraints: 'Max 3 retry failover attempts per combo pool; stream SSE chunks without buffer lag.',
        input: 'Standard OpenAI (/v1/chat/completions) or Anthropic (/v1/messages) POST request payload.',
        output: 'OpenAI/Anthropic compatible response stream or JSON payload.',
        validation: 'Verifies authorization headers, model availability, and active provider status.',
        objectives: 'Seamless multi-provider failover routing.',
        context: 'Mounts on /v1 routes in server.js, ProxyEngineService.js.',
        actions: 'handleChatCompletion(), executeProxyRequest(), executeFailover(), recordUsageTokens().',
        systemSpecs: 'Supports Round-Robin and Fallback load balancing.'
      },
      token_agent: {
        agentId: 'token_agent',
        name: 'Token Agent',
        role: 'Online Provider Token Limits & Latency Synchronizer',
        task: 'Measure ping latency, aggregate consumed tokens from model usage, and update hard limit normalizations.',
        goal: 'Accurate real-time token telemetry across all registered providers.',
        constraints: 'Zero false token counts; sanitize inputs and apply SI unit formatting (k, M, B, Unlimited).',
        input: 'Provider ID and active model usage telemetry logs.',
        output: 'Updated ProviderModel telemetry state (freeTierLimit, hardTokenLimit, tokensConsumed, pingLatencyMs).',
        validation: 'Validates non-negative token counts and reachable HTTP endpoint latency.',
        objectives: 'Maintain accurate token availability indicators.',
        context: 'Operates in TokenAgentService.js and Dashboard telemetry rail.',
        actions: 'syncProviderTokenLimit(id), syncAllProviderTokens(), pingLatency(), detectProviderKey().',
        systemSpecs: 'Executes latency pings with 3000ms timeout.'
      },
      family_classifier_agent: {
        agentId: 'family_classifier_agent',
        name: 'Model Family Classifier Agent',
        role: 'LLM Taxonomy & Core Skill Classifier',
        task: 'Classify registered open models into Llama, Qwen, DeepSeek, Gemma, Mistral, and Gemini families and assign core skills.',
        goal: 'Maintain standardized 5-Pane Model Club taxonomy pyramid.',
        constraints: 'Strict regex pattern matching; fallback to General Family for unclassified models.',
        input: 'Model ID, model display name, and provider specifications.',
        output: 'Taxonomy object containing family name, core skill, context window, and skill color token.',
        validation: 'Validates non-empty family string and known core skill classification.',
        objectives: 'Automatic model family classification.',
        context: 'Invoked during provider registration and model sync in ModelFamilyService.js.',
        actions: 'classifyModelFamily(), detectCoreSkill(), auditContextWindow(), verifyTokenBounds().',
        systemSpecs: 'Regex dictionary covering Llama, Qwen, DeepSeek, Gemma, Mistral, Gemini.'
      },
      stream_handler_agent: {
        agentId: 'stream_handler_agent',
        name: 'Stream Handler Agent',
        role: 'Decoupled Server-Sent Events Stream Accumulator',
        task: 'Stream LLM completion chunks to client UI and tool connections with zero buffer lag.',
        goal: 'Real-time token streaming with sub-10ms chunk latency.',
        constraints: 'Must handle SSE data: [DONE] termination signal and calculate token metrics on the fly.',
        input: 'Upstream HTTP SSE response stream.',
        output: 'Client SSE data stream chunks.',
        validation: 'Verifies chunk integrity before pushing to response stream.',
        objectives: 'Zero-copy token streaming.',
        context: 'Serves streaming proxy completions in StreamHandlerService.js.',
        actions: 'handleStreamResponse(), accumulateTokens(), recordStreamLog().',
        systemSpecs: 'SSE stream pipeline wrapper.'
      },
      self_healing_agent: {
        agentId: 'self_healing_agent',
        name: 'RCA & Self-Healing AI Agent',
        role: 'Autonomous Diagnostics & Code Auto-Patch Agent',
        task: 'Detect runtime exceptions in Playground chat and generate 3-Tier RCA Resolution Cards with 1-click auto-patching.',
        goal: 'Self-healing codebase recovery from runtime errors.',
        constraints: 'Modifications strictly contained within project workspace bounds; backup file created before patch.',
        input: 'Error log object, stack trace, and target source code file path.',
        output: 'Self-healing diagnostic payload containing RCA summary, recommended fix diff, and executable patch action.',
        validation: 'Validates target file exists within workspace before applying patch.',
        objectives: 'Autonomous system recovery.',
        context: 'Embedded in PlaygroundView.js, SelfHealingService.js, SelfHealingController.js.',
        actions: 'detectIntentAndContext(), generateSelfHealingPayload(), applySelfHealingPatch().',
        systemSpecs: 'Creates backup in data/backups/ before patching.'
      },
      combo_agent: {
        agentId: 'combo_agent',
        name: 'Combo Agent',
        role: 'Virtual Model Combo Pool Router & Load-Balancing Agent',
        task: 'Pool multiple free AI models across providers into virtual Model Combos with Round-Robin or Fallback load balancing.',
        goal: 'High-availability LLM access via pooled free tier quotas.',
        constraints: 'Filter out inactive providers before routing; enforce max context window bounds.',
        input: 'Model Combo ID and chat completion prompt payload.',
        output: 'Proxy chat completion payload routed from active combo model pool.',
        validation: 'Validates combo pool has at least 1 active model before dispatch.',
        objectives: 'Fault-tolerant multi-model load balancing.',
        context: 'ModelComboService.js, ModelClubComboStudioHelper.js, combos.json.',
        actions: 'createCombo(), routeComboRequest(), executeRoundRobin(), executeFallback().',
        systemSpecs: 'Supports Round-Robin index pointer and Fallback priority queue.'
      },
      combo_smart_agent: {
        agentId: 'combo_smart_agent',
        name: 'Combo Smart Agent (22-Agent Master Orchestrator)',
        role: 'Unified 22-Agent Orchestrator & Adaptive Strategy Switching Engine',
        task: 'Analyze prompt intent (vision, code synthesis, large context, fast autocomplete), dynamically delegate across 13 Load Balancing algorithms, 4 Core Engines, and 5 Auxiliary Agents.',
        goal: 'Maximum throughput, sub-50ms routing overhead, zero-downtime failover, and automated prompt-intent optimization.',
        constraints: 'Preflight token budget validation; auto-fallback to active provider if quota exhausted; zero broken dependencies.',
        input: 'Chat prompt messages array, model ID, workspace context, and requested strategy override.',
        output: 'Orchestrated completion payload with dynamic strategy tag, resolved model metadata, and SSE streaming telemetry.',
        validation: 'Validates active provider readiness, token TPM budget, and context window limits before outbound dispatch.',
        objectives: 'Enterprise-grade autonomous multi-agent delegation & dynamic load balancing.',
        context: 'src/services/ComboSmartAgent.js, public/js/agents/ComboSmartAgent.js, openaiRoutes.js, ToolExecutionLoopService.js.',
        actions: 'analyzePromptIntent(), resolveOptimalStrategy(), resolveTargetCandidate(), validatePreflight(), getTelemetry().',
        systemSpecs: 'Coordinates 13 Load Balancing Algorithms, 4 Core Engines, 5 Auxiliary Agents. Response headers: X-FMC-Strategy-Used, X-FMC-Resolved-Model.'
      }
    };
  }
}

window.SettingsAgentEngineRocasDb = SettingsAgentEngineRocasDb;
