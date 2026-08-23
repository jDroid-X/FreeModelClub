/**
 * LoadBalancingStrategyHelper.js
 * Master SSOT for all 13 Load Balancing Agent Strategies across Model Club & Playground Chatbot.
 * OOPS-based MVC helper (< 250 lines) providing metadata, criteria, optimum use cases, and rendering methods.
 */

class LoadBalancingStrategyHelper {
  static STRATEGIES = [
    {
      id: 'Round Robin',
      key: 'roundrobin',
      name: 'Round Robin (Equal Weight)',
      emoji: '⚖️',
      icon: 'fa-rotate',
      color: 'var(--text-main)',
      tag: 'UNIFORM',
      criteria: 'Equal Cycle Distribution',
      shortDesc: 'Equal Weight Distribution across pool',
      optimumUseCase: '<strong>⚖️ Uniform Balancing:</strong> Cycles requests across all pooled candidate models sequentially with equal weight. Best for homogeneous model pools with identical rate limits.',
      scoringFactors: { availability: 1.0, concurrency: 0.0, latency: 0.0, explore: 0.0 }
    },
    {
      id: 'Fallback',
      key: 'fallback',
      name: 'Fallback (Failover Sequential)',
      emoji: '🛡️',
      icon: 'fa-shield-halved',
      color: 'var(--accent-rose)',
      tag: 'FAILOVER',
      criteria: 'Primary First -> Cascade on 429/Error',
      shortDesc: 'Sequential High-Availability Failover',
      optimumUseCase: '<strong>🛡️ Sequential Failover:</strong> Routes prompt to primary model; cascades sequentially to secondary models on 429, 404, or upstream timeout. Best for high-reliability production APIs.',
      scoringFactors: { availability: 1.0, concurrency: 0.0, latency: 0.0, explore: 0.0 }
    },
    {
      id: 'Auto',
      key: 'auto',
      name: 'Auto (Multi-Factor Scoring Engine)',
      emoji: '🤖',
      icon: 'fa-robot',
      color: 'var(--accent-emerald)',
      tag: 'INTELLIGENT',
      criteria: 'Health (40%) + Concurrency (30%) + Latency (20%) + Exploration (10%)',
      shortDesc: '12-Factor Real-time Scoring Engine',
      optimumUseCase: '<strong>🤖 12-Factor Scoring Engine:</strong> Dynamically optimizes between availability (40%), concurrency load (30%), latency (20%), and explore (10%). Best general-purpose smart routing.',
      scoringFactors: { availability: 0.4, concurrency: 0.3, latency: 0.2, explore: 0.1 }
    },
    {
      id: 'Cost Optimized',
      key: 'costoptimized',
      name: 'Cost Optimized (Cheapest Provider First)',
      emoji: '💲',
      icon: 'fa-dollar-sign',
      color: 'var(--accent-cyan)',
      tag: 'ECONOMIC',
      criteria: 'Cheapest Price / 1K Tokens + Context Headroom',
      shortDesc: 'Cheapest Provider First',
      optimumUseCase: '<strong>💲 Economic Priority:</strong> Prioritizes completely free providers and cheapest pricing per 1K tokens with maximum context window. Best for cost-controlled batch inferences.',
      scoringFactors: { availability: 0.5, concurrency: 0.0, latency: 0.0, explore: 0.0 }
    },
    {
      id: 'Least Used',
      key: 'leastused',
      name: 'Least Used (Min Active Connections)',
      emoji: '⚖️',
      icon: 'fa-scale-balanced',
      color: 'var(--accent-purple)',
      tag: 'LOAD-AWARE',
      criteria: 'Min In-Flight Concurrency Requests',
      shortDesc: 'Fewest Active In-Flight Connections',
      optimumUseCase: '<strong>⚡ Concurrency Balancer:</strong> Inspects active connection concurrency and routes to the model with fewest in-flight requests. Best under heavy burst traffic.',
      scoringFactors: { availability: 0.2, concurrency: 0.8, latency: 0.0, explore: 0.0 }
    },
    {
      id: 'Power of 2 Choices',
      key: 'powerof2choices',
      name: 'Power of 2 Choices (P2C Dual Random)',
      emoji: '🎲',
      icon: 'fa-dice',
      color: 'var(--accent-amber)',
      tag: 'STOCHASTIC',
      criteria: 'Random Sample 2 -> Pick Lower Load',
      shortDesc: 'P2C Dual Random Sampling',
      optimumUseCase: '<strong>🎲 P2C Dual Sampling:</strong> Samples 2 candidate models at random and selects the one with the lighter connection load, eliminating herd behavior with O(1) overhead.',
      scoringFactors: { availability: 0.3, concurrency: 0.7, latency: 0.0, explore: 0.0 }
    },
    {
      id: 'LKGP',
      key: 'lkgp',
      name: 'LKGP (Last-Known-Good Session Sticky)',
      emoji: '📌',
      icon: 'fa-thumbtack',
      color: 'var(--primary-light)',
      tag: 'STICKY',
      criteria: 'Sticky Pin to Verified HTTP 200 Uptime',
      shortDesc: 'Last-Known-Good Session Sticky',
      optimumUseCase: '<strong>📌 Sticky Session:</strong> Pins subsequent prompt turns to the Last-Known-Good Provider/Model with verified HTTP 200 uptime. Best for multi-turn conversational coherence.',
      scoringFactors: { availability: 1.0, concurrency: 0.0, latency: 0.0, explore: 0.0 }
    },
    {
      id: 'Fill First',
      key: 'fillfirst',
      name: 'Fill First (Greedy Quota Exhaustion)',
      emoji: '🔋',
      icon: 'fa-battery-full',
      color: 'var(--accent-emerald)',
      tag: 'GREEDY',
      criteria: 'Greedy First Tier Quota Satiation',
      shortDesc: 'Greedy Quota Exhaustion',
      optimumUseCase: '<strong>🔋 Greedy Satiation:</strong> Saturates primary quota completely before switching to fallback pool. Best when using tier-limited free credits before backup accounts.',
      scoringFactors: { availability: 1.0, concurrency: 0.0, latency: 0.0, explore: 0.0 }
    },
    {
      id: 'Headroom',
      key: 'headroom',
      name: 'Headroom (Max Context Window Size)',
      emoji: '📐',
      icon: 'fa-ruler-combined',
      color: 'var(--accent-cyan)',
      tag: 'CAPACITY',
      criteria: 'Largest Context Window Buffer (1M/128K)',
      shortDesc: 'Max Context Window Size',
      optimumUseCase: '<strong>📐 Context Maximizer:</strong> Inspects input prompt size and routes to the model with largest context buffer (e.g. Gemini 1M vs Llama 128K). Best for heavy codebases & long documents.',
      scoringFactors: { availability: 0.4, concurrency: 0.0, latency: 0.0, explore: 0.0 }
    },
    {
      id: 'Lowest Latency',
      key: 'lowestlatency',
      name: 'Lowest Latency (Speed Optimized)',
      emoji: '⚡',
      icon: 'fa-bolt',
      color: 'var(--accent-amber)',
      tag: 'SPEED',
      criteria: 'Min Roundtrip Latency (ms)',
      shortDesc: 'Speed Optimized Live Ping',
      optimumUseCase: '<strong>⚡ Speed Priority:</strong> Live ping routing selecting the fastest millisecond response time (e.g. Groq 200ms vs Cloud 2000ms). Best for real-time voice and autocomplete.',
      scoringFactors: { availability: 0.3, concurrency: 0.0, latency: 0.7, explore: 0.0 }
    },
    {
      id: 'Weighted',
      key: 'weighted',
      name: 'Weighted (Custom Probability)',
      emoji: '📊',
      icon: 'fa-chart-simple',
      color: 'var(--accent-cyan)',
      tag: 'CUSTOM',
      criteria: 'User-Configured Weight Distribution',
      shortDesc: 'Custom Probability Distribution',
      optimumUseCase: '<strong>📊 Custom Probability:</strong> Distributes traffic according to configured model probability weights. Best for controlled A/B model testing and gradual rollouts.',
      scoringFactors: { availability: 0.5, concurrency: 0.0, latency: 0.0, explore: 0.0 }
    },
    {
      id: 'Strict Random',
      key: 'strictrandom',
      name: 'Strict Random (Pure Uniform Random)',
      emoji: '🔀',
      icon: 'fa-shuffle',
      color: 'var(--text-muted)',
      tag: 'RANDOM',
      criteria: 'Pure Uniform Pseudo-Random',
      shortDesc: 'Pure Uniform Random',
      optimumUseCase: '<strong>🔀 Uniform Stochastic:</strong> Pure uniform pseudo-random exploration across all models. Best for benchmark evaluations and diverse response sampling.',
      scoringFactors: { availability: 0.0, concurrency: 0.0, latency: 0.0, explore: 1.0 }
    },
    {
      id: 'Context Optimized',
      key: 'contextoptimized',
      name: 'Context Optimized (Max Output Tokens)',
      emoji: '📝',
      icon: 'fa-file-lines',
      color: 'var(--accent-amber)',
      tag: 'SYNTHESIS',
      criteria: 'Max Completion Output Tokens (8K/16K)',
      shortDesc: 'Max Output Tokens Limit',
      optimumUseCase: '<strong>📝 Max Output Synthesis:</strong> Selected for extensive code/document generation with largest max_tokens limit. Best for generating entire applications and lengthy reports.',
      scoringFactors: { availability: 0.3, concurrency: 0.0, latency: 0.0, explore: 0.0 }
    }
  ];

