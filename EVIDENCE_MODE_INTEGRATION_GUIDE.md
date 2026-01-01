# Evidence Mode Integration Guide

## Quick Start

This guide shows how to integrate Evidence Mode features into your existing SSDI Symptom Tracker screens.

## 1. Settings Screen Integration

Add Evidence Mode controls to your Settings screen:

```tsx
// src/screens/SettingsScreen.tsx
import { EvidenceModeControls } from '../components';
import { useProfileStore } from '../state/profileStore';
import { useEvidenceModeStore } from '../state/evidenceModeStore';

export function SettingsScreen() {
  const { activeProfile } = useProfileStore();
  const evidenceStore = useEvidenceModeStore();
  
  useEffect(() => {
    evidenceStore.loadEvidenceMode();
  }, []);

  return (
    <ScrollView>
      {/* Existing settings */}
      
      {/* Add Evidence Mode Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Evidence Documentation</Text>
        <EvidenceModeControls profileId={activeProfile.id} />
      </View>
      
      {/* Submission Pack Builder */}
      <SubmissionPackBuilder 
        profileId={activeProfile.id}
        appVersion="1.0.0"
      />
    </ScrollView>
  );
}
```

## 2. Dashboard Integration

Add compact Evidence Mode indicator to your dashboard:

```tsx
// src/screens/DashboardScreen.tsx
import { EvidenceModeControls } from '../components';

export function DashboardScreen() {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <EvidenceModeControls profileId={profileId} compact={true} />
      </View>
      
      {/* Rest of dashboard */}
    </View>
  );
}
```

## 3. Daily Log Screen Integration

Update the Daily Log screen to support finalization and revisions:

```tsx
// src/screens/DailyLogScreen.tsx
import { 
  LogFinalizationControls, 
  RevisionHistoryViewer 
} from '../components';
import { 
  canModifyLog, 
  applyEvidenceTimestamp, 
  updateLogWithRevision 
} from '../services/EvidenceLogService';
import { useEvidenceModeStore } from '../state/evidenceModeStore';

export function DailyLogScreen({ route }) {
  const { logId } = route.params;
  const [log, setLog] = useState<DailyLog | null>(null);
  const [showRevisions, setShowRevisions] = useState(false);
  const evidenceStore = useEvidenceModeStore();
  
  // Load log
  useEffect(() => {
    loadLog();
  }, [logId]);

  const handleSave = async (logData: Partial<DailyLog>) => {
    if (logId) {
      // Editing existing log
      const { canModify, reason } = canModifyLog(logId);
      
      if (!canModify) {
        // Log is finalized - create revision
        Alert.alert(
          'Log is Finalized',
          reason + '\n\nWould you like to create a revision?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Create Revision',
              onPress: () => promptForRevision(logData),
            },
          ]
        );
        return;
      }
      
      // Normal update
      await logStore.updateDailyLog({ ...log, ...logData });
    } else {
      // Creating new log
      let newLog = { ...logData, profileId };
      
      // Apply evidence timestamp if Evidence Mode is enabled
      newLog = applyEvidenceTimestamp(newLog);
      
      await logStore.addDailyLog(newLog);
    }
  };

  const promptForRevision = async (updates: Partial<DailyLog>) => {
    Alert.prompt(
      'Reason for Revision',
      'Please provide a reason for this change:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async (reason) => {
            const result = await updateLogWithRevision(
              logId,
              'daily',
              profileId,
              log,
              updates,
              reason || 'No reason provided'
            );
            
            if (result.success) {
              Alert.alert('Success', 'Revision recorded successfully.');
              loadLog(); // Refresh
            } else {
              Alert.alert('Error', result.error);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  return (
    <ScrollView>
      {/* Show evidence timestamp if present */}
      {log?.evidenceTimestamp && (
        <View style={styles.evidenceBadge}>
          <Text style={styles.evidenceText}>
            Created: {new Date(log.evidenceTimestamp).toLocaleString()}
          </Text>
        </View>
      )}
      
      {/* Existing log form fields */}
      
      {/* Finalization controls */}
      {log && (
        <LogFinalizationControls
          log={log}
          logType="daily"
          profileId={profileId}
          onFinalized={() => loadLog()}
        />
      )}
      
      {/* View revisions button */}
      {evidenceStore.getLogRevisions(logId).length > 0 && (
        <TouchableOpacity onPress={() => setShowRevisions(true)}>
          <Text>View Revision History ({evidenceStore.getLogRevisions(logId).length})</Text>
        </TouchableOpacity>
      )}
      
      {/* Revision history modal */}
      <RevisionHistoryViewer
        logId={logId}
        visible={showRevisions}
        onClose={() => setShowRevisions(false)}
      />
    </ScrollView>
  );
}
```

