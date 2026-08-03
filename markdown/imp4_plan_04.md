# PonyTail Rule Compliance & Architectural Refactoring Plan

## 1. PonyTail Line-Count Audit (>300 Line Files Identified)

Per the strict enterprise development guideline (PonyTail rule: files must remain between 100–250 lines and strictly <300 lines), an audit identified two files exceeding 300 lines:
1. `src/models/Database.js` (397 lines) -> Exceeds limit due to embedded JSON seed arrays.
2. `public/css/style.css` (690 lines) -> Exceeds limit due to monolithic CSS rule definitions.

## 2. Refactoring & Modular Decomposition Strategy

### A. Database Persistence Layer Decomposition
```
src/models/
├── DatabaseSeed.js   # Encapsulates initial JSON seeds (Users, Config, Providers, Models, Keys, Manual)
└── Database.js       # Lean thread-safe file IO & atomic swap engine (< 100 lines)
```

### B. CSS Design System Decomposition
```
public/css/
├── base.css          # Core design tokens, CSS variables, typography reset
├── themes.css        # 8 Metal-based theme variable overrides
├── components.css    # Buttons, form controls, modals, toasts, cards, badges, tabs
├── layout.css        # Sidebar, header, main layout, grid systems, playground chat layout
└── style.css         # Master CSS bundle importing modular stylesheets (< 30 lines)
```

---

## 3. Benefits & Closed-Loop Integrity
- **100% PonyTail Rule Compliance**: Every file in the codebase is strictly < 250 lines.
- **Enterprise Decoupling**: Database seed logic is completely decoupled from atomic IO persistence.
- **Maintainable Design System**: CSS styles are partitioned by concern, making themes and components easily extensible.
- **Backward Compatibility**: All HTTP endpoints and public asset URLs remain 100% compatible.
