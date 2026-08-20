@echo off
setlocal enabledelayedexpansion
title FreeModelsClub - Installer
color 0A

:: 1. Verify Windows OS
if not "%OS%"=="Windows_NT" (
    echo [ERROR] This installer requires a Windows NT based operating system.
    pause
    exit /b 1
)

:: 2. Lock to application directory
cd /d "%~dp0"
set "APP_DIR=%~dp0"
set "LOG_DIR=%APP_DIR%logs"

echo =======================================================
echo  FreeModelsClub Localhost Smart Chatbot
echo  Enterprise Setup ^& Provisioning
echo =======================================================
echo.
echo Installing to: "%APP_DIR%"
echo.

:: 2.5 Check for Existing Installation (DO #2)
if exist "%APP_DIR%node_modules" (
    echo [WARNING] An existing installation was detected in "%APP_DIR%node_modules".
    echo If you want to update the application, please run 'Update_FreeModelsClub.bat' instead.
    echo If you want to reinstall, please run 'Uninstall_FreeModelsClub.bat' first.
    pause
    exit /b 1
)

:: 3. Create required directories
if not exist "%LOG_DIR%" (
    echo [INFO] Creating logs directory...
    mkdir "%LOG_DIR%"
)

set "LOG_FILE=%LOG_DIR%\install.log"
echo [%date% %time%] Starting installation... > "%LOG_FILE%"

:: 4. Check dependencies (Node.js)
echo [INFO] Checking Node.js runtime...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Node.js is not installed or not found in system PATH.
    echo Node.js v18+ is required to install dependencies and run the server.
    CHOICE /C IBA /M "Would you like to [I]nstall Node.js automatically, [B]ypass this check, or [A]bort?"
    set "CHOICE_NODE=!errorlevel!"
    if !CHOICE_NODE! equ 3 (
        echo [INFO] Aborting installation.
        pause
        exit /b 1
    )
    if !CHOICE_NODE! equ 2 (
        echo [INFO] Bypassing Node.js requirement.
        echo [%date% %time%] WARNING: Node.js bypassed. >> "%LOG_FILE%"
    )
    if !CHOICE_NODE! equ 1 (
        echo [INFO] Downloading and installing Node.js silently. This may take a moment...
        powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.17.0/node-v20.17.0-x64.msi' -OutFile 'node_installer.msi'; Start-Process -FilePath 'msiexec.exe' -ArgumentList '/i node_installer.msi /qn /norestart' -Wait; Remove-Item 'node_installer.msi' -Force;"
        echo [OK] Node.js installed successfully.
        echo [%date% %time%] Node.js installed automatically. >> "%LOG_FILE%"
        :: Refresh PATH for current session
        set "PATH=%PATH%;C:\Program Files\nodejs\"
    )
) else (
    for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
    echo [OK] Node.js !NODE_VER! detected.
    echo [%date% %time%] Node.js !NODE_VER! verified. >> "%LOG_FILE%"
)

:: 4.5 Check dependencies (Git)
echo [INFO] Checking Git runtime...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Git is not installed or not found in system PATH.
    echo Git is typically required for the Updater mechanism.
    CHOICE /C IBA /M "Would you like to [I]nstall Git automatically, [B]ypass this check, or [A]bort?"
    set "CHOICE_GIT=!errorlevel!"
    if !CHOICE_GIT! equ 3 (
        echo [INFO] Aborting installation.
        pause
        exit /b 1
    )
    if !CHOICE_GIT! equ 2 (
        echo [INFO] Bypassing Git requirement. The Updater will use ZIP fallback mode.
        echo [%date% %time%] WARNING: Git bypassed. >> "%LOG_FILE%"
    )
    if !CHOICE_GIT! equ 1 (
        echo [INFO] Downloading and installing Git silently. This may take a moment...
        powershell -Command "Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.46.0.windows.1/Git-2.46.0-64-bit.exe' -OutFile 'git_installer.exe'; Start-Process -FilePath 'git_installer.exe' -ArgumentList '/VERYSILENT /NORESTART /NOCANCEL /SP- /SUPPRESSMSGBOXES' -Wait; Remove-Item 'git_installer.exe' -Force;"
        echo [OK] Git installed successfully.
        echo [%date% %time%] Git installed automatically. >> "%LOG_FILE%"
        :: Refresh PATH for current session
        set "PATH=%PATH%;C:\Program Files\Git\cmd\"
    )
) else (
    for /f "tokens=*" %%g in ('git --version') do set GIT_VER=%%g
    echo [OK] !GIT_VER! detected.
    echo [%date% %time%] !GIT_VER! verified. >> "%LOG_FILE%"
)

:: 5. Execute deterministic install
echo [INFO] Resolving and installing dependencies via NPM...
echo This may take a few minutes. Please wait...
echo [%date% %time%] Running npm install... >> "%LOG_FILE%"

call npm install >> "%LOG_FILE%" 2>&1
set NPM_EXIT=%errorlevel%

:: 6. Validate execution
if %NPM_EXIT% neq 0 (
    echo [ERROR] Installation failed! Please check %LOG_FILE% for details.
    echo [%date% %time%] ERROR: npm install failed with exit code %NPM_EXIT%. >> "%LOG_FILE%"
    color 0C
    pause
    exit /b %NPM_EXIT%
)

:: 7. Validate installed application
if not exist "%APP_DIR%node_modules" (
    echo [ERROR] Installation failed! 'node_modules' directory is missing.
    echo [%date% %time%] ERROR: node_modules missing after install. >> "%LOG_FILE%"
    color 0C
    pause
    exit /b 1
)

echo [%date% %time%] Installation successful. >> "%LOG_FILE%"
echo.
echo =======================================================
echo  [SUCCESS] Installation completed successfully!
echo =======================================================
echo.
echo Application Directory : "%APP_DIR%"
echo Installation Log    : "%LOG_FILE%"
echo.
echo.
CHOICE /C YN /M "Would you like to launch the FreeModelsClub Dashboard now?"
if errorlevel 2 (
    echo.
    echo Press any key to close this terminal...
    pause >nul
    exit /b 0
)
if errorlevel 1 (
    start "" "%~dp0Launch_FMC.bat"
    exit /b 0
)
