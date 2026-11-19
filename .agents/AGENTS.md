# FreeModelsClub Enterprise Agent Rules & Guidelines (Project Level)

This document establishes the master operational guidelines, Waterfall Encapsulation Hierarchy (P0 -> P5), and workflow standards for **FreeModelsClub Localhost Smart Chatbot**.

---

## 🏛️ WATERFALL ENCAPSULATION HIERARCHY (P0 -> P5)

```
[TIER P0: SUPREME CONSTITUTION & GOVERNANCE]
  ├─ Prime Directives (1-5) & Dynamic OOPS-based MVC
  ├─ Zero-Trust Gatekeeper & Outbound Key Protection
  ├─ Zero-Leak Production-Only GitHub Sync & Sanitization
  └─ Circuit Breaker & Deterministic Branch Closure
       ↓
[TIER P1: PHASE 0 INITIALIZATION & 7-STAGE WATERFALL]
  ├─ Ponytail Decision Ladder & Line Limit Rule (Rule 1)
  ├─ Mandatory Phase 0 Protocol (Read -> Understand -> Use -> Set) (Rule 2)
  └─ 7-Stage Closed-Loop Waterfall Workflow (Rule 3)
       ↓
[TIER P2: THE 7 PILLARS OF TOKEN AUDIT & CONTEXT HYGIENE]
  ├─ Memory (<5k/10k) | Tools (MCP Deferral) | Model Tiering | Hooks (Noise Suppression)
  └─ Subagents | Scheduled Work | Prompt Cache Maximization (>85% Hit Rate) (Rule 4)
       ↓
[TIER P3: MODEL CLUB, PROXY ENGINE & UI/UX PRO-MAX]
  ├─ Security-First 5-Stage Launch Sequence (Rule 5)
  ├─ AI Model & Combo Proxy Routing Rules (Rule 6)
  ├─ Universal 2-Column User Manual & Help Layout (Rule 7)
  └─ Standardized URL Path & History Routing (Rule 8)
       ↓
[TIER P4: CODING CONSTRAINTS, PROGRAM MAPPING & PROVIDER SEARCH]
  ├─ Canonical Agent Map (A00 - A08) (Rule 9)
  ├─ Provider Agent Live Search Rule (Rule 10)
  ├─ Explicit Git Update Permission Rule (Rule 11)
  └─ Zero-Leak Production-Only GitHub Sync & Sanitization Rule (Rule 14)
       ↓
[TIER P5: TELEMETRY, REQUIREMENT LOGGING & CONTINUOUS UPTIME]
  ├─ Screen-Based Requirement Change Log (requirement/*.txt) (Rule 12)
  ├─ Zero Hard-Refresh Failure & Continuous Server Uptime (Rule 13)
  └─ Closed-Loop Maintenance & Feedback Flow
```

---

## TIER P0: SUPREME CONSTITUTION & GOVERNANCE
1. **Never Delete Earlier Code**: Deprecated code is updated or merged into new structures.
2. **Pre-Change Variable & Dependency Mapping**: List variables, constants, and dependencies before modifying code.
3. **Zero Basic Errors**: Prevent unresolved references, undefined parameters, or broken imports.
4. **Dynamic OOPS-based MVC Standard**: Clean separation of View Controllers, Execution Services, and DB Schemas.
5. **Program Mapping as Single Source of Truth**: Master relationship table across all programs. Any change must verify dependencies via `ProgramMappingAgent`.
6. **Zero-Trust Outbound Key Resolution**: Always substitute unmasked keys from `data/providers.json` before making external API calls. Never overwrite real keys with `"********"`.
7. **Deterministic Branch Closure & Circuit Breaker**: Every branch must resolve to a valid state or graceful fallback. Max 2 retry loops permitted.
8. **Zero-Leak Production-Only GitHub Sync**: All code, schemas, and assets committed, pushed, or synchronized to GitHub must be the production-grade sanitized version. Zero personal paths, user IDs, passwords, active provider keys, or development dumps are permitted in repository commits.

---

## TIER P1: PHASE 0 INITIALIZATION & 7-STAGE WATERFALL

### Rule 1 — Ponytail Decision Ladder & Line Limit Rule
- Keep source files under **1800–2000 lines max**.
- **Ponytail Ladder:** 1. Does it need to exist? -> 2. Reuse existing code? -> 3. Standard library? -> 4. Native platform? -> 5. Installed dependency? -> 6. Minimum lines? -> 7. Write lean OOPS MVC code.
- **3D Program Matrix:** View Controllers (Dim 1) ↔ Services & Agents (Dim 2) ↔ DB Schemas (Dim 3).

### Rule 2 — Mandatory Phase 0 Protocol (Read, Understand, Use, Set)
Before generating code or modifying files in any project/workspace:
1. **READ:** Read directory structure, `AGENTS.md`, `GEMINI.md`, configurations, and database schemas.
2. **UNDERSTAND:** Map program relationships, active routes, models, and data flows.
3. **USE:** Apply Dynamic OOPS-based MVC and the Ponytail Decision Ladder.
4. **SET:** Configure Token Audit guardrails, requirement logs (`requirement/`), and noise-suppression hooks.

