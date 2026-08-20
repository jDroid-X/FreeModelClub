/**
 * public/js/views/playground/OSCommandController.js
 * OOPS Controller: Intercepts console execution strings and directs them to system endpoints.
 */

class OSCommandController {
  static checkIsCliRequest(content) {
    const lowerContent = (content || '').toLowerCase().trim();
    if (!lowerContent) return false;

    return lowerContent.startsWith('run ') || 
           lowerContent.startsWith('exec ') || 
           lowerContent.startsWith('powershell ') || 
           lowerContent.startsWith('cmd ') || 
           lowerContent.startsWith('git ') || 
           lowerContent.startsWith('npm ') || 
           lowerContent.startsWith('node ') || 
           lowerContent.startsWith('mkdir ') || 
           lowerContent.startsWith('taskkill ') || 
           lowerContent.startsWith('ping ') || 
           lowerContent.startsWith('sc ') || 
           lowerContent.startsWith('net ') || 
           lowerContent.startsWith('type ') || 
           lowerContent.startsWith('cat ') || 
           lowerContent === 'dir' || lowerContent.startsWith('dir ') ||
           lowerContent === 'ipconfig' || lowerContent.startsWith('ipconfig ') ||
           lowerContent === 'systeminfo' ||
           lowerContent === 'tasklist' || lowerContent.startsWith('tasklist ') ||
           lowerContent.includes('get-service') || 
           lowerContent.includes('start-service') || 
           lowerContent.includes('stop-service') ||
           lowerContent === 'cls';
  }

  static checkIsFolderCreateRequest(content) {
    const lowerContent = (content || '').toLowerCase().trim();
    return lowerContent.includes('create folder') || 
           lowerContent.includes('create directory') || 
           lowerContent.includes('created directory') || 
           lowerContent.includes('make folder') || 
           lowerContent.startsWith('mkdir ');
  }

  static parseFolderCreateRequest(content) {
    // Match pattern "create directory [name] at path [path]" or similar
    const atPathRegex = /(?:create|created|make)\s+(?:folder|directory|dir)\s+["']?([^"'\n]+?)["']?\s+at\s+(?:path|location)\s+["']?([^"'\n]+)["']?/i;
    const atMatch = content.match(atPathRegex);
    
    if (atMatch) {
      const extractedName = atMatch[1].trim().replace(/^["']|["']$/g, '').trim();
      const extractedPath = atMatch[2].trim().replace(/^["']|["']$/g, '').trim();
      const pathSeparator = extractedPath.includes('/') ? '/' : '\\';
      return extractedPath.endsWith(pathSeparator) 
        ? `${extractedPath}${extractedName}` 
        : `${extractedPath}${pathSeparator}${extractedName}`;
    }
    
    // Fallback standard extraction
    return content.replace(/^(create folder|create directory|created directory|make folder|mkdir)\s+/i, '').trim();
  }

  static async handleFolderCreation(folderPath, onResultCallback) {
    ModalDialog.showNotification(`Creating directory '${folderPath}' on local system...`, 'info');
    try {
      const res = await ApiService.createFolder(folderPath);
      const statusIcon = res.success ? '✅' : '❌';
      const msgBody = `📁 **Local Directory Tool Execution Result**:\n\n${statusIcon} ${res.message || res.error || 'Operation completed.'}\n\n*Target Path:* \`${folderPath}\``;
      onResultCallback(res.success, msgBody);
    } catch (err) {
      console.warn('Folder Creation Execution Error:', err.message);
      onResultCallback(false, `📁 **Local Directory Tool Execution Error**:\n\n${err.message}`);
    }
  }

  static async handleCommandExecution(content, onResultCallback) {
    const lowerContent = content.toLowerCase().trim();
    let commandToRun = content;
    
    if (lowerContent.startsWith('run ') || lowerContent.startsWith('exec ') || lowerContent.startsWith('powershell ') || lowerContent.startsWith('cmd ')) {
      commandToRun = content.replace(/^(run|exec|powershell|cmd)\s+/i, '').trim();
    }

    if (!commandToRun) return;

    ModalDialog.showNotification(`Executing Windows command: '${commandToRun}'...`, 'info');
    try {
      const res = await ApiService.runPowerShell(commandToRun);
      const msgBody = TerminalRenderView.formatCommandOutput(commandToRun, res.output || res.error, res.success);
      onResultCallback(res.success, msgBody);
    } catch (err) {
      console.warn('CLI command execution error:', err.message);
      onResultCallback(false, `💻 **Windows System OS Tool Execution Error**:\n\n${err.message}`);
    }
  }
}

window.OSCommandController = OSCommandController;
