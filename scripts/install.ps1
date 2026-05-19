# Rubion Skills - Global Installer (Windows / PowerShell)
#
# Links every skill under adapted/* and skills/* into the global skill
# folders for Claude Code and/or Cursor using JUNCTIONS. When you pull
# updates in this repo, the global paths reflect them automatically.
#
# Usage:
#   .\scripts\install.ps1                 -> install for both targets
#   .\scripts\install.ps1 -Target claude  -> Claude Code only
#   .\scripts\install.ps1 -Target cursor  -> Cursor only
#   .\scripts\install.ps1 -Force          -> overwrite existing links/folders
#   .\scripts\install.ps1 -ExcludeNiche   -> skip niche skills (tubitak, dispatch-agents, prototype)
#   .\scripts\install.ps1 -Uninstall      -> remove all Rubion skill junctions

[CmdletBinding()]
param(
    [ValidateSet("claude", "cursor", "both")]
    [string]$Target = "both",
    [switch]$Force,
    [switch]$ExcludeNiche,
    [switch]$Uninstall
)

$ErrorActionPreference = "Stop"

$RepoRoot   = (Get-Item $PSScriptRoot).Parent.FullName
$ClaudeDir  = Join-Path $env:USERPROFILE ".claude\skills"
$CursorDir  = Join-Path $env:USERPROFILE ".cursor\skills-cursor"

# Nis skill'ler — T2/T3 tier'lerinde gereksiz token yuku.
# -ExcludeNiche flag'i ile bunlar atlanir.
$NicheSkills = @(
    "tubitak-1507-document",  # yilda 1-2 kez grant basvurusu
    "dispatch-agents",        # buyuk takimlarda paralel batch
    "prototype"               # throwaway, sadece spike zamani
)

function Get-SkillSources {
    $adapted = Get-ChildItem -Directory "$RepoRoot\adapted" -ErrorAction SilentlyContinue
    $custom  = Get-ChildItem -Directory "$RepoRoot\skills"  -ErrorAction SilentlyContinue
    $all = @($adapted) + @($custom)

    if ($ExcludeNiche) {
        $all = $all | Where-Object { $NicheSkills -notcontains $_.Name }
    }

    return $all
}

function Install-Skills {
    param([string]$TargetDir, [string]$Label)

    if (-not (Test-Path $TargetDir)) {
        New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
    }

    Write-Host ""
    Write-Host "[$Label] $TargetDir"

    $sources = Get-SkillSources
    $linked  = 0
    $skipped = 0

    foreach ($src in $sources) {
        $dest = Join-Path $TargetDir $src.Name

        if (Test-Path $dest) {
            if ($Force) {
                Remove-Item $dest -Recurse -Force
            } else {
                Write-Host "  [SKIP] $($src.Name) (already exists; use -Force to overwrite)"
                $skipped++
                continue
            }
        }

        New-Item -ItemType Junction -Path $dest -Target $src.FullName | Out-Null
        Write-Host "  [OK]   $($src.Name)"
        $linked++
    }

    Write-Host "  Linked: $linked, skipped: $skipped"
}

function Uninstall-Skills {
    param([string]$TargetDir, [string]$Label)

    if (-not (Test-Path $TargetDir)) {
        Write-Host "[$Label] Folder does not exist, skipping: $TargetDir"
        return
    }

    Write-Host ""
    Write-Host "[$Label] $TargetDir"

    $sources = Get-SkillSources
    $removed = 0

    foreach ($src in $sources) {
        $dest = Join-Path $TargetDir $src.Name
        if (-not (Test-Path $dest)) { continue }

        $item = Get-Item $dest -Force
        if ($item.LinkType -ne "Junction" -and $item.LinkType -ne "SymbolicLink") {
            Write-Host "  [SKIP] $($src.Name) (not a junction, leaving untouched)"
            continue
        }

        Remove-Item $dest -Recurse -Force
        Write-Host "  [DEL]  $($src.Name)"
        $removed++
    }

    Write-Host "  Removed: $removed"
}

# Run

if ($Uninstall) {
    Write-Host "Rubion Skills - Uninstall"
    if ($Target -in @("claude", "both")) { Uninstall-Skills -TargetDir $ClaudeDir -Label "Claude" }
    if ($Target -in @("cursor", "both")) { Uninstall-Skills -TargetDir $CursorDir -Label "Cursor" }
    Write-Host ""
    Write-Host "Done."
    return
}

Write-Host "Rubion Skills - Install"
Write-Host "Source: $RepoRoot"
Write-Host "Target: $Target"
if ($ExcludeNiche) {
    Write-Host "ExcludeNiche: ON (skipping: $($NicheSkills -join ', '))"
}

if ($Target -in @("claude", "both")) { Install-Skills -TargetDir $ClaudeDir -Label "Claude" }
if ($Target -in @("cursor", "both")) { Install-Skills -TargetDir $CursorDir -Label "Cursor" }

Write-Host ""
Write-Host "Done. Updates to this repo will reflect in the global paths via the junctions."
