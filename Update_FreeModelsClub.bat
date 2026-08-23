@echo off
setlocal enabledelayedexpansion
title FreeModelsClub - Safe Application Updater
color 0E

cd /d "%~dp0"
set "APP_DIR=%~dp0"
set "DATA_DIR=%APP_DIR%data"
set "BACKUP_DIR=%APP_DIR%backups"
set "GITHUB_REPO=https://github.com/jDroid-X/FreeModelClub"

echo =======================================================
echo  FreeModelsClub Localhost Smart Chatbot
echo  Safe Application Updater (jDroid-X-FMC)
echo  Source: %GITHUB_REPO%
echo =======================================================
echo.

CHOICE /C YN /M "Would you like to check and update FreeModelsClub to the latest GitHub release now?"
if errorlevel 2 (
    echo [INFO] Update aborted by user.
    pause
    exit /b 0
)

echo.
echo [██░░░░░░░░] 20%% [STAGE 1/5] Checking Git Runtime ^& Update Channel...
set "USE_GIT=1"
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Git is not installed or not in system PATH.
    echo [INFO] Falling back to direct GitHub archive download mechanism...
    set "USE_GIT=0"
) else (
    echo [OK] Git runtime active. Channel: main branch.
)

echo.
echo [████░░░░░░] 40%% [STAGE 2/5] Creating Automated Backup of User Vault ^& Database...
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

set "TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "CURRENT_BACKUP=%BACKUP_DIR%\backup_%TIMESTAMP%"

if exist "%DATA_DIR%" (
    mkdir "%CURRENT_BACKUP%"
    xcopy /E /I /H /Y "%DATA_DIR%" "%CURRENT_BACKUP%\data" >nul
    echo [OK] User data backed up safely to: "%CURRENT_BACKUP%"
) else (
    echo [NOTICE] No existing data/ directory found to backup.
)

echo.
echo [██████░░░░] 60%% [STAGE 3/5] Pulling Latest Release from %GITHUB_REPO%...
if "%USE_GIT%"=="1" (
    call git pull origin main
    if errorlevel 1 (
        echo [ERROR] Failed to update application code via git.
        echo Your backup has been preserved at "%CURRENT_BACKUP%".
        pause
        exit /b 1
    )
) else (
    echo [INFO] Downloading latest code archive from GitHub...
    powershell -Command "$url = '%GITHUB_REPO%/archive/refs/heads/main.zip'; $zipFile = 'main.zip'; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri $url -OutFile $zipFile; if (Test-Path $zipFile) { Expand-Archive -Path $zipFile -DestinationPath 'temp_update' -Force; Copy-Item -Path 'temp_update\FreeModelClub-main\*' -Destination .\ -Recurse -Force; Remove-Item -Path 'temp_update' -Recurse -Force; Remove-Item -Path $zipFile -Force; }"
    if errorlevel 1 (
        echo [ERROR] Failed to download and extract application code via PowerShell.
        echo Your backup has been preserved at "%CURRENT_BACKUP%".
        pause
        exit /b 1
    )
)
echo [OK] Codebase updated to latest release.

echo.
echo [████████░░] 80%% [STAGE 4/5] Synchronizing NPM Package Dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Dependency installation failed.
    pause
    exit /b 1
)
echo [OK] Dependencies are up to date.

echo.
echo [██████████] 100%% [STAGE 5/5] Verifying Installation Integrity...
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
echo [OK] Application integrity verified 100%%.

echo.
echo =======================================================
echo  [SUCCESS] Application successfully updated!
echo =======================================================
echo.
CHOICE /C YN /M "Would you like to launch FreeModelsClub (Launch_FMC.bat) now?"
if errorlevel 2 (
    echo.
    echo You can start the app anytime using 'Launch_FMC.bat'.
    pause
    exit /b 0
)
if errorlevel 1 (
    start "" "%APP_DIR%Launch_FMC.bat"
    exit /b 0
)
