# Evidence Mode Integration & Testing Checklist

## Pre-Integration Checklist

### Dependencies
- [ ] Verify zustand is installed (`npm list zustand`)
- [ ] Verify @react-native-async-storage/async-storage is installed
- [ ] Verify React Navigation is set up
- [ ] Verify TypeScript is configured

### File Structure
- [ ] Confirm all new files are in correct locations
- [ ] Verify imports in `src/components/index.ts`
- [ ] Verify imports in `src/services/index.ts`
- [ ] Check no TypeScript errors in new files

## Integration Steps

### Step 1: Initialize Evidence Mode Store
- [ ] Open `src/state/useAppState.ts` or `src/App.tsx`
- [ ] Import `useEvidenceModeStore`
- [ ] Call `evidenceStore.loadEvidenceMode()` in app initialization
- [ ] Test: Launch app and check no errors

### Step 2: Update Settings Screen
- [ ] Import `EvidenceModeControls` and `SubmissionPackBuilder`
- [ ] Add Evidence Mode section
- [ ] Add Submission Pack section
- [ ] Test: Navigate to Settings and verify controls render
- [ ] Test: Toggle Evidence Mode and verify state updates

### Step 3: Update Dashboard
- [ ] Import `EvidenceModeControls`
- [ ] Add compact indicator to header
- [ ] Test: Enable Evidence Mode and verify indicator shows
- [ ] Test: Disable Evidence Mode and verify indicator hides

### Step 4: Update Daily Log Screen - Creation
- [ ] Import `applyEvidenceTimestamp` from EvidenceLogService
- [ ] In `addDailyLog` handler, apply timestamp if Evidence Mode enabled
- [ ] Test: Enable Evidence Mode, create log, verify `evidenceTimestamp` exists
- [ ] Test: Disable Evidence Mode, create log, verify no `evidenceTimestamp`

### Step 5: Update Daily Log Screen - Editing
- [ ] Import `canModifyLog`, `updateLogWithRevision`
- [ ] Import `LogFinalizationControls`, `RevisionHistoryViewer`
- [ ] Add finalization status check before allowing edits
- [ ] Show revision prompt if log is finalized
- [ ] Add LogFinalizationControls component to detail view
- [ ] Add revision history button and modal
- [ ] Test: Create log, finalize it, try to edit → should prompt for revision
- [ ] Test: Create revision → should appear in revision history

### Step 6: Update Daily Log Screen - Display
- [ ] Show evidence timestamp if present
- [ ] Show finalization status badge
- [ ] Show revision count if > 0
- [ ] Disable edit button for finalized logs
- [ ] Test: Visual indicators appear correctly

### Step 7: Update Activity Log Screen
- [ ] Repeat Steps 4-6 for Activity Log screen
- [ ] Use `logType: 'activity'` in function calls
- [ ] Test: All features work for activity logs

### Step 8: Update Log Store
- [ ] Open `src/state/logStore.ts`
- [ ] Import `applyEvidenceTimestamp`
- [ ] Update `addDailyLog` to apply timestamp
- [ ] Update `addActivityLog` to apply timestamp
- [ ] Test: Create logs through store directly

### Step 9: Update Reports Screen
- [ ] Import Evidence Report Builder and PDF services
- [ ] Update report generation to use `buildEvidenceReport`
- [ ] Update export to use `generateHTMLForPDF` or `generatePlainTextReport`
- [ ] Test: Generate report with revisions
- [ ] Test: Verify standardized language appears
- [ ] Test: Verify revision summary section

### Step 10: Add Submission Pack Screen (Optional)
- [ ] Create new screen or add to existing
- [ ] Use `SubmissionPackBuilder` component
- [ ] Add navigation route
- [ ] Test: Create submission pack
- [ ] Test: View existing packs
- [ ] Test: Verify pack is immutable

## Testing Checklist

