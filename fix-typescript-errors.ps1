# TypeScript Error Fix Automation Script
# Systematically fixes common property name mismatches

param(
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"
$changesLog = @()

function Write-ChangeLog {
    param($File, $Pattern, $Replacement, $Count)
    $entry = [PSCustomObject]@{
        File = $File
        Pattern = $Pattern
        Replacement = $Replacement
        Occurrences = $Count
    }
    $script:changesLog += $entry
    if ($Verbose) {
        Write-Host "  [$Count changes] $File" -ForegroundColor Cyan
    }
}

function Update-InFiles {
    param(
        [string]$Pattern,
        [string]$Replacement,
        [string]$Include = "*.ts,*.tsx",
        [string]$Description
    )
    
    Write-Host "`n$Description" -ForegroundColor Yellow
    Write-Host "  Pattern: $Pattern" -ForegroundColor Gray
    Write-Host "  Replace: $Replacement" -ForegroundColor Gray
    
    $files = Get-ChildItem -Path "src" -Include $Include.Split(',') -Recurse -File
    $totalChanges = 0
    
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        $newContent = $content -replace [regex]::Escape($Pattern), $Replacement
        
        if ($content -ne $newContent) {
            $occurrences = ([regex]::Matches($content, [regex]::Escape($Pattern))).Count
            $totalChanges += $occurrences
            
            Write-ChangeLog -File $file.FullName -Pattern $Pattern -Replacement $Replacement -Count $occurrences
            
            if (-not $DryRun) {
                Set-Content -Path $file.FullName -Value $newContent -NoNewline
            }
        }
    }
    
    Write-Host "  Total changes: $totalChanges" -ForegroundColor Green
    return $totalChanges
}

Write-Host "=== TypeScript Error Fix Script ===" -ForegroundColor Magenta
Write-Host "Mode: $(if ($DryRun) { 'DRY RUN (no changes will be made)' } else { 'LIVE (files will be modified)' })" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Red' })
Write-Host ""

$totalAllChanges = 0

# 1. RFC Model: exertionalCapacity -> exertionalLimitations
$totalAllChanges += Update-InFiles `
    -Pattern "rfc.exertionalCapacity" `
    -Replacement "rfc.exertionalLimitations" `
    -Description "1. Fixing RFC.exertionalCapacity -> RFC.exertionalLimitations"

$totalAllChanges += Update-InFiles `
    -Pattern "exert.sitting" `
    -Replacement "exert.sitting" `
    -Description "2. Checking exert variable usage (may need manual fix)"

# 2. WorkImpact Model: canReturnToJob -> canReturnToThisJob
$totalAllChanges += Update-InFiles `
    -Pattern ".canReturnToJob" `
    -Replacement ".canReturnToThisJob" `
    -Description "3. Fixing WorkImpact.canReturnToJob -> canReturnToThisJob"

$totalAllChanges += Update-InFiles `
    -Pattern "wi.canReturnToJob" `
    -Replacement "wi.canReturnToThisJob" `
    -Description "4. Fixing wi.canReturnToJob -> canReturnToThisJob"

# 3. WorkImpact Model: overallImpactStatement -> impactStatements[0]
# Note: This needs manual review as impactStatements is an array
Write-Host "`n5. WorkImpact.overallImpactStatement -> impactStatements (NEEDS MANUAL REVIEW)" -ForegroundColor Yellow
Write-Host "  This property changed from string to string[] - requires manual fix" -ForegroundColor Gray

# 4. DailyLog Model: .date -> .logDate
$totalAllChanges += Update-InFiles `
    -Pattern "l.date)" `
    -Replacement "l.logDate)" `
    -Description "6. Fixing DailyLog .date -> .logDate (in map/filter)"

$totalAllChanges += Update-InFiles `
    -Pattern "log.date" `
    -Replacement "log.logDate" `
    -Description "7. Fixing DailyLog log.date -> log.logDate"

