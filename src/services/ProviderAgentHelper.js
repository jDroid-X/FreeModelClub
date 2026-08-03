/**
 * ProviderAgentHelper.js
 * Purpose: Pre-configured knowledge database of AI free tier providers, protocols, and endpoints
 *          for ProviderAgentService (< 200 lines).
 */

class ProviderAgentHelper {
  static getKnownProvidersDatabase() {
    return {
      nvidia: {
        id: 'prov_nvidia',
        rawId: 'nvidia',
        displayName: 'NVIDIA NIM Cloud API',
        protocol: 'OpenAI Compatible',
        baseUrl: 'https://integrate.api.nvidia.com/v1',
        apiKeyHelp: 'Generate free API Key at https://build.nvidia.com',
        apiKeyUrl: 'https://build.nvidia.com',
        keyPrefix: 'nvapi-',
        freeTierQuota: '1,000 Free Developer Credits (~1,000,000 Tokens)',
        tokenDetailsHelp: 'NVIDIA NIM grants 1,000 free developer credits upon account creation on build.nvidia.com.',
        description: 'NVIDIA NIM enterprise microservices platform hosting Llama 3.3 70B, DeepSeek R1, Nemotron, Mistral, and Qwen Coder models.',
        models: [
          { modelId: 'meta/llama-3.3-70b-instruct', modelName: 'Meta Llama 3.3 70B Instruct', family: 'Llama', coreSkill: 'Coding & High-Speed Reasoning', contextWindow: 131072, maxTokens: 4096, isFree: true },
          { modelId: 'deepseek-ai/deepseek-r1', modelName: 'DeepSeek R1 Reasoning', family: 'DeepSeek', coreSkill: 'Deep Reasoning & Math', contextWindow: 65536, maxTokens: 8192, isFree: true },
          { modelId: 'nvidia/llama-3.1-nemotron-70b-instruct', modelName: 'NVIDIA Llama 3.1 Nemotron 70B Instruct', family: 'Nemotron', coreSkill: 'Enterprise Code & Logic', contextWindow: 131072, maxTokens: 4096, isFree: true }
        ]
      },
      groq: {
        id: 'prov_groq',
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
        id: 'prov_openrouter',
        rawId: 'openrouter',
        displayName: 'OpenRouter Free Tier Router',
        protocol: 'OpenRouter Free',
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKeyHelp: 'Get free API Key from https://openrouter.ai/keys',
        apiKeyUrl: 'https://openrouter.ai/keys',
        keyPrefix: 'sk-or-',
        freeTierQuota: '200 Requests/Day for :free tagged models',
        tokenDetailsHelp: 'OpenRouter aggregates 20+ free models with :free tag.',
        description: 'Multi-provider free models router hosting Llama, Qwen, DeepSeek, and Mistral models.',
        models: [
          { modelId: 'meta-llama/llama-3.3-70b-instruct:free', modelName: 'Meta Llama 3.3 70B Instruct (Free)', family: 'Llama', coreSkill: 'General Reasoning', contextWindow: 131072, maxTokens: 4096, isFree: true },
          { modelId: 'deepseek/deepseek-r1:free', modelName: 'DeepSeek R1 (Free)', family: 'DeepSeek', coreSkill: 'Reasoning & Logic', contextWindow: 64000, maxTokens: 4096, isFree: true }
        ]
      },
      gemini: {
        id: 'prov_gemini',
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
        id: 'prov_router.bynara',
        rawId: 'router.bynara',
        displayName: 'router.bynara Cloud',
        protocol: 'OpenAI Compatible',
        baseUrl: 'https://router.bynara.id/v1',
        apiKeyHelp: 'Get API Key from https://router.bynara.id',
        apiKeyUrl: 'https://router.bynara.id',
        keyPrefix: 'sk-nry-',
        freeTierQuota: 'Universal Dynamic Free Tier (bynara)',
        tokenDetailsHelp: 'Router Bynara provides free open-source model routing.',
        description: 'Dynamic free tier routing service for coding & general LLMs.',
        models: [
          { modelId: 'bynara-llama-3.3-70b', modelName: 'Bynara Llama 3.3 70B', family: 'Llama', coreSkill: 'General Reasoning & Code', contextWindow: 131072, maxTokens: 4096, isFree: true }
        ]
      },
      together: {
        id: 'prov_together',
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
        id: 'prov_ollama',
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
        id: 'prov_sambanova',
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
        id: 'prov_cerebras',
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
        id: 'prov_mistral',
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
        id: 'prov_deepseek',
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
          { modelId: 'deepseek-reasoner', modelName: 'DeepSeek R1 Reasoner', family: 'DeepSeek', coreSkill: 'Chain of Thought Math & Logic', contextWindow: 64000, maxTokens: 8192, isFree: true }
        ]
      },
      hyperbolic: {
        id: 'prov_hyperbolic',
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
      }
    };
  }
}

module.exports = ProviderAgentHelper;
