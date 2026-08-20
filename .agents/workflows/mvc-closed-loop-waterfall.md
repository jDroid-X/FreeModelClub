---
description: Execute the 7-Stage Simple Waterfall (OOPS based MVC) Closed Loop Workflow from Idea to Final Product with continuous improvement feedback loops.
---

# 7-Stage Closed Loop OOPS based MVC Workflow

Execute the comprehensive **Simple Waterfall (OOPS based MVC) – Closed Loop Workflow From Idea To Final Product** for FreeModelsClub.

## Workflow Execution Stages

### Stage 0: PONYTAIL CHECK
- **Execute**: Run the Ponytail Decision Ladder. If resolved via native solution or minimum lines (Steps 1-6), bypass the 7-stage waterfall. If custom architecture is required (Step 7), proceed to Stage 1.

### Stage 1: INITIATE & PLAN
- Identify Problem → Market / User Research → Define Goals → Feasibility Analysis → Define Scope → Create Project Plan → Budget & Timeline → Approval & Kickoff.
- **Deliverables**: Project Plan, Feasibility Report.

### Stage 2: REQUIREMENTS ANALYSIS
- Stakeholder Interviews → Requirement Gathering → Analyze & Document → Requirements Validation → Prioritize Requirements → SRS Sign-off.
- **Deliverables**: SRS Document, Use Case Document.

### Stage 3: SYSTEM DESIGN (OOPS based MVC ARCHITECTURE)
- Use Case & Flow Design → Database Design (Model) → UI/UX Design (View) → Controller & Logic Design → Class Diagram → Design Review → Architecture Sign-off.
- **Deliverables**: System Design Doc, Database Design, UI/UX Design.

### Stage 4: IMPLEMENTATION (CODING)
- Setup Development Env → Database & Tables → Develop Models → Develop Controllers → Develop Views (UI) → Integrate Components → Code Review → Build / Compile.
- **Deliverables**: Source Code, Database, Components.
- **Dynamic OOPS based MVC Mandate**:
  - `User -> Request -> View -> Send Data -> Controller -> Request Data -> Model`
  - `Model -> Return Data -> Controller -> Process & Send -> View -> Response -> User`
  - Use `program_mapping.json` as master relationship table. Avoid duplicate code via call-by-reference.

### Stage 5: TESTING
- Test Plan Creation → Unit Testing (Model/View/Controller) → Integration Testing → System Testing → UAT → Fix Defects → Test Sign-off.
- **Deliverables**: Test Cases, Test Reports, Bug Reports.

### Stage 6: DEPLOYMENT
- Server Setup → App Build / Package → Configuration Setup → Database Migration → Deploy Application → Smoke Test → Go Live.
- **Deliverables**: Deployed Application, User Manual, Release Notes.

### Stage 7: MAINTENANCE & SUPPORT
- Monitor Application → Log & Error Tracking → Issue / Bug Reporting → Fixes & Patches → Optimize Performance → User Support → Enhancements.
- **Deliverables**: Support Reports, Change Logs, Updates.

---

## Closed Loop Feedback Convergence
Whenever feedback or bugs are identified at any stage:
`User Feedback -> Analyze -> Identify Issues & Improvements -> Update Plan & Requirements -> Implement Changes -> Re-Test & Deploy`
Every branch must either close logically or merge back into the main waterfall workflow.

## Agent Assignment Map
- `A00 Control / Orchestrator`: routes the stage, checks dependencies, and approves merge readiness.
- `A01 Solution Architect`: owns scope, decomposition, and implementation strategy for the stage.
- `A02 UI/UX Architect`: owns user-facing flow, layout, and interaction quality for screen work.
- `A03 Backend Architect`: owns controllers, services, routes, and API contracts for server work.
- `A04 Database Architect`: owns entity hierarchy, relationships, and persistence-safe structure changes.
- `A05 Programmer / Developer`: implements the change using the existing codebase first.
- `A06 QA / Validation`: verifies functional, data, and contract integrity before closure.
- `A07 Performance / Security`: checks resource use, token efficiency, and security boundaries.
- `A08 Theme Manager`: owns theme additions, edits, updates, and removals when appearance changes are involved.
