# Implementation Plan - Dynamic Master Data Settings & PonyTail Refactoring

This plan details the steps required to align the application's view files with the PonyTail line limit (< 380 lines) rules and inject dynamic "Master Data" variables throughout the backend and database.

## Proposed Changes

### Component 1: PonyTail File Refactoring (< 380 lines)

#### [MODIFY] [PlaygroundView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/PlaygroundView.js)
- Extract helper sub-renderers (like `renderSessionList()`, `formatChatMessageContent(text)`, and preset helpers) to reduce file lines under 350.
- Implement the requested **Dual Dropdowns** in the Playground header:
  - **Dropdown 1: Provider selection** (populated dynamically with active providers + "Model Combos" category).
  - **Dropdown 2: Model selection** (filtered dynamically based on the selected provider).
- Update the telemetry hover details box style to fit the text exactly and close automatically 3 seconds after mouse leave (`mouseleave`).

#### [MODIFY] [ModelClubView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/ModelClubView.js)
- Split long template renders and modal configurations into modular builders.
- Display a live provider status badge next to each model within a combo card (showing if a combo model's underlying provider is online).

#### [MODIFY] [RegistrationView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/RegistrationView.js)
- Extract cards HTML generation and validations to reduce code size.
- Add a client-side pre-validation alert if the provider Base URL is already registered.

#### [MODIFY] [SettingsView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/SettingsView.js)
- Move tab templates into smaller dedicated helper classes/functions.

---

### Component 2: Dynamic Backend & Database Master Data Integration

#### [MODIFY] [config.json](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/data/config.json)
- Hydrate the JSON configuration with default keys for all audited master variables.

#### [MODIFY] [ProxyEngineService.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/services/ProxyEngineService.js)
- Replace the hardcoded `'llama-3.3-70b-versatile'` fallback model and the retry limit count `3` with dynamic lookups from the `config.json` database.

#### [MODIFY] [ProviderController.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/controllers/ProviderController.js)
- Replace the hardcoded `5000ms` connection timeout with dynamic lookup from `config.json`.

---

### Component 3: HIL Manual & Hints Update

#### [MODIFY] [DatabaseSeed.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/models/DatabaseSeed.js)
- Append Step 9 (Master Data Settings) to the User Manual.
- Add interactive HIL checkboxes to the manual page in the UI.

---

## Verification Plan

### Automated Tests
- Run node model verification scripts.
- Validate JSON files schema integrity.

### Manual Verification
- Deploy to localhost and visually verify Settings ➔ Master Data tab values.
- Verify Playground dual dropdown filtering and hover box auto-close timeout.
