/**
 * ProviderAgentHelper.js
 * Purpose: Pre-configured knowledge database of AI free tier providers, protocols, and endpoints
 *          for ProviderAgentService (< 200 lines).
 */

class ProviderAgentHelper {
  static getKnownProvidersDatabase() {
    return {
      nvidia: {
        id: 'nvidia',
        rawId: 'nvidia',
        displayName: 'NVIDIA NIM Cloud API',
        protocol: 'OpenAI Compatible',
        baseUrl: 'https://integrate.api.nvidia.com/v1',
        apiKeyHelp: 'Generate free API Key at https://build.nvidia.com',
        apiKeyUrl: 'https://build.nvidia.com',
        keyPrefix: 'nvapi-',
        freeTierQuota: '1,000 Free Developer Credits (~1,000,000 Tokens)',
        tokenDetailsHelp: 'NVIDIA NIM grants 1,000 free developer credits upon account creation on build.nvidia.com.',
        description: 'NVIDIA NIM enterprise microservices platform hosting Llama 3.3 70B, DeepSeek R1, Nemotron Ultra/Super/Nano, and Qwen Coder models.',
        models: [
          { modelId: 'meta/llama-3.3-70b-instruct', modelName: 'Meta Llama 3.3 70B Instruct', family: 'Llama', coreSkill: 'Coding & High-Speed Reasoning', contextWindow: 131072, maxTokens: 4096, isFree: true },
          { modelId: 'deepseek-ai/deepseek-r1', modelName: 'DeepSeek R1 Reasoning', family: 'DeepSeek', coreSkill: 'Deep Reasoning & Math', contextWindow: 65536, maxTokens: 8192, isFree: true },
          { modelId: 'nvidia/llama-3.1-nemotron-70b-instruct', modelName: 'NVIDIA Llama 3.1 Nemotron 70B Instruct', family: 'Nemotron', coreSkill: 'Enterprise Code & Logic', contextWindow: 131072, maxTokens: 4096, isFree: true },
          { modelId: 'nvidia/nemotron-3-ultra-550b-a55b', modelName: 'NVIDIA Nemotron 3 Ultra 550B', family: 'Nemotron', coreSkill: 'Frontier Reasoning & Orchestration', contextWindow: 131072, maxTokens: 8192, isFree: true },
          { modelId: 'nvidia/nemotron-3-super-120b-a12b', modelName: 'NVIDIA Nemotron 3 Super 120B', family: 'Nemotron', coreSkill: 'Multi-Agent High Efficiency MoE', contextWindow: 131072, maxTokens: 8192, isFree: true },
          { modelId: 'nvidia/nemotron-3-nano-30b-a3b', modelName: 'NVIDIA Nemotron 3 Nano 30B', family: 'Nemotron', coreSkill: 'Agentic Systems Lightweight MoE', contextWindow: 131072, maxTokens: 4096, isFree: true },
          { modelId: 'qwen/qwen2.5-coder-32b-instruct', modelName: 'Qwen 2.5 Coder 32B Instruct', family: 'Qwen', coreSkill: 'Full-Stack Code Generation', contextWindow: 32768, maxTokens: 4096, isFree: true }
        ]
      },
      groq: {
        id: 'groq',
        rawId: 'groq',
        displayName: 'Groq Cloud LPU API',
        protocol: 'Groq API',
        baseUrl: 'https://api.groq.com/openai/v1',
        apiKeyHelp: 'Get free API Key from https://console.groq.com/keys',
        apiKeyUrl: 'https://console.groq.com/keys',
        keyPrefix: 'gsk_',
        freeTierQuota: '1,000–14,400 Requests/Day (100% Free Tier)',
        tokenDetailsHelp: 'Groq Cloud provides ultra-fast inference with rate limits up to 30 RPM and 14.4k RPD.',
        description: 'Ultra-fast LPU inference hosting Llama 3.3 70B, Llama 3.1 8B, Gemma 2, and Qwen models.',
        models: [
          { modelId: 'llama-3.3-70b-versatile', modelName: 'Meta Llama 3.3 70B Versatile', family: 'Llama', coreSkill: 'High-Speed Reasoning & Code', contextWindow: 128000, maxTokens: 8192, isFree: true },
          { modelId: 'llama-3.1-8b-instant', modelName: 'Meta Llama 3.1 8B Instant', family: 'Llama', coreSkill: 'Ultra-Fast General Chat', contextWindow: 128000, maxTokens: 8192, isFree: true },
          { modelId: 'qwen-2.5-coder-32b', modelName: 'Qwen 2.5 Coder 32B', family: 'Qwen', coreSkill: 'Full-Stack Code Generation', contextWindow: 32768, maxTokens: 8192, isFree: true }
        ]
      },
      openrouter: {
        id: 'openrouter',
        rawId: 'openrouter',
        displayName: 'OpenRouter Free Tier Router',
        protocol: 'OpenRouter Free',
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKeyHelp: 'Get free API Key from https://openrouter.ai/keys',
        apiKeyUrl: 'https://openrouter.ai/keys',
        keyPrefix: 'sk-or-',
        freeTierQuota: '200 Requests/Day — 15 verified :free tagged models',
        tokenDetailsHelp: 'OpenRouter aggregates 15 confirmed free models (pricing.prompt=0 & completion=0) sourced live from openrouter.ai/api/v1/models.',
        description: 'Multi-provider free models router hosting Ling-3.0-flash, Poolside Laguna, Cohere North Mini Code, NVIDIA Nemotron family, Google Gemma 4, OpenAI gpt-oss-20b and more.',
        models: [
          { modelId: 'inclusionai/ling-3.0-flash:free', modelName: 'Ling 3.0 Flash (Free)', family: 'MoE', coreSkill: 'Agentic Inference & Token Efficiency', contextWindow: 131072, maxTokens: 8192, isFree: true },
          { modelId: 'poolside/laguna-s-2.1:free', modelName: 'Poolside: Laguna S 2.1 (Free)', family: 'Poolside', coreSkill: 'Coding Agent & Terminal Tasks', contextWindow: 131072, maxTokens: 8192, isFree: true },
          { modelId: 'poolside/laguna-xs-2.1:free', modelName: 'Poolside: Laguna XS 2.1 (Free)', family: 'Poolside', coreSkill: 'Coding Agent 33B Compact', contextWindow: 131072, maxTokens: 8192, isFree: true },
          { modelId: 'cohere/north-mini-code:free', modelName: 'Cohere: North Mini Code (Free)', family: 'Cohere', coreSkill: 'Agentic Code Generation', contextWindow: 131072, maxTokens: 4096, isFree: true },
          { modelId: 'nvidia/nemotron-3.5-content-safety:free', modelName: 'NVIDIA: Nemotron 3.5 Content Safety (Free)', family: 'Nemotron', coreSkill: 'Content Moderation & Safety', contextWindow: 32768, maxTokens: 4096, isFree: true },
          { modelId: 'nvidia/nemotron-3-ultra-550b-a55b:free', modelName: 'NVIDIA: Nemotron 3 Ultra (Free)', family: 'Nemotron', coreSkill: 'Frontier Reasoning & Orchestration', contextWindow: 131072, maxTokens: 8192, isFree: true },
          { modelId: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', modelName: 'NVIDIA: Nemotron 3 Nano Omni (Free)', family: 'Nemotron', coreSkill: 'Multimodal Perception (Text/Image/Video)', contextWindow: 131072, maxTokens: 4096, isFree: true },
          { modelId: 'google/gemma-4-26b-a4b-it:free', modelName: 'Google: Gemma 4 26B A4B IT (Free)', family: 'Gemma', coreSkill: 'High-Quality MoE Instruction Following', contextWindow: 131072, maxTokens: 8192, isFree: true },
          { modelId: 'google/gemma-4-31b-it:free', modelName: 'Google: Gemma 4 31B (Free)', family: 'Gemma', coreSkill: 'Multimodal Reasoning 256K Context', contextWindow: 262144, maxTokens: 8192, isFree: true },
          { modelId: 'nvidia/nemotron-3-super-120b-a12b:free', modelName: 'NVIDIA: Nemotron 3 Super (Free)', family: 'Nemotron', coreSkill: 'Multi-Agent High Efficiency 120B MoE', contextWindow: 131072, maxTokens: 8192, isFree: true },
          { modelId: 'openrouter/free', modelName: 'Free Models Router (OpenRouter)', family: 'Router', coreSkill: 'Auto Random Free Model Selection', contextWindow: 131072, maxTokens: 4096, isFree: true },
          { modelId: 'nvidia/nemotron-3-nano-30b-a3b:free', modelName: 'NVIDIA: Nemotron 3 Nano 30B A3B (Free)', family: 'Nemotron', coreSkill: 'Agentic Systems Lightweight MoE', contextWindow: 131072, maxTokens: 4096, isFree: true },
          { modelId: 'nvidia/nemotron-nano-12b-v2-vl:free', modelName: 'NVIDIA: Nemotron Nano 12B 2 VL (Free)', family: 'Nemotron', coreSkill: 'Video & Document Intelligence', contextWindow: 131072, maxTokens: 4096, isFree: true },
          { modelId: 'nvidia/nemotron-nano-9b-v2:free', modelName: 'NVIDIA: Nemotron Nano 9B V2 (Free)', family: 'Nemotron', coreSkill: 'Unified Reasoning & Non-Reasoning', contextWindow: 131072, maxTokens: 4096, isFree: true },
          { modelId: 'openai/gpt-oss-20b:free', modelName: 'OpenAI: gpt-oss-20b (Free)', family: 'GPT', coreSkill: 'Open-Weight MoE Code & Reasoning', contextWindow: 131072, maxTokens: 8192, isFree: true }
        ]
      },
      agentrouter: {
        id: 'agentrouter',
        rawId: 'agentrouter',
        displayName: 'Agent Router Cloud API',
        protocol: 'OpenAI Compatible',
        baseUrl: 'https://agentrouter.org/v1',
        apiKeyHelp: 'Manage API keys at https://agentrouter.org/console',
        apiKeyUrl: 'https://agentrouter.org/console/personal',
        keyPrefix: 'sk-',
        freeTierQuota: 'Universal API Gateway Models',
        tokenDetailsHelp: 'Agent Router provides OpenAI-compatible routing for Claude, GPT, and other models.',
        description: 'Universal model router acting as a gateway for Claude, OpenAI, and DeepSeek.',
        models: [
          { modelId: 'claude-3-5-sonnet-20240620', modelName: 'Claude 3.5 Sonnet', family: 'Claude', coreSkill: 'Coding & High-Speed Reasoning', contextWindow: 200000, maxTokens: 8192, isFree: true },
          { modelId: 'claude-3-opus-20240229', modelName: 'Claude 3 Opus', family: 'Claude', coreSkill: 'Frontier Reasoning', contextWindow: 200000, maxTokens: 4096, isFree: true },
          { modelId: 'gpt-4o', modelName: 'GPT-4o Flagship', family: 'GPT', coreSkill: 'General Reasoning & Code', contextWindow: 128000, maxTokens: 4096, isFree: true },
          { modelId: 'gpt-4o-mini', modelName: 'GPT-4o Mini', family: 'GPT', coreSkill: 'Fast Chat & Instruction', contextWindow: 128000, maxTokens: 16384, isFree: true },
          { modelId: 'deepseek-chat', modelName: 'DeepSeek V3', family: 'DeepSeek', coreSkill: 'Reasoning & Code', contextWindow: 64000, maxTokens: 8192, isFree: true }
        ]
      },
      gemini: {
        id: 'gemini',
        rawId: 'gemini',
        displayName: 'Google Gemini API',
        protocol: 'Gemini API',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        apiKeyHelp: 'Get free API Key at https://aistudio.google.com/app/apikey',
        apiKeyUrl: 'https://aistudio.google.com/app/apikey',
        keyPrefix: 'AIzaSy',
        freeTierQuota: '15 RPM / 1,500 RPD (100% Free Tier)',
        tokenDetailsHelp: 'Google AI Studio offers 15 requests/minute free quota across Gemini 1.5 & 2.0 Flash models.',
        description: 'Google AI Studio multimodal models featuring 1,000,000 token context windows.',
        models: [
          { modelId: 'gemini-1.5-flash', modelName: 'Gemini 1.5 Flash', family: 'Gemini', coreSkill: '1M Context & Multimodal', contextWindow: 1048576, maxTokens: 8192, isFree: true },
          { modelId: 'gemini-2.0-flash-exp', modelName: 'Gemini 2.0 Flash Experimental', family: 'Gemini', coreSkill: 'Next-Gen Multimodal Reasoning', contextWindow: 1048576, maxTokens: 8192, isFree: true }
        ]
      },
      opencode: {
        id: 'opencode',
        rawId: 'opencode',
        displayName: 'Opencode Zen AI',
        protocol: 'OpenAI Compatible',
        baseUrl: 'https://opencode.ai/zen/v1',
        apiKeyHelp: 'Get free API Key from https://opencode.ai/keys',
        apiKeyUrl: 'https://opencode.ai/keys',
        keyPrefix: 'sk-',
        freeTierQuota: 'Universal Dynamic Free Tier (opencode)',
        tokenDetailsHelp: 'Opencode Zen AI provides free high-speed coding inference.',
        description: 'High-speed open source code inference service.',
        models: [
          { modelId: 'opencode-zen-coder', modelName: 'Opencode Zen Coder 32B', family: 'Qwen', coreSkill: 'Coding & Software Development', contextWindow: 65536, maxTokens: 4096, isFree: true }
        ]
      },
      bynara: {
        id: 'bynara',
        rawId: 'bynara',
        displayName: 'Bynara Cloud',
        protocol: 'OpenAI Compatible',
        baseUrl: 'https://router.bynara.id/v1',
        apiKeyHelp: 'Get API Key from https://router.bynara.id',
        apiKeyUrl: 'https://router.bynara.id',
        keyPrefix: 'sk-nry-',
        freeTierQuota: 'Universal Dynamic Free Tier (bynara)',
        tokenDetailsHelp: 'Router Bynara provides free open-source model routing.',
        description: 'Dynamic free tier routing service for coding & general LLMs.',
        models: [
          { modelId: 'mimo-v2.5-free', modelName: 'Bynara MiMo v2.5 Free', family: 'MiMo', coreSkill: 'General Reasoning', contextWindow: 65536, maxTokens: 4096, isFree: true },
          { modelId: 'mimo-v2.5-pro-free', modelName: 'Bynara MiMo v2.5 Pro', family: 'MiMo', coreSkill: 'Advanced Logic', contextWindow: 65536, maxTokens: 4096, isFree: true },
          { modelId: 'claude-sonnet-4.5', modelName: 'Bynara Claude Sonnet 4.5', family: 'Claude', coreSkill: 'Coding & Analysis', contextWindow: 200000, maxTokens: 4096, isFree: true },
          { modelId: 'claude-haiku-4.5', modelName: 'Bynara Claude Haiku 4.5', family: 'Claude', coreSkill: 'Fast Execution', contextWindow: 200000, maxTokens: 4096, isFree: true },
          { modelId: 'glm-4-flash', modelName: 'Bynara GLM 4 Flash', family: 'GLM', coreSkill: 'Multilingual Chat', contextWindow: 128000, maxTokens: 4096, isFree: true },
          { modelId: 'llama-3.3-70b-instruct', modelName: 'Bynara Llama 3.3 70B', family: 'Llama', coreSkill: 'General Reasoning & Code', contextWindow: 131072, maxTokens: 4096, isFree: true },
          { modelId: 'qwen-2.5-coder-32b', modelName: 'Bynara Qwen 2.5 Coder 32B', family: 'Qwen', coreSkill: 'Code Generation', contextWindow: 32768, maxTokens: 4096, isFree: true }
        ]
      },
      together: {
        id: 'together',
        rawId: 'together',
        displayName: 'Together AI Cloud',
        protocol: 'Together API',
        baseUrl: 'https://api.together.xyz/v1',
        apiKeyHelp: 'Get free API Key at https://api.together.ai',
        apiKeyUrl: 'https://api.together.ai',
        keyPrefix: '',
        freeTierQuota: '$5.00 Free Developer Credits',
        tokenDetailsHelp: 'Together AI grants $5 free credits upon sign-up.',
        description: 'Open-source model cloud hosting Llama 3.3, Qwen 2.5 Coder, and DeepSeek models.',
        models: [
          { modelId: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', modelName: 'Llama 3.3 70B Instruct Turbo', family: 'Llama', coreSkill: 'Fast Code & General Chat', contextWindow: 131072, maxTokens: 4096, isFree: true }
        ]
      },
      ollama: {
        id: 'ollama',
        rawId: 'ollama',
        displayName: 'Ollama Local Host',
        protocol: 'Ollama Local API',
        baseUrl: 'http://localhost:11434/v1',
        apiKeyHelp: 'No API Key required for local Ollama instance',
        apiKeyUrl: 'http://localhost:11434',
        keyPrefix: 'ollama-local',
        freeTierQuota: '100% Local Free Unlimited',
        tokenDetailsHelp: 'Ollama runs locally on your PC GPU/CPU with zero cost and no external internet required.',
        description: 'Local host model runner hosting Llama, Qwen, DeepSeek, and Mistral on local machine.',
        models: [
          { modelId: 'llama3.3:latest', modelName: 'Ollama Llama 3.3 Local', family: 'Llama', coreSkill: 'Local Private Reasoning', contextWindow: 128000, maxTokens: 4096, isFree: true }
        ]
      },
      sambanova: {
        id: 'sambanova',
        rawId: 'sambanova',
        displayName: 'SambaNova Cloud API',
        protocol: 'OpenAI Compatible',
        baseUrl: 'https://api.sambanova.ai/v1',
        apiKeyHelp: 'Get free API Key at https://cloud.sambanova.ai',
        apiKeyUrl: 'https://cloud.sambanova.ai',
        keyPrefix: 'sn-',
        freeTierQuota: '100% Free Developer Tier',
        tokenDetailsHelp: 'SambaNova SN40L Reconfigurable Dataflow Unit hosting Llama 3.3 70B & DeepSeek R1 at high speeds.',
        description: 'Ultra-fast RDU hardware hosting Llama 3.3 70B and DeepSeek R1.',
        models: [
          { modelId: 'Meta-Llama-3.3-70B-Instruct', modelName: 'SambaNova Llama 3.3 70B Instruct', family: 'Llama', coreSkill: 'RDU High Speed Reasoning', contextWindow: 131072, maxTokens: 4096, isFree: true },
          { modelId: 'DeepSeek-R1-Distill-Llama-70B', modelName: 'SambaNova DeepSeek R1 Distill 70B', family: 'DeepSeek', coreSkill: 'Reasoning & Math', contextWindow: 65536, maxTokens: 4096, isFree: true }
        ]
      },
      cerebras: {
        id: 'cerebras',
        rawId: 'cerebras',
        displayName: 'Cerebras Wafer-Scale Cloud',
        protocol: 'OpenAI Compatible',
        baseUrl: 'https://api.cerebras.ai/v1',
        apiKeyHelp: 'Get free API Key at https://cloud.cerebras.ai',
        apiKeyUrl: 'https://cloud.cerebras.ai',
        keyPrefix: 'csk-',
        freeTierQuota: '30 Requests/Min (100% Free Tier)',
        tokenDetailsHelp: 'Cerebras WSE-3 engine delivers 2,000+ tokens/sec on Llama 3.1 models.',
        description: 'Wafer-scale engine hosting Llama 3.1 8B & 70B at ultra-high throughput.',
        models: [
          { modelId: 'llama3.1-70b', modelName: 'Cerebras Llama 3.1 70B', family: 'Llama', coreSkill: '2000+ Tokens/Sec Inference', contextWindow: 131072, maxTokens: 8192, isFree: true },
          { modelId: 'llama3.1-8b', modelName: 'Cerebras Llama 3.1 8B', family: 'Llama', coreSkill: 'Ultra Fast General Chat', contextWindow: 131072, maxTokens: 8192, isFree: true }
        ]
      },
      mistral: {
        id: 'mistral',
        rawId: 'mistral',
        displayName: 'Mistral AI Cloud API',
        protocol: 'Mistral API',
        baseUrl: 'https://api.mistral.ai/v1',
        apiKeyHelp: 'Get free API Key at https://console.mistral.ai',
        apiKeyUrl: 'https://console.mistral.ai',
        keyPrefix: '',
        freeTierQuota: '1,000 Free Developer Credits',
        tokenDetailsHelp: 'Mistral La Plateforme free tier supports Mistral Small & Codestral.',
        description: 'Official Mistral AI cloud service.',
        models: [
          { modelId: 'mistral-small-latest', modelName: 'Mistral Small 24B', family: 'Mistral', coreSkill: 'Multilingual & Code', contextWindow: 32768, maxTokens: 4096, isFree: true },
          { modelId: 'codestral-latest', modelName: 'Codestral 22B', family: 'Mistral', coreSkill: 'Code Completion & FIM', contextWindow: 32768, maxTokens: 4096, isFree: true }
        ]
      },
      deepseek: {
        id: 'deepseek',
        rawId: 'deepseek',
        displayName: 'DeepSeek Official API',
        protocol: 'OpenAI Compatible',
        baseUrl: 'https://api.deepseek.com/v1',
        apiKeyHelp: 'Get free API Key at https://platform.deepseek.com',
        apiKeyUrl: 'https://platform.deepseek.com',
        keyPrefix: 'sk-',
        freeTierQuota: '5,000,000 Free Tokens on Sign-Up',
        tokenDetailsHelp: 'DeepSeek platform provides 5M free tokens for new developer accounts.',
        description: 'Official DeepSeek V3 and R1 reasoning API.',
        models: [
          { modelId: 'deepseek-chat', modelName: 'DeepSeek V3 Chat', family: 'DeepSeek', coreSkill: 'General Reasoning & Code', contextWindow: 64000, maxTokens: 8192, isFree: true },
          { modelId: 'deepseek-reasoner', modelName: 'DeepSeek R1 Reasoner', family: 'DeepSeek', coreSkill: 'Deep Math & Logic', contextWindow: 64000, maxTokens: 8192, isFree: true }
        ]
      },
      hyperbolic: {
        id: 'hyperbolic',
        rawId: 'hyperbolic',
        displayName: 'Hyperbolic Decentralized Cloud',
        protocol: 'OpenAI Compatible',
        baseUrl: 'https://api.hyperbolic.xyz/v1',
        apiKeyHelp: 'Get free API Key at https://app.hyperbolic.xyz',
        apiKeyUrl: 'https://app.hyperbolic.xyz',
        keyPrefix: 'hyp-',
        freeTierQuota: '$10.00 Free Developer Credits',
        tokenDetailsHelp: 'Hyperbolic decentralized GPU network providing open-source models.',
        description: 'Decentralized open-source AI inference cloud.',
        models: [
          { modelId: 'meta-llama/Llama-3.3-70B-Instruct', modelName: 'Hyperbolic Llama 3.3 70B', family: 'Llama', coreSkill: 'Open Source Inference', contextWindow: 131072, maxTokens: 4096, isFree: true }
        ]
      },
      openai: {
        id: 'openai',
        rawId: 'openai',
        displayName: 'OpenAI Cloud Platform (ChatGPT)',
        protocol: 'OpenAI Compatible',
        baseUrl: 'https://api.openai.com/v1',
        apiKeyHelp: 'Get API Key at https://platform.openai.com/api-keys',
        apiKeyUrl: 'https://platform.openai.com/api-keys',
        keyPrefix: 'sk-proj-',
        freeTierQuota: 'Standard Developer Tier',
        tokenDetailsHelp: 'OpenAI provides frontier models including GPT-4o, GPT-4o-mini, o1-preview, and o1-mini.',
        description: 'Official OpenAI API platform.',
        models: [
          { modelId: 'gpt-4o', modelName: 'GPT-4o Flagship', family: 'GPT', coreSkill: 'General Reasoning & Code', contextWindow: 128000, maxTokens: 4096, isFree: true },
          { modelId: 'gpt-4o-mini', modelName: 'GPT-4o Mini', family: 'GPT', coreSkill: 'Fast Chat & Instruction', contextWindow: 128000, maxTokens: 16384, isFree: true },
          { modelId: 'o1-preview', modelName: 'OpenAI o1 Preview', family: 'GPT', coreSkill: 'Deep Math & Logic', contextWindow: 128000, maxTokens: 32768, isFree: true },
          { modelId: 'o1-mini', modelName: 'OpenAI o1 Mini', family: 'GPT', coreSkill: 'Fast STEM Reasoning', contextWindow: 128000, maxTokens: 65536, isFree: true }
        ]
      },
      perplexity: {
        id: 'perplexity',
        rawId: 'perplexity',
        displayName: 'Perplexity AI Search Engine',
        protocol: 'OpenAI Compatible',
        baseUrl: 'https://api.perplexity.ai',
        apiKeyHelp: 'Get API Key at https://www.perplexity.ai/settings/api',
        apiKeyUrl: 'https://www.perplexity.ai/settings/api',
        keyPrefix: 'pplx-',
        freeTierQuota: 'API Access / Search Grounded',
        tokenDetailsHelp: 'Perplexity AI Sonar models provide live internet grounded search and reasoning.',
        description: 'Real-time search and reasoning model API.',
        models: [
          { modelId: 'sonar', modelName: 'Perplexity Sonar Search', family: 'Perplexity', coreSkill: 'Real-Time Web Search & Synthesis', contextWindow: 128000, maxTokens: 4096, isFree: true },
          { modelId: 'sonar-pro', modelName: 'Perplexity Sonar Pro', family: 'Perplexity', coreSkill: 'Deep Multi-Step Web Research', contextWindow: 200000, maxTokens: 8192, isFree: true },
          { modelId: 'sonar-reasoning', modelName: 'Perplexity Sonar Reasoning', family: 'Perplexity', coreSkill: 'CoT Math & Live Search', contextWindow: 128000, maxTokens: 8192, isFree: true }
        ]
      },
      poe: {
        id: 'poe',
        rawId: 'poe',
        displayName: 'Poe AI Platform',
        protocol: 'OpenAI Compatible',
        baseUrl: 'https://api.poe.com/v1',
        apiKeyHelp: 'Get API Key from https://poe.com/api/keys',
        apiKeyUrl: 'https://poe.com/api/keys',
        keyPrefix: 'sk-poe-',
        freeTierQuota: 'Daily Free Compute Points',
        tokenDetailsHelp: 'Poe platform provides multi-bot ecosystem and developer APIs.',
        description: 'Multi-model chatbot ecosystem.',
        models: [
          { modelId: 'Claude-3.5-Sonnet', modelName: 'Poe Claude 3.5 Sonnet', family: 'Claude', coreSkill: 'Coding & Analysis', contextWindow: 200000, maxTokens: 8192, isFree: true },
          { modelId: 'GPT-4o', modelName: 'Poe GPT-4o', family: 'GPT', coreSkill: 'General Reasoning', contextWindow: 128000, maxTokens: 4096, isFree: true }
        ]
      },
      morph: {
        id: 'morph',
        rawId: 'morph',
        displayName: 'Morph LLM Cloud',
        protocol: 'OpenAI Compatible',
        baseUrl: 'https://api.morphllm.com/v1',
        apiKeyHelp: 'Get API Key at https://www.morphllm.com',
        apiKeyUrl: 'https://www.morphllm.com',
        keyPrefix: 'sk-',
        freeTierQuota: 'Developer Free Tier',
        tokenDetailsHelp: 'Morph LLM hosts high-capacity GLM 5.2 and frontier models.',
        description: 'High-speed model inference provider.',
        models: [
          { modelId: 'morph-glm52-744b', modelName: 'Morph GLM 5.2 744B', family: 'GLM', coreSkill: 'Ultra High Capacity Reasoning', contextWindow: 128000, maxTokens: 8192, isFree: true }
        ]
      },
      comet: {
        id: 'comet',
        rawId: 'comet',
        displayName: 'Comet API Platform',
        protocol: 'OpenAI Compatible',
        baseUrl: 'https://api.cometapi.com/v1',
        apiKeyHelp: 'Get API Key from https://www.cometapi.com/console/token',
        apiKeyUrl: 'https://www.cometapi.com/console/token',
        keyPrefix: 'sk-',
        freeTierQuota: 'Universal Free Tier Tokens',
        tokenDetailsHelp: 'Comet API provides fast AI proxy and completion tokens.',
        description: 'Universal AI proxy platform.',
        models: [
          { modelId: 'comet-gpt-4o', modelName: 'Comet GPT-4o', family: 'GPT', coreSkill: 'General Reasoning', contextWindow: 128000, maxTokens: 4096, isFree: true }
        ]
      }
    };
  }

  /**
   * HC-17: Provider alias/typo normalization map.
   * Used by ProviderAgentService.lookupProvider() and frontend RegistrationView.
   * Add new aliases here — never duplicate in individual files.
   */
  static getProviderAliases() {
    return {
      'gorq': 'groq',
      'grok': 'groq',
      'groqcloud': 'groq',
      'groq cloud': 'groq',
      'groq api': 'groq',
      'groq cloud api': 'groq',
      'groq cloud lpu api': 'groq',
      'open router': 'openrouter',
      'openrouter.ai': 'openrouter',
      'openrouter free': 'openrouter',
      'openrouter free models': 'openrouter',
      'openrouter api': 'openrouter',
      'open router free': 'openrouter',
      'agent router': 'agentrouter',
      'agentrouter.org': 'agentrouter',
      'agentrouter api': 'agentrouter',
      'google': 'gemini',
      'google gemini': 'gemini',
      'googleai': 'gemini',
      'google ai': 'gemini',
      'gemini api': 'gemini',
      'google gemini api': 'gemini',
      'togetherai': 'together',
      'together ai': 'together',
      'together.ai': 'together',
      'together api': 'together',
      'together ai cloud': 'together',
      'mistral ai': 'mistral',
      'mistral.ai': 'mistral',
      'mistralai': 'mistral',
      'mistral api': 'mistral',
      'mistral ai cloud api': 'mistral',
      'deepseek ai': 'deepseek',
      'deepseek.com': 'deepseek',
      'deepseek api': 'deepseek',
      'deepseek official api': 'deepseek',
      'nvidia nim': 'nvidia',
      'nvidia build': 'nvidia',
      'nvidia api': 'nvidia',
      'nvidia nim cloud api': 'nvidia',
      'sambanova cloud': 'sambanova',
      'samba nova': 'sambanova',
      'sambanova api': 'sambanova',
      'sambanova cloud api': 'sambanova',
      'cerebras cloud': 'cerebras',
      'cerebras api': 'cerebras',
      'cerebras wafer-scale cloud': 'cerebras',
      'hyperbolic labs': 'hyperbolic',
      'hyperbolic api': 'hyperbolic',
      'hyperbolic decentralized cloud': 'hyperbolic',
      'ollama local': 'ollama',
      'local ollama': 'ollama',
      'ollama local api': 'ollama',
      'ollama / localhost models': 'ollama',
      'chatgpt': 'openai',
      'chat gpt': 'openai',
      'openai api': 'openai',
      'openai cloud platform': 'openai',
      'perplexity': 'perplexity',
      'perplexity ai': 'perplexity',
      'pplx': 'perplexity',
      'poe': 'poe',
      'poe ai': 'poe',
      'morph': 'morph',
      'morph llm': 'morph',
      'comet': 'comet',
      'comet api': 'comet',
      'bynara id': 'bynara',
      'router bynara': 'bynara',
      'router.bynara.id': 'bynara',
      'bynara router': 'bynara',
      'moonshot': 'moonshot',
      'moonshot cloud ai': 'moonshot',
      'opencode': 'opencode',
      'opencode zen': 'opencode'
    };
  }
}

module.exports = ProviderAgentHelper;
