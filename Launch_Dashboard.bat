@echo off
set PORT=12247
set URL=http://localhost:12247

echo =======================================================
echo FreeModelsClub Localhost Smart Chatbot Launcher
echo =======================================================

netstat -ano | findstr ":12247" >nul
if %errorlevel%==0 goto RUNNING

echo [INFO] Starting Express Backend Server (node server.js)...
cd /d "%~dp0"
start "FreeModelsClub Server (Port 12247)" /min node server.js
ping 127.0.0.1 -n 3 >nul
goto OPEN

:RUNNING
echo [OK] Express server is already running on port 12247.

:OPEN
echo [INFO] Opening Dashboard in default browser...
start http://localhost:12247
echo [OK] Launch complete. Server running on http://localhost:12247
