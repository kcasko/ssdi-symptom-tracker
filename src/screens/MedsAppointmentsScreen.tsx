/**
 * Medications & Appointments Screen
 * Track treatments and medical visits
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Share,
} from 'react-native';
import { useLogStore, useAppState } from '../state/useAppState';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import {
  Medication,
  MedicationFrequency,
  EffectivenessRating,
  getFrequencyLabel,
} from '../domain/models/Medication';
import {
  Appointment,
  getProviderTypeLabel,
  getPurposeLabel,
} from '../domain/models/Appointment';
import { AppointmentSummaryService, AppointmentPreparationSummary } from '../services/AppointmentSummaryService';

type Tab = 'medications' | 'appointments';

export const MedsAppointmentsScreen: React.FC = () => {
  const medications = useLogStore(state => state.medications);
  const addMedication = useLogStore(state => state.addMedication);
  const updateMedication = useLogStore(state => state.updateMedication);
  const deleteMedication = useLogStore(state => state.deleteMedication);
  
  const appointments = useLogStore(state => state.appointments);
  const deleteAppointment = useLogStore(state => state.deleteAppointment);
  
  const { dailyLogs, activityLogs, limitations } = useAppState();
  
  const [activeTab, setActiveTab] = useState<Tab>('medications');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [showSideEffectsModal, setShowSideEffectsModal] = useState(false);
  const [selectedMedForSideEffects, setSelectedMedForSideEffects] = useState<Medication | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<AppointmentPreparationSummary | null>(null);
  // ...existing code...

  const activeMeds = medications.filter(m => m.isActive);
  const inactiveMeds = medications.filter(m => !m.isActive);
  
  const upcomingAppts = appointments.filter(a => {
    const apptDate = new Date(a.appointmentDate);
    const now = new Date();
    return apptDate >= now && a.status === 'scheduled';
  }).sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate));
  
  const pastAppts = appointments.filter(a => {
    const apptDate = new Date(a.appointmentDate);
    const now = new Date();
    return apptDate < now || a.status !== 'scheduled';
  }).sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate));

  const handleAddMedication = () => {
    setEditingMed(null);
    setShowAddModal(true);
  };

  const handleEditMedication = (med: Medication) => {
    setEditingMed(med);
    setShowAddModal(true);
  };

  const handleManageSideEffects = (med: Medication) => {
    setSelectedMedForSideEffects(med);
    setShowSideEffectsModal(true);
  };

  const handleDeleteMedication = (medId: string) => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMedication(medId),
        },
      ]
    );
  };
  
  const handleAddAppointment = () => {
    setEditingAppt(null);
    setShowApptModal(true);
  };
  
  const handleEditAppointment = (appt: Appointment) => {
    setEditingAppt(appt);
    setShowApptModal(true);
  };
  
  const handleDeleteAppointment = (apptId: string) => {
    Alert.alert(
      'Delete Appointment',
      'Are you sure you want to delete this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAppointment(apptId),
        },
      ]
    );
  };
  
  const handleViewSummary = (appt: Appointment) => {
    const summary = AppointmentSummaryService.generatePreparationSummary(
      appt,
      dailyLogs,
      activityLogs,
      limitations,
      medications
    );
    setSelectedSummary(summary);
    setShowSummaryModal(true);
  };
  
  const handleShareSummary = async () => {
    if (!selectedSummary) return;
    
    const text = AppointmentSummaryService.formatSummaryAsText(selectedSummary);
    
    try {
      await Share.share({
        message: text,
        title: 'Appointment Preparation Summary',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Medications & Appointments</Text>
        <Text style={styles.subtitle}>Treatment tracking for medical documentation</Text>
        
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'medications' && styles.activeTab]}
            onPress={() => setActiveTab('medications')}
          >
            <Text style={[styles.tabText, activeTab === 'medications' && styles.activeTabText]}>
              Medications
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'appointments' && styles.activeTab]}
            onPress={() => setActiveTab('appointments')}
          >
            <Text style={[styles.tabText, activeTab === 'appointments' && styles.activeTabText]}>
              Appointments
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContent}>
        {activeTab === 'medications' && renderMedicationsTab()}
        {activeTab === 'appointments' && renderAppointmentsTab()}
      </ScrollView>

      <MedicationModal
        visible={showAddModal}
        medication={editingMed}
        onClose={() => setShowAddModal(false)}
        onSave={async (medData) => {
          if (editingMed) {
            await updateMedication({ ...editingMed, ...medData, updatedAt: new Date().toISOString() });
          } else {
            await addMedication(medData);
          }
          setShowAddModal(false);
        }}
      />

      <SideEffectsModal
        visible={showSideEffectsModal}
        medication={selectedMedForSideEffects}
        onClose={() => setShowSideEffectsModal(false)}
        onSave={async (sideEffects) => {
          if (selectedMedForSideEffects) {
            await updateMedication({
              ...selectedMedForSideEffects,
              sideEffects,
              updatedAt: new Date().toISOString(),
            });
          }
          setShowSideEffectsModal(false);
        }}
      />
      
      <AppointmentPreparationModal
        visible={showSummaryModal}
        summary={selectedSummary}
        onClose={() => setShowSummaryModal(false)}
        onShare={handleShareSummary}
      />
    </View>
  );
  
  function renderMedicationsTab() {
    return (
      <>
        {/* Active Medications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Medications</Text>
            <TouchableOpacity onPress={handleAddMedication} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {activeMeds.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No active medications</Text>
              <Text style={styles.emptySubtext}>Tap "Add" to track your medications</Text>
            </View>
          ) : (
            activeMeds.map(med => (
              <MedicationCard
                key={med.id}
                medication={med}
                onEdit={handleEditMedication}
                onDelete={handleDeleteMedication}
                onManageSideEffects={handleManageSideEffects}
              />
            ))
          )}
        </View>

        {/* Inactive Medications */}
        {inactiveMeds.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Discontinued Medications</Text>
            {inactiveMeds.map(med => (
              <MedicationCard
                key={med.id}
                medication={med}
                onEdit={handleEditMedication}
                onDelete={handleDeleteMedication}
                onManageSideEffects={handleManageSideEffects}
              />
            ))}
          </View>
        )}
      </>
    );
  }
  
  function renderAppointmentsTab() {
    return (
      <>
        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <TouchableOpacity onPress={handleAddAppointment} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {upcomingAppts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No upcoming appointments</Text>
              <Text style={styles.emptySubtext}>Tap "Add" to schedule an appointment</Text>
            </View>
          ) : (
            upcomingAppts.map(appt => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onEdit={handleEditAppointment}
                onDelete={handleDeleteAppointment}
                onViewSummary={handleViewSummary}
                showSummaryButton={true}
              />
            ))
          )}
        </View>

        {/* Past Appointments */}
        {pastAppts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past Appointments</Text>
            {pastAppts.slice(0, 10).map(appt => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onEdit={handleEditAppointment}
                onDelete={handleDeleteAppointment}
                onViewSummary={handleViewSummary}
                showSummaryButton={false}
              />
            ))}
          </View>
        )}
      </>
    );
  }
};

