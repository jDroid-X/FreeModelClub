# Implementation Plan - Comprehensive Waterfall Deep-Dive Audit & Refactoring

Refactor the application according to OOPS-based MVC architecture, PonyTail line limit rules (300-400 lines max per file), Master Data dynamic mapping, closed-loop feedback verification, and synchronized HIL User Manual guidance.

## User Review Required

> [!IMPORTANT]
> - **1. PonyTail Line Limit Rule Modularization (Files > 300-400 lines)**:
>   - **`public/js/views/SettingsView.js` (940 lines)** -> Split into `SettingsView.js` + `SettingsUiUxInspector.js` + `SettingsTabs.js`.
>   - **`public/js/views/PlaygroundView.js` (833 lines)** -> Split into `PlaygroundView.js` + `PlaygroundParamsDrawer.js` + `PlaygroundHistoryRail.js`.
>   - **`public/js/views/ModelClubView.js` (701 lines)** -> Split into `ModelClubView.js` + `ModelComboModal.js`.
>   - **`public/js/views/RegistrationView.js` (673 lines)** -> Split into `RegistrationView.js` + `RegistrationCodeDrawer.js`.
>   - **`src/services/ProxyEngineService.js` (427 lines)** -> Extract `ProxyLoadBalancerService.js`.
> - **2. Hardcoded Values Mapping to Master Data**:
>   - Identify all hardcoded constants (*Port 12247, Fallback Model ID, Ping Timeout, Max Failover Attempts, Default RPM/TPM*) and bind them dynamically to `HelpModel.js` (`system_config.json`) master data.
> - **3. Program Mapping & Master Relationship Table**:
>   - Update `program_mapping.json` with new modules, dependencies, and dynamic variable linkages.
> - **4. User Manual & Screen Hints Sync**:
>   - Update `ManualView.js` and screen help hints in `ModalDialog.js` to reference the modularized components.

---

## Proposed Changes

### Master Relationship Table (`program_mapping.json`)

#### [MODIFY] [program_mapping.json](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/program_mapping.json)
- Register new helper modules (`SettingsUiUxInspector.js`, `SettingsTabs.js`, `PlaygroundParamsDrawer.js`, `PlaygroundHistoryRail.js`, `ModelComboModal.js`, `RegistrationCodeDrawer.js`, `ProxyLoadBalancerService.js`).
- Map hardcoded parameters to Master Data config schema.

---

### Backend Services & Models (`src/`)

#### [NEW] [ProxyLoadBalancerService.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/services/ProxyLoadBalancerService.js)
- Extract failover attempts, circuit breaker status, and strategy routing (Weighted Round-Robin, Priority Fallback, Least Latency, Lowest Error Rate) from `ProxyEngineService.js`.

#### [MODIFY] [ProxyEngineService.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/services/ProxyEngineService.js)
- Delegate load balancing & fallback logic to `ProxyLoadBalancerService.js` to reduce line count under 300 lines.

#### [MODIFY] [HelpModel.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/models/HelpModel.js)
- Include default RPM (30) and TPM (14400) parameters in master data system configuration.

---

### Frontend Views & Modular Helpers (`public/js/`)

#### [NEW] [PlaygroundParamsDrawer.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/components/PlaygroundParamsDrawer.js)
- Extract 300px right slide-out hyperparameter drawer (Temperature, Top-P, Max Tokens, System Persona).

#### [NEW] [PlaygroundHistoryRail.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/components/PlaygroundHistoryRail.js)
- Extract 15% left history rail, session search, session renaming, and transcript export handlers.

#### [MODIFY] [PlaygroundView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/PlaygroundView.js)
- Retain core chat message window & stream controller, referencing `PlaygroundParamsDrawer` and `PlaygroundHistoryRail` (reduces to <300 lines).

---

#### [NEW] [SettingsUiUxInspector.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/SettingsUiUxInspector.js)
- Extract 15% left screens rail + 85% structural layout & properties inspector.

#### [NEW] [SettingsTabs.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/SettingsTabs.js)
- Extract API Keys Manager, Tool Connection Guides, 7 Metal Themes Manager, Launch Rules, and Master Data form.

#### [MODIFY] [SettingsView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/SettingsView.js)
- Retain main tab switcher & Endpoints Inspector, delegating tabs to `SettingsUiUxInspector` and `SettingsTabs` (reduces to <250 lines).

---

#### [NEW] [ModelComboModal.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/components/ModelComboModal.js)
- Extract Combo Creation/Edit modals, Test Routing Execution Simulator, and Side-by-Side Model Comparison Matrix.

#### [MODIFY] [ModelClubView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/ModelClubView.js)
- Retain taxonomy grid & card rendering, referencing `ModelComboModal` (reduces to <250 lines).

---

#### [NEW] [RegistrationCodeDrawer.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/components/RegistrationCodeDrawer.js)
- Extract 300px right slide-out integration code drawer and language selector.

#### [MODIFY] [RegistrationView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/RegistrationView.js)
- Retain provider onboarding form & staged models table, referencing `RegistrationCodeDrawer` (reduces to <300 lines).

---

#### [MODIFY] [index.html](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/index.html)
- Include script tags for all newly created modular JS files.

---

## Verification Plan

### Automated / Syntax Verification
- Execute `node` syntax evaluation checks across ALL 18 frontend and backend files.
- Verify every single file is strictly under 300-400 lines (PonyTail Rule).

### Manual Verification
- Test all screen transitions, chat streaming, provider onboarding, model combos, tool downloads, themes, and master data updates.
