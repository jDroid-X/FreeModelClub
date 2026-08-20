@echo off
:: ================================================================================
:: FreeModelsClub n8n Workflows Launcher
:: Launches local n8n automation engine on http://localhost:5678.
:: ================================================================================
title FreeModelsClub n8n Workflows Launcher
cd /d "%~dp0.."

:: Ensure portable Node.js and System PATHs are present
set "PATH=C:\jDroid-X-AI-Tools\NodeJS;C:\Program Files\nodejs;%AppData%\npm;%PATH%"

echo ================================================================================
echo FreeModelsClub n8n Workflow Automation Launcher
echo Target Directory: "%~dp0..\n8n Workflow"
echo ================================================================================

where n8n >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Global n8n command detected. Opening http://localhost:5678 ...
    start http://localhost:5678
    n8n start
) else (
    echo [INFO] Running n8n via npx (npx n8n start)...
    start http://localhost:5678
    call npx -y n8n start
)
pause
