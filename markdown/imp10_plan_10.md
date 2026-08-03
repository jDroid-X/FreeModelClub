# Implementation Plan - Model Combo Panel, Strategies & Database Routing

Introduce **Model Combo** management dashboard, strategy routing (Fallback & Round Robin load-balancing), and creation modal features into the Model Club page, backed by a persistent local JSON database table `combos.json`.

## User Review Required

> [!IMPORTANT]
> - **Unified Database Persistence (`combos.json`)**:
>   - Define a new JSON storage file `data/combos.json` for storing configured combos (e.g. `id`, `name`, `strategy`, `modelsList`, `isActive`).
> - **Model Club View Upgrades**:
>   - Add a **"Model Combo"** toggle button in the header of `ModelClubView.js` alongside Family and Skill views.
>   - Switch view to a dynamic Combo Management Dashboard displaying active combos, strategies, active toggles, and deletion triggers.
>   - Add **"+ Create Combo"** modal to name the combo, choose strategy (Fallback, Round Robin, Fusion), select models from active free list, and save.
> - **Proxy Routing Strategy Logic**:
>   - Update `ProxyEngineService.js` `/v1/chat/completions` request handler.
>   - If the request `model` matches a combo ID (e.g., `my-custom-combo`), resolve the selected models and execute the strategy:
>     - **Fallback (Failover)**: Try models sequentially. If Model A returns an error/fails, automatically fall back to Model B.
>     - **Round Robin (Load-Balancing)**: Distribute calls evenly between selected models in the combo using a rotating index counter.

## Proposed Changes

---

### Backend Data Layer

#### [MODIFY] [Database.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/models/Database.js)
- Add `combos: path.join(this.dataDir, 'combos.json')` in `this.files` configuration.
- Initialize `combos.json` as an empty array `[]` if it does not exist.

---

### API Controllers & Routes

#### [MODIFY] [modelRoutes.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/routes/modelRoutes.js)
- Add API routes for combos:
  - `GET /api/models/combos` - Get list of configured combos.
  - `POST /api/models/combos` - Create/Update a model combo.
  - `POST /api/models/combos/:id/toggle` - Toggle active status of a combo.
  - `DELETE /api/models/combos/:id` - Delete a combo.

#### [MODIFY] [ModelController.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/controllers/ModelController.js)
- Implement `getCombos`, `saveCombo`, `toggleComboStatus`, and `deleteCombo` controllers.

---

### Proxy Routing Engine

#### [MODIFY] [ProxyEngineService.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/services/ProxyEngineService.js)
- Update `handleChatCompletion` to detect if the requested model ID is a registered active Combo.
- Implement Fallback and Round Robin resolution logic to dynamically select the target model.
- Intercept `/v1/models` and `/v1/models/:model` calls to list configured combos alongside individual models.

---

### Frontend Services & Views

#### [MODIFY] [ApiService.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/services/api.js)
- Add frontend methods: `getCombos()`, `saveCombo(data)`, `toggleComboStatus(id)`, and `deleteCombo(id)`.

#### [MODIFY] [ModelClubView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/ModelClubView.js)
- Update navigation header to display **"Group by Model Family"** | **"Group by Core Skills"** | **"Model Combo Dashboard"**.
- Implement dynamic rendering of Combo Dashboard: list of combos, status toggles, strategy dropdown modifiers, and "+ Create Combo" modal form.

---

### Program Mapping

#### [MODIFY] [program_mapping.json](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/program_mapping.json)
- Document the new combos schema and controller endpoints.

---

## Verification Plan

### Automated & Manual Verification
- Test combos CRUD operations: create a new combo (e.g. `llama-mix`) using `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` with **Round Robin** strategy.
- Test endpoint proxy: send completion requests to `/v1/chat/completions` with `"model": "llama-mix"` and verify that the requests rotate evenly.
- Switch theme to Platinum/Chrome and verify that the combo dashboard cards dynamically match theme styling rules.