### Rule 3 — 7-Stage Closed-Loop Waterfall Workflow
`Initiate & Plan -> Requirements -> System Design -> Coding -> Testing -> Deployment -> Maintenance (Closed-Loop)`.

---

## TIER P2: THE 7 PILLARS OF TOKEN AUDIT & HYGIENE

### Rule 4 — The Token Audit Protocol (7 Pillars)
1. **MEMORY:** Audit all `AGENTS.md`, `GEMINI.md`, and rules in scope. Flag files > 5k tokens, total > 10k tokens.
2. **TOOLS:** Audit MCP servers & tools; enable tool deferral; prune unused schemas.
3. **MODEL:** Tier model selection (Flash for tasks, Pro for deep architecture); set thinking budget.
4. **HOOKS:** Suppress command noise with output filters (`PAGER=cat`, `git log -n 5`, concise JSON).
5. **SUBAGENTS:** Isolate subagent tasks with dedicated lightweight models.
6. **SCHEDULED WORK:** Align cron/background job intervals with cache lifetime.
7. **CACHE:** Maximize Prompt Cache hit rate (>85%) by keeping prompt prefixes static. Output findings table:
   `FINDING | SEVERITY | EVIDENCE | COST/SAVINGS`

---

## TIER P3: MODEL CLUB, PROXY ENGINE & UI/UX PRO-MAX

### Rule 5 — Security-First 5-Stage Launch Sequence
Stage 1 (Server Boot) -> Stage 2 (HTTP Security Headers) -> Stage 3 (Gatekeeper Auth) -> Stage 4 (Provider Health Audit) -> Stage 5 (Sanitized View Hydration).

### Rule 6 — AI Model & Combo Proxy Routing Rules
- Hybrid `/v1/models` responses (OpenAI + Anthropic formats).
- Verify `p.isActive === true` before load-balancing across Model Combos.
- Reject duplicate provider registrations based on `baseUrl`.

### Rule 7 — Universal 2-Column User Manual & Help Layout
Mandatory 20% Navigation Rail (Left) + 80% Detail Workspace (Right) on all SPA views.

### Rule 8 — Standardized URL Path & History Routing
Clean SPA page routes (`/dashboard`, `/playground`, `/registration`, `/config`, `/providers`, `/model-club`, `/settings`, `/reports`, `/manual`) with pushState synchronization.

---

## TIER P4: CODING CONSTRAINTS, CANONICAL MAP & PROVIDER SEARCH

### Rule 9 — Canonical Agent Map
Adhere to canonical roles `A00` through `A08` as defined in `.agents/agent-architecture.md`.

### Rule 10 — Provider Agent Live Search Rule
Mandatory live discovery via DDG context and LLM extraction before falling back to fast-path catalog.

### Rule 11 — Explicit Git Update Permission Rule
Never execute `git commit` or `git push` without explicit user instructions in chat.

### Rule 14 — Zero-Leak Production-Only GitHub Sync & Sanitization Rule
- **Production-Only Version Control Mandate**: All GitHub commits, releases, and repository syncs MUST represent the clean production distribution (`jDroid-X-FreeModelClub`). Zero development scratch files, prompt dumps (`Chat_Request.txt`), test runner logs, or transient debug traces may ever be staged or pushed.
- **Strict Credential & Key Quarantine**:
  - **Zero Personal Data**: Never commit personal computer directory paths (`C:\Users\...`), personal email addresses, or developer hardware identifiers.
  - **Zero User IDs or Passwords**: `data/users.json` must be a clean production template with generic admin email (`admin@localhost`) and `mustChangePassword: true`, or empty `[]` for first-run setup. Never commit personal passwords or emails.
  - **Zero Active Provider API Keys**: `data/providers.json` must always have `apiKey: ""` for every provider. Neither plaintext keys nor local CryptoVault encrypted strings (`enc:v1:...`) may be committed to git.
  - **Zero Default Client API Keys**: `data/api_keys.json` must be `[]` or clean template. No pre-shared live keys in documentation or public endpoints.
  - **Cryptographic Key & Salt Quarantine**: `data/.vault_key`, `data/device_key.json`, and hardware salts must be strictly ignored by `.gitignore` and never committed or pushed.
- **Mandatory Pre-Sync Audit Check**: Before any `git add`, `git commit`, or `git push` is executed, `scripts/export_clean_production.ps1` must be run and pass all 5 verification audit checks with 0 sensitive data leaks detected.

---

## TIER P5: TELEMETRY, REQUIREMENT LOGGING & CONTINUOUS UPTIME

### Rule 12 — Screen-Based Requirement Change Log
Log all chat modifications to `requirement/{screen}.txt` with ISO timestamp, description, modified files, and completion status.

### Rule 13 — Zero Hard-Refresh Failure & Continuous Server Uptime
- Keep server active on port 12247.
- Verify HTTP 200 after all modifications.
- Enforce `Cache-Control: no-store, no-cache, must-revalidate` for instant fresh asset loads.
