# Implementation Plan - IDE Developer Tool Mode Toggle & Split-Panel Code Editor

Upgrade the **FreeModelsClub Playground** with a **Chat ↔ IDE Mode Toggle** that transforms the center workspace into a split-panel IDE developer tool, enabling AI-powered code generation with a live file tree explorer, multi-file code editor, and direct local project file saving.

## User Review Required

> [!IMPORTANT]
> - **Chat ↔ IDE Toggle Switch**: Adds a prominent toggle pill between the left sidebar and center panel to switch between pure Chat Mode and IDE Developer Mode.
> - **IDE Mode Split Layout**: Right panel becomes a resizable code editor + file tree explorer (replaces the hidden hyperparameters drawer in IDE mode).
> - **Project Workspace Integration**: Uses the existing Project Workspace path to browse, create, and manage local project files.
> - **Multi-File Code Generation**: AI responses with multiple code blocks are automatically parsed and staged as individual files in the IDE file tree.
> - **Direct Save to Local Folders**: One-click "Save All" or per-file save buttons to write generated code to the local project workspace.
> - **Code Preview & Diff View**: Shows generated code in a syntax-highlighted editor with optional diff against existing files.
> - **Drag-Resized Split**: Users can drag the divider between chat and code panels to resize.

---

## Proposed Changes

### Frontend Playground Upgrade

#### [MODIFY] [PlaygroundView.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/PlaygroundView.js)
- **State Management**:
  - Add `static ideMode = false;` class property to track toggle state.
  - Add `static stagedFiles = [];` array to hold AI-generated files waiting to be saved.
  - Add `static activeFilePath = null;` for the currently displayed file in code editor.
  - Add `static splitRatio = 50;` for the chat/code split percentage.
  - Persist `ideMode` and `splitRatio` in `localStorage` for session persistence.
- **Layout Architecture**:
  - Wrap the center `#playground-chat-main-window` and the new `#ide-mode-right-panel` inside a flex container with a draggable divider.
  - Add the **Chat ↔ IDE toggle pill** at the top of the center section (between model select and header telemetry).
  - When `ideMode = false` → Only chat panel visible (current behavior).
  - When `ideMode = true` → Chat panel shrinks to `splitRatio%`, right code panel appears at `(100 - splitRatio)%`.
- **Toggle Switch HTML** (insert between left sidebar and center):
  ```html
  <div id="mode-toggle-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 32px; flex-shrink: 0; gap: 4px;">
    <button id="mode-chat-btn" class="btn btn-xs" style="..." onclick="PlaygroundView.switchMode('chat')">
      <i class="fa-solid fa-comments"></i>
    </button>
    <div style="writing-mode: vertical-rl; font-size: 0.6rem; color: var(--text-muted); transform: rotate(180deg);">MODE</div>
    <button id="mode-ide-btn" class="btn btn-xs" style="..." onclick="PlaygroundView.switchMode('ide')">
      <i class="fa-solid fa-code"></i>
    </button>
  </div>
  ```
- **IDE Mode Right Panel** (new HTML block, `display: none` by default):
  ```html
  <div id="ide-mode-right-panel" class="glass-panel" style="display: none; flex: 1; flex-direction: column; border-left: 1px solid var(--border-color);">
    <!-- Top Toolbar: File Tree Toggle | Staged Files Count | Save All | Settings -->
    <!-- File Tree Sidebar (25% width, collapsible) -->
    <!-- Code Editor Area (75% width) with syntax highlighting -->
  </div>
  ```
- **New Methods**:
  - `static switchMode(mode)` — Toggles between 'chat' and 'ide', re-renders layout.
  - `static toggleIDEPanel()` — Shows/hides the right IDE panel without leaving IDE mode.
  - `static parseCodeBlocksToFiles(fullResponse)` — Extracts ```lang\n...``` blocks, names them (file1.js, file2.py, etc.), and pushes to `stagedFiles[]`.
  - `static renderIDEFileTree()` — Renders the file tree from `stagedFiles[]` and the local project workspace.
  - `static renderCodeEditor(filePath, content)` — Shows file content in the code editor pane with syntax highlighting.
  - `static saveFileToProject(filePath, content)` — Calls `ApiService.saveCodeFile()` to write to local disk.
  - `static saveAllStagedFiles()` — Iterates `stagedFiles[]` and saves each to the workspace.
  - `static browseProjectFiles()` — Calls `ApiService.browseLocalPath()` and renders the tree.
  - `static createProjectFilePrompt()` — Prompts for filename and saves current editor content.
  - `static onResizeSplit(event)` — Handles drag-resize of the split divider.
  - `static refreshFileTree()` — Re-fetches the project workspace directory listing.

