/**
 * Log Finalization Component
 * Provides UI for finalizing logs and viewing finalization status
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useEvidenceModeStore } from '../state/evidenceModeStore';
import { canFinalizeLog, getFinalizationStatus, getRevisionCount } from '../services/EvidenceLogService';
import { DailyLog } from '../domain/models/DailyLog';
import { ActivityLog } from '../domain/models/ActivityLog';

interface LogFinalizationControlsProps {
  log: DailyLog | ActivityLog;
  logType: 'daily' | 'activity';
  profileId: string;
  onFinalized?: () => void;
}

export function LogFinalizationControls({
  log,
  logType,
  profileId,
  onFinalized,
}: LogFinalizationControlsProps) {
  const evidenceStore = useEvidenceModeStore();
  const [loading, setLoading] = useState(false);

  const isFinalized = evidenceStore.isLogFinalized(log.id);
  const revisionCount = getRevisionCount(log.id);
  const finalizationStatus = getFinalizationStatus(log.id);

  const handleFinalize = () => {
    const validation = canFinalizeLog(log);
    
    if (!validation.canFinalize) {
      Alert.alert('Cannot Finalize', validation.reason || 'This log cannot be finalized.');
      return;
    }

    Alert.alert(
      'Finalize Log',
      'Finalizing this log will make it read-only. Any future changes will be tracked as revisions. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finalize',
          onPress: async () => {
            setLoading(true);
            await evidenceStore.finalizeLog(log.id, logType, profileId);
            setLoading(false);
            onFinalized?.();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={[styles.statusValue, isFinalized && styles.finalizedText]}>
          {finalizationStatus}
        </Text>
      </View>

      {isFinalized && revisionCount > 0 && (
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Revisions:</Text>
          <Text style={styles.statusValue}>{revisionCount}</Text>
        </View>
      )}

      {!isFinalized && (
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleFinalize}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Finalizing...' : 'Finalize Log'}
          </Text>
        </TouchableOpacity>
      )}

      {isFinalized && (
        <View style={styles.readOnlyBadge}>
          <Text style={styles.readOnlyText}>Read-Only</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: '#000',
  },
  finalizedText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#bdbdbd',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  readOnlyBadge: {
    backgroundColor: '#fff3e0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  readOnlyText: {
    color: '#e65100',
    fontSize: 12,
    fontWeight: '600',
  },
});
