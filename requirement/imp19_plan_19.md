# Implementation Plan - Layout Structure & Panel Dimension Inspector in Settings UI/UX Tab

Expand the **Settings -> UI/UX Features Tab** ([SettingsView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/SettingsView.js)) to include complete **Layout Structure & Panel Dimension Properties** across all 3 panel sections (Left Rail, Center Window, Right Slide-out Pane) and Header/Footer elements.

## User Review Required

> [!IMPORTANT]
> - **Left Panel / Sidebar Structure**:
>   - Name: `Left History / Navigation Rail`
>   - Width Percentage: `15%` (range 10% - 30%)
>   - Min Width: `140px` (range 100px - 250px)
> - **Center Window Structure**:
>   - Name: `Center Main Container Window`
>   - Min Width: `300px` (range 200px - 600px)
>   - Flex Grow / Shrink: Flexible auto-resize (`1`)
> - **Right Slide-out Panel Structure**:
>   - Name: `Right Parameters / Code Slide-out Drawer`
>   - Width: `300px` (range 200px - 500px or `20%`)
>   - Slide Animation Speed: `0.3s` (range 0.1s - 1.0s)
> - **Header / Telemetry / Input Bar Heights**:
>   - Top Bar Height: `50px` (range 40px - 80px)
>   - Chat Input Textarea Max Height: `120px` (range 60px - 250px)

---

## Proposed Changes

### Settings View UI/UX Tab Expansion

#### [MODIFY] [SettingsView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/SettingsView.js)
- Update `renderUiUxTab(container)` to group properties into 3 structural sections:
  1. **Panel 1: Left Navigation / History Rail (15% Width)**
     - Left Rail Name, Width Percentage (`10% - 30%`), Min Width (`100px - 250px`).
  2. **Panel 2: Center Main Window & Flexible Sizing**
     - Center Window Name, Min Width (`200px - 600px`), Max Height (`100%`).
  3. **Panel 3: Right Slide-out Drawer & Compression Rules**
     - Right Panel Name, Width (`200px - 500px`), Slide Animation Speed (`0.1s - 1.0s`), Chat Compression Ratio.
  4. **Panel 4: Element Styling & Range Bounds**
     - Base Font Size (`11px - 20px`), Border Radius (`0px - 24px`), Inner Padding (`6px - 32px`), Glass Transparency (`0.1 - 1.0`), Accent Color picker.

---

## Verification Plan

### Automated / Syntax Verification
- Run Node.js syntax evaluation check on `SettingsView.js`.

### Manual Verification
- Navigate to **Settings -> UI/UX Features**, select any screen from the left rail, and verify that all 4 structural panel property sections render with editable textboxes, range sliders, and values.