## 4. Activity Log Screen Integration

Similar pattern for Activity Log screen:

```tsx
// src/screens/ActivityLogScreen.tsx
import { 
  LogFinalizationControls, 
  RevisionHistoryViewer 
} from '../components';
import { applyEvidenceTimestamp, canModifyLog } from '../services/EvidenceLogService';

export function ActivityLogScreen({ route }) {
  // Same pattern as DailyLogScreen
  // Apply evidence timestamp to new logs
  // Check finalization before editing
  // Show finalization controls
  // Display revision history
}
```

## 5. Reports Screen Integration

Update the Reports screen to use Evidence Report Builder:

```tsx
// src/screens/ReportsScreen.tsx
import { buildEvidenceReport, EvidenceReportData } from '../services/EvidenceReportBuilder';
import { generateHTMLForPDF, generatePlainTextReport } from '../services/EvidencePDFExportService';
import { useEvidenceModeStore } from '../state/evidenceModeStore';

export function ReportsScreen() {
  const logStore = useLogStore();
  const evidenceStore = useEvidenceModeStore();
  
  const generateReport = async (startDate: string, endDate: string) => {
    // Filter logs in range
    const dailyLogs = logStore.dailyLogs.filter(log => 
      log.logDate >= startDate && log.logDate <= endDate
    );
    const activityLogs = logStore.activityLogs.filter(log =>
      log.activityDate >= startDate && log.activityDate <= endDate
    );
    
    // Get revisions for these logs
    const logIds = new Set([
      ...dailyLogs.map(l => l.id),
      ...activityLogs.map(l => l.id)
    ]);
    const revisions = evidenceStore.getAllRevisions().filter(r =>
      logIds.has(r.logId)
    );
    
    // Count finalized logs
    const finalizedDaily = dailyLogs.filter(l => evidenceStore.isLogFinalized(l.id)).length;
    const finalizedActivity = activityLogs.filter(l => evidenceStore.isLogFinalized(l.id)).length;
    
    // Build report data
    const reportData: EvidenceReportData = {
      reportTitle: `Symptom Report: ${startDate} to ${endDate}`,
      generatedAt: new Date().toISOString(),
      appVersion: '1.0.0',
      startDate,
      endDate,
      dailyLogs,
      activityLogs,
      revisions,
      finalizedDailyLogs: finalizedDaily,
      finalizedActivityLogs: finalizedActivity,
      profileId: activeProfile.id,
    };
    
    // Generate report
    const report = buildEvidenceReport(reportData);
    
    // Export as PDF or text
    const htmlContent = generateHTMLForPDF(report);
    const textContent = generatePlainTextReport(report);
    
    // Use your PDF export method
    // await sharePDF(htmlContent);
    // or
    // await shareText(textContent);
  };
  
  return (
    <View>
      {/* Date range selector */}
      {/* Generate button calls generateReport() */}
    </View>
  );
}
```

## 6. Update Log Store

Integrate Evidence Mode awareness into log operations:

