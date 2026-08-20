@echo off
setlocal enabledelayedexpansion
title FreeModelsClub - Updater
color 0E

cd /d "%~dp0"
set "DEFAULT_INSTALL_PATH=%USERPROFILE%\jDroid-X\FreeModelClub"
set "APP_DIR=%DEFAULT_INSTALL_PATH%\"
set "DATA_DIR=%APP_DIR%data"
set "BACKUP_DIR=%APP_DIR%backups"

echo =======================================================
echo  FreeModelsClub Localhost Smart Chatbot
echo  Safe Application Updater
echo =======================================================
echo.

:: 1. Check Git Dependency & Define Update Strategy
set "USE_GIT=1"
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Git is not installed or not in system PATH.
    echo [INFO] Falling back to direct GitHub ZIP download mechanism...
    set "USE_GIT=0"
)

:: 2. Create Backup Phase
echo [INFO] Creating backup of user data and configurations...
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Generate timestamp folder
set "TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "CURRENT_BACKUP=%BACKUP_DIR%\backup_%TIMESTAMP%"

if exist "%DATA_DIR%" (
    mkdir "%CURRENT_BACKUP%"
    xcopy /E /I /H /Y "%DATA_DIR%" "%CURRENT_BACKUP%\data" >nul
    echo [OK] User data backed up to: "%CURRENT_BACKUP%"
) else (
    echo [NOTICE] No existing data/ directory found to backup.
)

:: 3. Update Phase
echo.
if "%USE_GIT%"=="1" (
    echo [INFO] Pulling latest code from GitHub...
    call git pull origin main
    if errorlevel 1 (
        echo [ERROR] Failed to update application code via git.
        echo Your backup has been preserved.
        pause
        exit /b 1
    )
) else (
    echo [INFO] Downloading latest code archive from GitHub...
    powershell -Command "$url = 'https://github.com/jDroid-X/FreeModelClub/archive/refs/heads/main.zip'; $zipFile = 'main.zip'; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri $url -OutFile $zipFile; if (Test-Path $zipFile) { Expand-Archive -Path $zipFile -DestinationPath 'temp_update' -Force; Copy-Item -Path 'temp_update\FreeModelClub-main\*' -Destination .\ -Recurse -Force; Remove-Item -Path 'temp_update' -Recurse -Force; Remove-Item -Path $zipFile -Force; }"
    if errorlevel 1 (
        echo [ERROR] Failed to download and extract application code via PowerShell.
        echo Your backup has been preserved.
        pause
        exit /b 1
    )
)
echo [OK] Codebase updated.

:: 4. Dependency Sync
echo.
echo [INFO] Syncing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Dependency installation failed.
    pause
    exit /b 1
)
echo [OK] Dependencies are up to date.

:: 5. Validation Phase (DO: Validate before claiming success)
echo.
echo [INFO] Validating updated installation...
if not exist "%APP_DIR%node_modules" (
    echo [ERROR] Validation failed. 'node_modules' is missing.
    pause
    exit /b 1
)
if not exist "%APP_DIR%server.js" (
    echo [ERROR] Validation failed. Core application file 'server.js' is missing.
    pause
    exit /b 1
)
echo [OK] Installation health verified.

echo.
echo =======================================================
echo  [SUCCESS] Application successfully updated!
echo =======================================================
echo.
echo You can now run 'Launch_Server_Console.bat' to start the new version.
echo.
pause
exit /b 0
