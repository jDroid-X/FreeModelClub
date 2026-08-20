/**
 * Clean up corrupted Bynara entries in database
 */

const db = require('../src/models/Database');
const ProviderModel = require('../src/models/ProviderModel');
const AIModel = require('../src/models/AIModel');

async function cleanupBynara() {
  console.log('[Cleanup] Starting Bynara cleanup...\n');
  
  // Step 1: Archive any corrupted Bynara providers
  const providers = db.read(db.files.providers);
  const bynaraProviders = providers.filter(p => 
    (p.id && p.id.includes('bynara')) || 
    (p.baseUrl && p.baseUrl.includes('bynara'))
  );
  
  console.log(`[Cleanup] Found ${bynaraProviders.length} Bynara-related providers:`);
  bynaraProviders.forEach(p => {
    console.log(`  - ${p.id}: ${p.displayName} (isActive: ${p.isActive}, isArchived: ${p.isArchived})`);
  });
  
  // Archive the router.bynara one if exists
  const routerBynara = bynaraProviders.find(p => p.id === 'router.bynara' || p.baseUrl?.includes('router.bynara'));
  if (routerBynara && !routerBynara.isArchived) {
    ProviderModel.archive(routerBynara.id);
    console.log(`\n[Cleanup] Archived provider: ${routerBynara.id}`);
  }
  
  // Step 2: Fix models with wrong providerId
  const models = db.read(db.files.models);
  const bynaraModels = models.filter(m => 
    m.providerId === 'router.bynara' || 
    m.providerName?.toLowerCase().includes('bynara') ||
    m.modelId?.toLowerCase().includes('bynara')
  );
  
  console.log(`\n[Cleanup] Found ${bynaraModels.length} Bynara-related models`);
  
  let fixed = 0;
  let removed = 0;
  
  for (const model of bynaraModels) {
    // Fix models with numeric providerId (corrupted)
    if (!isNaN(model.providerId) || model.providerId?.includes('http')) {
      console.log(`  [REMOVE] Model ${model.id} has corrupted providerId: ${model.providerId}`);
      // Delete this model
      const updated = models.filter(m => m.id !== model.id);
      db.write(db.files.models, updated);
      removed++;
      continue;
    }
    
    // Fix providerId from router.bynara to bynara
    if (model.providerId === 'router.bynara') {
      model.providerId = 'bynara';
      model.providerName = 'Bynara Cloud AI API';
      fixed++;
      console.log(`  [FIX] Model ${model.id}: providerId → bynara`);
    }
  }
  
  // Step 3: Ensure clean Bynara provider exists
  let bynaraProvider = providers.find(p => p.id === 'bynara');
  if (!bynaraProvider) {
    console.log('\n[Cleanup] Creating clean Bynara provider...');
    ProviderModel.register({
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
  } else {
    console.log(`\n[Cleanup] Bynara provider exists: ${bynaraProvider.displayName}`);
    console.log(`  - isActive: ${bynaraProvider.isActive}`);
    console.log(`  - isArchived: ${bynaraProvider.isArchived}`);
    console.log(`  - apiKey: ${bynaraProvider.apiKey ? '✓ Set' : '✗ Empty (user needs to add key)'}`);
  }
  
  console.log(`\n[Cleanup] Summary:`);
  console.log(`  - Fixed models: ${fixed}`);
  console.log(`  - Removed corrupted: ${removed}`);
  console.log('\n[Cleanup] Done! Restart server to apply changes.');
}

cleanupBynara().catch(err => console.error('[Cleanup] Error:', err.message));
