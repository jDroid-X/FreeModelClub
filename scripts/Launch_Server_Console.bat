@echo off
setlocal enabledelayedexpansion
title FreeModelsClub - Launcher
color 0B

cd /d "%~dp0.."
set "APP_DIR=%~dp0..\"
set "PORT=12247"
set "URL=http://localhost:%PORT%"

echo =======================================================
echo  FreeModelsClub Localhost Smart Chatbot
echo  Application Launcher
echo =======================================================
echo.

:: 1. Verify Installation
if not exist "%APP_DIR%node_modules" (
    echo [ERROR] Application is not installed. 
    echo Please run 'Install_FreeModelsClub.bat' first.
    pause
    exit /b 1
)

:: 2. Verify Port Availability
echo [INFO] Checking if port %PORT% is available...
netstat -ano | findstr ":%PORT% " >nul
if %errorlevel% equ 0 (
    echo [WARNING] Port %PORT% is already in use. 
    echo The server might already be running.
    echo If the UI does not load, please run 'Stop_FreeModelsClub.bat' and try again.
    goto LaunchBrowser
)

:: 3. Start Backend Process
echo [INFO] Starting Node.js server...
start "FMC Backend" /B node server.js >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Failed to launch node process.
    pause
    exit /b 1
)

:: 4. Health Check (Wait for Server)
echo [INFO] Waiting for server health verification...
set /a MAX_ATTEMPTS=15
set /a ATTEMPT=0

:HealthLoop
set /a ATTEMPT+=1
if !ATTEMPT! gtr !MAX_ATTEMPTS! (
    echo [ERROR] Server failed to start within the expected time.
    echo Please check the console logs for errors.
    pause
    exit /b 1
)

:: Ping the port using PowerShell TCPClient
powershell -Command "try { $tcp = New-Object System.Net.Sockets.TcpClient('localhost', %PORT%); $tcp.Close(); exit 0 } catch { exit 1 }"
if %errorlevel% neq 0 (
    :: Wait 1 second and retry
    timeout /t 1 >nul
    goto HealthLoop
)


echo [OK] Application health verified!
echo [INFO] Loading UI in default browser...
start %URL%/dashboard

echo.
echo =======================================================
echo  [SUCCESS] Application is now running!
echo =======================================================
echo.
echo Dashboard URL : %URL%/dashboard
echo API Endpoint  : %URL%/api
echo.
echo Please leave this console window open while using the app.
echo To shut down, simply close this window.
pause >nul
