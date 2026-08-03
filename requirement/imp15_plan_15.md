# Implementation Plan - Smart Dashboard Launcher & Windows System Tray App (`jedroid-xy_FMC`)

Automate prerequisite checks (Node.js, `npm install` / `node_modules`), server startup, browser launch, and tray minimization for FreeModelsClub Localhost Smart Chatbot.

## User Review Required

> [!IMPORTANT]
> - The launcher will use Windows PowerShell native `System.Windows.Forms.NotifyIcon` to create a lightweight system tray icon without requiring third-party compiled native modules.
> - Tray ToolTip/Title: **jedroid-xy_FMC**
> - Tray Menu items: **Start**, **Stop**, **Open / Hide Terminal**, **Launch Dashboard**, **Quit**.

## Proposed Changes

### Dashboard & Launcher Automation

#### [MODIFY] [Launch_Dashboard.bat](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/Launch_Dashboard.bat)
- Update batch script to launch PowerShell tray launcher script (`tray_launcher.ps1`) with hidden execution parameters.

#### [NEW] [tray_launcher.ps1](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/tray_launcher.ps1)
- **Prerequisite Checks**:
  1. Check if Node.js (`node`) is installed and accessible in PATH. If missing, warn user and exit.
  2. Check if `node_modules` directory exists. If missing, run `npm install` automatically.
- **Server & Web App Launch**:
  1. Check if port 12247 is currently listening. If not, spawn `node server.js` process.
  2. Open default web browser to `http://localhost:12247/dashboard`.
- **System Tray Integration (`jedroid-xy_FMC`)**:
  1. Create a `NotifyIcon` in the Windows System Tray with label `jedroid-xy_FMC`.
  2. Context Menu Actions:
     - **Start**: Starts the backend Express server if stopped.
     - **Stop**: Gracefully stops the background server process.
     - **Show Terminal / Hide Terminal**: Toggles console window visibility.
     - **Launch Dashboard**: Opens `http://localhost:12247/dashboard` in default browser.
     - **Quit**: Stops background server process and terminates tray icon.

#### [MODIFY] [program_mapping.json](file:///c:/Users/jiten/jAnitGravity/FreeModelsClub/program_mapping.json)
- Register `tray_launcher.ps1` in master program mapping table with its integrations and relationships.

---

## Verification Plan

### Automated / Command Verification
- Test `Launch_Dashboard.bat` execution.
- Verify `node` check and `node_modules` verification.
- Verify port 12247 status checking.

### Manual Verification
- Verify system tray icon `jedroid-xy_FMC` appears in Windows notification area.
- Verify right-click menu items: Start, Stop, Show/Hide Terminal, Launch Dashboard, Quit.
