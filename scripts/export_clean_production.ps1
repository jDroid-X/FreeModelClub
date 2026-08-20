# export_clean_production.ps1
# Purpose: Exports clean production codebase into jDroid-X-FreeModelClub without databases, user chat histories, prompt dumps, or logs.

$src = "c:\Users\jiten\jAnitGravity\FreeModelsClub"
$dst = "c:\Users\jiten\jAnitGravity\FreeModelsClub\jDroid-X-FreeModelClub"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host " Syncing Clean Production Files to jDroid-X-FreeModelClub" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

if (-not (Test-Path $dst)) {
    New-Item -ItemType Directory -Path $dst -Force | Out-Null
}

$excludeList = @('node_modules', '.git', 'jDroid-X-FreeModelClub', 'data', '.gemini', 'scratch', 'test-results', '.tray_launcher.lock', 'Chat_Request.txt', 'Chat Request.txt')
$items = Get-ChildItem -Path $src -Force

foreach ($item in $items) {
    if ($item.Name -notin $excludeList) {
        Write-Host "Syncing $($item.Name)..." -ForegroundColor Yellow
        Copy-Item -Path $item.FullName -Destination $dst -Recurse -Force
    }
}

# 1. Clean any chat history, conversation requests, or scratch logs from docs
$dstDocs = Join-Path $dst "docs"
if (Test-Path $dstDocs) {
    Get-ChildItem -Path $dstDocs -Filter "*Chat*" -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $dstDocs -Filter "*scratch*" -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $dstDocs -Filter "*BYNARA*" -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $dstDocs -Filter "*FIXES_APPLIED*" -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue
}

# 2. Clean temporary chat implementation plans and task files from requirement directory
$dstReq = Join-Path $dst "requirement"
if (Test-Path $dstReq) {
    Get-ChildItem -Path $dstReq -Filter "imp*.md" -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $dstReq -Filter "Task_*.md" -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path $dstReq -Filter "*audit*.md" -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue
}

# 3. Clean temporary artifact images from public/images/artifacts
$dstArtifacts = Join-Path $dst "public\images\artifacts"
if (Test-Path $dstArtifacts) {
    Get-ChildItem -Path $dstArtifacts -Recurse -Force | Remove-Item -Force -ErrorAction SilentlyContinue
}

# 4. Create clean production data directory with template / system seed schemas only
$dstData = Join-Path $dst "data"
if (-not (Test-Path $dstData)) {
    New-Item -ItemType Directory -Path $dstData -Force | Out-Null
}

# Remove any old runtime data, chat histories, or backup folders in destination data folder
Get-ChildItem -Path $dstData -Recurse -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Copy system schemas, taxonomies, themes, UI docs, and mappings only
$templateFiles = @('taxonomy.json', 'themes.json', 'user_manual.json', 'help_docs.json', 'bi_mapping.json', 'program_mapping.json')
foreach ($f in $templateFiles) {
    $srcFile = Join-Path $src "data\$f"
    if (Test-Path $srcFile) {
        Copy-Item -Path $srcFile -Destination (Join-Path $dstData $f) -Force
    }
}

# Initialize fresh empty database collections for zero-history production deployment
$emptyArray = "[]"
$cleanCollections = @('providers.json', 'models.json', 'combos.json', 'Activemodels.json', 'api_keys.json', 'api_logs.json', 'system_logs.json', 'users.json')
foreach ($c in $cleanCollections) {
    Set-Content -Path (Join-Path $dstData $c) -Value $emptyArray -Encoding UTF8 -Force
}

# Default production configuration
$defaultConfig = @{
    port = 12247
    autoStart = $true
    rateLimitRPM = 30
    rateLimitTPM = 70000
    monitoringFrequencyHours = 1
} | ConvertTo-Json -Depth 3

Set-Content -Path (Join-Path $dstData "config.json") -Value $defaultConfig -Encoding UTF8 -Force

Write-Host "=======================================================" -ForegroundColor Green
Write-Host " [SUCCESS] Clean production deployment updated at:" -ForegroundColor Green
Write-Host " $dst" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
