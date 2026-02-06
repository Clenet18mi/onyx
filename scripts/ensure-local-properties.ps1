# Cree ou met a jour android/local.properties avec sdk.dir
# Utiliser avant d'ouvrir le projet dans Android Studio ou si "SDK location not found"
# Usage: .\ensure-local-properties.ps1   ou   npm run android:config

$ErrorActionPreference = "Stop"
# Racine du projet (parent du dossier scripts)
$root = if ($PSScriptRoot) { Split-Path $PSScriptRoot -Parent } else { (Get-Location).Path }
$androidDir = Join-Path $root "android"
$localPropsPath = Join-Path $root "android\local.properties"

if (-not (Test-Path $androidDir)) {
    Write-Host "[INFO] Dossier android absent. Lancez: npm run prebuild:android" -ForegroundColor Yellow
    exit 0
}

$sdkPath = $env:ANDROID_HOME
if (-not $sdkPath) { $sdkPath = $env:ANDROID_SDK_ROOT }
if (-not $sdkPath) {
    $candidates = @(
        (Join-Path $env:LOCALAPPDATA "Android\Sdk"),
        (Join-Path $env:USERPROFILE "AppData\Local\Android\Sdk"),
        "C:\Android\Sdk"
    )
    foreach ($p in $candidates) {
        if ($p -and (Test-Path $p)) { $sdkPath = $p; break }
    }
}
if (-not $sdkPath -or -not (Test-Path $sdkPath)) {
    $sdkPath = Join-Path $env:USERPROFILE "AppData\Local\Android\Sdk"
}

try { $abs = (Resolve-Path -LiteralPath $sdkPath -ErrorAction Stop).Path } catch { $abs = $sdkPath }
$sdkDirValue = $abs -replace '\\', '/'
$line = "sdk.dir=$sdkDirValue"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($localPropsPath, $line + "`n", $utf8NoBom)
Write-Host "[OK] android\local.properties -> sdk.dir=$sdkDirValue" -ForegroundColor Green
