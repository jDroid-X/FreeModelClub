/**
 * TaxonomyHelper.js
 * Purpose: Client-side taxonomy normalizer for pyramid single source of truth.
 *          Normalizes 68 raw skills → 7 categories, 15 raw families → 10 head families.
 *          Provides bidirectional linkage across Combo Club → Model Club → (Skills, Family, Provider → Models).
 * Dependencies: None (self-contained, loaded before view helpers)
 */

class TaxonomyHelper {
  // ─── 7 SKILL CATEGORIES (with 3-level sub-hierarchy) ──────────────
  static SKILL_CATEGORIES = [
    { id: 'coding', name: 'Coding', icon: 'fa-code', color: '#10b981',
      subLevels: [{ id: 'ide_agent', name: 'IDE Agents & Copilots' }, { id: 'code_gen', name: 'Code Generation' }, { id: 'debug_review', name: 'Debugging & Review' }],
      kw: ['code','coder','dev','ide','program','coding','software','refactor','mimo','north-mini-code','laguna','poolside','kimi'] },
    { id: 'reasoning', name: 'Reasoning', icon: 'fa-brain', color: '#f59e0b',
      subLevels: [{ id: 'math_cot', name: 'Math & Chain-of-Thought' }, { id: 'scientific', name: 'Scientific & Analytical' }, { id: 'planning', name: 'Planning & Agentic' }],
      kw: ['r1','reason','math','think','chain','logic','deepseek-r1','nemotron-3-nano-omni'] },
    { id: 'general', name: 'General Knowledge', icon: 'fa-comments', color: '#6366f1',
      subLevels: [{ id: 'qa_chat', name: 'Q&A & Conversational' }, { id: 'multilingual', name: 'Multilingual & Translation' }, { id: 'summarize', name: 'Summarization & Writing' }],
      kw: ['general','knowledge','versatile','instruct','chat','language','glm','minimax','gpt','openai','mixtral','mistral','qwen','gemini'] },
    { id: 'fast_chat', name: 'Fast Chat', icon: 'fa-bolt', color: '#06b6d4',
      subLevels: [{ id: 'instant', name: 'Instant Response' }, { id: 'edge', name: 'Edge & On-Device' }, { id: 'streaming', name: 'Streaming & Real-Time' }],
      kw: ['instant','flash','turbo','fast','lite','8b','small','mini','nano','1b','3b','4b','smollm','gemma2-9b','gemma-4'] },
    { id: 'vision', name: 'Vision', icon: 'fa-eye', color: '#ec4899',
      subLevels: [{ id: 'image_understand', name: 'Image Understanding' }, { id: 'ocr_document', name: 'OCR & Document Parsing' }, { id: 'video_media', name: 'Video & Rich Media' }],
      kw: ['vision','vl','multimodal','image','ocr','parse','table','page','element','paligemma','lipsync','graphic','yolox','inkling','ising'] },
    { id: 'safety', name: 'Safety', icon: 'fa-shield-halved', color: '#ef4444',
      subLevels: [{ id: 'jailbreak', name: 'Jailbreak & Prompt Guard' }, { id: 'content_filter', name: 'Content Filtering' }, { id: 'topic_control', name: 'Topic Control' }],
      kw: ['guard','safety','jailbreak','content-safety','moderat','nemoguard','topic-control','nemotron-3.5-content'] },
    { id: 'enterprise', name: 'Enterprise', icon: 'fa-industry', color: '#8b5cf6',
      subLevels: [{ id: 'speech_tts', name: 'Speech, TTS & ASR' }, { id: 'rag_retrieval', name: 'RAG & Retrieval' }, { id: 'science_bio', name: 'Molecular & BioAI' }],
      kw: ['whisper','speech','tts','asr','voice','parakeet','magpie','voicechat','embed','bge','retrieval','fold','molecular','molmim','genmol','msa','openfold'] }
  ];

