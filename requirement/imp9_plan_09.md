# Implementation Plan - "Tool Connection" Tab in Settings for Universal AI Tools Integration

Add a dedicated, interactive tab titled **"Tool Connection"** in `SettingsView.js` (`Endpoints` | `API keys Manager` | `Tool Connection` | `7 Metal Themes`) containing complete PowerShell, Bash, Environment Variables, and step-by-step instructions for connecting any external AI tool or client (Claude Desktop, VS Code / Cursor extensions, Antigravity, Kiro, Python OpenAI, LangChain, Terminal CLI) to the FreeModelsClub localhost server on port 12247.

## User Review Required

> [!IMPORTANT]
> - **New Tab Structure in Settings**: `Endpoints` | `API keys Manager` | `Tool Connection` | `7 Metal Themes`.
> - **Universal AI Tool Guides**:
>   - **Claude Desktop & MCP**: Step-by-step `claude_desktop_config.json` setup and environment variables.
>   - **Terminal CLI (PowerShell & Bash)**: One-click copy commands for `$env:OPENAI_BASE_URL="http://localhost:12247/v1"` and `$env:OPENAI_API_KEY="..."`.
>   - **VS Code / Cursor / IDE Extensions**: Configuration steps for Continue, Cline, Roo Code, and AI Assistant extensions.
>   - **Python / Node.js SDKs**: Ready-to-run code snippets for OpenAI Python client, LangChain, and Node SDK.
> - **Interactive Copy & Test Features**: Quick-copy buttons for all environment variable strings, cURL commands, and key selectors.

## Proposed Changes

---

### Frontend Views & UI Components

#### [MODIFY] [SettingsView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/SettingsView.js)
- Update tab bar in `SettingsView.render()` to include `<button class="tab-btn" id="tab-btn-tools" onclick="SettingsView.switchTab('tools')"><i class="fa-solid fa-plug-circle-bolt"></i> Tool Connection</button>`.
- Add `renderToolConnectionTab(container)` method to render structured tool guides:
  1. **Quick Setup Environment Variables** (PowerShell & Bash one-liner commands with live key selection).
  2. **Claude Desktop Integration Guide** (`claude_desktop_config.json` snippet & instructions).
  3. **IDE Extensions Setup** (VS Code, Cursor, Continue.dev, Cline, Roo Code config parameters).
  4. **Python & Node.js SDK Integration** (OpenAI SDK initialization snippets).
  5. **Interactive cURL Test Sandbox** for verifying connectivity to `http://localhost:12247/v1`.

---

### Single Source of Truth & Program Mapping

#### [MODIFY] [program_mapping.json](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/program_mapping.json)
- Update `SettingsView` purpose description to include universal AI tool connection guides and PowerShell/Bash environment setup.

---

## Verification Plan

### Automated & Manual Verification
- Render `SettingsView` and switch to the new **Tool Connection** tab.
- Test quick-copy buttons for PowerShell, Bash, and Python snippets.
- Verify that selecting an active API key dynamically updates the key value in all PowerShell, Bash, and cURL snippets in real time.
