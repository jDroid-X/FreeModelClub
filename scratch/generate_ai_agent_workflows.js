const fs = require('fs');
const path = require('path');

const FMC_API = "http://localhost:12247";

function createAiAgentWorkflow(config) {
  const { id, name, screenName, agentPurpose, modelName, tools, hasImageCapabilities } = config;

  const nodes = [
    {
      "parameters": {},
      "id": `${id}-trigger`,
      "name": `TRIGGER: ${screenName} Loaded`,
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [100, 300]
    },
    {
      "parameters": {
        "values": {
          "string": [
            { "name": "fmcApiBase", "value": FMC_API },
            { "name": "sessionToken", "value": "fmc_user_session_token" },
            { "name": "screen", "value": screenName },
            { "name": "imageVisionEnabled", "value": hasImageCapabilities ? "true" : "false" }
          ]
        }
      },
      "id": `${id}-input`,
      "name": `INPUT: ${screenName} Config & Session`,
      "type": "n8n-nodes-base.set",
      "typeVersion": 2,
      "position": [300, 300]
    },
    {
      "parameters": {
        "options": {
          "systemMessage": `You are the ${name} for ${screenName}. Purpose: ${agentPurpose}. Leverage attached Chat Model, Window Buffer Memory, and Tools to process context and return structured JSON telemetry.`
        }
      },
      "id": `${id}-ai-agent`,
      "name": `AI AGENT: ${name}`,
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1.7,
      "position": [540, 300]
    },
    {
      "parameters": {
        "model": modelName || "llama-3.3-70b-versatile",
        "options": {
          "baseURL": `${FMC_API}/v1`
        }
      },
      "id": `${id}-chat-model`,
      "name": `CHAT MODEL: FMC Proxy (${modelName || "llama-3.3-70b-versatile"})`,
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "typeVersion": 1.2,
      "position": [440, 520],
      "credentials": {
        "openAiApi": {
          "id": "fmc-proxy-credentials",
          "name": "FMC Localhost Proxy"
        }
      }
    },
    {
      "parameters": {
        "sessionIdType": "customKey",
        "sessionKey": `fmc_${id}_session`
      },
      "id": `${id}-memory`,
      "name": `MEMORY: Window Buffer (${screenName})`,
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "typeVersion": 1.3,
      "position": [580, 520]
    }
  ];

  const connections = {
    [`TRIGGER: ${screenName} Loaded`]: {
      "main": [[{ "node": `INPUT: ${screenName} Config & Session`, "type": "main", "index": 0 }]]
    },
    [`INPUT: ${screenName} Config & Session`]: {
      "main": [[{ "node": `AI AGENT: ${name}`, "type": "main", "index": 0 }]]
    },
    [`CHAT MODEL: FMC Proxy (${modelName || "llama-3.3-70b-versatile"})`]: {
      "ai_languageModel": [[{ "node": `AI AGENT: ${name}`, "type": "ai_languageModel", "index": 0 }]]
    },
    [`MEMORY: Window Buffer (${screenName})`]: {
      "ai_memory": [[{ "node": `AI AGENT: ${name}`, "type": "ai_memory", "index": 0 }]]
    }
  };

  let toolX = 720;
  (tools || []).forEach((t, idx) => {
    const toolId = `${id}-tool-${idx+1}`;
    const toolNodeName = `TOOL ${idx+1}: ${t.name}`;
    
    nodes.push({
      "parameters": {
        "name": t.slug || `tool_${idx+1}`,
        "description": t.description,
        "method": t.method || "GET",
        "url": t.url.startsWith("http") ? t.url : `${FMC_API}${t.url}`
      },
      "id": toolId,
      "name": toolNodeName,
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "typeVersion": 1.1,
      "position": [toolX, 520]
    });

    connections[toolNodeName] = {
      "ai_tool": [[{ "node": `AI AGENT: ${name}`, "type": "ai_tool", "index": 0 }]]
    };

    toolX += 140;
  });

  // Final Output Node
  const finalOutputName = `FINAL OUTPUT: ${screenName} Agent Result`;
  nodes.push({
    "parameters": {
      "jsCode": `// FINAL OUTPUT: ${screenName}\nreturn [{ json: { workflowId: '${id}', name: '${name}', screen: '${screenName}', status: 'AGENT_LOADED', imageCapabilities: ${hasImageCapabilities ? true : false}, timestamp: new Date().toISOString() } }];`
    },
    "id": `${id}-final-output`,
    "name": finalOutputName,
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": [toolX + 100, 300]
  });

  connections[`AI AGENT: ${name}`] = {
    "main": [[{ "node": finalOutputName, "type": "main", "index": 0 }]]
  };

  return {
    "id": id,
    "name": name,
    "active": false,
    "nodes": nodes,
    "connections": connections,
    "settings": { "executionOrder": "v1" }
  };
}