### Evidence Mode Basics
- [ ] Enable Evidence Mode from Settings
- [ ] Verify UI shows "Evidence Mode Active" indicator
- [ ] Create new daily log
- [ ] Verify log has `evidenceTimestamp` field
- [ ] Verify timestamp is in ISO format
- [ ] Disable Evidence Mode
- [ ] Create new daily log
- [ ] Verify log does NOT have `evidenceTimestamp`
- [ ] Re-enable Evidence Mode
- [ ] Verify old logs keep their timestamps

### Log Finalization
- [ ] Create a daily log with at least one symptom
- [ ] Navigate to log detail view
- [ ] Verify "Finalize Log" button appears
- [ ] Click "Finalize Log"
- [ ] Confirm in dialog
- [ ] Verify status changes to "Finalized"
- [ ] Verify "Read-Only" badge appears
- [ ] Verify edit button is disabled or removed
- [ ] Try to delete finalized log (should be blocked if you implement protection)

### Revision Creation
- [ ] Create and finalize a daily log
- [ ] Attempt to edit the log
- [ ] Verify system prompts for revision reason
- [ ] Enter reason: "Correcting severity value"
- [ ] Change severity from 7 to 8
- [ ] Submit revision
- [ ] Verify success message
- [ ] Navigate to revision history
- [ ] Verify revision appears with:
  - [ ] Correct timestamp
  - [ ] Field name
  - [ ] Original value (7)
  - [ ] Updated value (8)
  - [ ] Reason

### Revision History Viewer
- [ ] Open revision history for log with revisions
- [ ] Verify modal appears
- [ ] Verify revisions are sorted by date (newest first)
- [ ] Click to expand revision
- [ ] Verify all details display correctly
- [ ] Create multiple revisions
- [ ] Verify all appear in list
- [ ] Close modal
- [ ] Verify modal dismisses

### Standardized Narratives
- [ ] Create multiple daily logs with varying symptoms
- [ ] Generate a report
- [ ] Verify opening statement uses format: "The user reports symptom and activity data for the period from X to Y..."
- [ ] Verify symptom summaries use format: "Logs indicate [symptom] was recorded on X of Y logged days (Z percent)..."
- [ ] Verify NO emotional language (no "suffering," "severe," "chronic")
- [ ] Verify NO speculation (no "likely caused by," "appears to worsen")
- [ ] Verify consistent formatting across multiple report generations
- [ ] Generate same report twice, compare output → should be identical

### Functional Domain Mappings
- [ ] Create logs with back-pain symptom
- [ ] Generate report
- [ ] Navigate to "Functional Limitations" section
- [ ] Verify back-pain appears under multiple domains (sitting, standing, walking, etc.)
- [ ] Verify domains are NOT labeled as "SSA fields"
- [ ] Verify domain labels use plain English ("Sitting," not "SSA-Sitting")
- [ ] Create logs with desk-work activity
- [ ] Generate report
- [ ] Verify desk-work affects concentration, sitting, persistence domains

### PDF Export
- [ ] Generate a report
- [ ] Export as PDF (or HTML for PDF)
- [ ] Verify output contains:
  - [ ] App name only (no logos or icons)
  - [ ] Generation date
  - [ ] Clean formatting
  - [ ] Times New Roman or similar professional font
  - [ ] Black text on white background
  - [ ] No colors or styling
  - [ ] All report sections
  - [ ] Revision summary if applicable
  - [ ] Neutral disclaimer at end

### Submission Packs
- [ ] Navigate to Submission Pack Builder
- [ ] Enter title: "Test Pack Q1"
- [ ] Enter start date: 2024-01-01
- [ ] Enter end date: 2024-03-31
- [ ] Click "Create Submission Pack"
- [ ] Verify success message
- [ ] Verify pack appears in list
- [ ] Verify pack shows:
  - [ ] Title
  - [ ] Date range
  - [ ] Count of included daily logs
  - [ ] Count of included activity logs
  - [ ] Count of revisions
  - [ ] Creation timestamp
  - [ ] "Immutable" badge