interface MedicationCardProps {
  medication: Medication;
  onEdit: (med: Medication) => void;
  onDelete: (medId: string) => void;
  onManageSideEffects: (med: Medication) => void;
}

const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  onEdit,
  onDelete,
  onManageSideEffects,
}) => {
  return (
    <View style={[styles.card, !medication.isActive && styles.inactiveCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleSection}>
          <Text style={styles.medName}>{medication.name}</Text>
          {medication.genericName && (
            <Text style={styles.genericName}>({medication.genericName})</Text>
          )}
        </View>
        {!medication.isActive && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveBadgeText}>Discontinued</Text>
          </View>
        )}
      </View>

      <Text style={styles.dosage}>{medication.dosage}</Text>
      <Text style={styles.frequency}>{getFrequencyLabel(medication.frequency)}</Text>

      {medication.purpose.length > 0 && (
        <Text style={styles.purpose}>For: {medication.purpose.join(', ')}</Text>
      )}

      {medication.sideEffects && medication.sideEffects.length > 0 && (
        <View style={styles.sideEffectsSection}>
          <Text style={styles.sideEffectsLabel}>Side Effects:</Text>
          <Text style={styles.sideEffectsText}>{medication.sideEffects.join(', ')}</Text>
        </View>
      )}

      {medication.effectiveness && (
        <View style={styles.effectivenessSection}>
          <Text style={styles.effectivenessLabel}>Effectiveness:</Text>
          <Text style={styles.effectivenessValue}>
            {medication.effectiveness.replace(/_/g, ' ')}
          </Text>
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => onManageSideEffects(medication)} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Side Effects</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onEdit(medication)} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(medication.id)} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface MedicationModalProps {
  visible: boolean;
  medication: Medication | null;
  onClose: () => void;
  onSave: (medData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const MedicationModal: React.FC<MedicationModalProps> = ({ visible, medication, onClose, onSave }) => {
  const currentProfileId = useLogStore(state => state.currentProfileId);
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<MedicationFrequency>('as_needed');
  const [purpose, setPurpose] = useState('');
  const [prescriber, setPrescriber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [effectiveness, setEffectiveness] = useState<EffectivenessRating | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  React.useEffect(() => {
    if (medication) {
      setName(medication.name);
      setGenericName(medication.genericName || '');
      setDosage(medication.dosage);
      setFrequency(medication.frequency);
      setPurpose(medication.purpose.join(', '));
      setPrescriber(medication.prescriber || '');
      setStartDate(medication.startDate || '');
      setEffectiveness(medication.effectiveness);
      setNotes(medication.notes || '');
      setIsActive(medication.isActive);
    } else {
      // Reset for new medication
      setName('');
      setGenericName('');
      setDosage('');
      setFrequency('as_needed');
      setPurpose('');
      setPrescriber('');
      setStartDate('');
      setEffectiveness(undefined);
      setNotes('');
      setIsActive(true);
    }
  }, [medication, visible]);

  const handleSave = async () => {
    if (!name.trim() || !dosage.trim() || !currentProfileId) {
      Alert.alert('Error', 'Please fill in required fields (name and dosage)');
      return;
    }

    const medData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'> = {
      profileId: currentProfileId,
      name: name.trim(),
      genericName: genericName.trim() || undefined,
      dosage: dosage.trim(),
      frequency,
      purpose: purpose.split(',').map(p => p.trim()).filter(p => p),
      prescriber: prescriber.trim() || undefined,
      startDate: startDate || undefined,
      sideEffects: medication?.sideEffects || [],
      effectiveness,
      notes: notes.trim() || undefined,
      isActive,
    };

    await onSave(medData);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{medication ? 'Edit' : 'Add'} Medication</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Medication Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Gabapentin"
              placeholderTextColor={colors.gray400}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Generic Name</Text>
            <TextInput
              style={styles.input}
              value={genericName}
              onChangeText={setGenericName}
              placeholder="Optional"
              placeholderTextColor={colors.gray400}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Dosage *</Text>
            <TextInput
              style={styles.input}
              value={dosage}
              onChangeText={setDosage}
              placeholder="e.g., 300mg"
              placeholderTextColor={colors.gray400}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Purpose (comma-separated)</Text>
            <TextInput
              style={styles.input}
              value={purpose}
              onChangeText={setPurpose}
              placeholder="e.g., Pain, Nerve pain"
              placeholderTextColor={colors.gray400}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Prescriber</Text>
            <TextInput
              style={styles.input}
              value={prescriber}
              onChangeText={setPrescriber}
              placeholder="Doctor's name"
              placeholderTextColor={colors.gray400}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Start Date</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.gray400}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              placeholderTextColor={colors.gray400}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <TouchableOpacity
              onPress={() => setIsActive(!isActive)}
              style={styles.checkboxRow}
            >
              <View style={[styles.checkbox, isActive && styles.checkboxChecked]}>
                {isActive && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Currently taking this medication</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Medication</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

interface SideEffectsModalProps {
  visible: boolean;
  medication: Medication | null;
  onClose: () => void;
  onSave: (sideEffects: string[]) => Promise<void>;
}

const SideEffectsModal: React.FC<SideEffectsModalProps> = ({ visible, medication, onClose, onSave }) => {
  const [sideEffects, setSideEffects] = useState<string[]>([]);
  const [newSideEffect, setNewSideEffect] = useState('');

  React.useEffect(() => {
    if (medication) {
      setSideEffects(medication.sideEffects || []);
    }
  }, [medication, visible]);

  const handleAddSideEffect = () => {
    if (newSideEffect.trim()) {
      setSideEffects([...sideEffects, newSideEffect.trim()]);
      setNewSideEffect('');
    }
  };

  const handleRemoveSideEffect = (index: number) => {
    setSideEffects(sideEffects.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    await onSave(sideEffects);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Side Effects - {medication?.name}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.sideEffectsInstructions}>
            Track side effects to correlate with symptom changes. This helps document medication impact for medical records.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Add Side Effect</Text>
            <View style={styles.addSideEffectRow}>
              <TextInput
                style={[styles.input, styles.sideEffectInput]}
                value={newSideEffect}
                onChangeText={setNewSideEffect}
                placeholder="e.g., Dizziness, Nausea"
                placeholderTextColor={colors.gray400}
                onSubmitEditing={handleAddSideEffect}
              />
              <TouchableOpacity onPress={handleAddSideEffect} style={styles.addSideEffectButton}>
                <Text style={styles.addSideEffectButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sideEffectsList}>
            {sideEffects.length === 0 ? (
              <Text style={styles.noSideEffects}>No side effects logged</Text>
            ) : (
              sideEffects.map((effect, index) => (
                <View key={index} style={styles.sideEffectItem}>
                  <Text style={styles.sideEffectText}>{effect}</Text>
                  <TouchableOpacity onPress={() => handleRemoveSideEffect(index)}>
                    <Text style={styles.removeSideEffect}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Side Effects</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: (appt: Appointment) => void;
  onDelete: (apptId: string) => void;
  onViewSummary: (appt: Appointment) => void;
  showSummaryButton: boolean;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onEdit,
  onDelete,
  onViewSummary,
  showSummaryButton,
}) => {
  const apptDate = new Date(appointment.appointmentDate);
  const isPast = apptDate < new Date();
  
  return (
    <View style={[styles.card, isPast && styles.pastApptCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleSection}>
          <Text style={styles.medName}>{appointment.providerName}</Text>
          <Text style={styles.genericName}>{getProviderTypeLabel(appointment.providerType)}</Text>
        </View>
        <View style={[styles.statusBadge, styles[`status_${appointment.status}`]]}>
          <Text style={styles.statusBadgeText}>{appointment.status}</Text>
        </View>
      </View>
      
      <Text style={styles.dosage}>
        {apptDate.toLocaleDateString()} {appointment.appointmentTime && `at ${appointment.appointmentTime}`}
      </Text>
      <Text style={styles.purpose}>Purpose: {getPurposeLabel(appointment.purpose)}</Text>
      
      {appointment.facilityName && (
        <Text style={styles.frequency}>Facility: {appointment.facilityName}</Text>
      )}
      
      {appointment.preAppointmentNotes && (
        <View style={styles.notesSection}>
          <Text style={styles.sideEffectsLabel}>Notes:</Text>
          <Text style={styles.sideEffectsText}>{appointment.preAppointmentNotes}</Text>
        </View>
      )}
      
      <View style={styles.cardActions}>
        {showSummaryButton && (
          <TouchableOpacity onPress={() => onViewSummary(appointment)} style={styles.primaryActionButton}>
            <Text style={styles.primaryActionButtonText}>Preparation Summary</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => onEdit(appointment)} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(appointment.id)} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface AppointmentPreparationModalProps {
  visible: boolean;
  summary: AppointmentPreparationSummary | null;
  onClose: () => void;
  onShare: () => void;
}

const AppointmentPreparationModal: React.FC<AppointmentPreparationModalProps> = ({
  visible,
  summary,
  onClose,
  onShare,
}) => {
  if (!summary) return null;
  
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.summaryModalContainer}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.summaryTitle}>Appointment Preparation</Text>
            <Text style={styles.summarySubtitle}>
              {summary.appointment.providerName} - {new Date(summary.appointment.appointmentDate).toLocaleDateString()}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.summaryContent}>
          {/* Day Quality */}
          <View style={styles.summarySection}>
            <Text style={styles.summarySectionTitle}>Functional Status</Text>
            <Text style={styles.summaryText}>
              Good Days: {summary.dayQualitySummary.goodDays} | Bad Days: {summary.dayQualitySummary.badDays} ({summary.dayQualitySummary.percentage}%)
            </Text>
            <Text style={styles.summaryText}>Trend: {summary.dayQualitySummary.trend}</Text>
          </View>
          
          {/* Recent Symptoms */}
          {summary.recentSymptoms.length > 0 && (
            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>Recent Symptoms</Text>
              {summary.recentSymptoms.slice(0, 5).map((symptom, i) => (
                <View key={i} style={styles.summaryItem}>
                  <Text style={styles.summaryBullet}>•</Text>
                  <Text style={styles.summaryText}>
                    {symptom.symptomName}: {symptom.frequency}% of days, avg {symptom.averageSeverity}/10 ({symptom.trend})
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Changed Symptoms */}
          {summary.changedSymptoms.length > 0 && (
            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>New or Changed Symptoms</Text>
              {summary.changedSymptoms.map((change, i) => (
                <View key={i} style={styles.summaryItem}>
                  <Text style={styles.summaryBullet}>•</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryHighlight}>{change.symptomName} ({change.change})</Text>
                    <Text style={styles.summaryDetail}>{change.details}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          
          {/* Activity Limitations */}
          {summary.recentLimitations.length > 0 && (
            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>Activity Limitations</Text>
              {summary.recentLimitations.map((limitation, i) => (
                <View key={i} style={styles.summaryItem}>
                  <Text style={styles.summaryBullet}>•</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryText}>
                      {limitation.activityName} (Impact: {limitation.impactLevel}/10, {limitation.frequency}% of attempts)
                    </Text>
                    {limitation.examples.map((example, j) => (
                      <Text key={j} style={styles.summaryDetail}>  - {example}</Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
          
          {/* Medication Changes */}
          {summary.medicationChanges.length > 0 && (
            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>Medication Updates</Text>
              {summary.medicationChanges.map((change, i) => (
                <View key={i} style={styles.summaryItem}>
                  <Text style={styles.summaryBullet}>•</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryText}>
                      {change.medicationName} ({change.status})
                    </Text>
                    {change.effectiveness && (
                      <Text style={styles.summaryDetail}>Effectiveness: {change.effectiveness}</Text>
                    )}
                    {change.sideEffects && change.sideEffects.length > 0 && (
                      <Text style={styles.summaryDetail}>Side effects: {change.sideEffects.join(', ')}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
          
          {/* Discussion Points */}
          {summary.discussionPoints.length > 0 && (
            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>Key Discussion Points</Text>
              {summary.discussionPoints.map((point, i) => (
                <View key={i} style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{i + 1}.</Text>
                  <Text style={styles.summaryText}>{point}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Questions */}
          {summary.suggestedQuestions.length > 0 && (
            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>Questions for Provider</Text>
              {summary.suggestedQuestions.map((question, i) => (
                <View key={i} style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{i + 1}.</Text>
                  <Text style={styles.summaryText}>{question}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
        
        <View style={styles.summaryActions}>
          <TouchableOpacity onPress={onShare} style={styles.shareButton}>
            <Text style={styles.shareButtonText}>Share Summary</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeActionButton}>
            <Text style={styles.closeActionButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  title: {
    ...typography.displayMedium,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.gray600,
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.headlineSmall,
    color: colors.gray900,
  },
  addButton: {
    backgroundColor: colors.primaryMain,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  addButtonText: {
    ...typography.labelLarge,
    color: colors.white,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyLarge,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.bodyMedium,
    color: colors.gray500,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryMain,
  },
  inactiveCard: {
    borderLeftColor: colors.gray400,
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  cardTitleSection: {
    flex: 1,
  },
  medName: {
    ...typography.titleMedium,
    color: colors.gray900,
  },
  genericName: {
    ...typography.bodySmall,
    color: colors.gray600,
    fontStyle: 'italic',
  },
  inactiveBadge: {
    backgroundColor: colors.gray200,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  inactiveBadgeText: {
    ...typography.labelSmall,
    color: colors.gray700,
  },
  dosage: {
    ...typography.bodyLarge,
    color: colors.gray800,
    marginBottom: spacing.xs,
  },
  frequency: {
    ...typography.bodyMedium,
    color: colors.gray600,
    marginBottom: spacing.sm,
  },
  purpose: {
    ...typography.bodyMedium,
    color: colors.gray700,
    marginBottom: spacing.sm,
  },
  sideEffectsSection: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.warning.light,
    borderRadius: 6,
  },
  sideEffectsLabel: {
    ...typography.labelMedium,
    color: colors.warning.dark,
    marginBottom: spacing.xs,
  },
  sideEffectsText: {
    ...typography.bodyMedium,
    color: colors.gray800,
  },
  effectivenessSection: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  effectivenessLabel: {
    ...typography.labelMedium,
    color: colors.gray700,
    marginRight: spacing.xs,
  },
  effectivenessValue: {
    ...typography.bodyMedium,
    color: colors.primaryMain,
    textTransform: 'capitalize',
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    backgroundColor: colors.gray100,
    alignItems: 'center',
  },
  actionButtonText: {
    ...typography.labelMedium,
    color: colors.primaryMain,
  },
  deleteButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    backgroundColor: colors.error.light,
    alignItems: 'center',
  },
  deleteButtonText: {
    ...typography.labelMedium,
    color: colors.error.main,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalTitle: {
    ...typography.headlineMedium,
    color: colors.gray900,
  },
  modalClose: {
    ...typography.labelLarge,
    color: colors.primaryMain,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.labelLarge,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.bodyLarge,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.gray900,
    backgroundColor: colors.white,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.gray400,
    borderRadius: 4,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primaryMain,
    borderColor: colors.primaryMain,
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    ...typography.bodyMedium,
    color: colors.gray800,
  },
  modalActions: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  saveButton: {
    backgroundColor: colors.primaryMain,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    ...typography.labelLarge,
    color: colors.white,
  },
  sideEffectsInstructions: {
    ...typography.bodyMedium,
    color: colors.gray700,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: 8,
  },
  addSideEffectRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sideEffectInput: {
    flex: 1,
  },
  addSideEffectButton: {
    backgroundColor: colors.primaryMain,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: 8,
  },
  addSideEffectButtonText: {
    ...typography.labelMedium,
    color: colors.white,
  },
  sideEffectsList: {
    marginTop: spacing.md,
  },
  noSideEffects: {
    ...typography.bodyMedium,
    color: colors.gray500,
    textAlign: 'center',
    padding: spacing.lg,
  },
  sideEffectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  sideEffectText: {
    ...typography.bodyMedium,
    color: colors.gray900,
    flex: 1,
  },
  removeSideEffect: {
    ...typography.titleMedium,
    color: colors.error.main,
    paddingHorizontal: spacing.sm,
  },
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    marginTop: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.gray200,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -2,
  },
  activeTab: {
    borderBottomColor: colors.primaryMain,
  },
  tabText: {
    ...typography.labelLarge,
    color: colors.gray600,
  },
  activeTabText: {
    color: colors.primaryMain,
    fontWeight: '600',
  },
  // Appointment specific
  pastApptCard: {
    borderLeftColor: colors.gray300,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  status_scheduled: {
    backgroundColor: colors.primary[100],
  },
  status_completed: {
    backgroundColor: colors.success.light,
  },
  status_cancelled: {
    backgroundColor: colors.gray[200],
  },
  status_rescheduled: {
    backgroundColor: colors.warning.light,
  },
  status_no_show: {
    backgroundColor: colors.error.light,
  },
  statusBadgeText: {
    ...typography.labelSmall,
    color: colors.gray700,
    textTransform: 'capitalize',
  },
  notesSection: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.gray50,
    borderRadius: 6,
  },
  primaryActionButton: {
    backgroundColor: colors.primaryMain,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
  },
  primaryActionButtonText: {
    ...typography.labelMedium,
    color: colors.white,
  },
  // Summary Modal
  summaryModalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  summaryTitle: {
    ...typography.displaySmall,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  summarySubtitle: {
    ...typography.bodyMedium,
    color: colors.gray600,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    ...typography.titleLarge,
    color: colors.gray600,
  },
  summaryContent: {
    flex: 1,
    padding: spacing.lg,
  },
  summarySection: {
    marginBottom: spacing.lg,
  },
  summarySectionTitle: {
    ...typography.titleMedium,
    color: colors.gray900,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  summaryItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  summaryBullet: {
    ...typography.bodyMedium,
    color: colors.gray600,
    marginRight: spacing.sm,
  },
  summaryNumber: {
    ...typography.bodyMedium,
    color: colors.gray600,
    marginRight: spacing.sm,
    fontWeight: '600',
  },
  summaryText: {
    ...typography.bodyMedium,
    color: colors.gray800,
    flex: 1,
  },
  summaryHighlight: {
    ...typography.bodyMedium,
    color: colors.gray900,
    fontWeight: '600',
  },
  summaryDetail: {
    ...typography.bodySmall,
    color: colors.gray600,
    marginTop: spacing.xs,
  },
  summaryActions: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  shareButton: {
    flex: 1,
    backgroundColor: colors.primaryMain,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    ...typography.labelLarge,
    color: colors.white,
  },
  closeActionButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray400,
    alignItems: 'center',
  },
  closeActionButtonText: {
    ...typography.labelLarge,
    color: colors.gray700,
  },
});
