/**
 * Fix All Bynara Models to Use Correct ProviderId
 */

const db = require('../src/models/Database');
const AIModel = require('../src/models/AIModel');

async function fixAllBynaraModels() {
  console.log('[FixBynara] Starting mass model fix...\n');
  
  const models = db.read(db.files.models);
  let fixed = 0;
  let removed = 0;
  
  for (const model of models) {
    const isBynara = 
      model.providerId === 'router.bynara' ||
      model.providerName?.toLowerCase().includes('bynara') ||
      model.id?.startsWith('router_bynara') ||
      model.modelId?.toLowerCase().includes('mimo') ||
      model.modelId?.toLowerCase().includes('claude-sonnet') ||
      model.modelId?.toLowerCase().includes('glm-4-flash') ||
      model.modelId?.toLowerCase().includes('qwen-2.5-coder');
    
    if (isBynara) {
      // Check if already has correct providerId
      if (model.providerId !== 'bynara') {
        console.log(`[FIX] ${model.id}: ${model.providerId} → bynara`);
        model.providerId = 'bynara';
        model.providerName = 'Bynara Cloud AI API';
        fixed++;
      }
    }
    
    // Remove corrupted models with numeric providerIds
    if (model.providerId && !isNaN(model.providerId)) {
      console.log(`[REMOVE] ${model.id}: Corrupted providerId "${model.providerId}"`);
      removed++;
    }
  }
  
  // Write back fixed models
  db.write(db.files.models, models);
  
  // Count total Bynara models
  const bynaraCount = models.filter(m => m.providerId === 'bynara').length;
  
  console.log(`\n[FixBynara] Summary:`);
  console.log(`  - Fixed models: ${fixed}`);
  console.log(`  - Removed corrupted: ${removed}`);
  console.log(`  - Total Bynara models now: ${bynaraCount}`);
}

fixAllBynaraModels().catch(err => console.error('[FixBynara] Error:', err.message));