- [ ] Verify pack cannot be modified (no edit/delete buttons)

### Legal Language
- [ ] Review all UI text
- [ ] Verify NO phrases like:
  - [ ] "This will help you get approved"
  - [ ] "For best results"
  - [ ] "SSA requires"
  - [ ] "Recommended strategy"
- [ ] Verify disclaimer includes:
  - [ ] "Documents user-reported information only"
  - [ ] "Does not provide medical advice"
  - [ ] "Does not constitute clinical assessment"
- [ ] Review report output
- [ ] Verify only factual statements
- [ ] Verify no legal predictions

### Edge Cases
- [ ] Try to finalize log with no symptoms → should block
- [ ] Try to finalize log with no activity → should block
- [ ] Create revision for non-finalized log → should not be needed
- [ ] Create submission pack with no finalized logs → should warn but allow
- [ ] Create submission pack with invalid date range → should block
- [ ] Generate report with no logs → should handle gracefully
- [ ] View revision history for log with no revisions → should show "No revisions"

### Performance
- [ ] Create 100+ daily logs
- [ ] Enable Evidence Mode
- [ ] Verify app remains responsive
- [ ] Generate report with all logs
- [ ] Verify report generation completes in reasonable time
- [ ] Create submission pack with all logs
- [ ] Verify pack creation completes in reasonable time

### Data Persistence
- [ ] Enable Evidence Mode
- [ ] Create and finalize logs
- [ ] Create revisions
- [ ] Create submission pack
- [ ] Force close app
- [ ] Reopen app
- [ ] Verify Evidence Mode state preserved
- [ ] Verify all finalizations preserved
- [ ] Verify all revisions preserved
- [ ] Verify all packs preserved

## Bug Tracking

### Issues Found
Document any issues found during testing:

| ID | Issue Description | Severity | Status | Notes |
|----|------------------|----------|--------|-------|
| 1  |                  |          |        |       |
| 2  |                  |          |        |       |

### Common Issues and Fixes

**Issue:** Evidence timestamp not appearing
**Cause:** Evidence Mode not loaded or store not initialized
**Fix:** Ensure `evidenceStore.loadEvidenceMode()` is called in app init

**Issue:** Can't edit finalized log at all
**Cause:** Missing revision workflow implementation
**Fix:** Implement revision prompt in edit handler

**Issue:** Revisions not showing in report
**Cause:** Logs not in date range or revision summary not included
**Fix:** Check date filters and ensure revision summary is in report builder

**Issue:** PDF export shows raw HTML
**Cause:** Missing PDF rendering library
**Fix:** Install and integrate expo-print or react-native-pdf

**Issue:** Functional domains showing as "undefined"
**Cause:** Symptom/activity ID not in mapping
**Fix:** Add mapping or handle gracefully with fallback

## Deployment Checklist

Before releasing Evidence Mode to users:

- [ ] All integration steps completed
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Documentation updated
- [ ] In-app help screens created (optional)
- [ ] Legal disclaimer reviewed by attorney (recommended)
- [ ] Privacy policy updated if needed
- [ ] App store description mentions Evidence Mode
- [ ] Screenshots show Evidence Mode features
- [ ] User guide/FAQ created
- [ ] Support channels informed about new features

## Post-Deployment Monitoring

After release, monitor:

- [ ] User adoption rate (how many enable Evidence Mode)
- [ ] Revision frequency (are users creating many revisions?)
- [ ] Report generation success rate
- [ ] Submission pack creation rate
- [ ] User feedback on legal language
- [ ] Bug reports related to finalization/revisions
- [ ] Performance metrics with large datasets

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | TBD  | Initial Evidence Mode implementation |

## Notes

Use this space for implementation notes, decisions, or issues encountered:

```
[Your notes here]
```
