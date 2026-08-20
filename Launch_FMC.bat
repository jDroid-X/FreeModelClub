@echo off
:: ================================================================================
:: FreeModelsClub Master 1-Click Silent Dashboard Launcher
:: Launches directly into Windows System Tray (jDroid-X-FMC) with zero foreground console
:: ================================================================================
cd /d "%~dp0"
set "PATH=C:\jDroid-X-AI-Tools\NodeJS;C:\Program Files\nodejs;%AppData%\npm;%SystemRoot%\System32\WindowsPowerShell\v1.0;%PATH%"

if not exist "%~dp0node_modules" (
    powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('FreeModelsClub is not installed or has been uninstalled.`n`nPlease run Install_FreeModelsClub.bat first.', 'FreeModelsClub - Not Installed', [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning)"
    exit /b 1
)

start "" powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0scripts\tray_launcher.ps1"
exit /b 0
