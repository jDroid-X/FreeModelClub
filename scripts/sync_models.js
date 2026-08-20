const db = require('./src/models/Database');
const providers = db.read(db.files.providers);
const models = db.read(db.files.models);

let updated = 0;
models.forEach(m => {
  const p = providers.find(prov => prov.id === m.providerId);
  if (p && m.providerName !== p.displayName) {
    console.log(`Updating providerName for model ${m.id} from '${m.providerName}' to '${p.displayName}'`);
    m.providerName = p.displayName;
    updated++;
  }
  
  // Format model names if they look raw/ugly or are missing
  if (!m.modelName) {
     m.modelName = m.modelId;
     updated++;
  }
});

if (updated > 0) {
  db.write(db.files.models, models);
  console.log(`Successfully synced ${updated} model fields from the single source of truth.`);
} else {
  console.log('All model names are already perfectly synced with their providers.');
}
