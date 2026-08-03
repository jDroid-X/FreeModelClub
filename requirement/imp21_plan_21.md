# Implementation Plan - Provider Onboarding View (RegistrationView.js) Enhancements

Deep-dive audit and enhancement of [RegistrationView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/RegistrationView.js) to resolve missing details, brand icons, pre-populated free model defaults, and dynamic integration code snippet parameters.

## User Review Required

> [!IMPORTANT]
> - **Brand Icons & Status Indicators**:
>   - Added unique FontAwesome brand icons for each provider (*Groq ⚡, OpenRouter 🌐, Gemini ⚛️, Together 🤝, Mistral 🌀, Ollama 🖥️, Custom ⚙️*).
> - **Pre-Populated Popular Free Model Defaults**:
>   - Automatically loads pre-verified default free models into the checklist box upon selecting any provider protocol (e.g. `llama-3.3-70b-versatile`, `gemini-1.5-flash`, `mistral-7b-instruct`) even before entering an API key.
> - **Dynamic Integration Code Drawer**:
>   - The 300px right slide-out code pane dynamically injects the user's entered `Base URL` and currently selected `Model ID` into the code snippets (cURL, Python, Node.js, PHP).
> - **Live Select All / Unselect All Helper & Staging Table Count Sync**:
>   - Seamless sync between checklist items, verified count badge, and staged models table.

---

## Proposed Changes

### Provider Onboarding View

#### [MODIFY] [RegistrationView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/RegistrationView.js)
- Add brand icon definitions to `predefined` provider objects.
- Update `onProtocolSelect(proto)` to auto-populate default popular free models for each protocol when no custom models exist yet.
- Update `switchIntTab(lang)` to dynamically replace `http://localhost:12247/v1` and model IDs with active form values.
- Verify password eye toggle, search models button, test ping latency modal, and staged models table actions.

---

## Verification Plan

### Automated / Syntax Verification
- Run Node.js syntax check on `RegistrationView.js`.

### Manual Verification
- Test selecting Groq, OpenRouter, Gemini, and Ollama from the left rail.
- Verify default free model checklist items, eye toggle visibility, search models query, test ping response, and dynamic integration code snippets.