const workflows = [
  {
    fileName: "Master FMC n8n Wkf.json",
    config: {
      id: "fmc-master-brain-centralized-workflow",
      name: "Master FMC n8n Wkf - Centralized Brain Agentic Workflow",
      screenName: "MasterBrainView",
      agentPurpose: "Orchestrate all 10 screen sub-agents, aggregate real-time telemetry, run self-healing patches, and generate visual reporting artifacts.",
      modelName: "llama-3.3-70b-versatile",
      hasImageCapabilities: true,
      tools: [
        { name: "Provider Telemetry Engine", slug: "provider_telemetry_tool", description: "Fetch live health and response times of all model providers", method: "GET", url: "/api/providers/status" },
        { name: "Active Models Catalog Engine", slug: "active_models_tool", description: "Fetch all active free models in the club", method: "GET", url: "/api/models/active" },
        { name: "Master Repository Sync", slug: "master_repo_tool", description: "Sync OpenAI & Anthropic compatible model list", method: "GET", url: "/v1/models" },
        { name: "Image & Report Artifact Engine", slug: "report_artifact_tool", description: "Log audit reports and visual telemetry image metadata", method: "GET", url: "/api/reports/telemetry" }
      ]
    }
  },
  {
    fileName: "Login Screen n8nWkf.json",
    config: {
      id: "fmc-login-screen-workflow",
      name: "FMC Login Screen n8nWkf",
      screenName: "LoginView",
      agentPurpose: "Authenticate users, enforce zero-trust session token rules, and audit security events.",
      modelName: "gemma-3-27b-it",
      hasImageCapabilities: false,
      tools: [
        { name: "Provider Status Tool", slug: "provider_status_tool", description: "Check backend connectivity during login", method: "GET", url: "/api/providers/status" },
        { name: "Security Audit Tool", slug: "security_audit_tool", description: "Log security authentication events", method: "POST", url: "/api/reports/reports" }
      ]
    }
  },
  {
    fileName: "Dashboard Screen n8nWkf.json",
    config: {
      id: "fmc-dashboard-screen-workflow",
      name: "FMC Dashboard Screen n8nWkf",
      screenName: "DashboardView",
      agentPurpose: "Build live telemetry cards, model specs drawers, quota stats, and visual dashboard tiles.",
      modelName: "llama-3.3-70b-versatile",
      hasImageCapabilities: true,
      tools: [
        { name: "Provider Status Telemetry Tool", slug: "provider_telemetry_tool", description: "Get active status of model providers", method: "GET", url: "/api/providers/status" },
        { name: "Active Models Count Tool", slug: "active_models_tool", description: "Fetch active model count", method: "GET", url: "/api/models/active" },
        { name: "Master Repo Sync Tool", slug: "master_repo_tool", description: "Fetch models for drawer cards", method: "GET", url: "/v1/models" }
      ]
    }
  },
  {
    fileName: "Playground Screen n8nWkf.json",
    config: {
      id: "fmc-playground-screen-workflow",
      name: "FMC Playground Screen n8nWkf",
      screenName: "PlaygroundView",
      agentPurpose: "Manage self-healing code debugging, vision image uploads, web search tools, and SSE streaming.",
      modelName: "deepseek-r1-distill-llama-70b",
      hasImageCapabilities: true,
      tools: [
        { name: "Self-Heal Intent Detector Tool", slug: "self_heal_tool", description: "Detect code errors and generate self-healing patches", method: "POST", url: "/api/reports/reports" },
        { name: "Chat Completion Proxy Tool", slug: "chat_completion_tool", description: "Execute chat completion through ProxyEngine", method: "POST", url: "/v1/chat/completions" }
      ]
    }
  },
  {
    fileName: "Registration Screen n8nWkf.json",
    config: {
      id: "fmc-registration-screen-workflow",
      name: "FMC Registration Screen n8nWkf",
      screenName: "RegistrationView",
      agentPurpose: "Validate new provider base URLs, resolve API keys, and perform provider agent lookups.",
      modelName: "gemma-3-27b-it",
      hasImageCapabilities: false,
      tools: [
        { name: "Provider Connection Test Tool", slug: "test_connection_tool", description: "Test provider API key and endpoint ping", method: "POST", url: "/api/providers/test-connection" },
        { name: "Agent Lookup Tool", slug: "agent_lookup_tool", description: "Lookup provider metadata and model endpoints", method: "POST", url: "/api/providers/agent-lookup" },
        { name: "Fetch Models Tool", slug: "fetch_models_tool", description: "Fetch remote provider model catalog", method: "POST", url: "/api/providers/fetch-models" }
      ]
    }
  },
  {
    fileName: "Providers Screen n8nWkf.json",
    config: {
      id: "fmc-providers-screen-workflow",
      name: "FMC Providers Screen n8nWkf",
      screenName: "ProvidersView",
      agentPurpose: "Monitor provider health, ping latencies, and active model lists across 9 integrated providers.",
      modelName: "llama-3.3-70b-versatile",
      hasImageCapabilities: false,
      tools: [
        { name: "Provider Status Tool", slug: "provider_status_tool", description: "Get latency and status of all 9 providers", method: "GET", url: "/api/providers/status" },
        { name: "Ping Connection Tool", slug: "ping_connection_tool", description: "Ping provider API endpoint", method: "POST", url: "/api/providers/test-connection" }
      ]
    }
  },
  {
    fileName: "ModelClub Screen n8nWkf.json",
    config: {
      id: "fmc-modelclub-screen-workflow",
      name: "FMC ModelClub Screen n8nWkf",
      screenName: "ModelClubView",
      agentPurpose: "Manage Model Combos (Round-Robin, Fallback), skill categories, model badges, and architecture diagrams.",
      modelName: "llama-3.3-70b-versatile",
      hasImageCapabilities: true,
      tools: [
        { name: "Active Models Tool", slug: "active_models_tool", description: "Fetch active models list", method: "GET", url: "/api/models/active" },
        { name: "Master Repository Models Tool", slug: "repo_models_tool", description: "Fetch all models in hybrid format", method: "GET", url: "/v1/models" }
      ]
    }
  },
  {
    fileName: "Config Screen n8nWkf.json",
    config: {
      id: "fmc-config-screen-workflow",
      name: "FMC Config Screen n8nWkf",
      screenName: "ConfigView",
      agentPurpose: "Audit API token quotas, rate limits, proxy timeouts, and fallback routing priorities.",
      modelName: "gemma-3-27b-it",
      hasImageCapabilities: false,
      tools: [
        { name: "Active Models Quota Tool", slug: "models_quota_tool", description: "Audit active models quota", method: "GET", url: "/api/models/active" }
      ]
    }
  },
  {
    fileName: "Settings Screen n8nWkf.json",
    config: {
      id: "fmc-settings-screen-workflow",
      name: "FMC Settings Screen n8nWkf",
      screenName: "SettingsView",
      agentPurpose: "Manage 7 metal UI themes, attached AI agents, prompt presets, and system parameters.",
      modelName: "gemma-3-27b-it",
      hasImageCapabilities: false,
      tools: [
        { name: "Provider Health Tool", slug: "provider_health_tool", description: "Get system provider health status", method: "GET", url: "/api/providers/status" }
      ]
    }
  },
  {
    fileName: "Reports Screen n8nWkf.json",
    config: {
      id: "fmc-reports-screen-workflow",
      name: "FMC Reports Screen n8nWkf",
      screenName: "ReportsView",
      agentPurpose: "Render audit logs, system telemetry, visual report charts, graphic artifacts, and 1-click n8n sync.",
      modelName: "llama-3.3-70b-versatile",
      hasImageCapabilities: true,
      tools: [
        { name: "API Logs Tool", slug: "api_logs_tool", description: "Fetch API audit logs", method: "GET", url: "/api/reports/api-logs" },
        { name: "System Logs Tool", slug: "system_logs_tool", description: "Fetch system logs", method: "GET", url: "/api/reports/system-logs" },
        { name: "Telemetry Summary Tool", slug: "telemetry_tool", description: "Fetch telemetry metrics and graphic chart data", method: "GET", url: "/api/reports/telemetry" },
        { name: "n8n Sync Tool", slug: "n8n_sync_tool", description: "Synchronize n8n workflows with database", method: "POST", url: "/api/integrations/n8n-sync" }
      ]
    }
  },
  {
    fileName: "Manual Screen n8nWkf.json",
    config: {
      id: "fmc-manual-screen-workflow",
      name: "FMC Manual Screen n8nWkf",
      screenName: "ManualView",
      agentPurpose: "Serve 2-column interactive help documentation, troubleshooting steps, and visual UI architecture guides.",
      modelName: "gemma-3-27b-it",
      hasImageCapabilities: true,
      tools: [
        { name: "Manual Help API Tool", slug: "manual_help_tool", description: "Fetch user manual content and guide data", method: "GET", url: "/api/help/manual" }
      ]
    }
  }
];

const outDir = path.join(__dirname, '../n8n Workflow');

workflows.forEach(item => {
  const wkfObj = createAiAgentWorkflow(item.config);
  const outPath = path.join(outDir, item.fileName);
  fs.writeFileSync(outPath, JSON.stringify(wkfObj, null, 2), { encoding: 'utf8' });
  console.log(`[GENERATED] ${item.fileName} (${wkfObj.nodes.length} nodes, AI Agent + Model + Memory + ${item.config.tools.length} Tools)`);
});

console.log("\nALL 11 AI AGENT WORKFLOWS GENERATED SUCCESSFULLY!");
