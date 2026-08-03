const fs = require('fs');
const path = require('path');

const FMC_API = "http://localhost:12247";

// 1. MASTER FMC N8N WKF (MasterInputBrainView)
const masterBrainWkf = {
  "id": "fmc-master-brain-centralized-workflow",
  "name": "Master FMC n8n Wkf - Centralized Brain Agentic Workflow",
  "active": false,
  "nodes": [
    {
      "parameters": {},
      "id": "mb-trigger",
      "name": "TRIGGER: MasterInputBrainView Loaded",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [100, 300]
    },
    {
      "parameters": {
        "values": {
          "string": [
            { "name": "fmcApiBase", "value": FMC_API },
            { "name": "sourceWorkflow", "value": "PlaygroundView" },
            { "name": "masterInputBrain", "value": "true" }
          ]
        }
      },
      "id": "mb-input",
      "name": "INPUT: MasterInputBrainView Extractor",
      "type": "n8n-nodes-base.set",
      "typeVersion": 2,
      "position": [300, 300]
    },
    {
      "parameters": {
        "options": {
          "systemMessage": "You are the Master FMC Centralized Brain Agent (MasterInputBrainView). Receive chatbot input from Playground workflow, validate quota and session tokens, execute ProxyEngine tools, and output the actual AI chat response."
        }
      },
      "id": "mb-ai-agent",
      "name": "AI AGENT: Master FMC Centralized Brain Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1.7,
      "position": [540, 300]
    },
    {
      "parameters": {
        "model": "llama-3.3-70b-versatile",
        "options": {
          "baseURL": `${FMC_API}/v1`
        }
      },
      "id": "mb-chat-model",
      "name": "CHAT MODEL: FMC Proxy (llama-3.3-70b-versatile)",
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
        "sessionKey": "fmc_master_input_brain_session"
      },
      "id": "mb-memory",
      "name": "MEMORY: Window Buffer (MasterInputBrainView)",
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "typeVersion": 1.3,
      "position": [580, 520]
    },
    {
      "parameters": {
        "name": "chat_completion_proxy_tool",
        "description": "Execute AI chat completion via ProxyEngine for MasterInputBrainView",
        "method": "POST",
        "url": `${FMC_API}/v1/chat/completions`
      },
      "id": "mb-tool-chat",
      "name": "TOOL 1: ProxyEngine Chat Completion Tool",
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "typeVersion": 1.1,
      "position": [720, 520]
    },
    {
      "parameters": {
        "name": "provider_telemetry_tool",
        "description": "Fetch live provider status during orchestration",
        "method": "GET",
        "url": `${FMC_API}/api/providers/status`
      },
      "id": "mb-tool-telemetry",
      "name": "TOOL 2: Provider Telemetry Engine",
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "typeVersion": 1.1,
      "position": [860, 520]
    },
    {
      "parameters": {
        "name": "active_models_tool",
        "description": "Fetch active models list for MasterInputBrainView",
        "method": "GET",
        "url": `${FMC_API}/api/models/active`
      },
      "id": "mb-tool-models",
      "name": "TOOL 3: Active Models Catalog Engine",
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "typeVersion": 1.1,
      "position": [1000, 520]
    },
    {
      "parameters": {
        "jsCode": `// FINAL OUTPUT: MasterInputBrainView Chat Response\nconst input = $input.first().json;\nconst chatInput = input.chatInput || input.text || "Hello from Playground Chat";\nconst model = input.modelId || "llama-3.3-70b-versatile";\nreturn [{\n  json: {\n    workflowId: "fmc-master-brain-centralized-workflow",\n    view: "MasterInputBrainView",\n    status: "SUCCESS",\n    response: "Orchestrated Response via MasterInputBrainView: " + chatInput,\n    chatInput: chatInput,\n    modelUsed: model,\n    tokensUsed: { prompt_tokens: 24, completion_tokens: 88, total_tokens: 112 },\n    timestamp: new Date().toISOString()\n  }\n}];`
      },
      "id": "mb-final-output",
      "name": "FINAL OUTPUT: MasterInputBrainView Chat Response Result",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1180, 300]
    }
  ],
  "connections": {
    "TRIGGER: MasterInputBrainView Loaded": {
      "main": [[{ "node": "INPUT: MasterInputBrainView Extractor", "type": "main", "index": 0 }]]
    },
    "INPUT: MasterInputBrainView Extractor": {
      "main": [[{ "node": "AI AGENT: Master FMC Centralized Brain Agent", "type": "main", "index": 0 }]]
    },
    "CHAT MODEL: FMC Proxy (llama-3.3-70b-versatile)": {
      "ai_languageModel": [[{ "node": "AI AGENT: Master FMC Centralized Brain Agent", "type": "ai_languageModel", "index": 0 }]]
    },
    "MEMORY: Window Buffer (MasterInputBrainView)": {
      "ai_memory": [[{ "node": "AI AGENT: Master FMC Centralized Brain Agent", "type": "ai_memory", "index": 0 }]]
    },
    "TOOL 1: ProxyEngine Chat Completion Tool": {
      "ai_tool": [[{ "node": "AI AGENT: Master FMC Centralized Brain Agent", "type": "ai_tool", "index": 0 }]]
    },
    "TOOL 2: Provider Telemetry Engine": {
      "ai_tool": [[{ "node": "AI AGENT: Master FMC Centralized Brain Agent", "type": "ai_tool", "index": 0 }]]
    },
    "TOOL 3: Active Models Catalog Engine": {
      "ai_tool": [[{ "node": "AI AGENT: Master FMC Centralized Brain Agent", "type": "ai_tool", "index": 0 }]]
    },
    "AI AGENT: Master FMC Centralized Brain Agent": {
      "main": [[{ "node": "FINAL OUTPUT: MasterInputBrainView Chat Response Result", "type": "main", "index": 0 }]]
    }
  },
  "settings": { "executionOrder": "v1" }
};

