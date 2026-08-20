/**
 * StreamHandlerService.js
 * Purpose: Handles Server-Sent Events (SSE) stream decoding, chunk buffering, and completion token accumulation
 * Dependencies: AIModel, LogModel
 */

const AIModel = require('../models/AIModel');
const LogModel = require('../models/LogModel');
const ProviderModel = require('../models/ProviderModel');

class StreamHandlerService {
  static handleStreamResponse({
    proxyRes,
    res,
    targetModel,
    targetProvider,
    clientKey,
    estimatedPromptTokens,
    startTime,
    isFailover,
    // NEW: Additional metadata from upstream
    userAgent_full = null,
    ip_address = null,
    request_size_bytes = 0,
    comboId = null,
    strategyUsed = 'Direct Route'
  }) {
    let completionTextAccumulator = '';
    let sseBuffer = '';
    let ttft_ms = null;  // Time to First Token
    let firstTokenTime = null;

    proxyRes.on('data', (chunk) => {
      res.write(chunk);
      sseBuffer += chunk.toString();

      const lines = sseBuffer.split('\n');
      sseBuffer = lines.pop(); // Keep partial line in buffer

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
          try {
            const json = JSON.parse(trimmed.substring(6));
            const content = json.choices?.[0]?.delta?.content || '';
            
            // Capture TTFT (Time To First Token)
            if (content && !firstTokenTime) {
              firstTokenTime = Date.now();
              ttft_ms = firstTokenTime - startTime;
            }
            
            completionTextAccumulator += content;
          } catch (e) {}
        }
      });
    });

    proxyRes.on('end', () => {
      res.end();
      const latencyMs = Date.now() - startTime;
      const estimatedCompletionTokens = Math.max(1, Math.round(completionTextAccumulator.length / 4));
      const tokens_per_second = latencyMs > 0 ? (estimatedCompletionTokens / (latencyMs / 1000)).toFixed(2) : 0;

      AIModel.recordUsage(targetModel.id, estimatedPromptTokens, estimatedCompletionTokens, latencyMs);
      ProviderModel.recordUsage(targetProvider.id, estimatedPromptTokens, estimatedCompletionTokens);

      LogModel.recordApiLog({
        providerId: targetProvider.id,
        providerName: targetProvider.displayName,
        modelId: targetModel.modelId,
        clientKey,
        endpoint: '/v1/chat/completions',
        promptTokens: estimatedPromptTokens,
        completionTokens: estimatedCompletionTokens,
        latencyMs,
        statusCode: proxyRes.statusCode || 200,
        status: isFailover ? 'SUCCESS_FAILOVER' : 'SUCCESS',
        requestPayload: { model: targetModel.modelId, stream: true, isFailover },
        responseSummary: `Stream completed (${completionTextAccumulator.length} chars)`,
        // NEW: Deep analytics fields
        ttft_ms,
        tokens_per_second,
        userAgent_full,
        ip_address,
        request_size_bytes,
        comboId,
        strategyUsed
      });
    });
  }
}

module.exports = StreamHandlerService;
