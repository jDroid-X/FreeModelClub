# Implementation Plan - 5 Advanced Diagnostic Reports & Logs Features

Implement top 5 APM & Audit Logging features across [ReportsView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/ReportsView.js) and backend logging API endpoints.

## User Review Required

> [!IMPORTANT]
> - **1. Live Log Stream Auto-Refresh Toggle**:
>   - Auto-refresh toggle switch (*Play/Pause Live Feed*) polling `/api/logs` every 3 seconds.
> - **2. Log Level Severity Pill Filters**:
>   - Filter pills (*ALL, INFO, WARN, ERROR*) to isolate errors and stack traces.
> - **3. Audit Log CSV & JSON Exporter**:
>   - 1-Click **Export CSV** and **Export JSON** log download buttons.
> - **4. Real-Time Keyword & Component Search**:
>   - Live search input filtering logs by Model ID, Status Code, or Component.
> - **5. Latency Distribution Breakdown**:
>   - Visual distribution bar showing request latency buckets (`<100ms`, `100-500ms`, `>500ms`).

---

## Proposed Changes

### Diagnostic Reports View

#### [MODIFY] [ReportsView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/ReportsView.js)
- Add live auto-refresh toggle switch and timer.
- Add severity level filter pills (*ALL, INFO, WARN, ERROR*).
- Add `exportLogsCsv()` and `exportLogsJson()` functions.
- Add search input for real-time log filtering.
- Add visual Latency Distribution bar tile.

---

## Verification Plan

### Automated / Syntax Verification
- Run Node.js syntax check on `ReportsView.js`.

### Manual Verification
- Test toggling Live Auto-Refresh feed, filtering by ERROR/WARN, searching log keywords, exporting CSV/JSON, and viewing latency distribution.