```tsx
// src/state/logStore.ts
import { applyEvidenceTimestamp } from '../services/EvidenceLogService';

// In addDailyLog:
addDailyLog: async (logData) => {
  const { currentProfileId } = get();
  if (!currentProfileId) return;
  
  try {
    const logId = ids.dailyLog();
    const now = new Date().toISOString();
    
    let newLog: DailyLog = {
      ...logData,
      id: logId,
      profileId: currentProfileId,
      createdAt: now,
      updatedAt: now,
    };
    
    // Apply evidence timestamp if Evidence Mode is active
    newLog = applyEvidenceTimestamp(newLog);
    
    const { dailyLogs } = get();
    const updatedLogs = [...dailyLogs, newLog];
    
    await LogStorage.saveDailyLogs(currentProfileId, updatedLogs);
    set({ dailyLogs: updatedLogs, error: null });
  } catch (error) {
    set({ error: error instanceof Error ? error.message : 'Failed to add daily log' });
  }
},

// Same pattern for addActivityLog
```

## 7. Initialize Evidence Mode on App Start

```tsx
// src/state/useAppState.ts or App.tsx
import { useEvidenceModeStore } from './state/evidenceModeStore';

export function useAppState(): AppState {
  const evidenceStore = useEvidenceModeStore();
  
  // In initializeApp:
  const initializeApp = async () => {
    try {
      await profileStore.loadProfiles();
      await settingsStore.loadSettings();
      await evidenceStore.loadEvidenceMode(); // Add this
      
      // ... rest of initialization
    } catch (error) {
      // handle error
    }
  };
  
  // ... rest of hook
}
```

## 8. Export Utilities

Add utility functions for common operations:

```tsx
// src/utils/evidenceHelpers.ts
import { useEvidenceModeStore } from '../state/evidenceModeStore';

export function isLogReadOnly(logId: string): boolean {
  const evidenceStore = useEvidenceModeStore.getState();
  return evidenceStore.isLogFinalized(logId);
}

export function getLogStatusBadge(logId: string): string {
  const evidenceStore = useEvidenceModeStore.getState();
  
  if (evidenceStore.isLogFinalized(logId)) {
    return 'Finalized';
  }
  
  const revisions = evidenceStore.getLogRevisions(logId);
  if (revisions.length > 0) {
    return `${revisions.length} Revision${revisions.length > 1 ? 's' : ''}`;
  }
  
  return 'Active';
}
```

## Testing Your Integration

1. **Enable Evidence Mode**
   - Go to Settings
   - Toggle Evidence Mode on
   - Create a new daily log
   - Verify it has an `evidenceTimestamp`

2. **Finalize a Log**
   - Create and complete a daily log
   - Click "Finalize Log"
   - Try to edit it - should prompt for revision

3. **Create Revision**
   - Edit a finalized log
   - Provide a reason
   - Check revision history
   - Verify original value is preserved

4. **Generate Report**
   - Go to Reports
   - Select date range
   - Generate report
   - Check for standardized language
   - Verify revision summary appears if applicable

5. **Create Submission Pack**
   - Go to Settings or dedicated Submission Packs screen
   - Create pack with date range
   - Verify pack shows as immutable
   - Check metadata is correct

## Key Points

- Evidence Mode is **opt-in** - users must enable it
- Timestamps are **immutable** once set
- Finalized logs **cannot be deleted** (consider adding a flag check)
- Revisions **preserve original data**
- Reports use **fixed templates** for consistency
- UI uses **neutral language** - no legal advice
- Functional domains are **internal only** - not shown as "SSA fields"

## Common Issues

**Issue:** Evidence timestamp not appearing
**Fix:** Ensure Evidence Mode is enabled before creating log, and `applyEvidenceTimestamp()` is called

**Issue:** Can't edit finalized log
**Expected:** This is correct behavior - create revision instead

**Issue:** Revision not showing in report
**Fix:** Ensure revision summary is included in report builder and logs are in date range

**Issue:** PDF export not working
**Fix:** You'll need to integrate a PDF library like `expo-print` or `react-native-pdf`
