# Anthropic Protocol & Claude Desktop Integration

This plan implements full support for the **Anthropic Messages API (`/v1/messages`)** format, enabling native integration with **Claude Desktop**, **Claude Code**, and other Anthropic-compatible clients. 

## 🍎 Apple to Apple: Protocol Translation Layer

Claude Desktop sends API requests in the **Anthropic format**, but our FreeModelsClub proxy engines and failover systems operate entirely on the **OpenAI format** (`/v1/chat/completions`). To support Claude without rewriting our core engine, we will introduce a **Translation Interceptor Service**.

### 1. Request Mapping (Anthropic -> OpenAI)
When an Anthropic request arrives at `POST /v1/messages`, we translate the request body:
- **`system` (Anthropic)**: Extract the `system` string and inject it as the first message `{ role: "system", content: system }` in the OpenAI `messages` array.
- **`messages` (Anthropic)**: Map Anthropic user/assistant messages directly to OpenAI format.
- **`max_tokens` (Anthropic)**: Mapped directly to OpenAI `max_tokens`.
- **`model` (Anthropic)**: Passed as-is; our server will route it (or use fallbacks/combos) exactly like OpenAI requests.

### 2. Response Mapping (OpenAI -> Anthropic)
We will create a Mock Express Response Interceptor that wraps the real `res` object. When `ProxyEngineService` sends OpenAI data, the interceptor captures it and translates it back.

#### Non-Streaming Mapping:
**OpenAI:**
```json
{
  "id": "chatcmpl-123",
  "choices": [{ "message": { "content": "Hello" }, "finish_reason": "stop" }],
  "usage": { "prompt_tokens": 10, "completion_tokens": 5 }
}
```
**Translated Anthropic:**
```json
{
  "id": "chatcmpl-123",
  "type": "message",
  "role": "assistant",
  "content": [{ "type": "text", "text": "Hello" }],
  "stop_reason": "end_turn",
  "usage": { "input_tokens": 10, "output_tokens": 5 }
}
```

#### Streaming Mapping (Server-Sent Events):
When `stream: true`, the interceptor will parse incoming OpenAI SSE chunks (`data: {...}`) and emit the proper Anthropic SSE sequence:
1. `event: message_start`
2. `event: content_block_start`
3. `event: content_block_delta` (Mapped from OpenAI `choices[0].delta.content`)
4. `event: content_block_stop`
5. `event: message_stop`

---

## 🛠️ Proposed Changes

### 1. `src/services/AnthropicTranslationService.js` [NEW]
Create a dedicated service responsible for:
- Exporting a `handleMessages(req, res)` controller method.
- Translating `req.body` from Anthropic to OpenAI shape.
- Building a proxy `res` object with intercepted `json()`, `write()`, and `setHeader()` methods to translate outbound responses and stream events back into Anthropic shapes.

### 2. `src/routes/openaiRoutes.js` [MODIFY]
Mount the new Anthropic endpoint:
- `router.post('/messages', AnthropicTranslationService.handleMessages);`
- (Note: Claude clients will use base URL `http://localhost:12247/v1`, hitting `/v1/messages`).

### 3. `public/js/views/ConfigView.js` [MODIFY]
Add a dedicated "Claude Desktop" configuration snippet panel in the UI under **Tool Connections**, providing users with the exact `claude_desktop_config.json` payload needed to connect.

---

> [!WARNING]
> **User Review Required**
> Because streaming SSE translation (chunk-by-chunk converting OpenAI deltas to Anthropic events) is highly complex, I want to confirm if you require **Stream Translation** support for Claude Desktop immediately, or if a non-streaming implementation is sufficient for the first phase? (Claude Desktop typically requests streaming by default, so implementing both is recommended).
> 
> *Press **Proceed** to approve this plan, and I will build both the non-streaming and streaming translation interceptors to guarantee full compatibility!*