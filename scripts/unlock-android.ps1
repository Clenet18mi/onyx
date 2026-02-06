# Arrete le daemon Gradle et attend pour liberer les fichiers verrouilles (EBUSY)
# Usage: .\scripts\unlock-android.ps1
# Puis relancer: npm run prebuild:android ou npm run build:android

$ErrorActionPreference = "Stop"
$androidDir = Join-Path $PSScriptRoot "..\android"
if (-not (Test-Path $androidDir)) {
    Write-Host "[INFO] Pas de dossier android, rien a liberer." -ForegroundColor Yellow
    exit 0
}
$gradlew = Join-Path $androidDir "gradlew.bat"
if (Test-Path $gradlew) {
    Write-Host "[INFO] Arret du daemon Gradle..." -ForegroundColor Yellow
    Push-Location $androidDir
    try {
        & .\gradlew.bat --stop 2>$null
    } catch {}
    Pop-Location
    Write-Host "[INFO] Attente 3 s pour liberer les fichiers..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
}
# Supprimer les dossiers build (souvent verrouilles)
$buildDirs = @(
    (Join-Path $androidDir "app\build"),
    (Join-Path $androidDir "build")
)
foreach ($d in $buildDirs) {
    if (Test-Path $d) {
        Write-Host "[INFO] Suppression de $d ..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $d -ErrorAction SilentlyContinue
    }
}
Write-Host "[OK] Vous pouvez relancer: npm run prebuild:android" -ForegroundColor Green
