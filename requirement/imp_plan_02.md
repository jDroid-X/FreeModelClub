# Resume Playground UI/UX Development & Sequence Mapping

This plan resumes the development track for adding interactive panel controls to the Playground and solidifying the background agent synchronization, as requested prior to our line-count review.

## High-Level Sequence of Launch FMC

As requested, here is the architectural sequence of execution when you launch FreeModelsClub. Notice how the UI consumes an *already prepared* state, rather than fetching and filtering models itself:

### 1. Installation & Bootstrap Sequence
1. **Environment Check**: Validates Node.js and dependencies via `tray_launcher.ps1`.
2. **Server Boot**: `server.js` boots the Express proxy on port 12247.
3. **Database Readiness**: Verifies JSON stores (`providers.json`, `models.json`, `combos.json`).
4. **System Tray**: Mounts the silent `jDroid-X-FMC` background process.

### 2. Control Plane (Background Sync Sequence)
1. **Scheduler Boot**: `ProviderMonitorAgent.js` begins its asynchronous loop.
2. **Provider Sync**: Fetches live models from configured endpoints (e.g., Ollama, Groq, OpenRouter).
3. **Model Eligibility Pipeline**:
   - Validates capabilities (vision, chat, context limits).
   - Filters out inactive, offline, or rate-limited models.
   - Saves strictly eligible models to the `Active Registry`.
4. **Combo Router Update**: Updates load-balancing pools (`combos.json`).

### 3. Application Startup Sequence (Presentation Plane)
1. **SPA Initialization**: `index.html` loads `app.js`.
2. **Router Default**: URL resolves to `/playground` as the default landing view.
3. **Theme & State Mount**: `PlaygroundView` renders UI themes and consumes the *pre-filtered* model registry.
4. **Proxy Handshake**: UI prepares to send requests via `ProxyEngineService` for failover-protected chatting.

---

## User Review Required

> [!IMPORTANT]  
> You mentioned "add image icons next to hint icon... to hide/unhide panels". Currently, the Playground header has a gamepad icon (`fa-gamepad`) but no specific "hint" icon on the left/right edges. I will add distinct Toggle Icons (like `fa-bars` or `fa-chevron-left/right`) in the top navigation header of the Playground to control the Left Sidebar (Chat/IDE) and the Right Drawer. Let me know if you want custom SVG images instead of standard font-awesome icons.

## Proposed Changes

### `public/js/views/PlaygroundView.js`
- **[MODIFY]** Add toggle buttons (Image/FontAwesome Icons) to the top header (`.panel-header`).
- **[MODIFY]** Implement Javascript layout logic to dynamically collapse the `left-sidebar` (changing width from 240px to 0px) and expand the center Chat Window.
- **[MODIFY]** Add a similar toggle mechanism if a right-side Parameters/Settings drawer is visible.
- **[MODIFY]** Add UI list box enhancements (with expandable details) and integrate `ValidationNotifier` to present popups for validation checks (e.g., when a user selects an offline model).

### `src/services/ProviderMonitorAgent.js`
- **[MODIFY]** Ensure background sync features (Capability check, Quota limit refresh) are actively saving their state so the Frontend can passively consume it.

## Verification Plan
1. **Automated Validation**: Run the `program_mapping_agent.js` to ensure the new toggle UI elements do not break existing MVC dependencies.
2. **Manual Verification**: Launch the UI, verify the application defaults to `/playground`, and test the new header icons to ensure they smoothly hide/unhide the left and right sidebars.
