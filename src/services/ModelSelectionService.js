const ModelLoadBalancer = require('./ModelLoadBalancer');

class ModelSelectionService {
  static getSortedCandidates(models, requiredSkills = ['Coding', 'Reasoning'], tokenBudget = 8192) {
    if (!Array.isArray(models) || models.length === 0) return [];
    return models.filter(m => m && m.isActive !== false);
  }

  static selectBestModel(models, requiredSkills = ['Coding', 'Reasoning'], tokenBudget = 8192) {
    return ModelLoadBalancer.select(models, 'smart');
  }
}

module.exports = ModelSelectionService;