  static getAll() {
    return this.STRATEGIES;
  }

  static getById(idOrKey) {
    if (!idOrKey) return this.STRATEGIES[0];
    const norm = String(idOrKey).toLowerCase().replace(/[\s_-]+/g, '');
    return this.STRATEGIES.find(s => s.key === norm || s.id.toLowerCase() === idOrKey.toLowerCase()) || this.STRATEGIES[0];
  }

  static renderOptionsHtml(selectedStrategy = 'Round Robin') {
    const cur = this.getById(selectedStrategy).id;
    return this.STRATEGIES.map(s => {
      const isSel = s.id === cur ? 'selected' : '';
      const prefix = s.emoji ? `${s.emoji} ` : '';
      return `<option value="${s.id}" ${isSel}>${prefix}${s.name}</option>`;
    }).join('');
  }

  static getOptimumUseCaseHtml(idOrKey) {
    const s = this.getById(idOrKey);
    return `
      <div style="display: flex; align-items: flex-start; gap: 6px;">
        <i class="fa-solid ${s.icon}" style="color: ${s.color}; font-size: 0.85rem; margin-top: 2px;"></i>
        <div style="flex: 1;">
          <div>${s.optimumUseCase}</div>
          <div style="display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap;">
            <span class="badge badge-secondary" style="font-size: 0.58rem; padding: 1px 4px;">Criteria: ${s.criteria}</span>
            <span class="badge badge-cyan" style="font-size: 0.58rem; padding: 1px 4px;">Tag: ${s.tag}</span>
          </div>
        </div>
      </div>
    `;
  }
}

if (typeof window !== 'undefined') {
  window.LoadBalancingStrategyHelper = LoadBalancingStrategyHelper;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoadBalancingStrategyHelper;
}
