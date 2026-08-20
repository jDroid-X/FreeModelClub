# Implementation Plan - Dashboard 2-Row Layout, 15% Width Side Panels & Claude Chatbot Setup Guide

Restructure the Dashboard view into a clean 2-row layout with statistical metadata tiles using RAG color indicators, set the first panel in Playground and Provider Register to 15% width equipped with fully functional action icons, and provide a step-by-step developer guide for connecting Claude Chatbot in developer mode.

## User Review Required

> [!IMPORTANT]
> - **Dashboard 2-Row Restructuring**:
>   - **Row 1**: Combined Provider Overview tile showing active providers, connection health status, and quick onboarding shortcut.
>   - **Row 2**: Metadata statistical tiles grid featuring **Available Models**, **Tokens Consumed**, **Remaining Quota Balance**, and **Estimated Credit Saved**. Uses large smart-fitting numbers (`1.8rem` - `2.2rem`) and RAG color coding (Green `#10b981` for >20% normal capacity, Amber `#f59e0b` for warnings, Red `#f43f5e` for <20% quota remaining).
> - **Playground & Provider Register 15% Side Panels**:
>   - Sets the first panel in `PlaygroundView` and `RegistrationView` to exactly **15% width** (`width: 15%; flex-shrink: 0; min-width: 140px;`).
>   - Adds a suite of fully functional tool icons:
>     - **Playground**: New Chat, Search History, System Prompt Presets, SSE Stream Toggle, Clear Chat, Export Transcript, Copy Response.
>     - **Provider Register**: Provider Protocol Selectors, Live Ping Test, Live Model Search Trigger, Reset Form Fields, Integration Snippets Toggle.
> - **Claude Chatbot Developer Connection Guide**:
>   - Detailed step-by-step instructions for connecting Claude Desktop / Claude Extensions in developer mode to `http://localhost:12247/v1` using generated FMC Bearer keys.

## Proposed Changes

---

### Frontend Views & UI Components

#### [MODIFY] [DashboardView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/DashboardView.js)
- Re-architect layout into 2 distinct rows:
  - **Row 1**: Combined Provider Overview Panel (active provider counts, connection status, quick onboarding action).
  - **Row 2**: Metadata Statistical Tiles Grid (Available Models, Consumed Tokens, Remaining Free Balance %, Credit Saved) with smart-fit numbers and dynamic RAG color logic (`< 20%` -> Red/Rose, `20% - 50%` -> Amber, `> 50%` -> Emerald Green).

#### [MODIFY] [PlaygroundView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/PlaygroundView.js)
- Update left history & tools sidebar to **15% available width** (`width: 15%; flex-shrink: 0; min-width: 140px;`).
- Add functional icon action bar:
  - ➕ New Chat
  - 📝 System Prompt Presets (Coding, Summary, Audit)
  - 🌊 Stream Toggle Switch (SSE vs Sync)
  - 📥 Export Chat Log (JSON download)
  - 🗑️ Clear Messages
  - 📋 Copy Last Response

#### [MODIFY] [RegistrationView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/RegistrationView.js)
- Update left provider quick-select panel to **15% available width** (`width: 15%; flex-shrink: 0; min-width: 140px;`).
- Add functional action icons:
  - ⚡ Provider Protocol Selectors (Groq, OpenRouter, Gemini, Together, Mistral, Ollama, Custom)
  - 🌐 Live Provider Ping Test Button
  - 🔍 Live Model Search Trigger
  - 🧹 Reset Form Fields
  - 📜 Integration Code Toggle

---

### Backend & Data Services

#### [MODIFY] [ProxyEngineService.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/services/ProxyEngineService.js) & [DashboardController.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/controllers/DashboardController.js)
- Include free quota balance calculations (percentage remaining and RAG status) in `/v1/dashboard/stats` response payload.

---

### Documentation & Walkthrough

#### [NEW] [walkthrough.md](file:///C:/Users/jiten/.gemini/antigravity-ide/brain/ce8f637f-9cd9-4471-a24a-84d58b9ecbed/walkthrough.md)
- Document Dashboard 2-row layout, 15% side panels, and step-by-step developer guide for connecting Claude Chatbot to `http://localhost:12247/v1`.

---

## Verification Plan

### Automated & Manual Verification
- Render DashboardView and verify 2-row structure, smart-fit typography, and RAG color logic (< 20% Red, > 20% Green).
- Render PlaygroundView and RegistrationView to verify 15% panel width and functional action icon triggers.
- Test endpoint response from `/v1/chat/completions` using custom Bearer key to verify Claude OpenAI proxy compatibility.
