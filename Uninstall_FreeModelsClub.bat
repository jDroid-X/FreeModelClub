@echo off
setlocal enabledelayedexpansion
title FreeModelsClub - Complete Application Uninstaller
color 0C

cd /d "%~dp0"
set "APP_DIR=%~dp0"
set "DATA_DIR=%APP_DIR%data"
set "NODE_MODULES=%APP_DIR%node_modules"

echo =======================================================
echo  FreeModelsClub Localhost Smart Chatbot
echo  Complete Application Uninstaller ^& Cleanup
echo =======================================================
echo.
echo Target Application Directory:
echo   "%APP_DIR%"
echo.
set /p CONFIRM="Are you sure you want to uninstall and wipe application runtime? (Y/N): "
if /i not "!CONFIRM!"=="Y" (
    echo [INFO] Uninstallation aborted by user.
    pause
    exit /b 0
)

echo.
echo =======================================================
echo  [STEP 1/4] Terminating All Background Services ^& Processes
echo =======================================================

:: Stop Tray Launcher PowerShell Hosts
echo [INFO] Stopping all FreeModelsClub tray processes...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { `$_.CommandLine -like '*tray_launcher.ps1*' -or `$_.CommandLine -like '*server.js*' } | ForEach-Object { Stop-Process -Id `$_.ProcessId -Force -ErrorAction SilentlyContinue }"

:: Force Kill Port 12247 (Primary Proxy)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":12247 "') do (
    taskkill /PID %%a /T /F >nul 2>&1
)

:: Force Kill Port 11434 (Secondary Ollama Bridge)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":11434 "') do (
    taskkill /PID %%a /T /F >nul 2>&1
)

:: Force Kill Port 5678 (n8n Workflow Service)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5678 "') do (
    taskkill /PID %%a /T /F >nul 2>&1
)

echo [OK] All background server processes terminated.

echo.
echo =======================================================
echo  [STEP 2/4] Removing Application Packages ^& Binaries
echo =======================================================

if exist "%NODE_MODULES%" (
    echo [INFO] Removing node_modules...
    rmdir /S /Q "%NODE_MODULES%"
    echo [OK] node_modules removed.
) else (
    echo [INFO] No node_modules found in current workspace.
)

if exist "%APP_DIR%.node" (
    echo [INFO] Removing portable Node.js runtime...
    rmdir /S /Q "%APP_DIR%.node"
    echo [OK] Portable Node.js runtime removed.
)

if exist "%APP_DIR%logs" (
    echo [INFO] Removing runtime logs...
    rmdir /S /Q "%APP_DIR%logs"
)

if exist "%APP_DIR%dist" (
    echo [INFO] Removing build output artifacts...
    rmdir /S /Q "%APP_DIR%dist"
)

if exist "%APP_DIR%.tray_launcher.lock" del /F /Q "%APP_DIR%.tray_launcher.lock"
if exist "%APP_DIR%public\status.json" del /F /Q "%APP_DIR%public\status.json"
if exist "%APP_DIR%public\status.js" del /F /Q "%APP_DIR%public\status.js"

echo [OK] Runtime buffers and build artifacts purged.

echo.
echo =======================================================
echo  [STEP 3/4] Cleaning Shortcuts ^& Shell Integrations
echo =======================================================

if exist "%USERPROFILE%\Desktop\FreeModelsClub.lnk" (
    del /F /Q "%USERPROFILE%\Desktop\FreeModelsClub.lnk"
    echo [OK] Removed Desktop Shortcut.
)

if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\FreeModelsClub.lnk" (
    del /F /Q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\FreeModelsClub.lnk"
    echo [OK] Removed Start Menu Shortcut.
)

echo.
echo =======================================================
echo  [STEP 4/4] User Database ^& Configuration Options
echo =======================================================
set /p KEEP_DATA="Do you want to KEEP your provider API keys and database in 'data/' folder? (Y/N): "
if /i "!KEEP_DATA!"=="N" (
    if exist "%DATA_DIR%" (
        echo [INFO] Purging user data and cryptographic vault keys...
        rmdir /S /Q "%DATA_DIR%"
        echo [OK] User database and vault keys permanently deleted.
    )
) else (
    echo [OK] User data preserved in "%DATA_DIR%".
)

:: Also clean legacy installation path if it existed
if exist "%USERPROFILE%\jDroid-X\FreeModelClub" (
    if /i "!KEEP_DATA!"=="N" (
        rmdir /S /Q "%USERPROFILE%\jDroid-X\FreeModelClub" >nul 2>&1
    )
)

echo.
echo =======================================================
echo  [SUCCESS] FreeModelsClub Uninstallation Complete!
echo =======================================================
echo.
echo All runtime packages, background services, and processes 
echo have been completely wiped from your local system.
echo.
echo Press any key to close...
pause >nul
exit /b 0
