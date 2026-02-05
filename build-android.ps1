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

# Creer local.properties si necessaire
if (-not (Test-Path "android\local.properties")) {
    Write-Host "[INFO] Creation de local.properties..." -ForegroundColor Yellow
    
    $sdkPath = $env:ANDROID_HOME
    if (-not $sdkPath) {
        $possiblePaths = @(
            "$env:LOCALAPPDATA\Android\Sdk",
            "$env:USERPROFILE\AppData\Local\Android\Sdk",
            "C:\Android\Sdk"
        )
        
        foreach ($path in $possiblePaths) {
            if (Test-Path $path) {
                $sdkPath = $path
                break
            }
        }
    }
    
    if ($sdkPath) {
        $sdkPathNormalized = $sdkPath -replace '\\', '/'
        Set-Content -Path "android\local.properties" -Value "sdk.dir=$sdkPathNormalized" -Encoding UTF8
        Write-Host "[OK] local.properties cree" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "[INFO] Build de l'APK ($BuildType)..." -ForegroundColor Yellow
Write-Host ""

# Appliquer les optimisations Gradle si le script existe (secours si prebuild n'a pas utilise le plugin)
$applyScript = Join-Path $PSScriptRoot "scripts\apply-gradle-optimizations.ps1"
if ((Test-Path $applyScript) -and (Test-Path "android")) {
    & $applyScript -AndroidDir "android"
}

# Aller dans le dossier android et builder (options pour reduire le temps de build)
Push-Location android
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
