# Affiche les logs Android (crash, erreurs) via adb
# Branche le telephone en USB, active le debogage USB, puis lance ce script.
# Usage: .\logcat-crash.ps1   ou   npm run android:logcat

$sdkPath = $env:ANDROID_HOME
if (-not $sdkPath) { $sdkPath = $env:ANDROID_SDK_ROOT }
if (-not $sdkPath) {
    $sdkPath = Join-Path $env:LOCALAPPDATA "Android\Sdk"
}
$adb = Join-Path $sdkPath "platform-tools\adb.exe"

if (-not (Test-Path $adb)) {
    Write-Host "[ERREUR] adb introuvable : $adb" -ForegroundColor Red
    Write-Host "Verifiez que Android SDK platform-tools est installe (Android Studio > SDK Manager)." -ForegroundColor Yellow
    exit 1
}

Write-Host "Nettoyage du buffer logcat..." -ForegroundColor Cyan
& $adb logcat -c
Write-Host "Lancement de logcat (niveau Erreur). Ouvrez l'app pour declencher le crash, puis Ctrl+C pour arreter." -ForegroundColor Cyan
Write-Host ""
& $adb logcat *:E
