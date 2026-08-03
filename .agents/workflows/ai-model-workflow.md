# AI Model Workflow & Proxy Strategy

This workflow defines the operational strategy for free provider management, model failovers, hybrid API payload responses, and combo pool load balancing.

## 🎯 Core Operating Strategy

1. **Primary Free Provider**: Prioritize high-throughput free providers like **Groq Cloud API** (`llama-3.3-70b-versatile`, `qwen/qwen3.6-27b`, `deepseek-r1-distill-llama-70b`) and **OpenRouter Free Tier** (`poolside/laguna-s-2.1:free`, `cohere/north-mini-code:free`).
2. **Hybrid OpenAI & Anthropic Protocol Output**: The `/v1/models` and `/v1/models/:model` endpoints must output hybrid JSON objects containing both OpenAI (`object: "model"`) and Anthropic (`type: "model"`, `display_name`, `created_at`) properties to guarantee compatibility with tools like Claude Desktop, Cline, and Continue.
3. **Closed-Loop Auto-Failover**:
   - If a request to a primary free model fails (e.g., HTTP 429 Rate Limit or HTTP 503 Provider Unavailable), automatically retry up to 3 times across active backup models.
   - Record all network failovers and latency in `LogModel.js` system audit logs.
4. **Combo Router Pooling**:
   - Round Robin & Fallback strategies dynamically cycle through active models.
   - Every combo check MUST verify `ProviderModel.getById(m.providerId).isActive === true` before delegating requests.
