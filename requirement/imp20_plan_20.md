# Implementation Plan - Screen-Specific Layout Customization Matrix

Update [SettingsView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/SettingsView.js) so that selecting any of the 9 screens in the **Settings -> UI/UX Features Tab** loads a layout customization inspector tailored specifically to that screen's architecture.

## User Review Required

> [!IMPORTANT]
> Each screen receives specialized layout controls:
> 1. **Dashboard (`dashboard`)**: 2-Row Grid Layout, 4-Tile Statistical Grid, Telemetry Table Max Rows, Status Dot Pulse.
> 2. **Playground (`playground`)**: 3-Panel Split (15% Left Rail, Center Chat Window, 300px Right Parameters Drawer).
> 3. **Provider Onboarding (`registration`)**: 2-Column Split (Form Width %, 300px Right Integration Code Drawer).
> 4. **Integration Code (`config`)**: Code Drawer Sizing, Monospace Font Family, Line Heights, Copy Button Position.
> 5. **Providers Panel (`providers`)**: Card Grid Columns (1-4), Ping Latency Badge Color Thresholds, Action Dropdown Placement.
> 6. **Model Club (`model-club`)**: Taxonomy Grid Columns, Search Filter Bar Position, Combo Card Layout.
> 7. **Settings (`settings`)**: Tab Row Layout, Theme Cards Grid, 3rd-Level Endpoint Inspector Split.
> 8. **Reports (`reports`)**: Log Stream Terminal Height, Log Font Size, Auto-Scroll Stream Toggle.
> 9. **User Manual (`manual`)**: Accordion Expand Animation, HIL Warning Box Contrast, Step-by-Step Guide Layout.

---

## Proposed Changes

### Settings View Screen-Specific Layout Engine

#### [MODIFY] [SettingsView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/SettingsView.js)
- Define a dictionary of screen-specific default layout structure schemas.
- Update `renderUiUxTab(container)` to render custom form fields for the selected screen's unique layout properties.
- Persist per-screen custom layouts to `localStorage` under `fmc_uiux_config`.

---

## Verification Plan

### Automated / Syntax Verification
- Run Node.js syntax evaluation test on `SettingsView.js`.

### Manual Verification
- In **Settings -> UI/UX Features**, select each of the 9 screens and verify that custom layout controls specific to that screen load dynamically.
