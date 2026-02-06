# Applique les optimisations Gradle dans android/gradle.properties
# Usage: appeler apres prebuild si le dossier android existe deja sans avoir relance prebuild.
# Les optimisations sont deja injectees par le plugin gradle-optimization lors de prebuild ;
# ce script sert de secours pour merger manuellement si besoin.

param(
    [string]$AndroidDir = "android"
)

$ErrorActionPreference = "Stop"
$gradlePropsPath = Join-Path $AndroidDir "gradle.properties"

if (-not (Test-Path $gradlePropsPath)) {
    Write-Host "[INFO] $gradlePropsPath introuvable. Lancez d'abord: npm run prebuild:android" -ForegroundColor Yellow
    exit 0
}

$optimizations = @{
    "org.gradle.daemon" = "true"
    "org.gradle.parallel" = "true"
    "org.gradle.configureondemand" = "true"
    "org.gradle.caching" = "true"
    "org.gradle.jvmargs" = "-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8 -XX:+UseParallelGC"
    "org.gradle.workers.max" = "4"
    "kotlin.incremental" = "true"
    "kotlin.incremental.js" = "true"
    "kotlin.incremental.js.ir" = "true"
    "android.useAndroidX" = "true"
    "android.enableJetifier" = "true"
    "android.enableR8.fullMode" = "true"
}

$content = Get-Content $gradlePropsPath -Raw
$lines = Get-Content $gradlePropsPath
$keysFound = @{}
$newLines = New-Object System.Collections.ArrayList

foreach ($line in $lines) {
    $trimmed = $line.Trim()
    if ($trimmed -match '^([^#=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $keysFound[$key] = $true
        if ($optimizations.ContainsKey($key)) {
            [void]$newLines.Add("$key=$($optimizations[$key])")
            $optimizations.Remove($key) | Out-Null
        } else {
            [void]$newLines.Add($line)
        }
    } else {
        [void]$newLines.Add($line)
    }
}

foreach ($k in $optimizations.Keys) {
    [void]$newLines.Add("$k=$($optimizations[$k])")
}

$newContent = $newLines -join "`n"
Set-Content -Path $gradlePropsPath -Value $newContent -Encoding UTF8
Write-Host "[OK] Optimisations Gradle appliquees dans $gradlePropsPath" -ForegroundColor Green
