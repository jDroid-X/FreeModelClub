@echo off
setlocal enabledelayedexpansion
title FreeModelsClub - Shutdown
color 0C

set "PORT=12247"

echo =======================================================
echo  FreeModelsClub Localhost Smart Chatbot
echo  Graceful Shutdown
echo =======================================================
echo.

echo [INFO] Searching for FreeModelsClub server on port %PORT%...

:: Find the PID listening on PORT
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% "') do (
    set "PID=%%a"
)

if "%PID%"=="" (
    echo [OK] Server is not running. No processes found on port %PORT%.
    pause
    exit /b 0
)

echo [INFO] Found server process (PID: %PID%). Initiating shutdown...

:: Kill the process tree forcefully
taskkill /PID %PID% /T /F >nul 2>&1

:: Verify it stopped
timeout /t 2 >nul
netstat -ano | findstr ":%PORT% " >nul
if %errorlevel% equ 0 (
    echo [ERROR] Failed to terminate server. Please close it manually via Task Manager.
    pause
    exit /b 1
)

echo.
echo [INFO] Searching for n8n Workflow server on port 5678...
set "N8N_PID="
for /f "tokens=5" %%b in ('netstat -ano ^| findstr ":5678 "') do (
    set "N8N_PID=%%b"
)

if not "%N8N_PID%"=="" (
    echo [INFO] Found n8n server process (PID: %N8N_PID%). Initiating shutdown...
    taskkill /PID %N8N_PID% /T /F >nul 2>&1
    echo [OK] n8n server stopped successfully.
) else (
    echo [OK] n8n is not running. No processes found on port 5678.
)

echo.
echo [OK] All systems stopped safely.
echo.
pause
exit /b 0