# 5. ActivityLog Model: .activity -> .activityId
$totalAllChanges += Update-InFiles `
    -Pattern "log.activity" `
    -Replacement "log.activityId" `
    -Description "8. Fixing ActivityLog .activity -> .activityId"

# 6. Limitation Model: relatedCondition (doesn't exist) - needs manual fix
Write-Host "`n9. Limitation.relatedCondition (PROPERTY DOESN'T EXIST)" -ForegroundColor Yellow
Write-Host "  This property needs to be removed or the model needs to be updated" -ForegroundColor Gray

# 7. Limitation Model: dateStarted (doesn't exist) - needs manual fix  
Write-Host "`n10. Limitation.dateStarted (PROPERTY DOESN'T EXIST)" -ForegroundColor Yellow
Write-Host "  Should probably use 'createdAt' instead" -ForegroundColor Gray

# 8. Appointment Model: .date -> .appointmentDate
$totalAllChanges += Update-InFiles `
    -Pattern "a.date" `
    -Replacement "a.appointmentDate" `
    -Description "11. Fixing Appointment .date -> .appointmentDate"

# 9. Appointment Model: .type -> .providerType, .location -> .providerLocation
Write-Host "`n12. Appointment model property updates (NEEDS MANUAL REVIEW)" -ForegroundColor Yellow
Write-Host "  Check Appointment model for correct property names" -ForegroundColor Gray

# 10. Medication Model: .purpose is string[] not string
Write-Host "`n13. Medication.purpose is string[] not string (NEEDS MANUAL FIX)" -ForegroundColor Yellow
Write-Host "  Convert to array or use purpose[0]" -ForegroundColor Gray

# 11. RFC Model: Mental limitations structure
Write-Host "`n14. RFC.mentalLimitations structure mismatch (NEEDS MANUAL FIX)" -ForegroundColor Yellow
Write-Host "  concentration and memory don't have .limited and .description properties" -ForegroundColor Gray
Write-Host "  Check RFC.ts for actual structure" -ForegroundColor Gray

# 12. RFC Model: socialInteraction doesn't exist
Write-Host "`n15. RFC.mentalLimitations.socialInteraction (DOESN'T EXIST)" -ForegroundColor Yellow
Write-Host "  Check RFC.ts for social limitation properties" -ForegroundColor Gray

Write-Host "`n=== Summary ===" -ForegroundColor Magenta
Write-Host "Total automated changes: $totalAllChanges" -ForegroundColor Green

if ($DryRun) {
    Write-Host "`nDRY RUN completed. Run without -DryRun to apply changes." -ForegroundColor Yellow
} else {
    Write-Host "`nChanges applied! Run 'npm run typecheck' to verify." -ForegroundColor Green
}

# Export change log
if ($changesLog.Count -gt 0) {
    $changesLog | Export-Csv -Path "typescript-fix-log.csv" -NoTypeInformation
    Write-Host "`nDetailed log saved to: typescript-fix-log.csv" -ForegroundColor Cyan
}

Write-Host "`n=== Manual Fixes Required ===" -ForegroundColor Magenta
Write-Host "The following errors need manual code changes:" -ForegroundColor Yellow
Write-Host "  1. WorkImpact.workHistory - needs to look up by workHistoryId" -ForegroundColor White
Write-Host "  2. WorkImpact.overallImpactStatement -> impactStatements (array)" -ForegroundColor White
Write-Host "  3. Limitation.relatedCondition - property doesn't exist" -ForegroundColor White
Write-Host "  4. Limitation.dateStarted - property doesn't exist, use createdAt" -ForegroundColor White
Write-Host "  5. Appointment model properties (type, location, etc.)" -ForegroundColor White
Write-Host "  6. Medication.purpose (string[] vs string)" -ForegroundColor White
Write-Host "  7. RFC mental limitations structure" -ForegroundColor White
Write-Host "  8. ActivityLog.impactLevel and .requiresAssistance - verify properties exist" -ForegroundColor White
Write-Host "  9. Test files with incorrect mock data structures" -ForegroundColor White
Write-Host "  10. CloudBackupService and SyncService - check constructor/static method usage" -ForegroundColor White
Write-Host ""
