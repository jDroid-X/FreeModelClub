# tray_launcher.ps1
# Purpose: Prerequisites audit, portable Node.js installer fallback, Express server manager, and System Tray Controller (`jDroid-X-FCM`)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

$Port = 12247
$DashboardUrl = "http://localhost:$Port/dashboard"
$ServerProcess = $null
$global:ConsoleVisible = $true
$IconPath = Join-Path $ScriptDir "jdroidxy.ico"

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
    $statusPath = Join-Path $ScriptDir "public\status.json"
    $json | Out-File -FilePath $statusPath -Encoding utf8 -Force

    $jsContent = "window.FMC_STATUS = $json;"
    $jsPath = Join-Path $ScriptDir "public\status.js"
    $jsContent | Out-File -FilePath $jsPath -Encoding utf8 -Force
}

# Auto-generate custom icon if missing
if (-not (Test-Path $IconPath)) {
    $genScript = Join-Path $ScriptDir "generate_icon.ps1"
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
"@ -name "Win32Console" -namespace Win32Functions -passThru

$SW_HIDE = 0
$SW_SHOW = 5

function Get-ConsoleHandle {
    return [Win32Functions.Win32Console]::GetConsoleWindow()
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

function Open-BrowserSplash {
    $launcherPath = Join-Path $ScriptDir "public\launcher.html"
    if (Test-Path $launcherPath) {
        Write-Host "[INFO] Opening launcher splash screen in browser..." -ForegroundColor Cyan
        Start-Process $launcherPath
    }
}

# 1. Prerequisite Checks (with silent Node.js installer fallback)
function Check-Prerequisites {
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host " FreeModelsClub - Prerequisites & Environment Audit" -ForegroundColor Cyan
    Write-Host "=======================================================" -ForegroundColor Cyan

    Write-StatusJson -Status "init" -Message "Auditing system environment..." -SubMessage "Checking Node.js runtime availability" -Progress 15 -Log "Starting environment audit..." -Badge "Prerequisite Check"

    # Add local .node directory to PATH if present
    $localNodeDir = Join-Path $ScriptDir ".node"
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
    if (-not (Test-Path "$ScriptDir\node_modules")) {
        Write-Host "[NOTICE] 'node_modules' missing. Installing dependencies via npm..." -ForegroundColor Yellow
        Write-StatusJson -Status "installing_deps" -Message "Installing project dependencies (npm install)..." -SubMessage "Resolving package dependencies behind the screen" -Progress 70 -Log "[NOTICE] Running npm install..." -Badge "Installing Dependencies"
        
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] 'npm install' failed." -ForegroundColor Red
            Write-StatusJson -Status "error" -Message "Dependency installation failed" -SubMessage "npm install returned error code" -Progress 0 -Log "[ERROR] npm install failed." -Badge "Dependency Error"
            Pause
            exit 1
        }
        Write-Host "[OK] Dependencies installed successfully." -ForegroundColor Green
    }

    Write-StatusJson -Status "deps_ok" -Message "Dependencies Verified" -SubMessage "Ready to initiate Express server process" -Progress 85 -Log "[OK] Dependencies verified." -Badge "Environment Ready"
}

# 2. Server Control Functions
function Is-ServerRunning {
    $netstat = netstat -ano | Select-String ":$Port "
    return ($null -ne $netstat)
}

