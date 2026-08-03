@echo off
set PORT=12247
set N8N_PORT=5678
set CANVAS_URL=http://localhost:5678/workflow/fmc-master-brain-centralized-workflow

echo =======================================================
echo FreeModelsClub n8n Master Automation Engine Launcher
echo =======================================================

:: 1. Check FMC Backend Server (Port 12247)
netstat -ano | findstr ":12247" >nul
if %errorlevel%==0 goto FMC_RUNNING

echo [INFO] Starting FMC Backend Server on port 12247...
cd /d "%~dp0"
start "FreeModelsClub Server (Port 12247)" /min node server.js
ping 127.0.0.1 -n 3 >nul
goto CHECK_N8N

:FMC_RUNNING
echo [OK] FMC Backend Server is already running on port 12247.

:CHECK_N8N
:: 2. Check n8n Automation Engine (Port 5678)
netstat -ano | findstr ":5678" >nul
if %errorlevel%==0 goto N8N_RUNNING

cd /d "%~dp0"
echo [INFO] Fast-syncing 11 workflows into n8n database...
call npx -y n8n import:workflow --separate --input="n8n Workflow/" >nul 2>&1
echo [INFO] Starting n8n server on port 5678...
start "FreeModelsClub n8n Server (Port 5678)" /min npx -y n8n start
ping 127.0.0.1 -n 4 >nul
goto N8N_OPEN

:N8N_RUNNING
echo [OK] n8n Automation Engine is already running on port 5678.

:N8N_OPEN
echo [INFO] Opening Master Brain Canvas in default browser...
start %CANVAS_URL%
echo [OK] Launch complete. Both background services active on ports 12247 and 5678.
