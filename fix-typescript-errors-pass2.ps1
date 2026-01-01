# TypeScript Error Fix - Pass 2
# Fixes issues from first pass and remaining errors

param(
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

function Replace-InFiles {
    param([string]$Pattern, [string]$Replacement, [string]$Description)
    
    Write-Host "$Description" -ForegroundColor Yellow
    $files = Get-ChildItem -Path "src" -Include "*.ts","*.tsx" -Recurse -File
    $totalChanges = 0
    
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        $newContent = $content -replace $Pattern, $Replacement
        
        if ($content -ne $newContent) {
            $occurrences = ([regex]::Matches($content, $Pattern)).Count
            $totalChanges += $occurrences
            Write-Host "  [$occurrences] $($file.Name)" -ForegroundColor Cyan
            
            if (-not $DryRun) {
                Set-Content -Path $file.FullName -Value $newContent -NoNewline
            }
        }
    }
    
    Write-Host "  Total: $totalChanges`n" -ForegroundColor Green
    return $totalChanges
}

Write-Host "=== TypeScript Fix - Pass 2 ===" -ForegroundColor Magenta
Write-Host "Mode: $(if ($DryRun) { 'DRY RUN' } else { 'LIVE' })`n" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Red' })

$total = 0

# Fix typos from first pass
$total += Replace-InFiles -Pattern '\.activityIdId' -Replacement '.activityId' `
    -Description "1. Fix .activityIdId typo -> .activityId"

$total += Replace-InFiles -Pattern '\.activityIdDate' -Replacement '.activityDate' `
    -Description "2. Fix .activityIdDate typo -> .activityDate"

# Fix ExertionalCapacity property names
$total += Replace-InFiles -Pattern '\.maxLiftingCapacity\.occasionalWeight' -Replacement '.lifting.maxWeightPoundsOccasional' `
    -Description "3. Fix maxLiftingCapacity.occasionalWeight -> lifting.maxWeightPoundsOccasional"

$total += Replace-InFiles -Pattern '\.maxLiftingCapacity\.frequentWeight' -Replacement '.lifting.maxWeightPoundsFrequent' `
    -Description "4. Fix maxLiftingCapacity.frequentWeight -> lifting.maxWeightPoundsFrequent"

$total += Replace-InFiles -Pattern '\.maxLiftingCapacity\.supportingEvidence' -Replacement '.lifting.evidence' `
    -Description "5. Fix maxLiftingCapacity.supportingEvidence -> lifting.evidence"

$total += Replace-InFiles -Pattern '\.maxLiftingCapacity' -Replacement '.lifting' `
    -Description "6. Fix remaining .maxLiftingCapacity -> .lifting"

# Fix hoursWithoutBreak -> maxContinuousMinutes/60
$total += Replace-InFiles -Pattern '\.sitting\.hoursWithoutBreak' -Replacement '.sitting.maxContinuousMinutes' `
    -Description "7. Fix .sitting.hoursWithoutBreak -> .sitting.maxContinuousMinutes"

$total += Replace-InFiles -Pattern '\.standing\.hoursWithoutBreak' -Replacement '.standing.maxContinuousMinutes' `
    -Description "8. Fix .standing.hoursWithoutBreak -> .standing.maxContinuousMinutes"

$total += Replace-InFiles -Pattern '\.walking\.hoursWithoutBreak' -Replacement '.walking.maxContinuousMinutes' `
    -Description "9. Fix .walking.hoursWithoutBreak -> .walking.maxContinuousMinutes"

# Fix supportingEvidence -> evidence
$total += Replace-InFiles -Pattern '\.sitting\.supportingEvidence' -Replacement '.sitting.evidence' `
    -Description "10. Fix .sitting.supportingEvidence -> .sitting.evidence"

$total += Replace-InFiles -Pattern '\.standing\.supportingEvidence' -Replacement '.standing.evidence' `
    -Description "11. Fix .standing.supportingEvidence -> .standing.evidence"

$total += Replace-InFiles -Pattern '\.walking\.supportingEvidence' -Replacement '.walking.evidence' `
    -Description "12. Fix .walking.supportingEvidence -> .walking.evidence"

Write-Host "=== Summary ===" -ForegroundColor Magenta
Write-Host "Total changes in pass 2: $total" -ForegroundColor Green

if ($DryRun) {
    Write-Host "`nDRY RUN - use without -DryRun to apply" -ForegroundColor Yellow
} else {
    Write-Host "`nChanges applied! Run typecheck again." -ForegroundColor Green
}
