# Implementation Plan - Slide-out Parameter Panel & Settings UI/UX Features Inspector Tab

Enhance Playground parameter controls with a 300px slide-out right drawer and add a comprehensive **UI/UX Features Tab** in Settings with a 15% left screens rail and editable right properties matrix.

## User Review Required

> [!IMPORTANT]
> - **Playground Parameters Slide-out Drawer**:
>   - Clicking the **Parameters** button in Playground slides open a 300px glass drawer on the right side, compressing/reducing the chat window smoothly (matching the Integration Code drawer UX).
> - **Settings UI/UX Features Tab**:
>   - Adds a new **"UI/UX Features"** tab in [SettingsView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/SettingsView.js).
>   - **Left Rail (15% width)**: Selectable list of all 9 application screens (Dashboard, Playground, Registration, Config, Providers, Model Club, Settings, Reports, Manual).
>   - **Right Panel (85% width)**: Editable textboxes, range sliders, and toggles for element properties (Font sizes, Border Radius, Panel Padding, Animation Duration, Card Elevation, Maximum List Items, Accent Colors).

---

## Proposed Changes

### 1. Playground View Slide-out Parameter Drawer

#### [MODIFY] [PlaygroundView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/PlaygroundView.js)
- Update layout to include a 300px right slide-out pane `#hyperparams-slideout-pane`.
- Update `toggleParamsDrawer()` to toggle display and smooth slide-in transition (`translateX`), dynamically adjusting the chat window width.

---

### 2. Settings View UI/UX Features Tab

#### [MODIFY] [SettingsView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/SettingsView.js)
- Add **"UI/UX Features"** tab button (`#tab-btn-ui-ux`).
- Implement `renderUiUxTab(container)`:
  - Render 15% left rail with all 9 application views.
  - Render right panel containing editable property controls for the selected view:
    - Font Family & Base Font Size (`12px` - `18px`)
    - Border Radius (`0px` - `20px`)
    - Panel Padding (`8px` - `30px`)
    - Transition Duration (`0.1s` - `1.0s`)
    - Glass Transparency (`0.1` - `0.9`)
    - Card Gap Spacing (`4px` - `24px`)
    - Maximum Table Items (`5` - `50`)
- Store & apply dynamic UI/UX property overrides in `localStorage` under `fmc_uiux_config`.

---

## Verification Plan

### Automated / Syntax Verification
- Run Node.js syntax checks on `PlaygroundView.js` and `SettingsView.js`.

### Manual Verification
- Test clicking **Parameters** button in Playground to verify 300px drawer slide-in and chat window compression.
- Test navigating to **Settings -> UI/UX Features**, select screens from the 15% left rail, and edit property values on the right.
