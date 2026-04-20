# Script de build Android avec NODE_ENV defini
# Usage: .\build-android.ps1 [debug|release]

param(
    [string]$BuildType = "release"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ONYX - Build Android APK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Step([string]$Message) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor Yellow
}

# Definir NODE_ENV
$env:NODE_ENV = if ($BuildType -eq "debug") { "development" } else { "production" }
Write-Host "[INFO] NODE_ENV = $env:NODE_ENV" -ForegroundColor Yellow
Write-Host ""

$androidStudioJbr = Join-Path $env:ProgramFiles "Android\Android Studio\jbr"
if (-not $env:JAVA_HOME -and (Test-Path $androidStudioJbr)) {
    $env:JAVA_HOME = $androidStudioJbr
    $env:ORG_GRADLE_JAVA_HOME = $androidStudioJbr
    $env:Path = "$(Join-Path $androidStudioJbr 'bin');$env:Path"
    Step "JAVA_HOME fixé sur Android Studio JBR"
}

# Build direct via Gradle dans le dossier android existant.
$androidDir = Join-Path $PSScriptRoot "android"
if (-not (Test-Path $androidDir)) {
    Write-Host "[ERREUR] Le dossier android est absent. Lancez une seule fois: npm run expo-prebuild:android" -ForegroundColor Red
    exit 1
}

$gradlew = Join-Path $androidDir "gradlew.bat"
if (-not (Test-Path $gradlew)) {
    Write-Host "[ERREUR] Gradle wrapper introuvable dans android/." -ForegroundColor Red
    exit 1
}

Step "Lancement du build Gradle ($BuildType)..."
Write-Host ""

Push-Location $androidDir
try {
    $gradleArgs = @("--build-cache", "--parallel", "--max-workers=4", "--console=plain")
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
