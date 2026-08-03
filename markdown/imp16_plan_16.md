# Implementation Plan - UI/UX & Functional Enhancements Across Dashboard & Provider Pages

Address Playground screen errors, update Provider Registration layout, add password eye-toggle icons, fix dynamic model filtering per provider, and generate an analytical waterfall structure report.

## User Review Required

> [!IMPORTANT]
> - All password textboxes across all screens (`LoginView.js`, `RegistrationView.js`, `ProvidersView.js`, `SettingsView.js`) will be upgraded with eye-toggle icons (`<i class="fa-solid fa-eye"></i>`).
> - `RegistrationView.js` layout update:
>   - Replaced Reset icon button with **"Add New Provider"** button (`<i class="fa-solid fa-plus-circle"></i>`).
>   - Inline placement of **"Search Models"** and **"Test Ping"** right next to the API Key textbox.
>   - Dynamic model filtering based on selected provider protocol.
>   - Renamed *"Add Selected to Table"* to **"Add Selected"**.
>   - Available models title updated to include live verified count: `Available Free Models Box (Verified Only) (<Count>)`.

---

## Proposed Changes

### Frontend Views & Logic

#### [MODIFY] [PlaygroundView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/PlaygroundView.js)
- Fix model list re-fetching in `sendChatMessage()` so active Model Combos are preserved and telemetry updates cleanly without runtime exception.

#### [MODIFY] [RegistrationView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/RegistrationView.js)
- **New Provider Button**: Add **"Add New Provider"** button with `<i class="fa-solid fa-plus-circle"></i>` icon to reset fields for adding a fresh provider.
- **Inline API Key Controls**: Move **Search Models** (`<i class="fa-solid fa-magnifying-glass"></i>`) and **Test Ping** (`<i class="fa-solid fa-plug-circle-check"></i>`) next to the API Key input box.
- **Eye Icon Toggle**: Add show/hide password toggle to the API key input.
- **Provider Filtering**: Filter and refresh available free models dynamically whenever a provider protocol is selected.
- **Model Count Badge**: Update header to `Available Free Models Box (Verified Only) (<Count>)`.
- **Button Rename**: Rename "Add Selected to Table" to **"Add Selected"**.

#### [MODIFY] [ProvidersView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/ProvidersView.js)
- Ensure newly registered providers display with their `displayName` in the providers panel.
- Add password eye icon to provider API key edit modal inputs.

#### [MODIFY] [LoginView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/LoginView.js)
- Add password eye-toggle icon for the password input field.

#### [MODIFY] [SettingsView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/SettingsView.js)
- Ensure all API Key password textboxes feature the eye-toggle icon.

---

## Verification Plan

### Automated / Syntax Verification
- Test code execution and syntax validity across modified JS views using `node -e`.

### Manual Verification
- Test Playground chat functionality with models and combos.
- Test Provider Registration form with new inline buttons, eye-icon toggle, dynamic filtering, model count badge, and "Add Selected" button.
- Verify new provider displays with `<Display Name>` in Providers panel.
