# Affiche les logs Android pour trouver l'erreur (crash, écran gris après import)
# 1. Branche le telephone en USB
# 2. Active le debogage USB (Parametres > Options developpeur)
# 3. Lance ce script : npm run android:logcat
# 4. Ouvre l'app, fais l'import, declenche l'ecran gris
# 5. L'erreur JS s'affiche dans le terminal (tag ReactNativeJS)
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

# Verifier qu'un appareil est connecte et autorise
$devicesOutput = & $adb devices 2>&1 | Out-String
if ($devicesOutput -match "unauthorized") {
    Write-Host "[ATTENTION] Telephone connecte mais NON AUTORISE." -ForegroundColor Yellow
    Write-Host "Sur le TELEPHONE : une popup doit apparaitre (Autoriser le debogage USB?)." -ForegroundColor Yellow
    Write-Host "Appuie sur Autoriser (et coche Toujours autoriser si propose)." -ForegroundColor Yellow
    Write-Host "Ensuite relance ce script." -ForegroundColor Cyan
    exit 1
}
$lines = $devicesOutput -split "`r?\n"
$hasDevice = $false
foreach ($line in $lines) {
    if ($line -match "^\S+\s+device\s*$") { $hasDevice = $true; break }
}
if (-not $hasDevice) {
    Write-Host "[ERREUR] Le PC ne detecte pas le telephone." -ForegroundColor Red
    Write-Host ""
    Write-Host "Essaie dans cet ordre :" -ForegroundColor Yellow
    Write-Host "  1. Debranche et rebranche le cable USB." -ForegroundColor White
    Write-Host "  2. Sur le telephone : parametres > Options developpeur > Debogage USB = ON." -ForegroundColor White
    Write-Host "  3. Quand tu branches : choisis Transfert de fichiers ou MTP (pas seulement Charger)." -ForegroundColor White
    Write-Host "  4. Si une popup Autoriser debogage USB apparait sur le tel, appuie sur Autoriser." -ForegroundColor White
    Write-Host "  5. Dans un terminal, lance : adb devices" -ForegroundColor Cyan
    Write-Host "     Tu dois voir une ligne avec ton appareil et device a droite." -ForegroundColor White
    Write-Host ""
    Write-Host "Sortie actuelle de adb devices :" -ForegroundColor Gray
    Write-Host $devicesOutput -ForegroundColor Gray
    exit 1
}

Write-Host "Buffer logcat vide. Reproduis le bug (import puis ecran gris), l erreur apparaitra ici. Ctrl+C pour arreter." -ForegroundColor Cyan
Write-Host ""
& $adb logcat -c

# ReactNativeJS = logs et erreurs JavaScript (notre app). *:E = toutes les erreurs natives.
& $adb logcat ReactNativeJS:V AndroidRuntime:E *:E