- **Integration with Existing Streaming Completion**:
  - At the end of `executeStreamingCompletion()`, when `ideMode = true`, automatically call `parseCodeBlocksToFiles(fullText)` to extract and stage all code blocks.
  - Show a toast notification: `Found N code block(s) → staged in IDE file tree`.
  - The staged files appear in the IDE panel's "Staged Files" tab, ready to save.

#### [MODIFY] [PlaygroundViewHelper.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/views/PlaygroundViewHelper.js)
- **Enhanced Code Block Parser**:
  - Modify `formatChatMessageContent()` code block regex to capture filename hints from comments (e.g., `// filename: app.js` or `// path: src/utils/helper.py`).
  - Add a `data-filename` attribute to each code block container for IDE mode extraction.
  - Add **"Open in IDE"** button next to each code block's existing Copy/Live Artifact buttons:
    ```html
    <button class="btn btn-cyan btn-xs" onclick="PlaygroundView.openCodeInIDE('${encodeURIComponent(cleanCode)}', '${lang}')" title="Open in IDE Editor">
      <i class="fa-solid fa-code"></i> Open in IDE
    </button>
    ```
- **New Helper Methods**:
  - `static extractFileMetadata(codeBlock)` — Parses language, filename hints, and content.
  - `static generateDefaultFilename(lang, index)` — Creates smart filenames (`script_1.js`, `module_2.py`, etc.).
  - `static renderIDEFileTreeItem(file)` — HTML for a single file tree node.
  - `static highlightSyntax(code, language)` — Lightweight regex-based syntax highlighting (or integrate highlight.js CDN).

### Backend Support

#### [MODIFY] [SelfHealingController.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/controllers/SelfHealingController.js)
- **Enhance `browseLocalPath`** response to include:
  - `fileSize` for each item (bytes, formatted).
  - `lastModified` timestamp for each item.
  - `extension` field for file type detection.
- **Add `saveMultipleFiles` method**:
  - Route: `POST /api/playground/save-multiple-files`
  - Accepts `{ basePath, files: [{ relativePath, content }] }`.
  - Creates directories recursively and writes all files.
  - Returns `{ success, savedCount, results: [{ path, bytesWritten, error }] }`.

#### [MODIFY] [server.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/server.js)
- Add route: `app.post('/api/playground/save-multiple-files', SelfHealingController.saveMultipleFiles)`
- Add route: `app.post('/api/playground/read-file', SelfHealingController.readFileContent)`
  - Reads a local file and returns its content (for loading existing files into the editor).
- Add route: `app.post('/api/playground/delete-file', SelfHealingController.deleteFile)`
  - Deletes a local file (with confirmation).

#### [MODIFY] [AntigravityToolExecutionEngine.js](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/src/services/AntigravityToolExecutionEngine.js)
- **Add `saveMultipleFiles(basePath, files)`**:
  - Iterates files array, creates parent directories via `fs.mkdirSync(..., { recursive: true })`, writes each file.
  - Returns per-file success/error results.
- **Add `readFileContent(filePath)`**:
  - Reads file content via `fs.readFileSync()`.
  - Returns `{ success, content, extension, size, lastModified }`.
- **Add `deleteFile(filePath)`**:
  - Deletes file via `fs.unlinkSync()`.
  - Returns `{ success, message }`.

#### [MODIFY] [ApiService (api.js)](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/public/js/services/api.js)
- Add `static saveMultipleFiles(basePath, files)` → `POST /api/playground/save-multiple-files`
- Add `static readFileContent(filePath)` → `POST /api/playground/read-file`
- Add `static deleteFile(filePath)` → `POST /api/playground/delete-file`

---

## IDE Mode UI Wireframe

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [Left Sidebar 20%]  │ [Mode Toggle] │ [Center Chat]  │ [Right IDE Panel]│
│                       │   💬 ↔ 🛠️    │                │                  │
│  Conversations        │               │  Model: [v]    │ 📁 File Tree    │
│  Project Workspace    │               │  Messages...   │  ├─ src/         │
│  Session List         │               │                │  │  ├─ app.js    │
│                       │               │                │  │  └─ utils.js  │
│                       │               │                │  └─ index.html   │
│                       │               │                │                  │
│                       │               │                │ ─── Editor ──── │
│                       │               │                │ // app.js       │
│                       │               │                │ function main() │
│                       │               │                │ { ... }         │
│                       │               │                │                  │
│                       │               │                │ [💾 Save] [📋]  │
│                       │               │                │                  │
│                       │               │  ┌──────────┐  │ [💾 Save All]   │
│                       │               │  │ Input    │  │ [📁 Browse]     │
│                       │               │  │ [Send]   │  │ [+ New File]    │
│                       │               │  └──────────┘  │                  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## IDE Mode Feature Breakdown

