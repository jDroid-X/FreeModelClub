# generate_icon.ps1
# Purpose: Generate custom high-resolution system tray icon (jdroidxy.ico) with gradient AI styling

Add-Type -AssemblyName System.Drawing

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$IconPath = Join-Path $ScriptDir "jdroidxy.ico"

$bmp = New-Object System.Drawing.Bitmap 32, 32
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# 1. Dark Glass/Obsidian Outer Circle background
$rect = New-Object System.Drawing.Rectangle 0, 0, 32, 32
$brushBg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.Color]::FromArgb(255, 15, 23, 42),    # Deep Slate
    [System.Drawing.Color]::FromArgb(255, 99, 102, 241),  # Electric Indigo
    45.0
)
$g.FillEllipse($brushBg, 1, 1, 30, 30)

# 2. Glowing Cyan Border Ring
$penBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 56, 189, 248), 2.0)
$g.DrawEllipse($penBorder, 2, 2, 28, 28)

# 3. High-Contrast Text "XY" / "FMC"
$font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$brushText = [System.Drawing.Brushes]::White
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

$rectF = New-Object System.Drawing.RectangleF 0, 1, 32, 32
$g.DrawString("XY", $font, $brushText, $rectF, $sf)

# 4. Save to ICO file
$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)

$fs = [System.IO.File]::Create($IconPath)
$icon.Save($fs)
$fs.Close()

$g.Dispose()
$bmp.Dispose()

Write-Host "Successfully generated custom tray icon at: $IconPath" -ForegroundColor Green
