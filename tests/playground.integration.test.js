// tests/playground.integration.test.js
const { test, expect } = require('@playwright/test');

// Increase timeout for the entire suite to 2 minutes
test.describe.configure({ timeout: 120000 });


test.describe('Playground Chat Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:12247/playground');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#chat-user-input', { state: 'visible', timeout: 120000 });
    await page.waitForSelector('#chat-provider-select', { state: 'visible', timeout: 120000 });
  });

  test('Model dropdown filters by provider', async ({ page }) => {
    await page.selectOption('#chat-provider-select', 'ollama');
    // Wait for model options to be populated (non-empty)
    await page.waitForFunction(() => {
      const modelSelect = document.getElementById('ollama-model-select');
      return modelSelect && modelSelect.options.length > 1 && modelSelect.options[0].value !== '';
    }, { timeout: 120000 });
    const options = await page.$$eval('#ollama-model-select option', opts => opts.map(o => o.textContent.trim()));
    expect(options.length).toBeGreaterThan(0);
  });

  test('Voice toggle shows error when unsupported', async ({ page }) => {
    await page.evaluate(() => { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; });
    await page.click('#voice-toggle-btn');
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Voice input not supported');
      await dialog.dismiss();
    });
  });

  test('Send button validation prevents empty messages', async ({ page }) => {
    await page.fill('#chat-user-input', '');
    await page.click('#chat-send-btn');
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Empty Message Detected');
      await dialog.dismiss();
    });
  });
});
