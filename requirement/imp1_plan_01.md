# Implementation Plan - FreeModelsClub Localhost Service Provider Smart Chatbot (OpenAI Compatible)

Develop an enterprise-grade, OOPS-based MVC localhost service provider smart chatbot server & web application running on port `12247`. The system proxies requests to free models across multiple providers (Groq, Gemini, OpenRouter, Together AI, Mistral, Ollama/Local, HuggingFace, etc.) through a standard OpenAI-compatible API (`/v1/chat/completions`, `/v1/models`), while offering a premium web interface with full provider management, interactive playground, Model Club family/skill classification, endpoint code generator, local client API key generation, and detailed diagnostic logs.

## Proposed System Architecture (OOPS based MVC)

```
FreeModelsClub/
├── package.json
├── program_mapping.json              # Master Relationship Table
├── server.js                        # Express Server (Port 12247)
├── data/                            # Persistent JSON Stores
│   ├── config.json
│   ├── providers.json
│   ├── api_keys.json
│   ├── api_logs.json
│   └── system_logs.json
├── src/
│   ├── controllers/                 # MVC Controllers
│   │   ├── AuthController.js
│   │   ├── ProviderController.js
│   │   ├── ModelController.js
│   │   ├── ChatController.js        # Handles OpenAI Proxy & Streaming
│   │   ├── LogController.js
│   │   └── IntegrationController.js
│   ├── models/                      # Database & Schemas
│   │   ├── ProviderModel.js
│   │   ├── AIModel.js
│   │   ├── UserModel.js
│   │   ├── LogModel.js
│   │   └── Database.js
│   ├── services/                    # Core Business & Connector Logic
│   │   ├── ProviderService.js       # Live API Model Fetcher & Free-tier Filtering
│   │   ├── ModelFamilyService.js    # Model Family & Core Skill Tagger
│   │   ├── ProxyEngineService.js    # OpenAI API compatibility proxy layer
│   │   ├── CodeSnippetService.js    # Multi-language integration code generator
│   │   └── AnalyticsService.js      # Realtime statistics & token counter
│   └── routes/                      # API & UI Route Endpoints
│       ├── authRoutes.js
│       ├── providerRoutes.js
│       ├── modelRoutes.js
│       ├── openaiRoutes.js          # /v1/models, /v1/chat/completions, /v1/api
│       ├── reportRoutes.js
│       └── integrationRoutes.js
└── public/                          # Glassmorphism Modern UI (Frontend SPA)
    ├── index.html
    ├── css/
    │   └── style.css                # Custom CSS Design System (Dark mode, glassmorphism, animations)
    └── js/
        ├── app.js                   # Client SPA Router & State Manager
        ├── views/
        │   ├── LoginView.js
        │   ├── DashboardView.js
        │   ├── RegistrationView.js
        │   ├── PlaygroundView.js
        │   ├── ProvidersView.js
        │   ├── ModelClubView.js
        │   ├── SettingsView.js
        │   └── ReportsView.js
        └── services/
            └── api.js
```

## User Review Required

> [!NOTE]
> All requested default configurations and credentials are pre-configured:
> - Default login email: `FreeModelsClub@jdroidxy.com`
> - Default login password: `Admin@1234`
> - Server port: `12247`
> - OpenAI Endpoints: `http://localhost:12247/v1/chat/completions`, `http://localhost:12247/v1/models`, `http://localhost:12247/v1/api`

## Key Component Changes

### [NEW] Package & Master Mapping
- `package.json`: Dependencies (`express`, `cors`, `body-parser`, `node-fetch`, `uuid`, etc.).
- `program_mapping.json`: Master relationship table listing all modules, functions, dependencies, and integration points.

### [NEW] Backend Server & MVC Core (`src/`)
- `server.js`: Initializes Express on port `12247`, mounts API routes, static UI files, and handles error catching.
- `Database.js`: Thread-safe, JSON-backed persistent store for providers, models, keys, and logs.
- `ProviderService.js`: Queries remote APIs (Groq, OpenRouter, Google Gemini, Ollama, Mistral, Together) to fetch available models, filtered strictly for free models.
- `ProxyEngineService.js`: Translates incoming standard OpenAI requests (`/v1/chat/completions`) into target provider calls, supports streaming (SSE), calculates tokens/latency, and writes detailed diagnostic logs.
- `ModelFamilyService.js`: Categorizes models by Architecture Family (Llama, Qwen, Gemma, DeepSeek, Mixtral, Phi) and Core Skills (Coding, Reasoning, Low-Latency Chat, Vision, General).

### [NEW] Frontend UI (`public/`)
- Single-Page Interface with responsive left navigation menu:
  - **Login Screen**: Pre-filled with `FreeModelsClub@jdroidxy.com` / `Admin@1234`.
  - **Provider Onboarding / Registration**: Live API search, multi-select free model picker, tooltips.
  - **Dashboard**: Provider metrics, token counts, request speed, active models.
  - **Playground**: Chat client with live model selector, token analytical stats header row, markdown & code formatting.
  - **Providers**: CRUD operations for providers & free models, tool connector generator (Claude, VSCode, Antigravity, Kiro).
  - **Model Club**: Free model grid with "Model Family" and "Model Core Skills" group/rearrange views.
  - **Settings**: Endpoint URL list (`/v1`, `/v1/api`, `/v1/models`, `/v1/chat/completions`), local API key generator.
  - **Reports**: Tabbed view for API logs (with request/response payload root cause diagnostics) and System logs.

## Verification Plan

### Automated & Integration Tests
1. Start local server on port 12247: `node server.js`
2. Test health check endpoint: `GET http://localhost:12247/v1/api`
3. Test model listing endpoint: `GET http://localhost:12247/v1/models`
4. Test OpenAI chat completion proxy endpoint: `POST http://localhost:12247/v1/chat/completions` with sample prompt and API Key.
5. Check log recording in `data/api_logs.json` and `data/system_logs.json`.

### Manual UI Verification
- Verify login screen pre-filled values and redirection logic.
- Verify provider registration & free model search functionality.
- Verify playground chat flow & token header metrics update.
- Verify Model Family and Core Skill view toggles in Model Club.
- Verify integration code generator snippets (cURL, Python, Node.js).
