/**
 * public/js/views/playground/MediaController.js
 * OOPS Controller: Coordinates web queries, video transcriptions, and image asset generation.
 */

class MediaController {
  static async handleWebSearch(query, onResultCallback) {
    ModalDialog.showNotification('Running online web search...', 'info');
    try {
      const res = await ApiService.runWebSearch(query);
      if (res.success && res.results) {
        const msgBody = `🔍 **Online Web Search Results for:** "${query}"\n\n${res.results}\n\n*(Powered by Tavily Search Engine)*`;
        onResultCallback(true, msgBody);
      } else {
        ModalDialog.showNotification('Search failed: ' + (res.error || 'Unknown error'), 'danger');
      }
    } catch (err) {
      ModalDialog.showNotification('Search error: ' + err.message, 'danger');
    }
  }

  static async handleYouTubeTranscript(url, onResultCallback) {
    ModalDialog.showNotification('Extracting YouTube video transcript...', 'info');
    try {
      const res = await ApiService.getYouTubeTranscript(url);
      if (res.success && res.transcript) {
        const msgBody = `📹 **YouTube Transcript Extracted**:\n\n*Video Link:* ${url}\n\n\`\`\`text\n${res.transcript.substring(0, 4000)}...\n\`\`\``;
        onResultCallback(true, msgBody);
      } else {
        ModalDialog.showNotification('Extraction failed: ' + (res.error || 'Unknown error'), 'danger');
      }
    } catch (err) {
      ModalDialog.showNotification('Extraction error: ' + err.message, 'danger');
    }
  }

  static async handleImageGeneration(promptText, onResultCallback) {
    ModalDialog.showNotification('Generating graphic artifact...', 'info');
    try {
      const res = await ApiService.generateImage(promptText, 'ai_ui_art');
      if (res.success && res.imageUrl) {
        const msgBody = `🎨 **jDroid-X Image Engine Result**:\n\nPrompt: "${promptText}"\n\n![Generated UI Graphic](${res.imageUrl})\n\n*(Saved to Local Desk)*`;
        onResultCallback(true, msgBody);
      } else {
        ModalDialog.showNotification('Image generation failed: ' + (res.error || 'Unknown error'), 'danger');
      }
    } catch (err) {
      ModalDialog.showNotification('Generation error: ' + err.message, 'danger');
    }
  }
}

window.MediaController = MediaController;
