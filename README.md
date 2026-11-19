
<div align="center">
  <img src="public/jdroidxlogo.png" alt="FreeModelsClub Logo" width="150" />
  <h1>FreeModelsClub</h1>
  <p><strong>Enterprise-Grade Localhost Smart Chatbot & Universal AI Proxy Gateway</strong></p>
</div>

---

**FreeModelsClub** is a highly advanced, zero-trust localized smart chatbot and OpenAI-compatible API proxy. It acts as an intelligent gateway to seamlessly aggregate, monitor, load-balance, and route your inference calls across a multitude of free and open-weights LLMs from providers like **Groq**, **Google Gemini**, **OpenRouter**, and local **Ollama** models.

## ✨ Core Features

### 🔌 Universal OpenAI-Compatible API Proxy
Easily plug FreeModelsClub into any IDE (like VSCode, Cursor), Desktop Agent (like Claude Desktop), or CLI tool by simply substituting their API Base URL with `http://localhost:12247/v1`. FreeModelsClub translates outgoing requests to fit the requirements of Groq, Gemini, or Anthropic instantly on the fly.

### ⚖️ Model Club & Smart Load Balancing
Create **Model Combos** to logically group different AI models together.
- **Round-Robin Strategy**: Evenly distribute requests across multiple free models to completely avoid rate limits.
- **Fallback Strategy**: Automatically fail-over to a backup model if the primary model goes offline or throws a 429 Rate Limit error.

### 🎨 22 Curated Multi-Palette Themes & 4-Color Substrate Engine
Experience a visually rich, eye-candy glassmorphism interface across 4 distinct categories:
- **7 Metal Themes**: Platinum Silver, Gold Royal, Silver Classic, Titanium Modern, Bronze Antique, Copper Industrial, Obsidian Stealth.
- **5 Natural Themes**: Emerald Forest, Deep Ocean, Nordic Pine, Sahara Desert, Autumn Maple.
- **5 Cosmic Themes**: Nebula Violet, Galaxy Starlight, Solar Flare, Aurora Borealis, Deep Cosmos.
- **5 Popular Internet Themes**: Dracula Dark, Tokyo Night, Catppuccin Mocha, Nord Ice, Cyberpunk Neon.
- **4-Color Substrate Palettes**: Every theme provides calibrated `--bg-dark`, `--bg-sidebar`, `--bg-card`, and `--primary` tokens with 25% darker button depth and specular hover highlights.

### 🔤 12 Crystal-Clear Online Typography Choices & Interactive Resizing
- **12 Top Fonts**: System Default Native, Inter, Outfit, Plus Jakarta Sans, Roboto, Space Grotesk, JetBrains Mono, Fira Code, Manrope, DM Sans, and Sora.
- **Interactive UI/UX Customizer**: Adjust Base Font Size (11px–18px), Font Weight (300–700), Letter Spacing (-1px to +2px), Line Height (1.2–1.8), Card Padding (2px–24px), Backdrop Blur, and Glass Opacity.
- **Fresh Install Intelligence**: Defaults to System Default Native Font on clean install, and automatically persists & hydrates saved typography across browser sessions.

### 🌟 Unified Icon System & RAG Telemetry Immunity
- **Transparent Backgrounds**: 100% transparent icon backgrounds across all buttons, navigation items, cards, and drawers.
- **Dynamic Viewport Scaling**: Adaptive icon scaling via `font-size: clamp(0.72rem, 1em, 1.25rem)`.
- **Theme Specular Glow**: Non-status icons smoothly transition to the theme's active glow on hover.
- **🛡️ RAG Status Protection**: Functional health badges (`.badge-emerald`, `.badge-amber`, `.badge-rose`, `.badge-cyan`) are immune to theme overrides to guarantee telemetry accuracy.

### 📊 Real-Time Telemetry Dashboard
A beautiful, responsive glassmorphism UI tracks your exact API usage:
- Live streaming token tracking (Prompt vs Completion tokens)
- Request latency measuring (milliseconds)
- Provider status monitoring (Active vs Offline)
- Total diagnostic traces and error root cause analysis (400, 429, 500 error breakdowns)

