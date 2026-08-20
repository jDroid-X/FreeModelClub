# FreeModelsClub Enterprise Agent Rules & Guidelines (Project Level)

This document establishes the master operational guidelines and workflow standards for **FreeModelsClub Localhost Smart Chatbot**.

---

## 1. PonyTail Decision Ladder & Line Limit Rule
**Prime Directive**: Implement the leanest working OOPS-based MVC solution.

### Ponytail Decision Ladder:
Before writing or modifying code, evaluate:
1. Does this need to exist?
2. Can existing code be reused?
3. Can the standard library handle it?
4. Can native platform features handle it?
5. Can an installed dependency handle it?
6. Can it be written in one or minimum lines?
7. Write the minimum code required as part of an OOPS-based MVC structure.
8. Ensure that while refactory code existing functionality and integrity must not breake.

### Line Count Limit & Integrity Mandate (PonyTail Rule):
- Keep source files under **1800–2000 lines max**.
- Maintain clean OOPS-based MVC structure while ensuring high cohesion, feature completeness, and visual excellence.
- **CRITICAL INTEGRITY DIRECTIVE**: Functionality, UI/UX richness, and code integrity MUST ALWAYS be the #1 priority. Never truncate or compromise features for line metrics.
- **3D PROGRAM MATRIX & MULTI-THREAD CLOSED-LOOP ARCHITECTURE**:
  - **Dimension 1 (View Controllers)**: User Interface & DOM Render Layer (`DashboardView`, `PlaygroundView`, `RegistrationView`, `ProvidersView`, `ModelClubView`, `SettingsView`, `ReportsView`).
  - **Dimension 2 (Services & Agents)**: Execution Engine & Multi-Thread Processing Layer (`ModelClubHierarchyHelper`, `ModelClubComboStudioHelper`, `SearchAgent`, `ProgramMappingAgent`, `TokenAgentService`, `ProxyEngineService`).
  - **Dimension 3 (Database Schemas)**: Persistence Layer (`data/combos.json`, `data/models.json`, `data/providers.json`, `data/taxonomy.json`, `data/program_mapping.json`).
  - **1-to-Multi-Thread Workflow & Convergence**: User triggers fork into parallel asynchronous threads (UI render, data hydration, security handshake, quota check) which converge at state validation checkpoints.
  - **Closed-Loop Feedback Loop**: Any exception, rate limit (HTTP 429), or user action triggers an automatic failover/retry feedback loop (`User -> Parallel Threads -> Convergence -> Closed-Loop Feedback -> View Sync`).
- **PROGRAM MAPPING AGENT MANDATE**: The **Program Mapping Agent** ([`src/services/ProgramMappingAgent.js`](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/services/ProgramMappingAgent.js)) acts as the master relationship auditor. Before and after every refactoring pass, execute `node scratch/program_mapping_agent.js` to parse class definitions across all 3 dimensions, verify line limits (< 250 lines), check syntax, and validate that **100% of all dependencies and integration contracts remain intact and unbroken**.

---

## 2. 7-Stage Closed-Loop Waterfall (OOPS MVC) Workflow

All application enhancements follow the strict 7-stage Waterfall sequence:

1. **INITIATE & PLAN**: Problem definition, scope, feasibility, and approval.
2. **REQUIREMENTS ANALYSIS**: SRS documentation, use case identification, and sign-off.
3. **SYSTEM DESIGN (OOPS MVC)**: Class diagrams, database schema (Model), UI/UX (View), and controller routing.
4. **IMPLEMENTATION (CODING)**:
   - Data Flow: `User -> Request -> View -> Controller -> Model -> DB`
   - Return Flow: `DB -> Model -> Controller -> View -> User`
   - Reference `program_mapping.json` as the master dependency table.
5. **TESTING**: Unit, integration, security, and performance testing.
6. **DEPLOYMENT**: Server boot, configuration setup, database migration, and smoke tests.
7. **MAINTENANCE & SUPPORT (CLOSED LOOP)**:
   - `User Feedback -> Analyze -> Identify Issues -> Update Plan -> Implement -> Re-Test & Deploy`.
   - No open logic loops; every branch must logically resolve or merge back into the main workflow.

---

## 3. Security-First 5-Stage Launch Sequence

The application startup strictly enforces OWASP security rules in chronological order:

1. **Stage 1 (Server Phase)**: Backend Boot & Security Middleware Setup (Atomic DB locks, CORS, CSP headers, payload size bounds).
2. **Stage 2 (Network Phase)**: HTTP Security Handshake & Asset Delivery (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `CSP`).
3. **Stage 3 (Gatekeeper Phase)**: Zero-Trust Authentication Gatekeeper (`fmc_user` token check, fail-fast redirect to Login).
4. **Stage 4 (Audit Phase)**: Database Health & Provider Readiness Audit (`/api/providers/status` check).
5. **Stage 5 (View Phase)**: Sanitized Layout Mount & Data Hydration (`escapeHtml()` XSS wrappers, live telemetry counters).

---

## 4. AI Model & Combo Proxy Routing Rules
- **Hybrid Format**: Model API endpoints (`/v1/models`) must return hybrid payloads containing both OpenAI (`object: "model"`) and Anthropic (`type: "model"`, `display_name`, `created_at`) fields.
- **Provider Active Check**: When load-balancing across Model Combos (Round Robin / Fallback), verify that the underlying provider (`p.isActive === true`). If inactive, skip to the next active provider in the pool.
- **Duplicate Provider Guard**: Reject provider registrations if the `baseUrl` matches an existing provider.