function Start-FMCServer {
    if (Is-ServerRunning) {
        Write-Host "[INFO] An existing server was found on port $Port. Restarting for a fresh launch..." -ForegroundColor Yellow
        Stop-FMCServer
        Start-Sleep -Seconds 2
    }

    Write-Host "[INFO] Starting FreeModelsClub Server (node server.js)..." -ForegroundColor Yellow
    Write-StatusJson -Status "starting_server" -Message "Starting Express Backend Server..." -SubMessage "Initializing server.js on port $Port" -Progress 90 -Log "[INFO] Executing node server.js..." -Badge "Server Startup"

    $global:ServerProcess = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $ScriptDir -PassThru
    
    # Wait and poll for server availability
    $attempts = 0
    while ($attempts -lt 15) {
        Start-Sleep -Milliseconds 500
        if (Is-ServerRunning) {
            Write-Host "[OK] Server started successfully on port $Port." -ForegroundColor Green
            Write-StatusJson -Status "ready" -Message "Server Ready! Redirecting to Dashboard..." -SubMessage "FreeModelsClub proxy operational on port $Port" -Progress 100 -Log "[OK] Express server active on port $Port." -Badge "Server Ready"
            if ($global:notifyIcon) {
                $global:notifyIcon.ShowBalloonTip(3000, "jDroid-X-FCM", "Server running on http://localhost:$Port", [System.Windows.Forms.ToolTipIcon]::Info)
            }
            return
        }
        $attempts++
    }

    Write-Host "[WARNING] Server port $Port not detected listening yet." -ForegroundColor Yellow
}

function Stop-FMCServer {
    Write-Host "[INFO] Stopping FreeModelsClub Server..." -ForegroundColor Yellow
    if ($global:ServerProcess -and -not $global:ServerProcess.HasExited) {
        Stop-Process -Id $global:ServerProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    $netstatLines = netstat -ano | Select-String ":$Port "
    foreach ($line in $netstatLines) {
        $tokens = $line.ToString().Trim() -split '\s+'
        $pidToKill = $tokens[-1]
        if ($pidToKill -match '^\d+$' -and $pidToKill -ne 0) {
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "[OK] Server stopped." -ForegroundColor Green
    if ($global:notifyIcon) {
        $global:notifyIcon.ShowBalloonTip(3000, "jDroid-X-FCM", "Server stopped.", [System.Windows.Forms.ToolTipIcon]::Warning)
    }
}

function Open-Dashboard {
    Write-Host "[INFO] Opening Dashboard in default browser ($DashboardUrl)..." -ForegroundColor Cyan
    Start-Process $DashboardUrl
}

# --- LAUNCH SEQUENCE ---
# 1. Immediately open browser splash page with loading popup & progress bar
Open-BrowserSplash

# 2. Perform environment check & node server boot behind screen
Check-Prerequisites
Start-FMCServer
Open-Dashboard

# 3. Setup System Tray Application
$global:notifyIcon = New-Object System.Windows.Forms.NotifyIcon

if (Test-Path $IconPath) {
    $global:notifyIcon.Icon = New-Object System.Drawing.Icon($IconPath)
} else {
    $global:notifyIcon.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon((Get-Process -Id $PID).Path)
}

$global:notifyIcon.Text = "jDroid-X-FCM"
$global:notifyIcon.Visible = $true

$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip

$itemTitle = New-Object System.Windows.Forms.ToolStripMenuItem("jDroid-X-FCM (Port $Port)")
$itemTitle.Enabled = $false
$contextMenu.Items.Add($itemTitle) | Out-Null

$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator)) | Out-Null

$itemStart = New-Object System.Windows.Forms.ToolStripMenuItem("Start Server")
$itemStart.Add_Click({ Start-FMCServer })
$contextMenu.Items.Add($itemStart) | Out-Null

$itemStop = New-Object System.Windows.Forms.ToolStripMenuItem("Stop Server")
$itemStop.Add_Click({ Stop-FMCServer })
$contextMenu.Items.Add($itemStop) | Out-Null

$itemDashboard = New-Object System.Windows.Forms.ToolStripMenuItem("Launch Dashboard")
$itemDashboard.Add_Click({ Open-Dashboard })
$contextMenu.Items.Add($itemDashboard) | Out-Null

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
$global:notifyIcon.ShowBalloonTip(4000, "jDroid-X-FCM", "FreeModelsClub is active on port $Port with custom icon in system tray.", [System.Windows.Forms.ToolTipIcon]::Info)

# Hide Console Window to System Tray AFTER server start confirmed
Write-Host "[INFO] Minimizing terminal to System Tray as 'jDroid-X-FCM'..." -ForegroundColor Cyan
Start-Sleep -Seconds 1
Hide-Console

# Keep PowerShell message loop running for System Tray Application
[System.Windows.Forms.Application]::Run()
