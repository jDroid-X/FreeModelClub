/**
 * public/js/views/playground/MediaDialogView.js
 * OOPS View: Renders simple dialog modal triggers for image generator, YouTube link, and web queries.
 */

class MediaDialogView {
  static promptWebSearch() {
    const query = prompt('Enter search query for real-time online web search:', 'latest AI models 2026');
    if (!query || !query.trim()) return null;
    return query.trim();
  }

  static promptYouTubeTranscript() {
    const url = prompt('Enter YouTube Video URL to extract transcript:', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    if (!url || !url.trim()) return null;
    return url.trim();
  }

  static promptGenerateImage() {
    const promptText = prompt('Enter graphic prompt to generate image asset:', 'futuristic cyberpunk software development workbench');
    if (!promptText || !promptText.trim()) return null;
    return promptText.trim();
  }
}

window.MediaDialogView = MediaDialogView;
