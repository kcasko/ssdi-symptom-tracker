/**
 * Revision History Viewer Component
 * Displays revision history for finalized logs
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useEvidenceModeStore } from '../state/evidenceModeStore';
import { RevisionRecord, RevisionReasonCategory } from '../domain/models/EvidenceMode';

interface RevisionHistoryViewerProps {
  logId: string;
  visible: boolean;
  onClose: () => void;
}

export function RevisionHistoryViewer({
  logId,
  visible,
  onClose,
}: RevisionHistoryViewerProps) {
  const evidenceStore = useEvidenceModeStore();
  const [revisions, setRevisions] = useState<RevisionRecord[]>([]);

  useEffect(() => {
    if (visible) {
      const logRevisions = evidenceStore.getLogRevisions(logId);
      const sorted = [...logRevisions].sort((a, b) => 
        new Date(b.revisionTimestamp).getTime() - new Date(a.revisionTimestamp).getTime()
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRevisions(sorted);
    } else {
      setRevisions([]);
    }
  }, [visible, logId, evidenceStore]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Revision History</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            {revisions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No revisions recorded.</Text>
              </View>
            ) : (
              revisions.map((revision, index) => (
                <RevisionCard key={revision.id} revision={revision} index={index} />
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface RevisionCardProps {
  revision: RevisionRecord;
  index: number;
}

function RevisionCard({ revision, index }: RevisionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const reasonLabels: Record<RevisionReasonCategory, string> = {
    typo_correction: 'Typo correction',
    added_detail_omitted_earlier: 'Added detail omitted earlier',
    correction_after_reviewing_records: 'Correction after reviewing records',
    clarification_requested: 'Clarification at request of third party',
    other: 'Other',
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'None';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <View style={styles.revisionCard}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={styles.revisionHeader}
      >
        <View style={styles.revisionHeaderContent}>
          <Text style={styles.revisionNumber}>Revision {index + 1}</Text>
          <Text style={styles.revisionTimestamp}>
            {formatTimestamp(revision.revisionTimestamp)}
          </Text>
        </View>
        <View style={styles.reasonPill}>
          <Text style={styles.reasonText}>
            {reasonLabels[revision.reasonCategory] || 'Other'}
          </Text>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '−' : '+'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.revisionDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Field Changed:</Text>
            <Text style={styles.detailValue}>{revision.fieldPath}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reason:</Text>
            <Text style={styles.detailValue}>
              {reasonLabels[revision.reasonCategory] || 'Other'}
              {revision.reasonNote ? ` — ${revision.reasonNote}` : ''}
            </Text>
          </View>

          {revision.summary && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Summary:</Text>
              <Text style={styles.detailValue}>{revision.summary}</Text>
            </View>
          )}

          <View style={styles.valueComparison}>
            <View style={styles.valueBlock}>
              <Text style={styles.valueLabel}>Original Value:</Text>
              <View style={styles.valueBox}>
                <Text style={styles.valueText}>
                  {formatValue(revision.originalValue)}
                </Text>
              </View>
            </View>

            <View style={styles.valueBlock}>
              <Text style={styles.valueLabel}>Updated Value:</Text>
              <View style={styles.valueBox}>
                <Text style={styles.valueText}>
                  {formatValue(revision.updatedValue)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: '500',
  },
  scrollView: {
    padding: 16,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  revisionCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  revisionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  revisionHeaderContent: {
    flex: 1,
  },
  revisionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  revisionTimestamp: {
    fontSize: 14,
    color: '#666',
  },
  reasonPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#eef2f7',
    borderRadius: 12,
    marginLeft: 8,
  },
  reasonText: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 24,
    color: '#666',
    width: 24,
    textAlign: 'center',
  },
  revisionDetails: {
    padding: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
  },
  valueComparison: {
    marginTop: 8,
  },
  valueBlock: {
    marginBottom: 12,
  },
  valueLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '600',
  },
  valueBox: {
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  valueText: {
    fontSize: 13,
    color: '#000',
    fontFamily: 'monospace',
  },
});
