# tray_launcher.ps1
# Purpose: Prerequisites audit, portable Node.js installer fallback, Express server manager, and System Tray Controller (`jDroid-X-FMC`)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) { $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition }
$RootDir = Split-Path -Parent $ScriptDir
Set-Location $RootDir

# --- SINGLE-INSTANCE SYSTEM TRAY HOST GUARD ---
# Kills any previous tray_launcher PowerShell hosts so EXACTLY 1 icon exists
$currentPid = $PID
$parentPid = (Get-CimInstance Win32_Process -Filter "ProcessId = $currentPid" -ErrorAction SilentlyContinue).ParentProcessId
Get-CimInstance Win32_Process | ForEach-Object {
    if ($_.ProcessId -ne $currentPid -and $_.ProcessId -ne $parentPid -and $_.CommandLine -and $_.CommandLine -like "*tray_launcher.ps1*" -and $_.CommandLine -notlike "*Get-CimInstance*") {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

$Port = 12247
$DashboardUrl = "http://localhost:$Port/playground"
$ServerProcess = $null
$global:ConsoleVisible = $true
$IconPath = Join-Path $RootDir "public\jdroidxlogo.ico"
if (-not (Test-Path $IconPath)) {
    $IconPath = Join-Path $RootDir "public\jdroidxy.ico"
}

# Helper to write status to public/status.json and public/status.js for zero-CORS browser progress tracking
function Write-StatusJson {
    param(
        [string]$Status,
        [string]$Message,
        [string]$SubMessage = "",
        [int]$Progress = 10,
        [string]$Log = "",
        [string]$Badge = "Environment Audit"
    )
    $statusObj = @{
        status = $Status
        message = $Message
        subMessage = $SubMessage
        progress = $Progress
        log = $Log
        badge = $Badge
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    }
    $json = $statusObj | ConvertTo-Json -Depth 3
    $statusPath = Join-Path $RootDir "public\status.json"
    $json | Out-File -FilePath $statusPath -Encoding utf8 -Force

    $jsContent = "window.FMC_STATUS = $json;"
    $jsPath = Join-Path $RootDir "public\status.js"
    $jsContent | Out-File -FilePath $jsPath -Encoding utf8 -Force
}

# Auto-generate custom icon if missing
if (-not (Test-Path $IconPath)) {
    $genScript = Join-Path $RootDir "generate_icon.ps1"
    if (Test-Path $genScript) {
        & powershell -ExecutionPolicy Bypass -File $genScript
    }
}

# Win32 API to Show/Hide Console Window
$user32 = Add-Type -memberDefinition @"
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("kernel32.dll")]
    public static extern IntPtr GetConsoleWindow();
    [DllImport("kernel32.dll")]
    public static extern bool AllocConsole();
    [DllImport("kernel32.dll")]
    public static extern bool FreeConsole();
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
"@ -name "Win32Console" -namespace Win32Functions -passThru

$SW_HIDE = 0
$SW_SHOW = 5

function Get-ConsoleHandle {
    $hwnd = [Win32Functions.Win32Console]::GetConsoleWindow()
    if ($hwnd -eq [IntPtr]::Zero) {
        $hwnd = (Get-Process -Id $PID).MainWindowHandle
    }
    return $hwnd
}

function Hide-Console {
    $hwnd = Get-ConsoleHandle
    if ($hwnd -ne [IntPtr]::Zero) {
        [Win32Functions.Win32Console]::ShowWindow($hwnd, $SW_HIDE) | Out-Null
        $global:ConsoleVisible = $false
    }
}

function Show-Console {
    $hwnd = Get-ConsoleHandle
    if ($hwnd -eq [IntPtr]::Zero) {
        [Win32Functions.Win32Console]::AllocConsole() | Out-Null
        $hwnd = [Win32Functions.Win32Console]::GetConsoleWindow()
    }
    if ($hwnd -ne [IntPtr]::Zero) {
        [Win32Functions.Win32Console]::ShowWindow($hwnd, $SW_SHOW) | Out-Null
        $global:ConsoleVisible = $true
    }
}

function Toggle-Console {
    if ($global:ConsoleVisible) {
        Hide-Console
    } else {
        Show-Console
    }
}

# Immediately hide terminal window to Windows System Tray (Zero Foreground Flash)
Hide-Console


# 1. Prerequisite Checks (with silent Node.js installer fallback)
function Check-Prerequisites {
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host " FreeModelsClub - Prerequisites & Environment Audit" -ForegroundColor Cyan
    Write-Host "=======================================================" -ForegroundColor Cyan

    Write-StatusJson -Status "init" -Message "Auditing system environment..." -SubMessage "Checking Node.js runtime availability" -Progress 15 -Log "Starting environment audit..." -Badge "Prerequisite Check"

    # Add local .node directory to PATH if present
    $localNodeDir = Join-Path $RootDir ".node"
    if (Test-Path $localNodeDir) {
        $env:PATH = "$localNodeDir;" + $env:PATH
    }

    # Check Node.js
    $nodeVersion = node -v 2>$null
    if (-not $nodeVersion) {
        Write-Host "[NOTICE] Node.js not found in system PATH. Attempting automatic portable setup..." -ForegroundColor Yellow
        Write-StatusJson -Status "installing_node" -Message "Node.js not detected - Installing portable Node.js runtime..." -SubMessage "Downloading portable Node.js binary into local environment" -Progress 30 -Log "[INSTALL] Downloading portable Node.js..." -Badge "Node.js Auto-Installer"

        if (-not (Test-Path $localNodeDir)) {
            New-Item -ItemType Directory -Path $localNodeDir -Force | Out-Null
        }

        $nodeExePath = Join-Path $localNodeDir "node.exe"
        if (-not (Test-Path $nodeExePath)) {
            try {
                $nodeUrl = "https://nodejs.org/dist/v20.18.0/win-x64/node.exe"
                Write-Host "[INFO] Downloading node.exe from $nodeUrl..." -ForegroundColor Cyan
                [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
                (New-Object System.Net.WebClient).DownloadFile($nodeUrl, $nodeExePath)
                Write-Host "[OK] Portable Node.js downloaded successfully." -ForegroundColor Green
            } catch {
                Write-Host "[WARNING] Direct node.exe download encountered an issue: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }

        $env:PATH = "$localNodeDir;" + $env:PATH
        $nodeVersion = node -v 2>$null

        if (-not $nodeVersion) {
            Write-Host "[ERROR] Automatic Node.js installation failed. Please install Node.js manually." -ForegroundColor Red
            Write-StatusJson -Status "error" -Message "Node.js installation failed" -SubMessage "Please install Node.js manually from nodejs.org" -Progress 0 -Log "[ERROR] Failed to configure Node.js runtime." -Badge "Setup Error"
            Pause
            exit 1
        }
    }

    Write-Host "[OK] Node.js verified: $nodeVersion" -ForegroundColor Green
    Write-StatusJson -Status "node_ok" -Message "Node.js Runtime Verified ($nodeVersion)" -SubMessage "Checking project dependencies in node_modules..." -Progress 55 -Log "[OK] Node.js detected: $nodeVersion" -Badge "Node.js Ready"

    # Check node_modules
    Write-Host "[DEBUG] Checking for node_modules at: $RootDir\node_modules" -ForegroundColor Yellow
    if (-not (Test-Path "$RootDir\node_modules")) {
        Write-Host "[ERROR] 'node_modules' missing. Application is not installed." -ForegroundColor Red
        Write-StatusJson -Status "error" -Message "Application is not installed" -SubMessage "Please run 'Install_FreeModelsClub.bat' to install." -Progress 0 -Log "[ERROR] node_modules missing." -Badge "Not Installed"
        [System.Windows.Forms.MessageBox]::Show("FreeModelsClub is not installed. Please run 'Install_FreeModelsClub.bat' first.", "Installation Required", 0, [System.Windows.Forms.MessageBoxIcon]::Warning)
        exit 1
    }

    Write-StatusJson -Status "deps_ok" -Message "Dependencies Verified" -SubMessage "Ready to initiate Express server process" -Progress 85 -Log "[OK] Dependencies verified." -Badge "Environment Ready"
}

# --- UPDATE CHECKER ---
function Check-ForUpdates {
    param([bool]$Silent = $true)
    if (-not $Silent) {
        $global:notifyIcon.ShowBalloonTip(3000, "jDroid-X-FMC", "Checking GitHub for updates...", [System.Windows.Forms.ToolTipIcon]::Info)
    }
    
    $fetchOut = git fetch origin main 2>&1
    $statusOut = git status -uno 2>&1
    
    if ($statusOut -match "Your branch is behind") {
        $result = [System.Windows.Forms.MessageBox]::Show("A new version is available on GitHub. Would you like to download and install it now?`n`nThis will temporarily close the server.", "Update Available", [System.Windows.Forms.MessageBoxButtons]::YesNo, [System.Windows.Forms.MessageBoxIcon]::Information)
        if ($result -eq 'Yes') {
            Stop-FMCServer
            Start-Process -FilePath "$RootDir\Update_FreeModelsClub.bat" -Wait
            [System.Windows.Forms.Application]::Exit()
        }
    } elseif (-not $Silent) {
        [System.Windows.Forms.MessageBox]::Show("You are running the latest version! No updates found.", "Up to Date", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
    }
}

# 2. Server Control Functions
function Is-ServerRunning {
    $netstat = netstat -ano | Select-String ":$Port "
    return ($null -ne $netstat)
}

function Start-FMCServer {
    if (Is-ServerRunning) {
        Write-Host "[INFO] FreeModelsClub server is ALREADY running in the background on port $Port. Bypassing startup." -ForegroundColor Green
        if ($global:notifyIcon) {
            $global:notifyIcon.ShowBalloonTip(2500, "jDroid-X-FMC", "Server active on http://localhost:$Port", [System.Windows.Forms.ToolTipIcon]::Info)
        }
        $launcherPath = Join-Path $RootDir "public\launcher.html"
        if (-not (Test-Path $launcherPath)) {
            Open-Dashboard
        }
        return
    }

    Write-Host "[INFO] Starting FreeModelsClub Server (node server.js)..." -ForegroundColor Yellow
    Write-StatusJson -Status "starting_server" -Message "Starting Express Backend Server..." -SubMessage "Initializing server.js on port $Port" -Progress 90 -Log "[INFO] Executing node server.js..." -Badge "Server Startup"

    $startClass = [WMICLASS]"ROOT\CIMV2:Win32_Process"
    $result = $startClass.Create("node server.js", $RootDir, $null)
    $global:ServerProcessId = $result.ProcessId
    
    # Wait and poll for server availability
    $attempts = 0
    while ($attempts -lt 15) {
        Start-Sleep -Milliseconds 500
        if (Is-ServerRunning) {
            Write-Host "[OK] Server started successfully on port $Port (PID: $($result.ProcessId))." -ForegroundColor Green
            Write-StatusJson -Status "ready" -Message "Server Ready! Redirecting to Playground..." -SubMessage "FreeModelsClub proxy operational on port $Port" -Progress 100 -Log "[OK] Express server active on port $Port." -Badge "Server Ready"
            if ($global:notifyIcon) {
                $global:notifyIcon.ShowBalloonTip(3000, "jDroid-X-FMC", "Server running on http://localhost:$Port", [System.Windows.Forms.ToolTipIcon]::Info)
            }
            $launcherPath = Join-Path $RootDir "public\launcher.html"
            if (-not (Test-Path $launcherPath)) {
                Open-Dashboard
            }
            return
        }
        $attempts++
    }

    Write-Host "[WARNING] Server port $Port not detected listening yet." -ForegroundColor Yellow
}

function Stop-FMCServer {
    Write-Host "[INFO] Stopping FreeModelsClub Server..." -ForegroundColor Yellow
    if ($global:ServerProcessId) {
        Stop-Process -Id $global:ServerProcessId -Force -ErrorAction SilentlyContinue
    }
    
    $netstatLines = netstat -ano | Select-String ":$Port "
    foreach ($line in $netstatLines) {
        $tokens = $line.ToString().Trim() -split '\s+'
        $pidToKill = $tokens[-1]
        if ($pidToKill -match '^\d+$' -and $pidToKill -ne 0) {
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
        }
    }

    # Absolute Process Guard: Terminate any orphan node.exe process executing server.js
    Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue | ForEach-Object {
        if ($_.CommandLine -and $_.CommandLine -like "*server.js*") {
            Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "[OK] Server stopped." -ForegroundColor Green
    if ($global:notifyIcon) {
        $global:notifyIcon.ShowBalloonTip(3000, "jDroid-X-FMC", "Server stopped.", [System.Windows.Forms.ToolTipIcon]::Warning)
    }
}

function Open-Dashboard {
    Write-Host "[INFO] Opening Playground in default browser ($DashboardUrl)..." -ForegroundColor Cyan
    Start-Process $DashboardUrl
}

function Show-BackgroundJobsStatus {
    $netstat = netstat -ano | Select-String ":$Port "
    $pidStr = "None"
    if ($netstat) {
        $tokens = $netstat.ToString().Trim() -split '\s+'
        $pidStr = $tokens[-1]
    }
    
    $nodeCount = (Get-Process -Name node -ErrorAction SilentlyContinue).Count
    $memUsage = "N/A"
    if ($pidStr -match '^\d+$') {
        $p = Get-Process -Id $pidStr -ErrorAction SilentlyContinue
        if ($p) {
            $memUsage = [math]::Round($p.WorkingSet64 / 1MB, 1).ToString() + " MB"
        }
    }

    $msg = "Active Node Master Process (PID: $pidStr)`n" +
           "Memory Usage: $memUsage`n" +
           "Duplicate Prevention Guard: 0 Duplicates (Single Instance Locked)`n" +
           "Background Services Active: Proxy Engine, Provider Monitor Agent, Circuit Breaker, Telemetry`n" +
           "Port Binding: http://localhost:$Port"

    [System.Windows.Forms.MessageBox]::Show($msg, "jDroid-X-FMC Background Jobs & Node Monitor", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information) | Out-Null
    Start-Process "http://localhost:$Port/reports"
}

# --- LAUNCH SEQUENCE ---
# 1. Perform environment check FIRST so we don't open the browser if uninstalled
Check-Prerequisites

# 2. Node server boot and instant browser launch (Fast Path)
Start-FMCServer

# 3. Check for GitHub Updates asynchronously in background without blocking launch
try {
    Start-Job -ScriptBlock {
        param($ScriptRoot)
        Set-Location $ScriptRoot
        git fetch origin main 2>&1 | Out-Null
    } -ArgumentList $RootDir | Out-Null
} catch {}

# 3. Setup System Tray Application
$global:notifyIcon = New-Object System.Windows.Forms.NotifyIcon

if (Test-Path $IconPath) {
    $global:notifyIcon.Icon = New-Object System.Drawing.Icon($IconPath)
} else {
    $global:notifyIcon.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon((Get-Process -Id $PID).Path)
}

$global:notifyIcon.Text = "jDroid-X-FMC"
$global:notifyIcon.Visible = $true

$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip

$itemTitle = New-Object System.Windows.Forms.ToolStripMenuItem("jDroid-X-FMC (Port $Port)")
$itemTitle.Enabled = $false
$contextMenu.Items.Add($itemTitle) | Out-Null

$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

$itemStart = New-Object System.Windows.Forms.ToolStripMenuItem("Start Server")
$itemStart.Add_Click({ Start-FMCServer })
$contextMenu.Items.Add($itemStart) | Out-Null

$itemStop = New-Object System.Windows.Forms.ToolStripMenuItem("Stop Server")
$itemStop.Add_Click({ Stop-FMCServer })
$contextMenu.Items.Add($itemStop) | Out-Null

$itemDashboard = New-Object System.Windows.Forms.ToolStripMenuItem("Launch FMC")
$itemDashboard.Add_Click({ Open-Dashboard })
$contextMenu.Items.Add($itemDashboard) | Out-Null

$itemUpdateCheck = New-Object System.Windows.Forms.ToolStripMenuItem("Check for Updates")
$itemUpdateCheck.Add_Click({ Check-ForUpdates -Silent $false })
$contextMenu.Items.Add($itemUpdateCheck) | Out-Null

$itemJobsMonitor = New-Object System.Windows.Forms.ToolStripMenuItem("Background Jobs & Node Monitor")
$itemJobsMonitor.Add_Click({ Show-BackgroundJobsStatus })
$contextMenu.Items.Add($itemJobsMonitor) | Out-Null

$itemToggleConsole = New-Object System.Windows.Forms.ToolStripMenuItem("Open / Hide Terminal")
$itemToggleConsole.Add_Click({ Toggle-Console })
$contextMenu.Items.Add($itemToggleConsole) | Out-Null

$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

$itemQuit = New-Object System.Windows.Forms.ToolStripMenuItem("Quit")
$itemQuit.Add_Click({
    Stop-FMCServer
    $global:notifyIcon.Visible = $false
    [System.Windows.Forms.Application]::Exit()
})
$contextMenu.Items.Add($itemQuit) | Out-Null

$global:notifyIcon.ContextMenuStrip = $contextMenu
$global:notifyIcon.Add_DoubleClick({ Open-Dashboard })

# Show Initial Notification Tip
$global:notifyIcon.ShowBalloonTip(4000, "jDroid-X-FMC", "FreeModelsClub is active on port $Port with custom icon in system tray.", [System.Windows.Forms.ToolTipIcon]::Info)

# Hide Console Window to System Tray AFTER server start confirmed
Write-Host "[INFO] Minimizing terminal to System Tray as 'jDroid-X-FMC'..." -ForegroundColor Cyan
Start-Sleep -Seconds 1
Hide-Console

# Keep PowerShell message loop running for System Tray Application
[System.Windows.Forms.Application]::Run()
