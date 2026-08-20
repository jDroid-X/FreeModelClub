# Implementation Plan #34 — API Distribution: Tool Identification & Conflict Resolution

## Problem Statement

When multiple AI tools (VS Code Copilot, Claude Desktop, Cursor, Cline, OpenClaw, Kilo, OpenRouter, Codex, etc.) connect to FreeModelsClub simultaneously:

1. **No tool identification** — All requests appear identical in logs (only `clientKey` from API key, no semantic tool name)
2. **No conflict detection** — Two tools hitting the same combo/model simultaneously cause silent contention
3. **No connection visibility** — Dashboard shows flat logs, not which tool is actively using which model
4. **No resolution strategy** — When a model is rate-limited by Tool A, Tool B gets the 429 with no context

## Architecture

### 1. Tool Identification Protocol

**Headers parsed (in priority order):**
| Header | Example | Source Tools |
|--------|---------|-------------|
| `X-Tool-Name` | `VSCode-Copilot` | VS Code Copilot, Cline, Kilo |
| `X-Tool-Version` | `1.2.0` | Any tool with version info |
| `User-Agent` | `claude-desktop/1.0` | Claude Desktop, Cursor, OpenClaw |
| `X-Client-Id` | `uuid-xxx` | Unique session per tool instance |

**Fallback detection:** Regex pattern matching on User-Agent string to identify known tools.

**Known Tool Signatures:**
```json
{
  "vscode-copilot":    { "patterns": ["vscode", "copilot", "github-copilot"], "icon": "fa-brands fa-vs-code", "color": "#007ACC" },
  "claude-desktop":    { "patterns": ["claude-desktop", "anthropic"], "icon": "fa-solid fa-robot", "color": "#D97706" },
  "cursor":            { "patterns": ["cursor", "anysphere"], "icon": "fa-solid fa-i-cursor", "color": "#7C3AED" },
  "cline":             { "patterns": ["cline", "saoudrizwan"], "icon": "fa-solid fa-terminal", "color": "#10B981" },
  "openclaw":          { "patterns": ["openclaw"], "icon": "fa-solid fa-hand-fist", "color": "#EF4444" },
  "kilo":              { "patterns": ["kilo", "kilocode"], "icon": "fa-solid fa-microchip", "color": "#F59E0B" },
  "openrouter":        { "patterns": ["openrouter"], "icon": "fa-solid fa-route", "color": "#6366F1" },
  "codex":             { "patterns": ["codex", "openai-codex"], "icon": "fa-solid fa-code", "color": "#10B981" },
  "mcp-client":        { "patterns": ["mcp", "model-context-protocol"], "icon": "fa-solid fa-plug", "color": "#8B5CF6" },
  "fmc-dashboard":     { "patterns": ["fmc-dashboard", "free-models-club"], "icon": "fa-solid fa-gauge-high", "color": "#06B6D4" },
  "unknown":           { "patterns": [], "icon": "fa-solid fa-question-circle", "color": "#6B7280" }
}
```

### 2. Enhanced API Log Schema

New fields added to each log entry:
```json
{
  "id": "api_log_xxx",
  "timestamp": "...",
  "providerId": "...",
  "modelId": "...",
  "clientKey": "...",
  "toolName": "VSCode-Copilot",
  "toolVersion": "1.2.0",
  "toolIcon": "fa-brands fa-vs-code",
  "toolColor": "#007ACC",
  "clientSessionId": "uuid-xxx",
  "endpoint": "/v1/chat/completions",
  "promptTokens": 150,
  "completionTokens": 300,
  "latencyMs": 1200,
  "statusCode": 200,
  "status": "SUCCESS",
  "conflictFlags": {
    "concurrentOnSameModel": true,
    "concurrentToolCount": 2,
    "concurrentTools": ["VSCode-Copilot", "Claude-Desktop"]
  }
}
```

### 3. Active Connection Tracker (In-Memory)

```
activeConnections = Map<modelId, Set<{toolName, clientSessionId, timestamp, comboId}>>
```

- **On request start**: Add to tracker
- **On request end**: Remove from tracker
- **On conflict**: Flag in log, record system warning

### 4. Conflict Resolution Strategies

| Strategy | Behavior |
|----------|----------|
| **Queue** (default) | Second request waits if model has active connection |
| **Allow** | Both proceed (current behavior — no conflict handling) |
| **Redirect** | Second request auto-routed to next available model in combo |
| **Reject** | Return 429 with `X-FMC-Conflict: true` header |

### 5. API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/playground/active-connections` | GET | Real-time tool→model mapping |
| `/api/playground/tool-distribution` | GET | Aggregated tool usage stats |
| `/api/playground/conflict-log` | GET | Recent conflict events |

## Files to Create/Modify

| # | File | Action | Purpose |
|---|------|--------|---------|
| 1 | `src/services/ToolIdentificationService.js` | CREATE | Header parsing, tool fingerprinting, known-tool registry |
| 2 | `src/services/ActiveConnectionTracker.js` | CREATE | In-memory active connection map, conflict detection |
| 3 | `src/models/LogModel.js` | MODIFY | Add tool fields + conflict flags to `recordApiLog()` |
| 4 | `src/services/ProxyEngineService.js` | MODIFY | Pass req headers to tool identification, track connections |
| 5 | `src/services/ProxyExecutionHelper.js` | MODIFY | Pass tool info to log entries, wrap with tracker start/end |
| 6 | `src/services/StreamHandlerService.js` | MODIFY | Pass tool info to streaming log entries |
| 7 | `src/controllers/ChatController.js` | MODIFY | Extract and pass tool identification headers |
| 8 | `src/routes/reportRoutes.js` | MODIFY | Add new endpoints for connections/distribution/conflicts |
| 9 | `src/controllers/ReportController.js` | MODIFY | Add handlers for new endpoints |
| 10 | `public/js/views/ReportsView.js` | MODIFY | Add Tool Distribution panel + Active Connections live view |
| 11 | `public/js/services/api.js` | MODIFY | Add API methods for new endpoints |

## Phase Breakdown

### Phase 1: Tool Identification Service
- Parse `X-Tool-Name`, `X-Tool-Version`, `User-Agent`, `X-Client-Id` headers
- Regex-based tool fingerprinting with known-tool registry
- Export: `identifyTool(req)` → `{toolName, toolVersion, toolIcon, toolColor, clientSessionId}`

### Phase 2: Enhanced Logging
- Extend `LogModel.recordApiLog()` with tool fields
- Add `conflictFlags` object when concurrent usage detected
- Backward compatible — old logs remain valid

### Phase 3: Active Connection Tracker
- Singleton `ActiveConnectionTracker` with `start(modelId, toolInfo)`, `end(modelId, sessionId)`, `getActive()`, `checkConflict(modelId)`
- Integrated into ProxyEngineService request flow

### Phase 4: Conflict Resolution
- Configurable strategy per combo (Allow/Queue/Redirect/Reject)
- Auto-redirect to next combo model when conflict detected
- System log entries for all conflict events

### Phase 5: Dashboard Enhancement
- "Tool Distribution" pie chart in Reports
- "Active Connections" live-updating panel
- "Conflict Events" timeline
- Filter API logs by tool name
