/**
 * AntigravityToolExecutionEngine.js (Legacy Compatible Alias)
 * Purpose: Provides backwards-compatible bridge to jDroidXToolExecutionEngine
 *          Enforces Prime Directive #1: Do not delete earlier codes, update deprecated ones and merge new codes.
 * Dependencies: jDroidXToolExecutionEngine
 */

const jDroidXToolExecutionEngine = require('./jDroidXToolExecutionEngine');

class AntigravityToolExecutionEngine extends jDroidXToolExecutionEngine {
  // Inherits all methods from jDroidXToolExecutionEngine with full backwards compatibility:
  // 1. executeWebSearch(query)
  // 2. extractYouTubeTranscript(videoUrl)
  // 3. generateImage(promptText, imageName)
  // 4. saveCodeToFile(targetPath, codeContent)
  // 5. readFileContent(filePath)
  // 6. executePowerShellCommand(commandLine, timeoutMs)
  // 7. extractTextFromImageData(base64Data)
  // 8. executeSemanticSearch(query, topK)
  // 9. executeASTAnalysis(filePath)
}

module.exports = AntigravityToolExecutionEngine;
