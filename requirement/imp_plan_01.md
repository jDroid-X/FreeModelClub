# Run AI Agents to Sync: UI/UX, Backend, and Bug Fixes

This document outlines the master implementation plan to sync the Frontend, Backend, and Background Control Agents, add requested UI/UX features, and fix identified bugs in the system.

## User Review Required
> [!IMPORTANT]
> Please review the identified bugs and proposed UI/UX additions below. Let me know if you want to add any specific list boxes or dialogs to other screens before I begin execution.

## 1. Do's and Don'ts (Identified Bugs & Mistakes)

I have audited the system (specifically `ProviderMonitorAgent`, `SelfHealingController`, and `ProvidersView`) and found the following critical/silly mistakes:

### A. Missing Validation & Empty Inputs (Silly Mistake)
- **Don't**: Assume UI inputs are valid numbers. In `ProvidersView.js` (line 569), the quota limits check for boundaries but do not account for `NaN` if the user leaves the text box completely empty or inputs a string.
- **Do**: Apply strict validation conditions.
- **Fix**: Update `configureQuota` validation to default empty inputs to `0` and explicitly check `!isNaN()` with visual dialog notifications.

### B. Path Traversal Vulnerability (Critical Bug)
- **Don't**: Accept raw user input for local directory browsing. In `SelfHealingController.js` (line 122 `browseLocalPath`), the system accepts any `targetPath` which could allow arbitrary system browsing.
- **Do**: Sandbox the directory browsing to the workspace or handle access denial gracefully.
- **Fix**: Implement path resolution (`path.resolve()`) and check if the resolved path is within permitted boundaries or gracefully catch `EPERM` (Permission Denied) errors.

### C. Background Agent Memory Leak & Sync Miss (Architectural Mistake)
- **Don't**: Continuously spawn overlapping intervals if `init()` is called multiple times. In `ProviderMonitorAgent.js`, `this.timer` is cleared, but if the app restarts or triggers `setFrequencyHours`, the async `runAudit()` might overlap.
- **Do**: Ensure atomic locks on the background sync agent.
- **Fix**: Add an `isAuditing` lock in `ProviderMonitorAgent.js` to prevent overlapping network requests during the Sync phase.

## 2. Frontend (Presentation Plane) Additions
As requested, I will add the following UI/UX features with Validations and Notifications:

### Additions to `ProvidersView` & `ModelClubComboHelper`
1. **Buttons & Textboxes**: Add enhanced Search/Filter textboxes with "Clear" buttons to easily filter lists.
2. **List Box (with details)**: Convert standard grids into interactive list boxes where clicking an item expands to show detailed capabilities (Context window, Max output, Vision capabilities).
3. **Dialog Box with Options**: Integrate `ValidationNotifier.showOptionPopup` to handle any destructive action (e.g., deleting a provider or overriding a combo) with clear Primary/Secondary options.
4. **Validations & Conditions**: Any form submission (Quota update, JSON import) will trigger conditional checks. If it fails, a popup dialog will show the exact reason and offer a "Retry" or "Reset" option.

## 3. Backend (Control Plane) Synchronization
1. **Update Responsible Agents (Pre-requisites)**:
   - Enhance `ProviderMonitorAgent.js` to sync capability flags (e.g., Vision, Coding, Chat) into the `Model Registry`.
   - Update `SelfHealingController.js` to handle the new UI Dialog option payloads safely.
2. **Sync the State**: Ensure that whenever the Backend Agent finishes an audit, it emits a WebSocket or SSE event to trigger `window.app.notifyDataChanged()` on the Frontend so the UI list boxes update instantly without page reloads.

## Verification Plan

### Automated / Unit Tests
- Execute `node scratch/program_mapping_agent.js` to ensure the OOPS MVC integrity is maintained and no dependencies are broken.

### Manual Verification
- Test entering invalid data in the Quota dialog to verify the popup options work.
- Test the Background Agent sync loop by simulating a Provider going offline and watching the UI List Box auto-update.
- Verify the Path Traversal patch in `SelfHealingController`.
