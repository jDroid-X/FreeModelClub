# Implementation Plan - Advanced Playground Features & Hyperparameter Tuning Matrix

Upgrade the **FreeModelsClub Playground** (`PlaygroundView.js`) with top-tier AI chat features including hyperparameter tuning, custom system prompt controls, message editing/regeneration, live token counters, attachment handling, and branching response navigation.

## User Review Required

> [!IMPORTANT]
> - **Hyperparameter Tuning**: Adds controls for Temperature (0.0 - 2.0), Top-P (0.0 - 1.0), and Max Tokens (128 - 8192).
> - **Custom System Prompt**: Provides an editable System Persona text box.
> - **Regenerate & Edit**: Adds hover action buttons to edit user prompts and regenerate assistant responses.
> - **Branching Responses**: Adds `< 1 / N >` response switcher arrows when assistant replies are regenerated.
> - **Live Input Counter**: Adds live character and estimated token counter below the prompt textarea.
> - **File Attachments**: Adds file attachment upload button to inject text/code file contents into the chat prompt.

---

## Proposed Changes

### Frontend Playground Upgrade

#### [MODIFY] [PlaygroundView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/PlaygroundView.js)
- **Top Parameter & System Prompt Toolbar**:
  - Add collapsible Hyperparameter Tuning Bar (`Temperature`, `Top-P`, `Max Tokens`, `System Prompt`).
- **Interactive Chat Message Bubbles**:
  - **Edit Prompt Button**: Hover action on user bubbles to edit and re-send.
  - **Regenerate Button**: Hover action on assistant bubbles to request alternative response.
  - **Branching Controls**: `< 1 / N >` pagination arrows when multiple response iterations exist.
- **Input Area Upgrades**:
  - **File Attachment Button**: Upload `.txt`, `.json`, `.js`, `.py`, `.md` files directly into chat context.
  - **Live Token Counter**: Displays character length and estimated token count (`~X tokens`).
  - **Stop Generation Button**: Allows aborting ongoing chat requests.

#### [MODIFY] [public/js/services/api.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/services/api.js)
- Update `sendChatMessage(modelId, messages, params)` to pass `temperature`, `top_p`, `max_tokens`, and system instructions to the `/v1/chat/completions` API endpoint.

#### [MODIFY] [src/controllers/ChatController.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/controllers/ChatController.js)
- Ensure backend OpenAI proxy controller respects dynamic `temperature`, `top_p`, and `max_tokens` payload parameters.

---

## Verification Plan

### Automated / Syntax Verification
- Run Node.js syntax checks on `PlaygroundView.js`, `api.js`, and `ChatController.js`.

### Manual Verification
- Test hyperparameter sliders and system prompt override.
- Test prompt editing and assistant response regeneration with branching response switcher `< 1 / N >`.
- Test file attachment upload into chat textarea.
- Test live token counter while typing.
