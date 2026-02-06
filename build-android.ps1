# Script de build Android avec NODE_ENV defini
# Usage: .\build-android.ps1 [debug|release]

param(
    [string]$BuildType = "release"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ONYX - Build Android APK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Definir NODE_ENV
$env:NODE_ENV = if ($BuildType -eq "debug") { "development" } else { "production" }
Write-Host "[INFO] NODE_ENV = $env:NODE_ENV" -ForegroundColor Yellow
Write-Host ""

# Verifier que le dossier android existe
if (-not (Test-Path "android")) {
    Write-Host "[INFO] Generation des fichiers natifs..." -ForegroundColor Yellow
    npm run prebuild:android
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERREUR] Echec du prebuild" -ForegroundColor Red
        exit 1
    }
}

# --- local.properties : OBLIGATOIRE pour Gradle ---
$localPropsPath = Join-Path $PSScriptRoot "android\local.properties"
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
# Chemin absolu pour que Gradle trouve le SDK meme si lance depuis l'IDE ou autre repertoire
try {
    $sdkDirValue = (Resolve-Path -LiteralPath $sdkPath -ErrorAction Stop).Path
} catch {
    $sdkDirValue = $sdkPath
}
$sdkDirValue = $sdkDirValue -replace '\\', '/'
$sdkDirLine = "sdk.dir=$sdkDirValue"
$androidDir = Join-Path $PSScriptRoot "android"
if (-not (Test-Path $androidDir)) { New-Item -ItemType Directory -Path $androidDir -Force | Out-Null }
# Ecrire sans BOM pour eviter tout souci de parsing Gradle
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($localPropsPath, $sdkDirLine + "`n", $utf8NoBom)
# S'assurer que Gradle voit bien le SDK via les variables d'environnement
$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath
if (-not (Test-Path $sdkPath)) {
    Write-Host "[ERREUR] Android SDK introuvable." -ForegroundColor Red
    Write-Host ""
    Write-Host "Le fichier android\local.properties pointe vers :" -ForegroundColor Yellow
    Write-Host "  $sdkPath" -ForegroundColor White
    Write-Host ""
    Write-Host "Faites UNE des actions suivantes :" -ForegroundColor Yellow
    Write-Host "  1. Installer Android Studio (il installe le SDK a cet emplacement par defaut)" -ForegroundColor White
    Write-Host "  2. Ou editer android\local.properties et mettre sdk.dir= vers votre SDK" -ForegroundColor White
    Write-Host "  3. Ou definir ANDROID_HOME puis relancer le build" -ForegroundColor White
    Write-Host ""
    exit 1
}
Write-Host "[OK] SDK Android : $sdkDirValue" -ForegroundColor Green

Write-Host ""
# Redemarrer les daemons pour prendre en compte les nouveaux jvmargs (evite crash)
if (Test-Path (Join-Path $androidDir "gradlew.bat")) {
    Write-Host "[INFO] Arret des daemons Gradle (nouveau demarrage avec plus de memoire)..." -ForegroundColor Yellow
    Push-Location $androidDir
    & .\gradlew.bat --stop 2>$null
    Pop-Location
    Start-Sleep -Seconds 2
}
Write-Host "[INFO] Build de l'APK ($BuildType)..." -ForegroundColor Yellow
Write-Host ""

# Appliquer les optimisations Gradle si le script existe (secours si prebuild n'a pas utilise le plugin)
$applyScript = Join-Path $PSScriptRoot "scripts\apply-gradle-optimizations.ps1"
if ((Test-Path $applyScript) -and (Test-Path $androidDir)) {
    & $applyScript -AndroidDir $androidDir
}

# Reecrire local.properties juste avant Gradle (au cas ou IDE ou prebuild l'aurait supprime)
[System.IO.File]::WriteAllText($localPropsPath, $sdkDirLine + "`n", $utf8NoBom)

# Aller dans le dossier android et builder (options pour reduire le temps de build)
Push-Location $androidDir
try {
    $gradleArgs = @("--build-cache", "--parallel", "--max-workers=4")
    if ($BuildType -eq "debug") {
        .\gradlew.bat assembleDebug @gradleArgs
    } else {
        .\gradlew.bat assembleRelease @gradleArgs
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[OK] Build reussi !" -ForegroundColor Green
        
        if ($BuildType -eq "debug") {
            $apkPath = "app\build\outputs\apk\debug\app-debug.apk"
        } else {
            $apkPath = "app\build\outputs\apk\release\app-release.apk"
        }
        
        if (Test-Path $apkPath) {
            $fullPath = (Resolve-Path $apkPath).Path
            $size = (Get-Item $fullPath).Length / 1MB
            Write-Host ""
            Write-Host "APK genere :" -ForegroundColor Cyan
            Write-Host "  $fullPath" -ForegroundColor White
            Write-Host "  Taille : $([math]::Round($size, 2)) MB" -ForegroundColor White
        }
    } else {
        Write-Host "[ERREUR] Build echoue" -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

Write-Host ""
