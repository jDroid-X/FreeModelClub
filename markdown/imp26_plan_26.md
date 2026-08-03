# Implementation Plan - 5 Advanced User Manual Features

Implement top 5 User Manual & HIL Guide features across [ManualView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/ManualView.js).

## User Review Required

> [!IMPORTANT]
> - **1. Interactive Left Table of Contents Rail (20% Width)**:
>   - Sticky TOC rail listing manual chapters (*Prerequisites, Provider Onboarding, Model Combos, Tool Integrations, Tray Launcher, Troubleshooting FAQs*).
> - **2. Direct View Launcher Buttons inside Steps**:
>   - Quick action buttons inside step cards navigating directly to corresponding app views (*e.g. "Open Onboarding", "Test Playground", "View Combos"*).
> - **3. Export Operational Manual (Markdown / Printable)**:
>   - 1-Click **Download Markdown Manual** and **Print / Save PDF** buttons.
> - **4. Interactive FAQ & Troubleshooting Accordion**:
>   - Collapsible Q&A solving Port 12247 Refused, Missing System Tray Icon, 429 Failover, and Invalid API Key errors.
> - **5. Live Keyword Search & Section Filtering**:
>   - Real-time text search across manual steps and FAQs.

---

## Proposed Changes

### User Manual View

#### [MODIFY] [ManualView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/ManualView.js)
- Update layout to include 20% left TOC rail and 80% right manual content pane.
- Add quick action navigation buttons inside step cards.
- Add `exportManualMarkdown()` and `printManual()` functions.
- Add Interactive FAQ & Troubleshooting accordion section.

---

## Verification Plan

### Automated / Syntax Verification
- Run Node.js syntax check on `ManualView.js`.

### Manual Verification
- Test TOC rail chapter clicking, direct view navigation CTA buttons, downloading Markdown manual, expanding FAQ accordion, and searching keywords.
