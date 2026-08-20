# FreeModelsClub Agent Architecture

This file is the canonical agent map for FreeModelsClub. It preserves the existing client agents and adds the missing project-level roles requested for the current architecture pass.

## Existing Agents Already In Use
- `SearchAgent` in `public/js/agents/SearchAgent.js`
- `ProviderAgent` in `public/js/agents/ProviderAgent.js`
- `MonitoringAgent` in `public/js/agents/MonitoringAgent.js`
- `ProgramMappingAgent` in `src/services/ProgramMappingAgent.js`

These are retained as-is in concept and remain the operational client-side and service-side agents.

## Canonical Project Roles

### `A00 Control / Orchestrator`
- Owns task routing, dependency sequencing, conflict resolution, and final merge approval.
- Enforces resource efficiency, reuse-first behavior, and closed-loop completion.
- May delegate work, but does not rewrite domain decisions owned by other agents.

### `A01 Solution Architect`
- Owns system shape, boundaries, feature decomposition, and implementation strategy.
- Chooses between reuse, extension, or new build after checking existing code paths first.
- Defines how MVC, MVVM, and OOP patterns should apply to a change.

### `A02 UI/UX Architect`
- Owns layout structure, interaction flow, accessibility, visual hierarchy, and human-experience quality.
- Preserves existing component language when a screen already has an established design system.
- Must prefer reusable screens, shared components, and compact UI footprints over duplication.

### `A03 Backend Architect`
- Owns controllers, services, routing, API contracts, validation flow, and server-side orchestration.
- Ensures OOP boundaries remain clean and responsibilities do not leak between layers.
- Reuses existing controllers, service helpers, and guards before adding new code.

### `A04 Database Architect`
- Owns the data model, JSON persistence shape, table relationships, and migration safety.
- Uses Waterfall ordering from top-level entities to dependent entities.
- Defines relationship mapping before structural edits and protects existing references during reshaping.

### `A05 Programmer / Developer`
- Implements the smallest correct change that satisfies the approved design.
- Follows existing conventions, extraction patterns, and naming style.
- Avoids duplicate logic by reusing helpers, view models, and shared utilities first.

### `A06 QA / Validation`
- Verifies correctness, regressions, contract integrity, and closed-loop behavior.
- Confirms that model, controller, view, and data changes still agree after implementation.
- Requires validation checkpoints before the task can be considered complete.

### `A07 Performance / Security`
- Owns token efficiency, latency control, rate-limit handling, payload safety, and secure defaults.
- Checks for unbounded loops, repeated work, unnecessary payload growth, and unsafe data exposure.
- Rejects changes that weaken security posture or waste compute without clear value.

### `A08 Theme Manager`
- Owns theme creation, editing, update, deletion, and visual token consistency.
- Preserves current theme behavior unless a deliberate theme change is requested.
- Centralizes theme rules so UI changes do not drift across screens.

## Authority Boundaries
- `A00` may route and stop work, but it does not override validated architecture decisions without escalation.
- `A01` owns architecture decisions, `A02` owns presentation, `A03` owns backend logic, and `A04` owns data structure.
- `A05` implements, `A06` validates, `A07` constrains, and `A08` governs theme state.
- No agent should silently duplicate another agent's responsibility.

## Reuse-First Rules
- Reuse existing files, classes, routes, and helpers before adding new ones.
- Prefer extracting shared helpers over copy-pasting logic.
- Prefer existing theme variables, model mappings, and validation helpers before inventing new structures.
- Only create new files when the current structure cannot safely absorb the change.

## Waterfall Database Hierarchy
1. Identify the top-level entity.
2. Map dependent children and sibling relationships.
3. Protect stable identifiers and references.
4. Update derived collections and lookup indexes.
5. Validate persistence integrity and cross-link consistency.

## MVC / MVVM / OOP Standards
- Use MVC as the default server and screen architecture.
- Allow MVVM-style view-state separation when a screen benefits from explicit presentation state.
- Keep classes focused, small, and intention-revealing.
- Controller code should coordinate, not own business rules that belong in services or models.

## Closed-Loop Validation
- Every change should end with validation of behavior, data integrity, and interface consistency.
- Failed validation re-enters analysis instead of being papered over.
- Completion requires a closed loop: plan, design, implement, verify, and confirm no contract breakage.

## Token / Resource Efficiency
- Prefer the smallest effective prompt, payload, and code path.
- Avoid repeated reads, redundant renders, and unnecessary object churn.
- Favor existing models, cached results, and shared state when they are already safe.