### 🛡️ Zero-Trust Security & Self-Healing
- **AES-256-GCM CryptoVault**: Provider API keys are encrypted at rest with hardware/device-bound cryptographic salts.
- **Outbound Key Resolution**: Masked placeholders (`"********"`) in the UI are dynamically resolved to decrypted keys before outbound API calls, preventing plaintext exposure.
- **Crash-Safe Persistence**: Employs dynamic `.tmp` atomic file writing mechanisms to ensure your configurations are never corrupted during a crash.
- **Auto-Database Seeding**: The app automatically generates the required database structure, schemas, and default credentials upon its first boot.
- **Aggressive Rate Limiting**: Built-in mechanisms to prevent request flooding and preserve system memory.
- **Strict 127.0.0.1 Localhost Binding**: Zero-trust CORS and CSP security headers prevent unauthorized external origin access.

### 🏗️ Strict OOPS MVC Enterprise Architecture
Built on a robust, highly cohesive 3D Program Matrix:
- **Dimension 1**: View Controllers & DOM Render Layer (`DashboardView`, `PlaygroundView`, `RegistrationView`, `ProvidersView`, `ModelClubView`, `SettingsView`, `ReportsView`, `ManualView`)
- **Dimension 2**: Execution Engine & Multi-Thread Processing Services (`ProxyEngineService`, `ModelSelectionService`, `ModelLoadBalancer`, `ProgramMappingAgent`)
- **Dimension 3**: Auto-managed JSON Persistence Layer (`data/users.json`, `data/providers.json`, `data/models.json`, `data/combos.json`, `data/taxonomy.json`, `data/program_mapping.json`)

---

## 🚀 Prerequisites

Ensure your system has the following installed before proceeding:
- **Node.js**: `v18.0.0` or higher
- **Git**: To clone the repository

---

## 📦 Fresh System Installation Guide

Follow these step-by-step instructions to get FreeModelsClub running on a fresh machine seamlessly:

### 1. Clone the Repository
Open your terminal/command prompt and clone the codebase:
```bash
git clone https://github.com/jDroid-X/FreeModelClub.git
cd FreeModelClub
```

### 2. Windows 1-Click Automated Install & Launch (Recommended)
If you are on Windows, you can use the enterprise automated scripts to install and launch without manual terminal commands:

1. **Install Dependencies:** Double-click `Install_FreeModelsClub.bat` in the root folder. It checks your Windows environment, validates Node.js (v18+), provisions folders, and runs an isolated deterministic install.
2. **Launch into System Tray (Silent):** Double-click `Launch_FMC.bat` in the root folder. FreeModelsClub boots silently and mounts directly to your Windows Taskbar / Notification Tray with zero background console clutter.
3. **Launch with Real-Time Server Console:** If you prefer watching live streaming inference logs and request latency in real time, double-click `scripts\Launch_Server_Console.bat`.

