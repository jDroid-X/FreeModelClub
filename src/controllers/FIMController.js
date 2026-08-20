/**
 * FIMController.js
 * Purpose: Handles Fill-In-the-Middle (FIM) Autocomplete requests for IDE Mode.
 */

const ProxyEngineService = require('../services/ProxyEngineService');
const AIModel = require('../models/AIModel');

class FIMController {
  static async handleFIM(req, res) {
    try {
      const { prefix, suffix, modelId } = req.body;
      if (!prefix) return res.json({ success: false, completion: '' });

      // Format for general FIM. We use a standard prompt structure that works for most models
      // if they don't natively support specialized FIM tokens via API.
      const prompt = `Please complete the following code. Only output the exact missing middle code, no explanations.\n\nCode Before Cursor:\n${prefix}\n\nCode After Cursor:\n${suffix || ''}\n\nMissing Middle Code:`;
      
      const payload = {
        model: modelId || 'default-fallback-model',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
        temperature: 0.1
      };

      // Use OpenAI-compatible endpoint directly
      const proxyRes = await fetch('http://localhost:12247/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!proxyRes.ok) {
        throw new Error(`HTTP ${proxyRes.status}: ${proxyRes.statusText}`);
      }
      
      const data = await proxyRes.json();
      let completion = '';
      if (data.choices && data.choices[0] && data.choices[0].message) {
         completion = data.choices[0].message.content || '';
      }

      // Cleanup markdown code blocks
      completion = completion.replace(/```[a-z]*\n/g, '').replace(/```/g, '').trim();

      return res.json({ success: true, completion });
    } catch (e) {
      console.error('[FIMController] Error:', e.message);
      return res.status(500).json({ success: false, error: e.message });
    }
  }
}

module.exports = FIMController;
