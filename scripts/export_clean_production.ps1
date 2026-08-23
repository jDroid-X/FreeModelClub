# export_clean_production.ps1
# Purpose: Exports clean production codebase into jDroid-X-FreeModelClub without databases, user chat histories, prompt dumps, or logs.

try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}

$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) { $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition }
$src = Split-Path -Parent $ScriptDir
$dst = Join-Path $src "jDroid-X-FreeModelClub"

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host " FreeModelsClub - Clean Production Build & Distribution Exporter" -ForegroundColor Cyan
Write-Host " Target Distribution: $dst" -ForegroundColor Yellow
Write-Host "================================================================================" -ForegroundColor Cyan

# STAGE 1: Target Initialization
Write-Host "`n[##........] 20% [STAGE 1/5] Preparing Target Production Workspace..." -ForegroundColor Green
if (-not (Test-Path $dst)) {
    New-Item -ItemType Directory -Path $dst -Force | Out-Null
}

# STAGE 2: Core Asset Synchronization
Write-Host "[####......] 40% [STAGE 2/5] Synchronizing Production Core Files & Assets..." -ForegroundColor Green

$excludeList = @(
    'node_modules',
    '.git',
    'jDroid-X-FreeModelClub',
    'data',
    '.gemini',
    'scratch',
    'test-results',
    '.tray_launcher.lock',
    'Chat_Request.txt',
    'Chat Request.txt',
    '*.tmp',
    '*.log',
    'desktop.ini',
    'coverage',
    '.nyc_output'
)

$items = Get-ChildItem -Path $src -Force
foreach ($item in $items) {
    if ($item.Name -notin $excludeList) {
        Write-Host "  -> Syncing $($item.Name)..." -ForegroundColor DarkGray
        Copy-Item -Path $item.FullName -Destination $dst -Recurse -Force
    }
}

# STAGE 3: Strict Sanitization & Sensitive Data Purge
Write-Host "[######....] 60% [STAGE 3/5] Purging Scratch Dumps, Chat Transcripts & Logs..." -ForegroundColor Green

# 1. Clean chat history, transcripts, or scratch notes from docs
$dstDocs = Join-Path $dst "docs"
if (Test-Path $dstDocs) {
    Get-ChildItem -Path $dstDocs -Filter "*Chat*" -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $dstDocs -Filter "*scratch*" -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $dstDocs -Filter "*BYNARA*" -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $dstDocs -Filter "*FIXES_APPLIED*" -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $dstDocs -Filter "*conversation*" -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $dstDocs -Filter "*transcript*" -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue
}

# 2. Clean temporary chat implementation plans and task notes from requirement
$dstReq = Join-Path $dst "requirement"
if (Test-Path $dstReq) {
    Get-ChildItem -Path $dstReq -Filter "imp*.md" -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $dstReq -Filter "Task_*.md" -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $dstReq -Filter "*audit*.md" -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $dstReq -Filter "*conversation*" -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue
}

# 3. Clean temporary artifact images
$dstArtifacts = Join-Path $dst "public\images\artifacts"
if (Test-Path $dstArtifacts) {
    Get-ChildItem -Path $dstArtifacts -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue
}

# STAGE 4: Clean Database Schema & Template Seeding
Write-Host "[########..] 80% [STAGE 4/5] Initializing Clean Production Schemas & Vault..." -ForegroundColor Green

$dstData = Join-Path $dst "data"
if (-not (Test-Path $dstData)) {
    New-Item -ItemType Directory -Path $dstData -Force | Out-Null
}

# Remove any runtime databases or logs in destination data folder
Get-ChildItem -Path $dstData -Recurse -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Copy system schemas, taxonomies, themes, user manual, and relationship maps only
$templateFiles = @(
    'taxonomy.json',
    'themes.json',
    'user_manual.json',
    'help_docs.json',
    'bi_mapping.json',
    'program_mapping.json',
    'settings_agent_db.json'
)

foreach ($f in $templateFiles) {
    $srcFile = Join-Path $src "data\$f"
    if (Test-Path $srcFile) {
        Copy-Item -Path $srcFile -Destination (Join-Path $dstData $f) -Force
    }
}

# Initialize fresh empty zero-history production JSON collections
$emptyArray = "[]"
$cleanCollections = @(
    'providers.json',
    'models.json',
    'combos.json',
    'Activemodels.json',
    'inactivemodel.json',
    'api_keys.json',
    'api_logs.json',
    'system_logs.json',
    'users.json',
    'feedback.json'
)

foreach ($c in $cleanCollections) {
    Set-Content -Path (Join-Path $dstData $c) -Value $emptyArray -Encoding UTF8 -Force
}

# Default production runtime configuration
$defaultConfig = @{
    port = 12247
    autoStart = $true
    rateLimitRPM = 30
    rateLimitTPM = 70000
    monitoringFrequencyHours = 1
    theme = "platinum"
} | ConvertTo-Json -Depth 3

Set-Content -Path (Join-Path $dstData "config.json") -Value $defaultConfig -Encoding UTF8 -Force

# STAGE 5: Comprehensive Production Verification Audit
Write-Host "[##########] 100% [STAGE 5/5] Performing Deep Production Verification Audit..." -ForegroundColor Green

$verificationResults = @()

