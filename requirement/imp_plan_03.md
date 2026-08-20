# Add Auto-Failover to Agent Execution Loop

The root cause of your agents failing entirely when they hit a 401 error is an architectural gap: while standard chat uses `ProxyEngineService.js` (which has a robust `ComboModel` auto-failover loop to seamlessly switch providers on error), the Agent Loop (`ToolExecutionLoopService.js`) currently executes a single HTTP request and immediately crashes if it fails.

## User Review Required
> [!IMPORTANT]
> The Agent Execution Engine is a complex multi-thread service. To implement Closed-Loop Failover, I will need to introduce a retry/failover `while` loop wrapped around the inference HTTP calls in `ToolExecutionLoopService.js`. Please review the logic below.

## Proposed Changes

### `ToolExecutionLoopService.js`

#### [MODIFY] [ToolExecutionLoopService.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/services/ToolExecutionLoopService.js)
1. Inject the `ComboModel`, `AIModel`, and `ProviderModel` imports if not fully utilized.
2. Inside `executeLoop`, before making the `_callModel` HTTP request, I will calculate the `comboModels` array using the `ComboModel.getById(requestBody.comboId)` or `requestBody.model`.
3. I will wrap `_callModel` inside a `while (attemptCount < maxAttempts)` block.
4. If a 401, 429, or 500 error is caught inside the inference try/catch block:
   - Identify the backup model from the combo list (`comboModels`).
   - If no combo, select a cross-provider fallback from `AIModel.getActiveModels()`.
   - Reassign `targetModel` and `targetProvider` variables.
   - Record an `AUTO_FAILOVER` system log.
   - Loop back to `continue` and try the new provider seamlessly without crashing the Agent loop!

## Verification Plan
1. Send an agent query using a Combo where the first provider has an invalid/blank API key.
2. Confirm the `ToolExecutionLoopService.js` logs an `AUTO_FAILOVER` event and automatically routes to the second active provider in the combo.
3. Confirm the Agent finishes its iteration successfully and streams the final output to the Playground.