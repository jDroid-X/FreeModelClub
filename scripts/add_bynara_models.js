/**
 * Add Bynara Models to Database
 * Run this script to populate Bynara models
 */

const db = require('../src/models/Database');
const ProviderModel = require('../src/models/ProviderModel');
const AIModel = require('../src/models/AIModel');

async function addBynaraModels() {
  try {
    // Check if Bynara provider exists
    let bynaraProvider = ProviderModel.getById('bynara');
    
    if (!bynaraProvider) {
      console.log('[AddBynara] Creating Bynara provider...');
      bynaraProvider = await ProviderModel.register({
        id: 'bynara',
        displayName: 'Bynara Cloud AI API',
        protocol: 'OpenAI Compatible',
        baseUrl: 'https://router.bynara.id/v1',
        apiKey: '',
        isActive: false,
        freeOnly: true,
        docsUrl: 'https://router.bynara.id',
        registeredAt: new Date().toISOString()
      });
    }
    
    // Define Bynara models from ProviderAgentHelper catalog
    const bynaraModels = [
      { modelId: 'mimo-v2.5-free', modelName: 'Bynara MiMo v2.5 Free', family: 'MiMo', coreSkill: 'General Reasoning', contextWindow: 65536, maxTokens: 4096 },
      { modelId: 'mimo-v2.5-pro-free', modelName: 'Bynara MiMo v2.5 Pro', family: 'MiMo', coreSkill: 'Advanced Logic', contextWindow: 65536, maxTokens: 4096 },
      { modelId: 'claude-sonnet-4.5', modelName: 'Bynara Claude Sonnet 4.5', family: 'Claude', coreSkill: 'Coding & Analysis', contextWindow: 200000, maxTokens: 4096 },
      { modelId: 'claude-haiku-4.5', modelName: 'Bynara Claude Haiku 4.5', family: 'Claude', coreSkill: 'Fast Execution', contextWindow: 200000, maxTokens: 4096 },
      { modelId: 'glm-4-flash', modelName: 'Bynara GLM 4 Flash', family: 'GLM', coreSkill: 'Multilingual Chat', contextWindow: 128000, maxTokens: 4096 },
      { modelId: 'llama-3.3-70b-instruct', modelName: 'Bynara Llama 3.3 70B', family: 'Llama', coreSkill: 'General Reasoning & Code', contextWindow: 131072, maxTokens: 4096 },
      { modelId: 'qwen-2.5-coder-32b', modelName: 'Bynara Qwen 2.5 Coder 32B', family: 'Qwen', coreSkill: 'Code Generation', contextWindow: 32768, maxTokens: 4096 }
    ];
    
    // Check which models already exist
    const existingModels = AIModel.getByProvider('bynara');
    const existingIds = new Set(existingModels.map(m => m.modelId));
    
    let added = 0;
    for (const modelData of bynaraModels) {
      if (!existingIds.has(modelData.modelId)) {
        const model = {
          id: `bynara_${modelData.modelId}`,
          providerId: 'bynara',
          providerName: 'Bynara Cloud AI API',
          modelId: modelData.modelId,
          modelName: modelData.modelName,
          isFree: true,
          family: modelData.family,
          coreSkill: modelData.coreSkill,
          contextWindow: modelData.contextWindow,
          maxTokens: modelData.maxTokens,
          latencyMs: 0,
          status: 'Inactive',
          isActive: false,
          totalPromptTokens: 0,
          totalCompletionTokens: 0,
          requestCount: 0,
          registeredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        AIModel.saveBatch([model]);
        added++;
        console.log(`[AddBynara] Added model: ${modelData.modelName} (${modelData.modelId})`);
      } else {
        console.log(`[AddBynara] Model exists: ${modelData.modelName}`);
      }
    }
    
    console.log(`\n[AddBynara] Summary: Added ${added} new models to Bynara provider`);
    console.log(`[AddBynara] Total Bynara models: ${AIModel.getByProvider('bynara').length}`);
    
  } catch (err) {
    console.error('[AddBynara] Error:', err.message);
  }
}

addBynaraModels();