---

## 5. UI/UX Design Standards (UI-UX Pro-Max)
- **Compact Layout**: Vertically compact, dense, readable glassmorphism UI components.
- **7 Metal Themes**: Seamless support for Platinum, Gold, Silver, Titanium, Bronze, Copper, and Obsidian themes.
- **No Dead Navigation**: Every icon, button, and navigation item must resolve to a valid view or action.
- **Micro-Animations**: Smooth transitions on drawers (`.hint-drawer`, `.code-drawer`), modal popups, and tab switches.

---

## 6. Outbound API Key Resolution Rule (Zero-Trust Key Protection)
- **Automatic Outbound Key Resolution**: Irrespective of what is displayed in the browser UI or passed in request payloads, whenever any controller, connection ping test, model fetcher, or proxy execution service encounters a placeholder key (`"********"` or mask pattern), it **MUST** automatically resolve and substitute the original unmasked key stored in `data/providers.json` before constructing HTTP headers for outbound API calls.
- **Form Save Protection**: Form update calls receiving `"********"` **MUST NEVER** overwrite existing real keys stored in the database.

---

## 7. Universal 2-Column User Manual & Help Layout Rule
- **Mandatory 2-Column Page Structure**: All SPA views (`DashboardView`, `PlaygroundView`, `RegistrationView`, `ConfigView`, `ProvidersView`, `ModelClubView`, `SettingsView`, `ReportsView`, `ManualView`) MUST adopt the standard 2-column layout matching `User Manual & Help`:
  - **Left 20% TOC / Navigation Rail**: Contains quick category filters, quick action buttons, and status indicators.
  - **Right 80% Detail Workspace Pane**: Contains main workspace cards, forms, tables, and telemetry grids.

---

## 8. Standardized URL Path & History Routing Rule
- **URL Path Synchronization**: Every view navigation MUST synchronize with browser URL history (`history.pushState({ viewName }, '', urlPath)` and `document.title`).
- **Clean SPA Page Routes**: Clean paths (`/dashboard`, `/playground`, `/registration`, `/config`, `/providers`, `/model-club`, `/settings`, `/reports`, `/manual`) MUST be registered in `server.js` and parsed on app load (`window.location.pathname`).
- **Popstate Navigation**: Browser Back and Forward button events (`popstate`) MUST automatically trigger view transitions without full page reloads.

---

## 9. Screen-Based Requirement Change Log Rule
- **Mandatory Chat Change Logging**: Whenever any feature, bug fix, refactoring, or UI modification is requested in chat for any application screen/view, the AI **MUST** log and append the details to that screen's dedicated `.txt` file in the `requirement/` directory using editor tab style formatting.
- **Screen Requirement Mapping**:
  - Playground View -> `requirement/playground.txt`
  - Dashboard View -> `requirement/dashboard.txt`
  - Registration View -> `requirement/registration.txt`
  - Config View -> `requirement/config.txt`
  - Providers View -> `requirement/providers.txt`
  - Model Club View -> `requirement/model_club.txt`
  - Settings View -> `requirement/settings.txt`
  - Reports View -> `requirement/reports.txt`
  - User Manual View -> `requirement/manual.txt`
- **Log Format**: Every entry must include the ISO Date and Time (`YYYY-MM-DD HH:MM:SS`), requested change description, target screen name, modified files, and completion status (`PASS`/`FAIL`).

---

## 10. Zero Hard-Refresh Failure & Continuous Server Uptime Rule
- **Mandatory Hard-Refresh Resilience**: Whatever code edits, refactoring, or feature implementations are performed, the application **MUST NEVER** break, crash, or fail to launch when the user performs a hard refresh (`Ctrl + F5` / `Ctrl + Shift + R`) in the browser.
- **Continuous Background Server Guarantee**: The AI assistant MUST NEVER terminate or kill the running Express server process on port 12247 (`node server.js`) without immediately ensuring it is active as a persistent, detached Windows process (`Invoke-CimMethod Win32_Process`).
- **Post-Change Health Ping Mandatory Check**: After ANY file edit or script execution, the AI assistant MUST run an immediate HTTP health verification (`Invoke-WebRequest http://localhost:12247`) to confirm HTTP 200 status before completing its turn.
- **Zero-Cache Header Enforcement**: Server static asset delivery MUST maintain `Cache-Control: no-store, no-cache, must-revalidate` so hard refreshes always load the latest compiled JavaScript and CSS instantly without browser caching glitches.


## 11. Provider Agent Live Search Rule
- **Mandatory Live Discovery**: The Provider Agent MUST NEVER bypass the AI LLM and Web Search engine (Step 1). It must always attempt to dynamically extract live model specs using the online DuckDuckGo context and LLM extraction before ever falling back to the hardcoded Fast-Path catalog. This ensures that the true source of free models is always queried first.

---

## 12. Canonical Agent Map
- The project-level agent hierarchy is defined in [`\.agents/agent-architecture.md`](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/.agents/agent-architecture.md).
- Existing operational agents are preserved and mapped into the canonical roles instead of being replaced.
- New work should extend the canonical roles `A00` through `A08` rather than inventing parallel authority layers.
