/**
 * ChatMarkdownRenderer.js
 * Purpose: Enterprise-grade Markdown renderer for the Antigravity-class Playground chat.
 *          Supports GitHub-Flavored Markdown, Mermaid diagrams, GitHub alerts, diff blocks,
 *          <think> reasoning traces, code syntax highlighting, tables with CSV export,
 *          inline math, file links, and incremental streaming render.
 * Dependencies: PlaygroundViewHelper (escapeHtml)
 * Architecture: Dimension 1 (View) — UI Render Layer
 */

class ChatMarkdownRenderer {

  // ── Main Render Entry Point ──
  static render(text) {
    if (!text) return '';
    let html = text;

    // Phase 1: Extract and protect code blocks from further processing
    const codeBlocks = [];
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const placeholder = `%%CODEBLOCK_${codeBlocks.length}%%`;
      codeBlocks.push({ lang: lang || '', code: code.trimEnd() });
      return placeholder;
    });

    // Phase 2: Extract inline code
    const inlineCodes = [];
    html = html.replace(/`([^`\n]+)`/g, (match, code) => {
      const placeholder = `%%INLINECODE_${inlineCodes.length}%%`;
      inlineCodes.push(code);
      return placeholder;
    });

    // Phase 3: Process <think> reasoning traces
    html = html.replace(/<think>([\s\S]*?)<\/think>/gi, (match, body) => {
      const thinkId = `think_${Math.random().toString(36).substr(2, 8)}`;
      return `<div class="agv-think-block" id="${thinkId}-wrap">
        <div class="agv-think-header" onclick="document.getElementById('${thinkId}').style.display=document.getElementById('${thinkId}').style.display==='none'?'block':'none'; this.querySelector('.agv-think-chevron').classList.toggle('fa-chevron-down'); this.querySelector('.agv-think-chevron').classList.toggle('fa-chevron-right');">
          <span><i class="fa-solid fa-brain agv-think-icon"></i> Reasoning Trace</span>
          <i class="fa-solid fa-chevron-down agv-think-chevron"></i>
        </div>
        <div id="${thinkId}" class="agv-think-body">${this._escapeHtml(body.trim())}</div>
      </div>`;
    });

    // Phase 4: GitHub-style alerts
    html = this._processAlerts(html);

    // Phase 5: Tables
    html = this._processTables(html);

    // Phase 6: Block-level Markdown
    // Headers
    html = html.replace(/^######\s+(.+)$/gm, '<h6 class="agv-h6">$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5 class="agv-h5">$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4 class="agv-h4">$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3 class="agv-h3">$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2 class="agv-h2">$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1 class="agv-h1">$1</h1>');

    // Horizontal rules
    html = html.replace(/^---+$/gm, '<hr class="agv-hr"/>');

    // Blockquotes (non-alert)
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote class="agv-blockquote">$1</blockquote>');

    // Unordered lists (support -, *, •)
    html = html.replace(/^[\-\*•]\s+(.+)$/gm, '<li class="agv-li">$1</li>');
    // Group unordered list items even if separated by blank lines
    html = html.replace(/(<li class="agv-li">.*?<\/li>)(?:\s*<li class="agv-li">.*?<\/li>)+/gs, (match) => {
      const items = match.replace(/<\/li>\s*<li/g, '</li><li');
      return `<ul class="agv-ul">${items}</ul>`;
    });
    html = html.replace(/(?<!<ul class="agv-ul">)<li class="agv-li">(.*?)<\/li>(?!<\/ul>)/g, '<ul class="agv-ul"><li class="agv-li">$1</li></ul>');

    // Ordered lists (support 1., 2., etc.)
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="agv-oli">$1</li>');
    // Group ordered list items even if separated by blank lines
    html = html.replace(/(<li class="agv-oli">.*?<\/li>)(?:\s*<li class="agv-oli">.*?<\/li>)+/gs, (match) => {
      const items = match.replace(/<\/li>\s*<li/g, '</li><li');
      return `<ol class="agv-ol">${items}</ol>`;
    });
    html = html.replace(/(?<!<ol class="agv-ol">)<li class="agv-oli">(.*?)<\/li>(?!<\/ol>)/g, '<ol class="agv-ol"><li class="agv-oli">$1</li></ol>');

    // Phase 7: Inline Markdown
    // Bold + Italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // Images ![alt](url)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
      let webUrl = url.trim();
      if (webUrl.includes('public/images/artifacts/') || webUrl.includes('public\\images\\artifacts\\')) {
        const parts = webUrl.split(/public[\\\/]images[\\\/]artifacts[\\\/]/);
        if (parts[1]) webUrl = `/images/artifacts/${parts[1]}`;
      }
      return `<div class="agv-img-container" style="margin: 6px 0;">
        <img src="${webUrl}" alt="${alt}" class="agv-img" style="max-width: 100%; max-height: 380px; border-radius: 8px; border: 1px solid var(--border-color); box-shadow: 0 4px 14px rgba(0,0,0,0.35);" loading="lazy"/>
        <div style="display: flex; gap: 8px; align-items: center; font-size: 0.68rem; color: var(--text-dim); margin-top: 4px;">
          <a href="${webUrl}" target="_blank" class="agv-link" style="color:var(--accent-cyan);"><i class="fa-solid fa-up-right-from-square"></i> Open Full Image</a>
          <span>•</span>
          <a href="${webUrl}" download="${alt || 'generated_image.png'}" class="agv-link" style="color:var(--accent-emerald);"><i class="fa-solid fa-download"></i> Download</a>
        </div>
      </div>`;
    });

    // Links [text](url) - Smart file link & multi-format preview support (doc, pdf, xls, txt, audio, video, image)
    html = html.replace(/(?<!\!)\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      const cleanUrl = url.trim();
      let webUrl = cleanUrl;
      const fileName = text.trim() || cleanUrl.split(/[\\\/]/).pop();
      const ext = (fileName.split('.').pop() || '').toLowerCase();

      if (cleanUrl.includes('public/images/artifacts/') || cleanUrl.includes('public\\images\\artifacts\\')) {
        const parts = cleanUrl.split(/public[\\\/]images[\\\/]artifacts[\\\/]/);
        if (parts[1]) webUrl = `/images/artifacts/${parts[1]}`;
      } else if (cleanUrl.startsWith('file:///') && /\.(png|jpg|jpeg|webp|svg|gif|mp3|wav|ogg|mp4|webm|pdf)$/i.test(cleanUrl)) {
        const fn = cleanUrl.split(/[\\\/]/).pop();
        webUrl = `/images/artifacts/${fn}`;
      }

      // Check for rich artifact formats (audio, video, pdf, xls, doc)
      if (['mp3', 'wav', 'ogg', 'm4a', 'mp4', 'webm', 'mov', 'pdf', 'xls', 'xlsx', 'csv', 'doc', 'docx'].includes(ext)) {
        return this._renderFileArtifactPreview(fileName, webUrl, ext);
      }

      const isImg = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext);
      const icon = isImg ? '<i class="fa-solid fa-file-image" style="margin-right:4px;"></i>' : '<i class="fa-solid fa-arrow-up-right-from-square" style="margin-right:4px; font-size:0.7rem;"></i>';
      return `<a href="${webUrl}" target="_blank" rel="noopener" class="agv-link agv-file-link" title="Open / Preview File">${icon}${text}</a>`;
    });

    // Auto-Link Plain Text Artifact File Names (e.g. File: scorpion_1787131021504.png)
    html = html.replace(/(?:^|\n)(?:File:\s*)([a-zA-Z0-9_\-]+\.(?:png|jpg|jpeg|webp|svg|gif))/gi, (match, fileName) => {
      const imgUrl = `/images/artifacts/${fileName}`;
      return `\n<div class="agv-img-container" style="margin: 6px 0;">
        <img src="${imgUrl}" alt="${fileName}" class="agv-img" onclick="window.open('${imgUrl}', '_blank')" style="max-width: 100%; max-height: 380px; border-radius: 8px; border: 1px solid var(--border-color); box-shadow: 0 4px 14px rgba(0,0,0,0.35); cursor: pointer;" loading="lazy"/>
        <div style="display: flex; gap: 8px; align-items: center; font-size: 0.72rem; color: var(--text-dim); margin-top: 4px;">
          <span>File: <a href="${imgUrl}" target="_blank" rel="noopener" class="agv-link agv-file-link" title="Open Image File"><i class="fa-solid fa-file-image" style="margin-right:4px;"></i>${fileName}</a></span>
          <span>•</span>
          <a href="${imgUrl}" target="_blank" class="agv-link" style="color:var(--accent-cyan); cursor:pointer;"><i class="fa-solid fa-up-right-from-square"></i> Open Full Image</a>
          <span>•</span>
          <a href="${imgUrl}" download="${fileName}" class="agv-link" style="color:var(--accent-emerald); cursor:pointer;"><i class="fa-solid fa-download"></i> Download</a>
        </div>
      </div>`;
    });

    // Auto-Link Plain Text Artifact File Paths (e.g. Location: C:\...\public\images\artifacts\xxx.png)
    html = html.replace(/((?:Location|Path):\s*)([A-Za-z]:[/\\]+[^\s<>"'\`\)]+[/\\]+public[/\\]+images[/\\]+artifacts[/\\]+([a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+))/gi, (match, prefix, fullPath, fileName) => {
      return `${prefix}<a href="/images/artifacts/${fileName}" target="_blank" rel="noopener" class="agv-link agv-file-link" title="Open File Location"><i class="fa-solid fa-folder-open" style="margin-right:4px;"></i>${fullPath}</a>`;
    });

    // General fallback for standalone filenames (File: filename.ext)
    html = html.replace(/(File:\s*)([a-zA-Z0-9_\-]+\.(?:png|jpg|jpeg|webp|svg|gif))/gi, (match, prefix, fileName) => {
      return `${prefix}<a href="/images/artifacts/${fileName}" target="_blank" rel="noopener" class="agv-link agv-file-link" title="Open Image File"><i class="fa-solid fa-file-image" style="margin-right:4px;"></i>${fileName}</a>`;
    });

    // Auto-Link General Windows Absolute File Paths
    html = html.replace(/(?<!href=")(?<!>)([A-Za-z]:[/\\][a-zA-Z0-9_\-/\\]+\.[a-zA-Z0-9]+)(?!<\/a>)/g, (match, fullPath) => {
      if (fullPath.includes('public\\images\\artifacts\\') || fullPath.includes('public/images/artifacts/')) {
        const fn = fullPath.split(/[/\\]/).pop();
        return `<a href="/images/artifacts/${fn}" target="_blank" rel="noopener" class="agv-link agv-file-link" title="Open Image"><i class="fa-solid fa-file-image" style="margin-right:4px;"></i>${fullPath}</a>`;
      }
      return `<a href="javascript:void(0)" onclick="if(window.IDEWorkspaceView) IDEWorkspaceView.openFileInEditor('${fullPath.replace(/\\/g, '\\\\')}')" class="agv-link agv-file-link" title="Open File in IDE Workspace"><i class="fa-solid fa-file-code" style="margin-right:4px;"></i>${fullPath}</a>`;
    });

    // Phase 8: Restore code blocks with rich rendering
    codeBlocks.forEach((block, i) => {
      const renderedBlock = this._renderCodeBlock(block.lang, block.code);
      html = html.replace(`%%CODEBLOCK_${i}%%`, renderedBlock);
    });

    // Restore inline codes
    inlineCodes.forEach((code, i) => {
      html = html.replace(`%%INLINECODE_${i}%%`, `<code class="agv-inline-code">${this._escapeHtml(code)}</code>`);
    });

    // Phase 9: Antigravity-Grade Line Spacing & Paragraph Cleanup
    // Normalize 3+ newlines to 2 newlines
    html = html.replace(/\n{3,}/g, '\n\n');

    // Convert newlines inside regular text to <br>, but avoid double spacing
    html = html.replace(/\n\n/g, '<div style="height: 4px;"></div>');
    html = html.replace(/\n/g, '<br>');

    // Strip extraneous <br> surrounding block containers
    html = html.replace(/(?:<br\s*\/?>|\s)*(<\/?(?:h[1-6]|hr|ul|ol|li|table|thead|tbody|tr|th|td|div|blockquote|pre)>)(?:<br\s*\/?>|\s)*/gi, '$1');
    html = html.replace(/(?:<br\s*\/?>){2,}/gi, '<br>');

    return html.trim();
  }

  // ── Code Block Renderer with Mermaid & Diff Support ──
  static _renderCodeBlock(lang, code) {
    const langLower = (lang || '').toLowerCase();
    const codeId = `code_${Math.random().toString(36).substr(2, 8)}`;

    // Mermaid diagram
    if (langLower === 'mermaid') {
      const mermaidId = `mermaid_${Math.random().toString(36).substr(2, 8)}`;
      return `<div class="agv-mermaid-block" id="${mermaidId}-wrap">
        <div class="agv-code-header">
          <span class="agv-code-lang">MERMAID DIAGRAM</span>
          <div class="agv-code-actions">
            <button class="agv-code-btn" onclick="navigator.clipboard.writeText(document.getElementById('${codeId}').textContent); ModalDialog.showNotification('Diagram code copied!','success')">Copy</button>
          </div>
        </div>
        <div class="agv-mermaid-render" id="${mermaidId}"></div>
        <pre id="${codeId}" style="display:none;">${this._escapeHtml(code)}</pre>
        <script>
          (function(){
            if(typeof mermaid!=='undefined'){
              try{mermaid.render('${mermaidId}_svg',document.getElementById('${codeId}').textContent).then(function(r){document.getElementById('${mermaidId}').innerHTML=r.svg;});}catch(e){document.getElementById('${mermaidId}').innerHTML='<pre style="color:var(--accent-rose);">Mermaid Error: '+e.message+'</pre>';}
            } else {
              document.getElementById('${mermaidId}').innerHTML='<pre style="color:var(--text-muted);font-size:0.72rem;">' + document.getElementById('${codeId}').textContent + '</pre>';
            }
          })();
        <\/script>
      </div>`;
    }

    // Diff block
    if (langLower === 'diff') {
      const diffLines = code.split('\n').map(line => {
        if (line.startsWith('+')) return `<span class="agv-diff-add">${this._escapeHtml(line)}</span>`;
        if (line.startsWith('-')) return `<span class="agv-diff-del">${this._escapeHtml(line)}</span>`;
        return `<span class="agv-diff-ctx">${this._escapeHtml(line)}</span>`;
      }).join('\n');
      return `<div class="agv-code-block agv-diff-block">
        <div class="agv-code-header"><span class="agv-code-lang">DIFF</span>
          <button class="agv-code-btn" onclick="navigator.clipboard.writeText(document.getElementById('${codeId}').textContent); ModalDialog.showNotification('Diff copied!','success')">Copy</button>
        </div>
        <pre id="${codeId}" class="agv-diff-pre">${diffLines}</pre>
      </div>`;
    }

    // Standard code block
    const isArtifact = ['html', 'htm', 'svg', 'js', 'javascript', 'css', 'json'].includes(langLower);
    return `<div class="agv-code-block">
      <div class="agv-code-header">
        <span class="agv-code-lang">${(lang || 'CODE').toUpperCase()}</span>
        <div class="agv-code-actions">
          ${isArtifact ? `<button class="agv-code-btn agv-artifact-btn" onclick="PlaygroundView.openLiveArtifact('${encodeURIComponent(code)}','${lang||'html'}')"><i class="fa-solid fa-window-restore"></i> Live Artifact</button>` : ''}
          <button class="agv-code-btn" onclick="navigator.clipboard.writeText(document.getElementById('${codeId}').textContent); ModalDialog.showNotification('Code copied!','success')"><i class="fa-solid fa-copy"></i> Copy</button>
        </div>
      </div>
      <pre id="${codeId}" class="agv-code-pre"><code>${this._escapeHtml(code)}</code></pre>
    </div>`;
  }

  // ── GitHub-Style Alerts ──
  static _processAlerts(html) {
    const alertTypes = {
      'NOTE': { icon: 'fa-circle-info', color: 'var(--accent-cyan)', bg: 'rgba(6,182,212,0.08)' },
      'TIP': { icon: 'fa-lightbulb', color: 'var(--accent-emerald)', bg: 'rgba(16,185,129,0.08)' },
      'IMPORTANT': { icon: 'fa-circle-exclamation', color: 'var(--primary-light)', bg: 'rgba(99,102,241,0.08)' },
      'WARNING': { icon: 'fa-triangle-exclamation', color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.08)' },
      'CAUTION': { icon: 'fa-radiation', color: 'var(--accent-rose)', bg: 'rgba(244,63,94,0.08)' }
    };

    for (const [type, style] of Object.entries(alertTypes)) {
      const regex = new RegExp(`^>\\s*\\[!${type}\\]\\n((?:>.*\\n?)*)`, 'gm');
      html = html.replace(regex, (match, body) => {
        const content = body.replace(/^>\s?/gm, '').trim();
        return `<div class="agv-alert agv-alert-${type.toLowerCase()}" style="border-left-color:${style.color}; background:${style.bg};">
          <div class="agv-alert-title"><i class="fa-solid ${style.icon}" style="color:${style.color}"></i> ${type}</div>
          <div class="agv-alert-body">${content}</div>
        </div>`;
      });
    }
    return html;
  }

  // ── Markdown Tables ──
  static _processTables(html) {
    const tableRegex = /^(\|.+\|)\n(\|[\s\-:|]+\|)\n((?:\|.+\|\n?)+)/gm;
    return html.replace(tableRegex, (match, headerRow, separator, bodyRows) => {
      const tableId = `tbl_${Math.random().toString(36).substr(2, 6)}`;
      const headers = headerRow.split('|').filter(c => c.trim()).map(c => `<th class="agv-th">${c.trim()}</th>`).join('');
      const rows = bodyRows.trim().split('\n').map(row => {
        const cells = row.split('|').filter(c => c.trim()).map(c => `<td class="agv-td">${c.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');

      return `<div class="agv-table-wrap">
        <div class="agv-table-header">
          <span class="agv-code-lang">TABLE</span>
          <button class="agv-code-btn" onclick="ChatMarkdownRenderer.exportTableToCsv('${tableId}')"><i class="fa-solid fa-download"></i> CSV</button>
        </div>
        <table id="${tableId}" class="agv-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>
      </div>`;
    });
  }

  // ── CSV Export ──
  static exportTableToCsv(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    let csv = [];
    const rows = table.querySelectorAll('tr');
    for (let i = 0; i < rows.length; i++) {
      let row = [], cols = rows[i].querySelectorAll('td, th');
      for (let j = 0; j < cols.length; j++) {
        let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ');
        data = data.replace(/"/g, '""');
        row.push('"' + data + '"');
      }
      csv.push(row.join(','));
    }
    const csvFile = new Blob([csv.join('\n')], { type: 'text/csv' });
    const downloadLink = document.createElement('a');
    downloadLink.download = 'table_export_' + Date.now() + '.csv';
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    if (typeof ModalDialog !== 'undefined') ModalDialog.showNotification('Table exported to CSV', 'success');
  }

  // ── Incremental Streaming Render ──
  // Renders only the delta (new text appended) without re-processing the full content
  static renderDelta(existingHtml, deltaText) {
    // For now, use full re-render. Can be optimized to append-only for streaming perf.
    return this.render(existingHtml.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '') + deltaText);
  }

  // ── Multi-Format Generated File Artifact Preview Generator ──
  static _renderFileArtifactPreview(fileName, fileUrl, ext) {
    const cleanName = this._escapeHtml(fileName || 'generated_file');
    const safeUrl = this._escapeHtml(fileUrl);
    const lowerExt = (ext || '').toLowerCase();

    // 1. Audio Preview (.mp3, .wav, .ogg, .m4a)
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(lowerExt)) {
      return `<div class="agv-artifact-card agv-audio-card" style="margin: 6px 0; padding: 8px 12px; background: rgba(56, 189, 248, 0.08); border: 1px solid var(--accent-cyan); border-radius: 6px; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; font-weight: 700; color: var(--accent-cyan);">
          <span><i class="fa-solid fa-music" style="margin-right: 6px;"></i> ${cleanName}</span>
          <a href="${safeUrl}" download="${cleanName}" class="btn btn-link btn-xs" style="color: var(--accent-cyan); font-size: 0.72rem;" title="Download Audio"><i class="fa-solid fa-download"></i> Download</a>
        </div>
        <audio controls src="${safeUrl}" style="width: 100%; height: 32px; border-radius: 4px;"></audio>
      </div>`;
    }

    // 2. Video Preview (.mp4, .webm, .mov)
    if (['mp4', 'webm', 'mov'].includes(lowerExt)) {
      return `<div class="agv-artifact-card agv-video-card" style="margin: 6px 0; padding: 8px 12px; background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.4); border-radius: 6px; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; font-weight: 700; color: #a855f7;">
          <span><i class="fa-solid fa-film" style="margin-right: 6px;"></i> ${cleanName}</span>
          <a href="${safeUrl}" download="${cleanName}" class="btn btn-link btn-xs" style="color: #a855f7; font-size: 0.72rem;" title="Download Video"><i class="fa-solid fa-download"></i> Download</a>
        </div>
        <video controls src="${safeUrl}" style="max-height: 240px; width: 100%; border-radius: 4px; background: #000;"></video>
      </div>`;
    }

    // 3. PDF Preview (.pdf)
    if (lowerExt === 'pdf') {
      return `<div class="agv-artifact-card agv-pdf-card" style="margin: 6px 0; padding: 8px 12px; background: rgba(244, 63, 94, 0.08); border: 1px solid var(--accent-rose); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 32px; height: 32px; border-radius: 6px; background: rgba(244, 63, 94, 0.2); color: var(--accent-rose); display: flex; align-items: center; justify-content: center; font-size: 1rem;">
            <i class="fa-solid fa-file-pdf"></i>
          </div>
          <div>
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-main);">${cleanName}</div>
            <div style="font-size: 0.65rem; color: var(--text-dim);">PDF Document Preview</div>
          </div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-secondary btn-xs" style="padding: 3px 8px; font-size: 0.7rem;" onclick="window.open('${safeUrl}', '_blank')"><i class="fa-solid fa-eye"></i> Preview</button>
          <a href="${safeUrl}" download="${cleanName}" class="btn btn-secondary btn-xs" style="padding: 3px 8px; font-size: 0.7rem;"><i class="fa-solid fa-download"></i></a>
        </div>
      </div>`;
    }

    // 4. Excel / CSV Preview (.xls, .xlsx, .csv)
    if (['xls', 'xlsx', 'csv'].includes(lowerExt)) {
      return `<div class="agv-artifact-card agv-xls-card" style="margin: 6px 0; padding: 8px 12px; background: rgba(16, 185, 129, 0.08); border: 1px solid var(--accent-emerald); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 32px; height: 32px; border-radius: 6px; background: rgba(16, 185, 129, 0.2); color: var(--accent-emerald); display: flex; align-items: center; justify-content: center; font-size: 1rem;">
            <i class="fa-solid fa-file-excel"></i>
          </div>
          <div>
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-main);">${cleanName}</div>
            <div style="font-size: 0.65rem; color: var(--text-dim);">Spreadsheet Document</div>
          </div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-secondary btn-xs" style="padding: 3px 8px; font-size: 0.7rem;" onclick="if(window.IDEWorkspaceView) IDEWorkspaceView.openFileInEditor('${safeUrl}'); else window.open('${safeUrl}', '_blank')"><i class="fa-solid fa-table"></i> Open</button>
          <a href="${safeUrl}" download="${cleanName}" class="btn btn-secondary btn-xs" style="padding: 3px 8px; font-size: 0.7rem;"><i class="fa-solid fa-download"></i></a>
        </div>
      </div>`;
    }

    // 5. Word Document (.doc, .docx)
    if (['doc', 'docx'].includes(lowerExt)) {
      return `<div class="agv-artifact-card agv-doc-card" style="margin: 6px 0; padding: 8px 12px; background: rgba(59, 130, 246, 0.08); border: 1px solid var(--primary-light); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 32px; height: 32px; border-radius: 6px; background: rgba(59, 130, 246, 0.2); color: var(--primary-light); display: flex; align-items: center; justify-content: center; font-size: 1rem;">
            <i class="fa-solid fa-file-word"></i>
          </div>
          <div>
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-main);">${cleanName}</div>
            <div style="font-size: 0.65rem; color: var(--text-dim);">Word Document</div>
          </div>
        </div>
        <div style="display: flex; gap: 6px;">
          <a href="${safeUrl}" download="${cleanName}" class="btn btn-secondary btn-xs" style="padding: 3px 8px; font-size: 0.7rem;"><i class="fa-solid fa-download"></i> Download</a>
        </div>
      </div>`;
    }

    // Default fallback link
    return `<a href="${safeUrl}" target="_blank" rel="noopener" class="agv-link agv-file-link" title="Open / Download File"><i class="fa-solid fa-file" style="margin-right:4px;"></i>${cleanName}</a>`;
  }

  // ── HTML Escape (inline for zero-dependency) ──
  static _escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

window.ChatMarkdownRenderer = ChatMarkdownRenderer;
