/**
 * public/js/views/playground/TerminalRenderView.js
 * OOPS View: Formats standard outputs and error status banners for host CLI commands.
 */

class TerminalRenderView {
  static formatCommandOutput(command, output, success) {
    const statusIcon = success ? '💻' : '⚠️';
    const outputText = output ? output : 'Command executed with no output.';
    return `💻 **Windows System OS Tool Execution Result**:

*Command:* \`${command}\`

\`\`\`powershell
${outputText}
\`\`\``;
  }
}

window.TerminalRenderView = TerminalRenderView;