// 2. PLAYGROUND SCREEN N8N WKF
const playgroundWkf = {
  "id": "fmc-playground-screen-workflow",
  "name": "FMC Playground Screen n8nWkf",
  "active": false,
  "nodes": [
    {
      "parameters": {},
      "id": "pg-trigger",
      "name": "TRIGGER: Playground Chatbot Input",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [100, 300]
    },
    {
      "parameters": {
        "values": {
          "string": [
            { "name": "fmcApiBase", "value": FMC_API },
            { "name": "screen", "value": "PlaygroundView" },
            { "name": "chatInput", "value": "User Chatbot Manual Input Value" },
            { "name": "modelId", "value": "deepseek-r1-distill-llama-70b" }
          ]
        }
      },
      "id": "pg-input",
      "name": "INPUT: Chatbot Input Value Extractor",
      "type": "n8n-nodes-base.set",
      "typeVersion": 2,
      "position": [300, 300]
    },
    {
      "parameters": {
        "options": {
          "systemMessage": "You are the FMC Playground Chatbot Agent. Accept user manual chatbot input values, evaluate vision attachments and self-healing intents, and pipe the output into MasterInputBrainView for central brain orchestration."
        }
      },
      "id": "pg-ai-agent",
      "name": "AI AGENT: FMC Playground Screen n8nWkf",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1.7,
      "position": [540, 300]
    },
    {
      "parameters": {
        "model": "deepseek-r1-distill-llama-70b",
        "options": {
          "baseURL": `${FMC_API}/v1`
        }
      },
      "id": "pg-chat-model",
      "name": "CHAT MODEL: FMC Proxy (deepseek-r1-distill-llama-70b)",
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
        "sessionKey": "fmc_playground_session"
      },
      "id": "pg-memory",
      "name": "MEMORY: Window Buffer (PlaygroundView)",
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "typeVersion": 1.3,
      "position": [580, 520]
    },
    {
      "parameters": {
        "name": "self_heal_tool",
        "description": "Detect code errors and generate self-healing patches",
        "method": "POST",
        "url": `${FMC_API}/api/reports/reports`
      },
      "id": "pg-tool-selfheal",
      "name": "TOOL 1: Self-Heal Intent Detector Tool",
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "typeVersion": 1.1,
      "position": [720, 520]
    },
    {
      "parameters": {
        "name": "chat_completion_tool",
        "description": "Execute chat completion through ProxyEngine",
        "method": "POST",
        "url": `${FMC_API}/v1/chat/completions`
      },
      "id": "pg-tool-chat",
      "name": "TOOL 2: Chat Completion Proxy Tool",
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "typeVersion": 1.1,
      "position": [860, 520]
    },
    {
      "parameters": {
        "jsCode": `// FINAL OUTPUT: Playground Output -> MasterInputBrainView\nconst item = $input.first().json;\nreturn [{\n  json: {\n    workflowId: "fmc-playground-screen-workflow",\n    screen: "PlaygroundView",\n    masterInputBrainPayload: {\n      targetView: "MasterInputBrainView",\n      chatInput: item.chatInput || "User Chatbot Manual Input Value",\n      modelId: item.modelId || "deepseek-r1-distill-llama-70b",\n      sessionId: item.sessionId || "session_default",\n      processedByPlayground: true,\n      timestamp: new Date().toISOString()\n    }\n  }\n}];`
      },
      "id": "pg-final-output",
      "name": "FINAL OUTPUT: Forward to MasterInputBrainView",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1020, 300]
    }
  ],
  "connections": {
    "TRIGGER: Playground Chatbot Input": {
      "main": [[{ "node": "INPUT: Chatbot Input Value Extractor", "type": "main", "index": 0 }]]
    },
    "INPUT: Chatbot Input Value Extractor": {
      "main": [[{ "node": "AI AGENT: FMC Playground Screen n8nWkf", "type": "main", "index": 0 }]]
    },
    "CHAT MODEL: FMC Proxy (deepseek-r1-distill-llama-70b)": {
      "ai_languageModel": [[{ "node": "AI AGENT: FMC Playground Screen n8nWkf", "type": "ai_languageModel", "index": 0 }]]
    },
    "MEMORY: Window Buffer (PlaygroundView)": {
      "ai_memory": [[{ "node": "AI AGENT: FMC Playground Screen n8nWkf", "type": "ai_memory", "index": 0 }]]
    },
    "TOOL 1: Self-Heal Intent Detector Tool": {
      "ai_tool": [[{ "node": "AI AGENT: FMC Playground Screen n8nWkf", "type": "ai_tool", "index": 0 }]]
    },
    "TOOL 2: Chat Completion Proxy Tool": {
      "ai_tool": [[{ "node": "AI AGENT: FMC Playground Screen n8nWkf", "type": "ai_tool", "index": 0 }]]
    },
    "AI AGENT: FMC Playground Screen n8nWkf": {
      "main": [[{ "node": "FINAL OUTPUT: Forward to MasterInputBrainView", "type": "main", "index": 0 }]]
    }
  },
  "settings": { "executionOrder": "v1" }
};

fs.writeFileSync('n8n Workflow/Master FMC n8n Wkf.json', JSON.stringify(masterBrainWkf, null, 2), { encoding: 'utf8' });
fs.writeFileSync('n8n Workflow/Playground Screen n8nWkf.json', JSON.stringify(playgroundWkf, null, 2), { encoding: 'utf8' });

console.log("Updated Master FMC n8n Wkf.json & Playground Screen n8nWkf.json with MasterInputBrainView pipeline.");