> [!NOTE]
> **Active Verified Models & Providers:** The `data/` database is pre-configured with **21 AI Providers**, **322 Registered LLMs**, and **314 Active Free & Open-Weights Models** spanning Groq, NVIDIA NIM, Bynara, OpenRouter, Google Gemini, OpenAI, Opencode, Ollama, Azure AI, and Vercel.
> FreeModelsClub features an **ActiveModelAgent** and **Auto-Seeding Engine** that dynamically initializes default schemas securely upon first boot!
> 
> **Default Install Location:** By default, the application installs to `%USERPROFILE%\jDroid-X\FreeModelClub\`. This is outside your OneDrive sync folders and keeps the app fully contained within the jDroid-X ecosystem.

### 3. Cross-Platform Manual Installation (NPM)
If you are on Linux, macOS, or prefer a manual CLI workflow:
```bash
npm install
```

### 4. Application Lifecycle Management (Enterprise Scripts)
We provide a strict suite of enterprise-grade scripts to manage the application cleanly:

- `Install_FreeModelsClub.bat` *(Root)*: Verifies environment, builds directories, and installs dependencies.
- `Launch_FMC.bat` *(Root)*: 1-Click Master silent launcher with Windows System Tray integration (`jDroid-X-FMC`).
- `Update_FreeModelsClub.bat` *(Root)*: Safely creates timestamped backups of your API keys/data before pulling updates.
- `Uninstall_FreeModelsClub.bat` *(Root)*: Wipes dependencies with options to preserve or clean your configurations.
- `scripts\Launch_Server_Console.bat`: Performs health checks, ensures ports are free, boots the server, and shows live logs.
- `scripts\Launch_Silent.vbs`: Starts the Node.js server completely hidden in the background.
- `scripts\Stop_FreeModelsClub.bat`: Safely halts the background Node process and unbinds port 12247.

### 5. Launch the Server
You can boot the application using any of the following methods:

- **Method A: Windows 1-Click Tray (Recommended)**
  Double-click `Launch_FMC.bat`.
- **Method B: Standard Cross-Platform NPM Launch**
  ```bash
  npm start
  ```
- **Method C: Windows Real-Time Console Launcher**
  Double-click `scripts\Launch_Server_Console.bat`.
- **Method D: Silent Background Launcher**
  Double-click `scripts\Launch_Silent.vbs`.

### 6. Access the Smart Dashboard
Once the terminal reads `FreeModelsClub Localhost Smart Chatbot Server Running!`, open your browser and navigate to:
👉 **http://localhost:12247**

> [!SECURITY]
> **Production Security Mandate (Zero Pre-Shared Keys & Passwords):**
> In compliance with enterprise security protocols, no live third-party API keys or unencrypted passwords are shared with this distribution.
> - **Initial Setup**: Sign in with your localized administrator account (default initialized on boot: `admin@localhost` or as configured in your private `.env`).
> - **Mandatory Password Update**: Update your password upon initial login in **Settings -> Security**.
> - **Generate Client API Key**: Navigate to **Settings -> Tool Connections** to generate your own private localized bearer token for external IDEs and agents.

---

## ⚡ Supported Working Models & Providers (314 Active Free Models)

FreeModelsClub continuously audits, benchmarks, and serves **314 active free & open-weights models** across **21 AI providers**:

| Provider Suite | Active Models | Key Models & Highlights |
| :--- | :---: | :--- |
| **Groq Cloud** | 9 | `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `qwen3_6-27b`, `deepseek-r1-distill-llama-70b`, `mixtral-8x7b-32768`, `whisper-large-v3-turbo` |
| **NVIDIA NIM Cloud** | 71 | `nemotron-3-ultra-550b`, `nemotron-3-super-120b`, `nemotron-3-nano-omni-30b`, `nvidia-llama-3_3-70b`, `nvidia-coder-32b`, `deepseek-v4-flash`, `bge-m3` |
| **Bynara AI Router** | 72 | `kimi-k2_7-code-free`, `deepseek-v4-flash-free`, `mimo-v2_5-free`, `ling-3_0-flash-free`, `laguna-s-2_1-free` |
| **Opencode Zen** | 71 | `deepseek-v4-flash-free`, `mimo-v2_5-free`, `ling-3_0-flash-free`, `llama-3_3-70b-versatile`, `mixtral-8x7b` |
| **OpenRouter Free Models** | 17 | `laguna-s-2_1_free`, `cohere_north-mini-code_free`, `gemma-4-31b-it_free`, `nemotron-3-ultra-550b_free`, `gpt-oss-20b_free` |
| **OpenAI Cloud & ChatGPT** | 17 | `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo`, `o1-preview`, `o1-mini`, `gpt-oss-20b` |
| **Azure AI** | 15 | Enterprise managed open-weights models and serverless inference endpoints |
| **Vercel AI SDK Endpoints** | 15 | High-speed edge-optimized free tier endpoints |
| **Abhiraj GPT-OSS** | 9 | Open-weights research models (`gpt-oss-20b`, specialized reasoning checkpoints) |
| **Ollama Localhost** | 7 | 100% offline localhost models (`smollm3_latest`, `qwen2_5_3b`, etc. via port 11434) |
| **Google Gemini API** | 5 | `gemini-2.5-flash`, `gemini-2.0-flash-lite`, `gemini-1.5-pro`, `gemini-1.5-flash`, `gemma-2-9b-it` |
| **AgentRouter API** | 5 | Unified open-source routing agent endpoints |
| **Kie AI** | 1 | Specialized coding and reasoning agent endpoint |
| **Total Active Models** | **314** | **100% Free / Open-Weights Models Active and Verified** |

