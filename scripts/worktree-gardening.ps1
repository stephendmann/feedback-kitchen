<#
.SYNOPSIS
    Monthly "gardening" pass for Git worktrees in this repo.

.DESCRIPTION
    Scans all linked worktrees for this repository and reports which are safe
    to remove. A worktree is safe only if ALL of the following hold:

      1. Its path/branch does NOT match a protected pattern (see -Protected).
      2. Its branch is fully merged into main.
      3. Its working tree is clean (no uncommitted OR untracked changes).
      4. Its last commit is older than 14 days.

    With -Apply, each safe worktree is removed with `git worktree remove`
    (never --force), its now-unneeded branch deleted with `git branch -d`,
    and stale metadata cleared with `git worktree prune`. Without -Apply it
    prints a KEEP/REMOVE report and makes no changes.

    Protected worktrees: this repo keeps 'frosty-babbage' as a persistent
    planning-only workspace that must never be reaped, even when idle and
    merged. Its name is matched (substring, case-insensitive) against both
    the worktree path and branch and always kept. Extend via -Protected.

    Note: because condition 3 counts untracked files, a worktree carrying a
    regenerating cache dir (e.g. graphify-out/ on a branch cut before that
    path was gitignored) will read as dirty indefinitely and never be reaped.
    Such worktrees need a one-time manual `git worktree remove --force`.

.PARAMETER Apply
    Perform the removals. Omit for report-only mode.

.PARAMETER Protected
    Name substrings (case-insensitive) that mark a worktree as never-remove.
    Defaults to 'frosty-babbage'. Matched against worktree path and branch.

.NOTES
    - Never uses --force, so dirty worktrees and unmerged branches are safe.
    - The 14-day guard protects idle-but-open Claude sessions.
    - Run manually ~monthly from the main checkout; cloud schedulers cannot
      see this local .git and cannot manage local worktrees.

.EXAMPLE
    pwsh .\scripts\worktree-gardening.ps1
    Report only, no changes.

.EXAMPLE
    pwsh .\scripts\worktree-gardening.ps1 -Apply
    Apply safe removals, then prune.
#>
param(
    [switch]$Apply,
    [string[]]$Protected = @('frosty-babbage')
)

$repo = Split-Path $PSScriptRoot -Parent
$mainCheckout = (git -C $repo rev-parse --path-format=absolute --git-common-dir) -replace '[\\/]\.git$', ''
$merged = git -C $repo branch --format='%(refname:short)' --merged main

$worktrees = @()
$current = @{}
git -C $repo worktree list --porcelain | ForEach-Object {
    if ($_ -match '^worktree (.+)$') { $current = @{ Path = $Matches[1] } }
    elseif ($_ -match '^branch refs/heads/(.+)$') { $current.Branch = $Matches[1] }
    elseif ($_ -eq '') { if ($current.Path) { $worktrees += $current }; $current = @{} }
}
if ($current.Path) { $worktrees += $current }

$removed = 0
foreach ($wt in $worktrees) {
    if ((Resolve-Path $wt.Path).Path -eq (Resolve-Path $mainCheckout).Path) { continue }

    $why = @()
    $isProtected = $Protected | Where-Object { $wt.Path -like "*$_*" -or $wt.Branch -like "*$_*" }
    if ($isProtected) { $why += "protected ($($isProtected -join ', '))" }
    if ($merged -notcontains $wt.Branch) { $why += 'branch not merged into main' }
    if (git -C $wt.Path status --porcelain) { $why += 'working tree dirty' }
    $lastCommit = [DateTimeOffset]::FromUnixTimeSeconds([long](git -C $wt.Path log -1 --format=%ct))
    if ($lastCommit -gt [DateTimeOffset]::Now.AddDays(-14)) { $why += "last commit $($lastCommit.ToString('yyyy-MM-dd')) (<14 days)" }

    if ($why) {
        Write-Host "KEEP   $($wt.Path) [$($wt.Branch)] — $($why -join '; ')"
    } elseif ($Apply) {
        git -C $repo worktree remove $wt.Path && git -C $repo branch -d $wt.Branch
        Write-Host "REMOVED $($wt.Path) [$($wt.Branch)]"
        $removed++
    } else {
        Write-Host "WOULD REMOVE $($wt.Path) [$($wt.Branch)] — rerun with -Apply"
    }
}

if ($Apply) { git -C $repo worktree prune; Write-Host "Pruned stale metadata. Removed $removed worktree(s)." }
