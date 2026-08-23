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
echo  [██░░░░░░░░] 25%% [STEP 1/4] Terminating All Background Services (jDroid-X-FMC)
echo =======================================================

echo [INFO] Stopping all FreeModelsClub background processes...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -and ($_.CommandLine -like '*tray_launcher.ps1*' -or $_.CommandLine -like '*server.js*' -or $_.CommandLine -like '*FreeModelsClub*') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; try { Get-NetTCPConnection -LocalPort 12247 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } } catch {}" >nul 2>&1
timeout /t 2 /nobreak >nul

echo [OK] All background server processes terminated.

echo.
echo =======================================================
echo  [████░░░░░░] 50%% [STEP 2/4] Removing Application Packages ^& Binaries
echo =======================================================

if exist "%NODE_MODULES%" (
    echo [INFO] Removing node_modules...
    rmdir /S /Q "%NODE_MODULES%" >nul 2>&1
    echo [OK] node_modules removed.
) else (
    echo [INFO] No node_modules found in current workspace.
)

if exist "%APP_DIR%.node" (
    echo [INFO] Removing portable Node.js runtime...
    rmdir /S /Q "%APP_DIR%.node" >nul 2>&1
    echo [OK] Portable Node.js runtime removed.
)

if exist "%APP_DIR%logs" (
    echo [INFO] Removing runtime logs...
    rmdir /S /Q "%APP_DIR%logs" >nul 2>&1
)

if exist "%APP_DIR%dist" (
    echo [INFO] Removing build output artifacts...
    rmdir /S /Q "%APP_DIR%dist" >nul 2>&1
)

if exist "%APP_DIR%.tray_launcher.lock" del /F /Q "%APP_DIR%.tray_launcher.lock" >nul 2>&1
if exist "%APP_DIR%public\status.json" del /F /Q "%APP_DIR%public\status.json" >nul 2>&1
if exist "%APP_DIR%public\status.js" del /F /Q "%APP_DIR%public\status.js" >nul 2>&1

echo [OK] Runtime buffers and build artifacts purged.

echo.
echo =======================================================
echo  [██████░░░░] 75%% [STEP 3/4] Cleaning Shortcuts ^& Shell Integrations
echo =======================================================

if exist "%USERPROFILE%\Desktop\FreeModelsClub.lnk" (
    del /F /Q "%USERPROFILE%\Desktop\FreeModelsClub.lnk" >nul 2>&1
    echo [OK] Removed Desktop Shortcut.
)

if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\FreeModelsClub.lnk" (
    del /F /Q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\FreeModelsClub.lnk" >nul 2>&1
    echo [OK] Removed Start Menu Shortcut.
)

if exist "%ProgramData%\Microsoft\Windows\Start Menu\Programs\FreeModelsClub.lnk" (
    del /F /Q "%ProgramData%\Microsoft\Windows\Start Menu\Programs\FreeModelsClub.lnk" >nul 2>&1
    echo [OK] Removed Global Start Menu Shortcut.
)

echo.
echo =======================================================
echo  [██████████] 100%% [STEP 4/4] User Database ^& Configuration Options
echo =======================================================
set /p KEEP_DATA="Do you want to KEEP your provider API keys and database in 'data/' folder? (Y/N): "
if /i "!KEEP_DATA!"=="N" (
    if exist "%DATA_DIR%" (
        echo [INFO] Purging user data and cryptographic vault keys...
        rmdir /S /Q "%DATA_DIR%" >nul 2>&1
        echo [OK] User database and vault keys permanently deleted.
    )
) else (
    echo [OK] User data preserved in "%DATA_DIR%".
)

:: Clean legacy installation path if it exists
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
