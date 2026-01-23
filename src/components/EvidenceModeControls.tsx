/**
 * Evidence Mode Controls Component
 * Provides UI for enabling/disabling Evidence Mode and viewing status
 * Uses neutral, non-alarmist language
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import { useEvidenceModeStore } from '../state/evidenceModeStore';

interface EvidenceModeControlsProps {
  profileId: string;
  compact?: boolean;
}

export function EvidenceModeControls({ profileId, compact = false }: EvidenceModeControlsProps) {
  const evidenceStore = useEvidenceModeStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    evidenceStore.loadEvidenceMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async (value: boolean) => {
    if (value) {
      // Show confirmation before enabling
      Alert.alert(
        'Enable Evidence Mode',
        'Evidence Mode adds creation timestamps to all logs. These timestamps cannot be edited. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              setLoading(true);
              await evidenceStore.enableEvidenceMode(profileId);
              setLoading(false);
            },
          },
        ]
      );
    } else {
      // Show confirmation before disabling
      Alert.alert(
        'Disable Evidence Mode',
        'Existing logs will keep their timestamps. New logs will not receive timestamps. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            onPress: async () => {
              setLoading(true);
              await evidenceStore.disableEvidenceMode();
              setLoading(false);
            },
          },
        ]
      );
    }
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {evidenceStore.config.enabled && (
          <View style={styles.indicatorBadge}>
            <Text style={styles.indicatorText}>Evidence Mode Active</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Evidence Mode</Text>
        <Switch
          value={evidenceStore.config.enabled}
          onValueChange={handleToggle}
          disabled={loading}
        />
      </View>

      <Text style={styles.description}>
        When enabled, all logs receive creation timestamps that cannot be edited.
        This supports documentation of symptom and activity data.
      </Text>

      {evidenceStore.config.enabled && evidenceStore.config.enabledAt && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Active Since:</Text>
          <Text style={styles.statusValue}>
            {new Date(evidenceStore.config.enabledAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
      )}

      {evidenceStore.error && (
        <Text style={styles.error}>{evidenceStore.error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    marginBottom: 16,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  statusValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  indicatorBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  indicatorText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  error: {
    fontSize: 14,
    color: '#d32f2f',
    marginTop: 8,
  },
});
