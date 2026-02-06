# Arrete Gradle et supprime le dossier android pour eviter EBUSY au prebuild
# Usage: .\scripts\unlock-android.ps1
# Puis: npm run prebuild:android:clean (ou prebuild:android)

$ErrorActionPreference = "Continue"
$rootDir = (Get-Item $PSScriptRoot).Parent.FullName
$androidDir = Join-Path $rootDir "android"
if (-not (Test-Path $androidDir)) {
    Write-Host "[OK] Pas de dossier android." -ForegroundColor Green
    exit 0
}
$gradlew = Join-Path $androidDir "gradlew.bat"
if (Test-Path $gradlew) {
    Write-Host "[1/3] Arret du daemon Gradle..." -ForegroundColor Cyan
    Push-Location $androidDir
    & .\gradlew.bat --stop 2>$null
    Pop-Location
}
Write-Host "[2/3] Attente 5 s pour liberer les fichiers..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
Write-Host "[3/3] Suppression du dossier android..." -ForegroundColor Cyan
$maxAttempts = 5
for ($i = 1; $i -le $maxAttempts; $i++) {
    try {
        Remove-Item -LiteralPath $androidDir -Recurse -Force -ErrorAction Stop
        Write-Host "[OK] Dossier android supprime. Lancez: npm run prebuild:android:clean" -ForegroundColor Green
        exit 0
    } catch {
        if ($i -lt $maxAttempts) {
            Write-Host "  Tentative $i/$maxAttempts echouee, nouvelle attente 3 s..." -ForegroundColor Yellow
            Start-Sleep -Seconds 3
        } else {
            Write-Host "[ERREUR] Impossible de supprimer android (fichier verrouille)." -ForegroundColor Red
            Write-Host "  Fermez Android Studio, tous les terminaux, puis:" -ForegroundColor Yellow
            Write-Host "  1. Supprimez le dossier 'android' a la main dans l'Explorateur Windows" -ForegroundColor White
            Write-Host "  2. npm run prebuild:android:clean" -ForegroundColor White
            exit 1
        }
    }
}
exit 1
