/**
 * TelemetryController.js
 * Purpose: Aggregates token usage data and provides analytical endpoints for the Live Token Dashboard
 */

const LogModel = require('../models/LogModel');
const ProviderModel = require('../models/ProviderModel');
const ComboModel = require('../models/ComboModel');

class TelemetryController {
  static getDashboardTelemetry(req, res) {
    try {
      // 1. Fetch All Logs & Providers
      const logs = LogModel.getAll();
      const providers = ProviderModel.getAll();

      // 2. Compute Time Boundaries
      const now = new Date();
      
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon = 0
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // 3. Initialize Accumulators
      const consumed = { month: 0, week: 0, day: 0 };
      const providerStats = {}; // { providerId: { name, tokens, requests, latencySum, latencyCount } }
      const modelStats = {};    // { modelId: { name, tokens, requests, latencySum, latencyCount } }

      // 4. Process Logs
      logs.forEach(log => {
        const logDate = new Date(log.timestamp);
        const tokens = log.totalTokens || 0;
        const latency = log.latencyMs || 0;

        if (logDate >= startOfMonth) {
          consumed.month += tokens;
          
          if (logDate >= startOfWeek) {
            consumed.week += tokens;
          }
          if (logDate >= startOfDay) {
            consumed.day += tokens;
          }

          // Provider Aggregation (Month)
          if (!providerStats[log.providerId]) {
            providerStats[log.providerId] = { name: log.providerName || log.providerId, tokens: 0, requests: 0, latencySum: 0, latencyCount: 0 };
          }
          providerStats[log.providerId].tokens += tokens;
          providerStats[log.providerId].requests += 1;
          providerStats[log.providerId].latencySum += latency;
          providerStats[log.providerId].latencyCount += 1;

          // Model Aggregation (Month)
          if (!modelStats[log.modelId]) {
            modelStats[log.modelId] = { name: log.modelId, tokens: 0, requests: 0, latencySum: 0, latencyCount: 0 };
          }
          modelStats[log.modelId].tokens += tokens;
          modelStats[log.modelId].requests += 1;
          modelStats[log.modelId].latencySum += latency;
          modelStats[log.modelId].latencyCount += 1;
        }
      });

      // 5. Token Pool Gauge & Availability Logic
      // Assuming a default active capacity if 'Unlimited' is encountered, or we sum real limits.
      let monthlyCapacity = 0;
      let activeKeysCount = 0;
      let activeGroup = 'No Active Requests';
      if (logs.length > 0) {
        // Find the most recent log to determine active router
        const lastLog = logs[logs.length - 1];
        if (lastLog.modelId && lastLog.modelId.startsWith('combo_')) {
          const combo = ComboModel.getComboById(lastLog.modelId);
          activeGroup = combo ? combo.name : lastLog.modelId;
        } else {
          activeGroup = 'Direct Model Query';
        }
      }

      providers.forEach(p => {
        if (p.isActive) {
          activeKeysCount++;
          if (p.hardTokenLimit && p.hardTokenLimit > 0) {
            monthlyCapacity += p.hardTokenLimit;
          } else {
            // Default 100M for unlimited to make the gauge render nicely if no hard limits set
            monthlyCapacity += 100000000; 
          }
        }
      });
      
      if (monthlyCapacity === 0) monthlyCapacity = 100000000;

      // Available & Balance logic
      const available = {
        month: monthlyCapacity,
        week: Math.round(monthlyCapacity / 4.33),
        day: Math.round(monthlyCapacity / 30)
      };

      const balance = {
        month: Math.max(0, available.month - consumed.month),
        week: Math.max(0, available.week - consumed.week),
        day: Math.max(0, available.day - consumed.day)
      };

      const percent = {
        month: ((consumed.month / available.month) * 100).toFixed(1),
        week: ((consumed.week / available.week) * 100).toFixed(1),
        day: ((consumed.day / available.day) * 100).toFixed(1)
      };

      // 6. Format Leaderboards
      const topProviders = Object.values(providerStats)
        .sort((a, b) => b.tokens - a.tokens)
        .slice(0, 3)
        .map(p => ({
          name: p.name.toUpperCase(),
          tokens: p.tokens,
          requests: p.requests,
          avgLatency: p.latencyCount ? Math.round(p.latencySum / p.latencyCount) : 0
        }));

      const topModels = Object.values(modelStats)
        .sort((a, b) => b.tokens - a.tokens)
        .slice(0, 3)
        .map(m => ({
          name: m.name,
          tokens: m.tokens,
          requests: m.requests,
          avgLatency: m.latencyCount ? Math.round(m.latencySum / m.latencyCount) : 0
        }));

      return res.json({
        success: true,
        data: {
          available,
          consumed,
          balance,
          percent,
          gauge: {
            activeGroup,
            activeKeysCount,
            monthlyCapacity,
            usedPercent: percent.month
          },
          topProviders,
          topModels
        }
      });
    } catch (err) {
      console.error('Telemetry Aggregation Error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = TelemetryController;
