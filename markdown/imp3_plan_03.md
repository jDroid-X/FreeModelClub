# Modular OOPS-Based MVC Distribution & Code Refactoring Plan

## Structural & Refactoring Mandate

To strictly enforce enterprise OOPS-based MVC architecture and token efficiency rules, long monolith code blocks (>300 lines) will be modularized into decoupled, single-responsibility components and views under 200 lines each.

### Structural Refactoring Mapping

```
public/js/
├── services/
│   └── api.js                   # Client API Bridge
├── components/                  # UI Components
│   ├── ModalDialog.js           # Glassmorphic Modal & Notification Toast System
│   └── HeaderTelemetry.js       # Top Header Metrics & Telemetry Bar
├── views/                       # Modular UI View Controllers
│   ├── LoginView.js             # Pre-filled Auth & Login Screen
│   ├── DashboardView.js         # Provider Telemetry & Model Specs Drawer
│   ├── PlaygroundView.js        # Playground Chat & Markdown Code Highlighter
│   ├── RegistrationView.js      # Provider Registration & Live Connection Ping Test
│   ├── ConfigView.js            # Multi-Language Integration Snippets & Memo Box
│   ├── ProvidersView.js         # Provider CRUD & Protected Key Display
│   ├── ModelClubView.js         # Model Family & Core Skill Taxonomy Engine with Search
│   ├── SettingsView.js          # Endpoint URL Registry & API Key Generator
│   ├── ReportsView.js           # Diagnostic API Logs & System Audit Logs
│   └── ManualView.js            # Step-by-Step Human-In-Loop User Manual
└── app.js                       # Master SPA Router (< 100 lines)

src/services/
├── StreamHandlerService.js       # Server-Sent Events (SSE) Stream Accumulator
└── ProxyEngineService.js        # Lean OpenAI Proxy & Closed-Loop Auto Failover Router
```

---

## Benefits & Closed-Loop Integrity

1. **Decoupled OOPS Architecture**: Every view and component encapsulates its own rendering logic, event handlers, and data bindings.
2. **Zero Code Duplication**: Shared utilities (`ModalDialog`, `HeaderTelemetry`, `ValidationService`, `KeepAliveAgent`) are called by reference across views.
3. **100% Backward Compatibility**: All localhost endpoints (`http://localhost:12247`, `/v1/chat/completions`, `/v1/models`, `/api/help/manual`) retain identical API contracts.
