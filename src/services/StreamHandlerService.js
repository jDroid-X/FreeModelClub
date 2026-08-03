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
    isFailover
  }) {
    let completionTextAccumulator = '';
    let sseBuffer = '';

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
            completionTextAccumulator += content;
          } catch (e) {}
        }
      });
    });

    proxyRes.on('end', () => {
      res.end();
      const latencyMs = Date.now() - startTime;
      const estimatedCompletionTokens = Math.max(1, Math.round(completionTextAccumulator.length / 4));

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
        responseSummary: `Stream completed (${completionTextAccumulator.length} chars)`
      });
    });
  }
}

module.exports = StreamHandlerService;
