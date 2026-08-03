# Implementation Plan - 5 Advanced Model Club & Model Combo Features

Implement top 5 Model Club & Model Combo features across [ModelClubView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/ModelClubView.js) and backend proxy routing service.

## User Review Required

> [!IMPORTANT]
> - **1. Advanced Routing Strategies**:
>   - Support **Weighted Round-Robin**, **Priority Fallback**, **Least Latency First**, and **Lowest Error Rate First** routing strategies in Combo creation & edit modals.
> - **2. Inline Routing Execution Simulator**:
>   - Test Combo button with prompt simulation input showing which target model won the routing execution and output latency.
> - **3. Side-by-Side Model Comparison Matrix**:
>   - Modal interface allowing users to select 2 or 3 models and compare Context Window, Speed, Latency, Architecture, and Skillsets side-by-side.
> - **4. Automatic Circuit Breaker & Health Probing**:
>   - Health badges (`Healthy`, `Degraded (>2s)`, `Offline`) for target models in combo cards.
> - **5. Combo Cloning & JSON Export/Import**:
>   - 1-Click **Clone Combo**, **Export Combos JSON**, and **Import Combos JSON** action buttons.

---

## Proposed Changes

### Model Club View

#### [MODIFY] [ModelClubView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/ModelClubView.js)
- Add **Compare Models** button in taxonomy header.
- Add **Clone Combo**, **Export Combos JSON**, and **Import Combos JSON** buttons in Model Combo Dashboard.
- Add **Test Combo Router Simulator** modal.
- Expand Combo Creation / Edit modal to select between 4 load-balancing strategies (Weighted Round-Robin, Priority Fallback, Least Latency, Lowest Error Rate).
- Add circuit breaker health badges for combo models.

---

## Verification Plan

### Automated / Syntax Verification
- Run Node.js syntax check on `ModelClubView.js`.

### Manual Verification
- Test switching between Family, Skills, and Combos views.
- Test Model Comparison modal, Combo Creation with strategies, Combo Simulator, and JSON Export/Import.
