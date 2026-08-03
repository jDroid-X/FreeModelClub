# Implementation Plan - 5 Advanced Provider & Model Registration Features

Implement top 5 provider registration features across [RegistrationView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/RegistrationView.js), [ProvidersView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/ProvidersView.js), and backend API proxy service.

## User Review Required

> [!IMPORTANT]
> - **1. Multi-Key Load Balancing Pool**:
>   - Support comma or newline separated API Keys for auto-rotation round-robin key pooling per provider.
> - **2. Custom HTTP Headers Configurator**:
>   - Optional JSON / Key-Value headers textarea for custom proxy headers (`HTTP-Referer`, `X-Title`, `Helicone-Auth`).
> - **3. Rate Limit Bounds (RPM / TPM)**:
>   - Display Requests Per Minute (RPM) & Tokens Per Minute (TPM) metadata badges per model in staged table & custom model modal.
> - **4. Provider Import & Export (JSON)**:
>   - 1-Click Export of all registered provider configurations and 1-Click JSON Import profile loader.
> - **5. Real-Time Health & Latency Badge**:
>   - Dynamic latency gauge (`<50ms` Fast, `50-200ms` Normal, `>200ms` Slow) and HTTP status badge on provider cards.

---

## Proposed Changes

### 1. Provider Registration View

#### [MODIFY] [RegistrationView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/RegistrationView.js)
- Update API Key input to support multi-key pool inputs (separated by commas or newlines).
- Add collapsible **Custom HTTP Headers** field (`reg-custom-headers`).
- Update Custom Model modal & staged table to include **RPM** and **TPM** rate limit bounds.
- Add **Import JSON** and **Export JSON** buttons.

---

### 2. Providers Panel View

#### [MODIFY] [ProvidersView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/ProvidersView.js)
- Add live latency badge (`<50ms`, `50-200ms`, `>200ms`) and multi-key indicator to provider cards.
- Add **Export Providers Backup** and **Import Providers Profile** action buttons in top header.

---

## Verification Plan

### Automated / Syntax Verification
- Run Node.js syntax checks on `RegistrationView.js` and `ProvidersView.js`.

### Manual Verification
- Test multi-key input, custom headers textarea, RPM/TPM bounds, and provider JSON export/import.
