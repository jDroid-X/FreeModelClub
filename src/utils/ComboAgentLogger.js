// ComboAgentLogger.js
// Provides a simple logger that writes to VS Code OutputChannel if available, otherwise falls back to console.

let outputChannel = null;

function getChannel() {
  if (outputChannel) return outputChannel;
  try {
    // VS Code extension environment provides the 'vscode' module.
    const vscode = require('vscode');
    outputChannel = vscode.window.createOutputChannel('Combo-Agent');
    return outputChannel;
  } catch (e) {
    // Not running inside VS Code; fallback to console.
    outputChannel = console;
    return outputChannel;
  }
}

/**
 * Log a message with timestamp.
 * @param {string} message - Message to log.
 */
function log(message) {
  const ts = new Date().toISOString();
  const formatted = `[${ts}] ${message}`;
  const ch = getChannel();
  if (ch.appendLine) {
    ch.appendLine(formatted);
  } else {
    console.log(formatted);
  }
}

module.exports = { log };