> [!TIP]
> **Active Model Combos (Model Club):** In addition to individual models, FreeModelsClub bundles **7 multi-model combos** (such as `jDroidxyz-combo-agent`, `jdroid-x-combos`, and `coding-combo-agent`) with intelligent **Round-Robin**, **Fallback**, and **Auto** load-balancing to ensure 99.99% uptime with zero rate-limit errors.

---

## 🔄 How to Synchronize Working Models

FreeModelsClub features automated, multi-tiered synchronization to keep active models and provider states in continuous harmony:

### 1. Automatic Dynamic Sync (ActiveModelAgent)
The built-in `ActiveModelAgent` automatically audits and classifies all registered models in `data/models.json` against `data/providers.json` on application startup and on a recurring schedule.
- Active models are dynamically written to `data/Activemodels.json` (314 active).
- Temporarily paused or inactive provider models are safely isolated in `data/inactivemodel.json` (8 inactive).

### 2. Manual CLI Sync Command
To reconcile model names, display labels, and provider metadata against the single source of truth at any time:
```bash
node scripts/sync_models.js
```
This script audits `data/models.json` and updates provider display names and formatting.

### 3. Verify Live Working Models via REST API
Verify that all active models are responding via the OpenAI-compatible endpoint:
```bash
curl http://localhost:12247/v1/models
```
Or check the active model count via the native internal API:
```bash
curl http://localhost:12247/api/models/active
```

---

## 🔗 Integrating 3rd-Party AI Tools & Agents

FreeModelsClub acts as a central nervous system for all your AI development tools. By linking them to this localhost server, you gain centralized telemetry, zero plaintext key exposure, and multi-model rate-limit protection.

Configure any external tool (Cursor, Windsurf, Claude Desktop, Antigravity, Open-WebUI) with the following standard credentials:
- **Base URL**: `http://localhost:12247/v1`
- **API Key**: `<your-fmc-api-key>` *(Generated in the **Settings -> API Keys** tab of your local dashboard).*

### Example 1: OpenAI-Compatible Chat Completion (cURL)
Call any single model (e.g. `llama-3.3-70b-versatile`) directly:
```bash
curl http://localhost:12247/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-fmc-api-key>" \
  -d '{
    "model": "groq_llama-3_3-70b-versatile",
    "messages": [
      {"role": "user", "content": "Explain quantum computing in two sentences."}
    ],
    "temperature": 0.7
  }'
```

### Example 2: Using Intelligent Model Combos (Zero Rate Limits)
Route requests through a load-balanced combo agent (e.g. `jDroidxyz-combo-agent` or `jdroid-x-combos`):
```bash
curl http://localhost:12247/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-fmc-api-key>" \
  -d '{
    "model": "jDroidxyz-combo-agent",
    "messages": [
      {"role": "user", "content": "Write a clean JavaScript debounce function."}
    ],
    "stream": true
  }'
```

### Example 3: Connecting Anthropic Claude Desktop
FreeModelsClub automatically translates Claude's `/v1/messages` format into standard OpenAI protocols on the fly!
1. Open your `claude_desktop_config.json`
2. Point the Anthropic Base URL to `http://localhost:12247/v1`
3. Check the **Settings -> Tool Connections** tab in the FreeModelsClub dashboard for an exact copy-paste configuration snippet!

---

## 📚 Development & Documentation Guidelines

For contributors and agents interacting with this codebase, FreeModelsClub rigidly enforces a **7-Stage Closed-Loop Waterfall (OOPS MVC)** framework.
Every major architectural enhancement must flow through:
1. INITIATE & PLAN
2. REQUIREMENTS ANALYSIS
3. SYSTEM DESIGN
4. IMPLEMENTATION
5. TESTING
6. DEPLOYMENT
7. MAINTENANCE & SUPPORT (Closed-Loop Feedback)

Check the `.agents/workflows/` directory for exhaustive development rules and pony-tail code-limit mandates.
The canonical project agent map is defined in `.agents/agent-architecture.md` and extends the existing `SearchAgent`, `ProviderAgent`, `MonitoringAgent`, and `ProgramMappingAgent` roles without replacing them.

---

<div align="center">
  <p>Built for resilience, scale, and zero-cost LLM orchestration.</p>
  <p>Licensed under <b>MIT</b>.</p>
</div>
