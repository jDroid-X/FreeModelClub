# Implementation Plan - UI/UX & Functional Enhancements (Settings, API Keys Manager, Theme Consistency & Universal Navigation)

Enhance the FreeModelsClub web application by upgrading the Settings view with 3rd-level Endpoints inspector tools, adding a dedicated "API Keys Manager" tab with hover-activated micro-actions, unifying card/tile backgrounds for Model Club and User Manual pages across all 7 metal themes, and embedding universal to-and-fro navigation across all application screens.

## User Review Required

> [!IMPORTANT]
> - **Endpoint 3rd-Level Inspector**: Adds live interactive payload testing, schema validation inspectors, and headers/query param controls directly within the Endpoints detail section under `Settings`.
> - **API Keys Manager Tab**: Inserted after Endpoints in `SettingsView.js` with mouse-over hover action dropdowns (copy, unmask, scope management, status toggle, key rotation, revocation).
> - **Theme Consistency Fix**: Refactors hardcoded card background inline styles in `ModelClubView.js` and `ManualView.js` to utilize core CSS variable tokens (`var(--bg-card)`, `var(--text-main)`), ensuring 100% theme fidelity across Obsidian, Titanium, Steel, Gunmetal, Aluminum, Platinum, Chrome, and Bronze themes.
> - **Universal Navigation System**: Introduces browser-style Back/Forward history navigation, Home shortcut, and interactive breadcrumbs in `app.js` and on every page view header.

## Proposed Changes

---

### Backend & API Services

#### [MODIFY] [IntegrationController.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/controllers/IntegrationController.js)
- Add endpoints for API key status toggle (`toggleKeyStatus`), API key revocation/deletion (`deleteApiKey`), API key rotation (`rotateApiKey`), and scope update (`updateKeyScope`).

#### [MODIFY] [integrationRoutes.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/routes/integrationRoutes.js)
- Register routes for `/api/integrations/keys/:id/toggle`, `/api/integrations/keys/:id/rotate`, `/api/integrations/keys/:id/scope`, and `DELETE /api/integrations/keys/:id`.

#### [MODIFY] [ApiService.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/services/api.js)
- Add frontend client methods: `toggleApiKeyStatus(id)`, `deleteApiKey(id)`, `rotateApiKey(id)`, `updateApiKeyScope(id, scopeData)`, and `testEndpointPayload(endpointUrl, payload)`.

---

### Frontend Views & UI Components

#### [MODIFY] [SettingsView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/SettingsView.js)
- **Tab Structure**: Update tab bar to `Endpoints` | `API keys Manager` | `7 Metal Themes`.
- **Endpoints Detail Section (Up to 3rd Level)**:
  - **Level 1**: Endpoint list summary cards with status indicators.
  - **Level 2**: Expandable detail panel with HTTP methods, route paths, auth headers, rate limits, latency benchmarks, and cURL snippets.
  - **Level 3 (Interactive Inspector)**: Live endpoint test sandbox, JSON schema inspector (field definitions), and interactive header/query param controls.
- **API Keys Manager Tab**:
  - Render styled data table / card grid of generated client keys.
  - **Mouse-Over Action Menu**: Hovering over the `Action` column reveals a smooth glassmorphic action bar with quick options (Copy Key, Unmask/Show Key, Restrict Scope, Rotate Key, Deactivate/Activate Toggle, Delete Key).
  - Add "Generate New API Key" button and key creation modal.

#### [MODIFY] [ModelClubView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/ModelClubView.js)
- Replace hardcoded background inline styles (`background: rgba(10,13,20,0.7)`) with design system tokens (`var(--bg-card)`, `var(--bg-card-hover)`, `var(--border-color)`).
- Ensure model tiles adapt dynamically to light/dark themes (e.g. Platinum, Chrome) and metal themes (Titanium, Steel, Bronze).

#### [MODIFY] [ManualView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/ManualView.js)
- Replace hardcoded inline background colors (`background: rgba(10,13,20,0.6)`) with CSS variables (`var(--bg-card)`, `var(--text-main)`).
- Apply unified card elevation and border accents.

#### [MODIFY] [app.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/app.js)
- Implement universal navigation history manager (`historyStack`, `forwardStack`, `currentHistoryIndex`).
- Update top header layout to include Back (⬅️), Forward (➡️), Home (🏠) buttons, and dynamic interactive Breadcrumb trails (`Home > Settings > Endpoints`).
- Expose `app.goBack()`, `app.goForward()`, and `app.navigate(view, state)`.

---

### Styling & Design System

#### [MODIFY] [components.css](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/css/components.css)
- Add CSS classes for:
  - Hover action menu (`.action-hover-container`, `.action-hover-menu`, `.action-btn`).
  - Level 3 endpoint inspector tabs and payload sandbox output box (`.inspector-tab`, `.sandbox-res-box`).
  - Breadcrumb navigation pills (`.breadcrumb-nav`, `.nav-history-btn`).
  - Unified tile background overrides across light/dark metal themes.

---

### Program Mapping

#### [MODIFY] [program_mapping.json](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/program_mapping.json)
- Update program mapping JSON file to reflect new controller methods, view capabilities, and endpoints.

---

## Verification Plan

### Automated & Manual Verification
- Test Endpoints 3rd-level inspector by running a test request against `/v1/models` and `/v1/chat/completions` directly inside the Settings tab.
- Test API Keys Manager tab: generate new key, hover mouse over Action column to verify context menu, copy key, toggle active status, rotate key, and delete key.
- Switch between all 7 Metal Themes (Titanium, Steel, Gunmetal, Aluminum, Platinum Light, Chrome Light, Bronze) and verify that Model Club cards and User Manual cards dynamically update background colors and text contrast.
- Test universal to-and-fro navigation: navigate between Dashboard -> Model Club -> Settings -> User Manual and click Back/Forward buttons and Breadcrumb links to ensure smooth navigation state retention.
