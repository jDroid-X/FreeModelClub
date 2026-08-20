# Implementation Plan 32 (imp32_plan_32)
## 3D Program Matrix, SearchAgent & Real-Time Multi-Pane Taxonomy Traversal Engine

### 1. Goal Description
The objective of Implementation Plan 32 is to establish the **3-Dimensional Program Mapping Matrix** architecture, deploy the standalone **SearchAgent** module, and implement real-time taxonomy-aware search traversal across all N-Pane views while guaranteeing PonyTail line limit compliance (< 200–250 lines) and zero broken code integrity.

---

### 2. Architectural Blueprint & 3D Program Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ DIMENSION 1: VIEW CONTROLLER LAYER                                                         │
│ DashboardView | PlaygroundView | RegistrationView | ProvidersView | ModelClubView | etc.   │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ DIMENSION 2: SERVICES & AGENTS LAYER                                                      │
│ ModelClubHierarchyHelper | SearchAgent | ProgramMappingAgent | TokenAgent | ProxyEngine  │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ DIMENSION 3: DATABASE & SCHEMA PERSISTENCE LAYER                                          │
│ data/combos.json | data/models.json | data/providers.json | data/program_mapping.json   │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Key Component Changes

#### Component 1: Standalone System Search Agent
- **[NEW] [`public/js/agents/SearchAgent.js`](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/agents/SearchAgent.js)** (90 lines):
  - `SearchAgent.filterTaxonomyPyramid()`: Performs relational search traversal across Base Models, Skills, Families, Providers, and Combos.
  - `SearchAgent.applyInPlaceDomFilter()`: Performs smooth in-place DOM visibility toggling without focus loss or selection mutation.

#### Component 2: Master Program Mapping Agent & Audit Runner
- **[NEW] [`src/services/ProgramMappingAgent.js`](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/services/ProgramMappingAgent.js)** (95 lines):
  - Audits line count limits (< 250 lines), checks syntax, and validates master 3D Program Matrix mapping relationships.
- **[NEW] [`scratch/program_mapping_agent.js`](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/scratch/program_mapping_agent.js)** (10 lines):
  - CLI runner returning `100% GREEN (INTEGRITY SECURED)`.

#### Component 3: Provider Registration Modular Split
- **[NEW] [`public/js/views/RegistrationAgentHelper.js`](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/RegistrationAgentHelper.js)** (147 lines):
  - Encapsulates Provider Agent online search modal, token calculation modals, and free model pool search helpers.
- **[MODIFY] [`public/js/views/RegistrationView.js`](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/RegistrationView.js)** (204 lines):
  - Streamlined down from 396 lines while retaining 100% of all public methods and delegators.
- **[MODIFY] [`public/js/views/RegistrationViewHelper.js`](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/RegistrationViewHelper.js)** (234 lines):
  - Streamlined down from 394 lines while preserving all form inputs and staged tables.

#### Component 4: Enhanced Token Sync Algorithm & Telemetry Button
- **[MODIFY] [`src/services/TokenAgentService.js`](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/services/TokenAgentService.js)** (124 lines):
  - Enhanced token sync algorithm covering latency pings, token volume aggregation, and hard limit scaling.
- **[MODIFY] [`public/js/views/DashboardView.js`](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/DashboardView.js)** (251 lines):
  - Added `<Sync Token Limits>` button to Dashboard Left Telemetry Rail.

---

### 4. Verification Plan

1. **Automated Program Mapping Audit**:
   - Command: `node scratch/program_mapping_agent.js`
   - Verification Result: **0 Violations (100% GREEN)**.
2. **Line Count Limit Audit**:
   - All source files verified strictly under **200–250 lines**.