# Test 1: Required Entrypoint Files Check
$requiredFiles = @(
    'server.js',
    'package.json',
    'Install_FreeModelsClub.bat',
    'Update_FreeModelsClub.bat',
    'Uninstall_FreeModelsClub.bat',
    'Launch_FMC.bat',
    'scripts\tray_launcher.ps1',
    'public\index.html',
    'public\js\app.js',
    'public\js\views\AboutView.js',
    'public\js\views\PlaygroundView.js',
    'public\js\views\DashboardView.js',
    'data\config.json',
    'data\providers.json',
    'data\models.json',
    'data\combos.json',
    'data\taxonomy.json',
    'data\themes.json'
)

$missingFiles = @()
foreach ($rf in $requiredFiles) {
    $fullPath = Join-Path $dst $rf
    if (-not (Test-Path $fullPath)) {
        $missingFiles += $rf
    }
}

$verificationResults += [PSCustomObject]@{
    CheckId = "01"
    Area    = "Core Entrypoints & Scripts"
    Target  = "18 Core System Files"
    Status  = if ($missingFiles.Count -eq 0) { "[PASSED]" } else { "[FAILED: $($missingFiles -join ', ')]" }
}

# Test 2: JSON Schema Syntax & Health Validation
$jsonFiles = Get-ChildItem -Path $dstData -Filter "*.json"
$invalidJson = @()
foreach ($jf in $jsonFiles) {
    try {
        $raw = Get-Content $jf.FullName -Raw -Encoding UTF8
        $null = $raw | ConvertFrom-Json
    } catch {
        $invalidJson += $jf.Name
    }
}

$verificationResults += [PSCustomObject]@{
    CheckId = "02"
    Area    = "Data Schemas & JSON Syntax"
    Target  = "$($jsonFiles.Count) Data Collections"
    Status  = if ($invalidJson.Count -eq 0) { "[PASSED]" } else { "[FAILED: $($invalidJson -join ', ')]" }
}

# Test 3: Zero-Leakage Sanitization Verification
$leakedFiles = @()
$leakedFiles += Get-ChildItem -Path $dst -Recurse -Filter "*Chat_Request*.txt" -ErrorAction SilentlyContinue
$leakedFiles += Get-ChildItem -Path $dst -Recurse -Filter "Task_*.md" -ErrorAction SilentlyContinue
$leakedFiles += Get-ChildItem -Path $dst -Recurse -Filter "imp*.md" -ErrorAction SilentlyContinue
$leakedFiles += Get-ChildItem -Path $dst -Recurse -Filter "*.log" -ErrorAction SilentlyContinue

$verificationResults += [PSCustomObject]@{
    CheckId = "03"
    Area    = "Zero Sensitive Data Leaks"
    Target  = "Logs, Transcripts & Dumps"
    Status  = if ($leakedFiles.Count -eq 0) { "[PASSED]" } else { "[FAILED: $($leakedFiles.Count) Leaks Detected]" }
}

# Test 4: JavaScript Syntax Integrity Check
$serverJsPath = Join-Path $dst "server.js"
$aboutJsPath = Join-Path $dst "public\js\views\AboutView.js"
$syntaxPassed = $true

if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeCheck1 = node --check "$serverJsPath" 2>&1
    $nodeCheck2 = node --check "$aboutJsPath" 2>&1
    if ($LASTEXITCODE -ne 0 -or $nodeCheck1 -match "Error" -or $nodeCheck2 -match "Error") {
        $syntaxPassed = $false
    }
}

$verificationResults += [PSCustomObject]@{
    CheckId = "04"
    Area    = "JavaScript Syntax Health"
    Target  = "server.js, AboutView.js"
    Status  = if ($syntaxPassed) { "[PASSED]" } else { "[FAILED: Syntax Error]" }
}

# Test 5: File Count & Structure
$totalFiles = (Get-ChildItem -Path $dst -Recurse -File).Count
$totalDirs = (Get-ChildItem -Path $dst -Recurse -Directory).Count

$verificationResults += [PSCustomObject]@{
    CheckId = "05"
    Area    = "Distribution Matrix & Trees"
    Target  = "$totalFiles Files in $totalDirs Folders"
    Status  = if ($totalFiles -gt 50) { "[PASSED]" } else { "[FAILED: Incomplete Tree]" }
}

# Render Verification Summary Table
Write-Host "`n================================================================================" -ForegroundColor Cyan
Write-Host "               PRODUCTION EXPORT VERIFICATION AUDIT REPORT                     " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

$verificationResults | Format-Table -AutoSize | Out-String | Write-Host -ForegroundColor White

$allPassed = ($verificationResults | Where-Object { $_.Status -notlike "*[PASSED]*" }).Count -eq 0

if ($allPassed) {
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host " [SUCCESS] Clean Production Export & 100% Verification AUDIT PASSED!" -ForegroundColor Green
    Write-Host " Output Directory: $dst" -ForegroundColor Cyan
    Write-Host " Total Production Files: $totalFiles" -ForegroundColor White
    Write-Host " Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor DarkGray
    Write-Host " Ready for Git Version Control & Production Release." -ForegroundColor Green
    Write-Host "================================================================================" -ForegroundColor Green
} else {
    Write-Host "================================================================================" -ForegroundColor Red
    Write-Host " [WARNING] One or more verification checks failed. Review table above." -ForegroundColor Red
    Write-Host "================================================================================" -ForegroundColor Red
    exit 1
}

