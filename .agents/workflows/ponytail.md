# Ponytail Decision Ladder & Line Limit Rule

This workflow defines the Ponytail workflow and decision method, acting as the primary directive for code structure and maintainability in FreeModelsClub.

### Process Flow
1. **Understand the task**
2. **Inspect relevant code and trace the real flow**

### Ponytail Decision Ladder
Before writing new code, evaluate:
1. Does this need to exist?
2. Can existing code be reused?
3. Can the standard library handle it?
4. Can native platform features handle it?
5. Can an installed dependency handle it?
6. Can it be one or minimum lines?
7. Write the minimum code that works as part of OOPS-based MVC structure.

### Line Count Constraint (PonyTail Rule)
- Source code files MUST stay under **1800–2000 lines**.
- If a file exceeds 2000 lines, extract modular helper methods, static utility classes, or view renderers.
