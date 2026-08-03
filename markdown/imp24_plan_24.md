# Implementation Plan - 5 Advanced Settings & Tab Screens Features

Implement top 5 Settings & Tab screens features across [SettingsView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/SettingsView.js) and backend configuration API endpoints.

## User Review Required

> [!IMPORTANT]
> - **1. API Key Security Scopes & Expiry Limits**:
>   - Assign permissions (*Full Access, Proxy Only, Read Only*) and set Expiry Limits (*30 Days, 90 Days, Never*) when generating client API keys.
> - **2. Automated `.env` & Environment Script Downloader**:
>   - 1-Click download of pre-configured `.env`, `setup.ps1` (PowerShell), and `setup.sh` (Bash) files pre-filled with selected API key and Base URL.
> - **3. Custom Metal Theme Color Builder**:
>   - Dynamic color picker & glass opacity slider in Themes tab for real-time CSS variable styling customization (`--primary`, `--accent-cyan`, `--bg-card`).
> - **4. Master System Config JSON Export & Import**:
>   - 1-Click **Export System Config** and **Import System Config** JSON backup buttons.
> - **5. Live Endpoint Request Header Tester**:
>   - Interactive cURL header runner inside 3rd-level Endpoint Inspector.

---

## Proposed Changes

### Settings View

#### [MODIFY] [SettingsView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/SettingsView.js)
- Update `createApiKeyModal()` to include Scope & Expiry selection.
- Update `renderToolConnectionTab()` with `.env`, `setup.ps1`, and `setup.sh` file downloaders.
- Update `renderThemesTab()` with Custom Theme Color Builder.
- Update `renderMasterDataTab()` with System Config Export & Import JSON functions.
- Update `inspectEndpoint()` with custom headers tester.

---

## Verification Plan

### Automated / Syntax Verification
- Run Node.js syntax evaluation check on `SettingsView.js`.

### Manual Verification
- Test creating Scoped API key with expiry, downloading `.env` script files, building a custom theme color, and exporting/importing system master config.