  // ─── 10 HEAD MODEL FAMILIES ───────────────────────────────────────
  static HEAD_FAMILIES = [
    { id: 'llama', name: 'Llama Family', vendor: 'Meta', icon: '🦙', kw: ['llama'], exKw: [] },
    { id: 'gemini_gemma', name: 'Gemini & Gemma Family', vendor: 'Google', icon: '💎', kw: ['gemini','gemma'], exKw: [] },
    { id: 'gpt', name: 'OpenAI GPT Family', vendor: 'OpenAI', icon: '🧠', kw: ['gpt','openai'], exKw: [] },
    { id: 'qwen', name: 'Qwen Family', vendor: 'Alibaba', icon: '🐉', kw: ['qwen'], exKw: [] },
    { id: 'deepseek', name: 'DeepSeek Family', vendor: 'DeepSeek', icon: '🔍', kw: ['deepseek'], exKw: [] },
    { id: 'mistral', name: 'Mistral & Mixtral Family', vendor: 'Mistral AI', icon: '🌀', kw: ['mistral','mixtral','codestral'], exKw: [] },
    { id: 'nemotron', name: 'NVIDIA Nemotron Family', vendor: 'NVIDIA', icon: '🟢', kw: ['nemotron','nvidia'], exKw: ['llama'] },
    { id: 'cohere', name: 'Cohere Family', vendor: 'Cohere', icon: '🔗', kw: ['cohere','north'], exKw: [] },
    { id: 'poolside', name: 'Poolside Family', vendor: 'Poolside AI', icon: '🏊', kw: ['poolside','laguna'], exKw: [] },
    { id: 'other', name: 'Other Specialized', vendor: 'Various', icon: '🔬', kw: [], exKw: [] }
  ];

  // Priority order for skill matching (safety/vision first to avoid general catch-all)
  static SKILL_PRIORITY = ['safety', 'vision', 'coding', 'reasoning', 'fast_chat', 'enterprise', 'general'];

  // ─── NORMALIZE SKILL ───────────────────────────────────────────────
  static normalizeSkill(rawSkill, modelId) {
    const s = `${rawSkill || ''} ${modelId || ''}`.toLowerCase();
    for (const catId of this.SKILL_PRIORITY) {
      const cat = this.SKILL_CATEGORIES.find(c => c.id === catId);
      if (cat && cat.kw.some(k => s.includes(k))) {
        const sub = cat.subLevels?.[0]?.name || cat.name;
        return { categoryId: cat.id, categoryName: cat.name, icon: cat.icon, color: cat.color, subLevel1: sub, subLevels: cat.subLevels };
      }
    }
    const gen = this.SKILL_CATEGORIES.find(c => c.id === 'general');
    return { categoryId: 'general', categoryName: gen.name, icon: gen.icon, color: gen.color, subLevel1: gen.subLevels[0].name, subLevels: gen.subLevels };
  }

  // ─── NORMALIZE FAMILY ──────────────────────────────────────────────
  static normalizeFamily(rawFamily, modelId) {
    const s = `${rawFamily || ''} ${modelId || ''}`.toLowerCase();
    for (const hf of this.HEAD_FAMILIES) {
      if (hf.id === 'other') continue;
      if (hf.exKw.length > 0 && hf.exKw.some(ek => s.includes(ek))) continue;
      if (hf.kw.some(k => s.includes(k))) {
        return { headFamilyId: hf.id, headFamilyName: hf.name, vendor: hf.vendor, icon: hf.icon };
      }
    }
    return { headFamilyId: 'other', headFamilyName: 'Other Specialized', vendor: 'Various', icon: '🔬' };
  }

  // ─── NORMALIZE ALL MODELS ──────────────────────────────────────────
  static normalizeModels(models) {
    return models.map(m => {
      const sk = this.normalizeSkill(m.coreSkill, m.modelId || m.id);
      const fm = this.normalizeFamily(m.family, m.modelId || m.id);
      return { ...m, coreSkill: sk.categoryName, skillCategoryId: sk.categoryId, skillSubLevel1: sk.subLevel1, family: fm.headFamilyName, headFamilyId: fm.headFamilyId };
    });
  }

  // ─── BUILD PYRAMID (Combo Club → Model Club → Skills/Families/Providers → Models) ─
  static buildPyramid(models, providers = [], combos = []) {
    const normalized = this.normalizeModels(models);

    const skillGroups = this.SKILL_CATEGORIES.map(cat => ({
      skillName: cat.name, categoryId: cat.id, icon: cat.icon, color: cat.color,
      subLevels: cat.subLevels,
      models: normalized.filter(m => m.skillCategoryId === cat.id)
    })).filter(g => g.models.length > 0);

    const familyGroups = this.HEAD_FAMILIES.map(hf => ({
      familyName: hf.name, headFamilyId: hf.id, vendor: hf.vendor, icon: hf.icon,
      models: normalized.filter(m => m.headFamilyId === hf.id)
    })).filter(g => g.models.length > 0);

    return { models: normalized, skillGroups, familyGroups, providers, combos };
  }
}

window.TaxonomyHelper = TaxonomyHelper;