### 1. Chat ↔ IDE Toggle Switch
| Property | Detail |
|---|---|
| **Location** | Vertical pill between left sidebar and center panel |
| **Icons** | 💬 `fa-comments` (Chat) ↔ 🛠️ `fa-code` (IDE) |
| **Active Color** | Chat = `var(--accent-cyan)`, IDE = `var(--accent-emerald)` |
| **Behavior** | Toggles visibility of `#ide-mode-right-panel`, resizes chat panel |
| **Persistence** | Saved to `localStorage('fmc_ide_mode_enabled')` |

### 2. IDE Right Panel Components
| Component | Description |
|---|---|
| **File Tree** | Collapsible tree showing staged files + browsable project workspace files |
| **Code Editor** | Monospace text area with line numbers, basic syntax highlighting |
| **Staged Files Tab** | AI-generated files waiting to be saved (shown with amber indicator) |
| **Project Files Tab** | Files from the local workspace directory (loaded on demand) |
| **Toolbar** | Save All, Browse Folder, New File, Refresh, Toggle File Tree |

### 3. Auto-Code Extraction Pipeline
| Step | Action |
|---|---|
| 1 | AI response completes streaming |
| 2 | `parseCodeBlocksToFiles(fullText)` extracts all ``` blocks |
| 3 | Each block → `{ filename, language, content, lineRange }` |
| 4 | Staged in `PlaygroundView.stagedFiles[]` |
| 5 | Toast: `"Found 3 code block(s) → staged in IDE file tree"` |
| 6 | User clicks files in tree to preview in editor |
| 7 | User clicks "Save" or "Save All" → writes to local disk |

### 4. File Operations
| Operation | Trigger | Backend API |
|---|---|---|
| **Save Single File** | Click save icon on file tree item | `POST /api/playground/save-code` |
| **Save All Staged** | Click "Save All" button | `POST /api/playground/save-multiple-files` |
| **Browse Project** | Click "Browse" or workspace path | `POST /api/playground/browse-local` |
| **Read File** | Click project file in tree | `POST /api/playground/read-file` |
| **Delete File** | Right-click or delete icon | `POST /api/playground/delete-file` |
| **New File** | Click "+" button | Creates empty staged file |
| **Rename File** | Double-click filename in tree | Inline rename + save |
| **Open in System** | Double-click project file | `POST /api/playground/run-powershell` → `Start-Process` |

---

## Implementation Order

| Phase | Task | Est. Lines Changed |
|---|---|---|
| **1** | Add `ideMode` state + toggle switch HTML in `PlaygroundView.render()` | ~40 |
| **2** | Create `#ide-mode-right-panel` HTML block with file tree + editor | ~80 |
| **3** | Add `switchMode()`, `toggleIDEPanel()`, layout resize logic | ~50 |
| **4** | Add `parseCodeBlocksToFiles()` + integrate with streaming completion | ~60 |
| **5** | Add `renderIDEFileTree()`, `renderCodeEditor()` DOM rendering | ~80 |
| **6** | Add file operations: save, browse, read, delete, new | ~70 |
| **7** | Add drag-resize splitter between chat and IDE panels | ~40 |
| **8** | Enhance `PlaygroundViewHelper.js` with "Open in IDE" button | ~30 |
| **9** | Backend: `saveMultipleFiles`, `readFileContent`, `deleteFile` | ~80 |
| **10** | Backend: Enhance `browseLocalPath` with file metadata | ~30 |
| **11** | Add `ApiService` methods for new endpoints | ~30 |
| **12** | Syntax highlighting (highlight.js CDN or lightweight regex) | ~50 |
| **13** | LocalStorage persistence + session sync | ~20 |
| **14** | Testing & bug fixes | - |

---

## Files Modified Summary

| File | Action | Purpose |
|---|---|---|
| `public/js/views/PlaygroundView.js` | MODIFY | Core toggle, split layout, IDE mode logic |
| `public/js/views/PlaygroundViewHelper.js` | MODIFY | Code block extraction, IDE open button |
| `public/js/services/api.js` | MODIFY | New API methods (save-multiple, read-file, delete) |
| `src/controllers/SelfHealingController.js` | MODIFY | New controller methods |
| `src/services/AntigravityToolExecutionEngine.js` | MODIFY | New file operation services |
| `server.js` | MODIFY | New route definitions |
| `public/index.html` | MODIFY | Add highlight.js CDN (optional) |
| `requirement/playground.txt` | MODIFY | Log this change |
| `requirement/imp33_plan_33.md` | CREATE | This plan document |
