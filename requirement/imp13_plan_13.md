# Enterprise OOPS-based MVC Refactoring & System-Wide Audit Plan

Comprehensive plan to refactor large modules according to the **PonyTail Rule** (keeping files under 300-400 lines), perform a screen-by-screen audit of UI/UX features and validations, fix runtime edge-case bugs, update backend dynamic variables, and maintain HIL operational step synchronization across all documentation.

## User Review Required

> [!IMPORTANT]
> This plan performs clean OOPS-based structural decomposition without altering any API endpoints or breaking existing configuration files. Backward compatibility is strictly maintained.

## Proposed Changes

---

### 1. PonyTail Refactoring (Code Decomposition & OOPS MVC Structure)

#### [MODIFY] [SettingsView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/SettingsView.js)
- Decompose long inline HTML templates and modal handlers into modular helper methods to bring the line count within the 300-400 line threshold.

#### [MODIFY] [RegistrationView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/RegistrationView.js)
- Extract custom model modal logic and provider preset mapping into clean static helper methods.

#### [MODIFY] [ModelClubView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/ModelClubView.js)
- Separate Combo creation modal builder and drawer toggles into decoupled view components.

#### [MODIFY] [ProxyEngineService.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/services/ProxyEngineService.js)
- Refactor chat completion proxy handler and failover retry loop into modular service sub-functions.

---

### 2. Runtime Bug Fixes & Validation Hardening

#### [MODIFY] [DashboardView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/DashboardView.js)
- Fix null/undefined property dereference in `filterTable(query)` (`m.modelName || ''`) to prevent search bar runtime crashes.

#### [MODIFY] [PlaygroundView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/PlaygroundView.js)
- Add safe null checks when switching chat models or rendering empty session lists.

---

### 3. Dynamic Backend Variables & Database Synchronization

#### [MODIFY] [IntegrationController.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/controllers/IntegrationController.js)
- Ensure dynamic `host` and `port` properties are fetched from active server config instead of hardcoded strings.

---

### 4. Verification & Testing

#### Automated Tests
- Run `node -e` line counter script to confirm all refactored modules satisfy the PonyTail line limit (< 380 lines).
- Verify server startup and route responses via curl tests.

#### Manual Verification
- Test all 9 screens (Dashboard, Playground, Registration, Config, Providers, Model Club, Settings, Reports, Manual) to ensure smooth transitions, modal dialog options, and error notifications.
