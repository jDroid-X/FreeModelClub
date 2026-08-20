# UI/UX Enhancements & Navigation Implementation Plan

This plan details the UI upgrades requested based on the OmniRoute dashboard references, tile background fixes, and the global navigation system.

## Proposed Changes

### 1. Global "To and Fro" Navigation (App-wide)
- **Modify** `public/js/app.js` to track route history explicitly (maintaining a stack of visited pages).
- **Update** the master layout (e.g., `public/index.html` or the global header component) to include a floating or fixed navigation bar with **Back (<)**, **Forward (>)**, and **Home** buttons, visible on every page for quick traversal.

### 2. Settings - Endpoints Detail UI Upgrade
- **Modify** `public/js/views/SettingsView.js` (Endpoints Tab).
- Transform the basic endpoint text list into a modern, 3rd-level UI.
- Use card-based UI structures with distinct visual hierarchy, quick **"Copy to Clipboard"** icons on hover, and active status badges for each endpoint link.

### 3. Settings - New "API Keys Manager" Tab
- **Modify** `public/js/views/SettingsView.js`.
- Add a dedicated "API keys Manager" tab next to the Endpoints tab.
- Build an advanced table layout with columns for Name, Key, Usage, and Actions.
- Implement the requested **mouse-over functionality**: The "Action" column will display contextual buttons (Copy, Edit, Revoke) only when hovering over that specific table row, mimicking the reference OmniRoute dashboard.

### 4. Model Club & User Manual Background Consistency
- **Modify** `public/js/views/ModelClubView.js`
- **Modify** `public/js/views/ManualView.js`
- Currently, the tiles in these views have a background that clashes with the new theme colors. I will update their inline styles or assign the `.glass-panel` background CSS (`var(--bg-dark)`) to ensure they perfectly match the active theme across the app.

---
> [!NOTE]
> Since the OmniRoute references are hosted locally on your machine on port 20128 and my browser subagent could not reach the final dashboard state, this plan proposes best-in-class UI architectures (Hover action menus, Endpoint Data Cards, Breadcrumb/History Navigation) that fulfill your description accurately.

## User Review Required
Please review the changes above. Let me know if you want the global navigation to be placed in a specific corner (e.g., top-left header) or if the API Keys Manager should completely replace the older "External Client Keys" tab. Click **Proceed** if you're ready for me to build it!