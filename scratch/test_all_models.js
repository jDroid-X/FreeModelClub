/**
 * test_all_models.js
 * Purpose: Diagnostic execution audit script that tests all registered active models
 *          and outputs a comprehensive RAG (Red/Amber/Green) report.
 */

const fs = require('fs');
const path = require('path');

const providersPath = path.join(__dirname, '../data/providers.json');
const modelsPath = path.join(__dirname, '../data/models.json');

const providers = JSON.parse(fs.readFileSync(providersPath, 'utf8'));
const models = JSON.parse(fs.readFileSync(modelsPath, 'utf8'));

async function testModel(model, provider) {
  if (!provider) {
    return {
      status: 'FAIL',
      code: 'PROVIDER_MISSING',
      reason: 'Associated provider configuration record not found in database.',
      fix: 'Re-register provider under Provider Onboarding tab.'
    };
  }

  if (!provider.isActive) {
    return {
      status: 'FAIL',
      code: 'PROVIDER_INACTIVE',
      reason: `Provider '${provider.displayName}' is currently toggled Inactive.`,
      fix: 'Navigate to Provider Onboarding tab and click Toggle Active button.'
    };
  }

  if (!provider.apiKey || provider.apiKey === '********' || /^\*+$/.test(provider.apiKey)) {
    return {
      status: 'FAIL',
      code: 'API_KEY_MASKED_OR_MISSING',
      reason: `Provider '${provider.displayName}' has masked/placeholder API key ('********') in database.`,
      fix: `Go to Provider Onboarding -> Edit ${provider.displayName} -> Enter valid API Key -> Save.`
    };
  }

  // Attempt test request via fetch to local proxy endpoint
  try {
    const res = await fetch('http://localhost:12247/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer direct-ui'
      },
      body: JSON.stringify({
        model: model.id,
        messages: [{ role: 'user', content: 'Ping test' }],
        max_tokens: 5
      })
    });

    const data = await res.json();
    if (res.ok && data.choices && data.choices.length > 0) {
      return {
        status: 'PASS',
        code: '200_OK',
        reason: 'Successfully returned completion from model.',
        fix: 'None required. Model operational.'
      };
    } else {
      const errMsg = (data.error && data.error.message) ? data.error.message : JSON.stringify(data);
      if (res.status === 401 || errMsg.includes('Authentication') || errMsg.includes('API Key')) {
        return {
          status: 'FAIL',
          code: 'HTTP_401_UNAUTHORIZED',
          reason: `Upstream provider rejected key: ${errMsg}`,
          fix: `Update ${provider.displayName} API Key in Provider Onboarding tab with a fresh valid key.`
        };
      } else if (res.status === 404 || errMsg.includes('not found') || errMsg.includes('does not exist')) {
        return {
          status: 'FAIL',
          code: 'HTTP_404_NOT_FOUND',
          reason: `Model ID '${model.modelId}' was deprecated or not recognized by provider: ${errMsg}`,
          fix: 'Re-fetch available free models from Provider Onboarding tab to remove stale model IDs.'
        };
      } else {
        return {
          status: 'FAIL',
          code: `HTTP_${res.status}_ERROR`,
          reason: `Upstream error: ${errMsg}`,
          fix: 'Inspect network connection, rate limits, or provider documentation.'
        };
      }
    }
  } catch (err) {
    return {
      status: 'FAIL',
      code: 'CONNECTION_ERROR',
      reason: `Failed to connect to local server: ${err.message}`,
      fix: 'Verify server.js is running on http://localhost:12247.'
    };
  }
}

async function runAudit() {
  console.log('Running RAG Diagnostic Audit across all registered models...\n');
  const results = [];

  for (const model of models) {
    const provider = providers.find(p => p.id === model.providerId);
    const audit = await testModel(model, provider);
    results.push({
      id: model.id,
      modelId: model.modelId,
      modelName: model.modelName,
      providerName: model.providerName,
      status: audit.status,
      code: audit.code,
      reason: audit.reason,
      fix: audit.fix
    });
  }

  fs.writeFileSync(path.join(__dirname, 'audit_results.json'), JSON.stringify(results, null, 2));
  console.log('Audit completed. Total models tested:', results.length);
}

runAudit();
