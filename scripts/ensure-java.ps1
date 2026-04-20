# Ensure a compatible Java for Android/Gradle builds.
# - Gradle/AGP requires Java 17+ and 64-bit.
# - We prefer Android Studio bundled JBR when available.

$ErrorActionPreference = "Stop"

function Get-JavaInfo {
  param([Parameter(Mandatory=$true)][string]$JavaExe)

  if (-not (Test-Path $JavaExe)) {
    return $null
  }

  $tempOut = [System.IO.Path]::GetTempFileName()
  $tempErr = [System.IO.Path]::GetTempFileName()

  try {
    $proc = Start-Process `
      -FilePath $JavaExe `
      -ArgumentList @('-XshowSettings:properties', '-version') `
      -RedirectStandardOutput $tempOut `
      -RedirectStandardError $tempErr `
      -PassThru `
      -WindowStyle Hidden

    if (-not $proc.WaitForExit(10000)) {
      try { $proc.Kill() } catch {}
      return $null
    }

    $stdout = if (Test-Path $tempOut) { Get-Content -LiteralPath $tempOut -Raw -ErrorAction SilentlyContinue } else { '' }
    $stderr = if (Test-Path $tempErr) { Get-Content -LiteralPath $tempErr -Raw -ErrorAction SilentlyContinue } else { '' }
    if ($null -eq $stdout) { $stdout = '' }
    if ($null -eq $stderr) { $stderr = '' }
    $out = ($stdout + "`n" + $stderr).Trim()
  } finally {
    Remove-Item -LiteralPath $tempOut, $tempErr -Force -ErrorAction SilentlyContinue
  }

  if (-not $out) { return $null }

  $versionLine = ($out -split "`r?`n") | Where-Object { $_ -match '^\s*java\.version\s*=\s*' } | Select-Object -First 1
  $modelLine = ($out -split "`r?`n") | Where-Object { $_ -match '^\s*sun\.arch\.data\.model\s*=\s*' } | Select-Object -First 1

  $javaVersion = $null
  if ($versionLine -match '^\s*java\.version\s*=\s*(.+)$') {
    $javaVersion = $matches[1].Trim()
  }

  $dataModel = $null
  if ($modelLine -match '^\s*sun\.arch\.data\.model\s*=\s*(\d+)$') {
    $dataModel = [int]$matches[1]
  }

  $major = 0
  if ($javaVersion) {
    # 1.8.x => major 8, otherwise split on dot and take first.
    if ($javaVersion -match '^1\.(\d+)') {
      $major = [int]$matches[1]
    } else {
      $first = ($javaVersion -split '\.')[0]
      if ($first -match '^\d+$') { $major = [int]$first }
    }
  }

  return [pscustomobject]@{
    JavaExe    = $JavaExe
    JavaHome   = (Split-Path (Split-Path $JavaExe -Parent) -Parent)
    Version    = $javaVersion
    Major      = $major
    DataModel  = $dataModel
    Raw        = $out
  }
}

function Use-JavaHome {
  param([Parameter(Mandatory=$true)][string]$JavaHome)

  $env:JAVA_HOME = $JavaHome
  $env:ORG_GRADLE_JAVA_HOME = $JavaHome
  $bin = Join-Path $JavaHome "bin"
  if (Test-Path $bin) {
    # Prepend so gradle/child processes see it first.
    $env:Path = "$bin;$env:Path"
  }
}

# Candidate list
$candidates = New-Object System.Collections.Generic.List[string]

if ($env:JAVA_HOME) {
  Write-Host "[JAVA] Vérifie JAVA_HOME" -ForegroundColor Yellow
  $candidates.Add((Join-Path $env:JAVA_HOME "bin\java.exe"))
}

# Android Studio bundled JBR (common install path)
Write-Host "[JAVA] Vérifie Android Studio JBR" -ForegroundColor Yellow
$studioJbr = Join-Path ${env:ProgramFiles} "Android\Android Studio\jbr\bin\java.exe"
$candidates.Add($studioJbr)

# Typical JDK install locations
$jdkRoots = @(
  (Join-Path $env:ProgramFiles "Java"),
  (Join-Path $env:ProgramFiles "Eclipse Adoptium")
)
foreach ($root in $jdkRoots) {
  if (Test-Path $root) {
    Write-Host "[JAVA] Scan: $root" -ForegroundColor Yellow
    Get-ChildItem -Path $root -Directory -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -match '^jdk' -or $_.Name -match 'temurin' } |
      ForEach-Object {
        $candidates.Add((Join-Path $_.FullName "bin\java.exe"))
      }
  }
}

$selected = $null
foreach ($javaExe in ($candidates | Where-Object { $_ } | Select-Object -Unique)) {
  Write-Host "[JAVA] Test: $javaExe" -ForegroundColor Yellow
  $info = Get-JavaInfo -JavaExe $javaExe
  if (-not $info) { continue }
  if ($info.Major -ge 17 -and $info.DataModel -eq 64) {
    $selected = $info
    break
  }
}

if (-not $selected) {
  $current = $null
  try {
    $currentOut = & java -XshowSettings:properties -version 2>&1 | Out-String
    $current = $currentOut
  } catch {
    $current = $null
  }

  Write-Host "[ERREUR] Java 17+ 64-bit requis pour Gradle/Android." -ForegroundColor Red
  if ($current) {
    Write-Host "\nJava actuel (résumé) :" -ForegroundColor Yellow
    ($current -split "`r?`n") |
      Where-Object { $_ -match '^\s*(java\.version|sun\.arch\.data\.model)\s*=' } |
      ForEach-Object { Write-Host "  $_" -ForegroundColor White }
  }
  Write-Host "\nActions conseillées :" -ForegroundColor Yellow
  Write-Host "  1. Installer un JDK 17+ 64-bit (Temurin/Oracle)" -ForegroundColor White
  Write-Host "  2. Ou utiliser Android Studio (inclut un JBR compatible)" -ForegroundColor White
  Write-Host "  3. Puis relancer: npm run build:android" -ForegroundColor White
  exit 1
}

Use-JavaHome -JavaHome $selected.JavaHome
Write-Host "[OK] Java sélectionné : $($selected.Version) ($($selected.DataModel)-bit)" -ForegroundColor Green
Write-Host "      JAVA_HOME = $($selected.JavaHome)" -ForegroundColor Green
