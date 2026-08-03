const testWkf = {
  "id": "fmc-test-ai-agent-workflow",
  "name": "FMC Test AI Agent Workflow",
  "active": false,
  "nodes": [
    {
      "parameters": {},
      "id": "trigger",
      "name": "When clicking 'Execute Workflow'",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [100, 300]
    },
    {
      "parameters": {
        "options": {
          "systemMessage": "You are the FMC Master Orchestrator Agent. Use tools to query provider status and model specs."
        }
      },
      "id": "ai-agent",
      "name": "FMC AI Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1.7,
      "position": [360, 300]
    },
    {
      "parameters": {
        "model": "llama-3.3-70b-versatile",
        "options": {
          "baseURL": "http://localhost:12247/v1"
        }
      },
      "id": "chat-model",
      "name": "FMC OpenAI Compatible Chat Model",
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "typeVersion": 1.2,
      "position": [280, 520],
      "credentials": {
        "openAiApi": {
          "id": "fmc-dummy-creds",
          "name": "FMC Localhost Proxy"
        }
      }
    },
    {
      "parameters": {
        "sessionIdType": "customKey",
        "sessionKey": "fmc_session_id"
      },
      "id": "memory",
      "name": "Window Buffer Memory",
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "typeVersion": 1.3,
      "position": [420, 520]
    },
    {
      "parameters": {
        "name": "provider_status_tool",
        "description": "Fetch live telemetry and active health status of all model providers",
        "method": "GET",
        "url": "http://localhost:12247/api/providers/status"
      },
      "id": "tool-providers",
      "name": "Provider Telemetry Tool",
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "typeVersion": 1.1,
      "position": [560, 520]
    }
  ],
  "connections": {
    "When clicking 'Execute Workflow'": {
      "main": [
        [
          {
            "node": "FMC AI Agent",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "FMC OpenAI Compatible Chat Model": {
      "ai_languageModel": [
        [
          {
            "node": "FMC AI Agent",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Window Buffer Memory": {
      "ai_memory": [
        [
          {
            "node": "FMC AI Agent",
            "type": "ai_memory",
            "index": 0
          }
        ]
      ]
    },
    "Provider Telemetry Tool": {
      "ai_tool": [
        [
          {
            "node": "FMC AI Agent",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
};

const fs = require('fs');
fs.writeFileSync('scratch/test_ai_agent_wkf.json', JSON.stringify(testWkf, null, 2), 'utf8');
console.log('Saved test AI Agent workflow to scratch/test_ai_agent_wkf.json');
