/**
 * Profile Creation Screen
 * Comprehensive profile setup with essential information
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { BigButton } from '../components';
import { useAppState } from '../state/useAppState';
import { SYMPTOMS, SymptomDefinition } from '../data/symptoms';
import { ACTIVITIES, ActivityDefinition } from '../data/activities';
import { Profile } from '../domain/models/Profile';

type ProfileCreationProps = NativeStackScreenProps<RootStackParamList, 'ProfileCreation'>;

export const ProfileCreationScreen: React.FC<ProfileCreationProps> = ({ navigation }) => {
  const { createProfile, setActiveProfile } = useAppState();
  
  const [formData, setFormData] = useState({
    name: '',
    primaryConditions: [] as string[],
    defaultSymptoms: [] as string[],
    defaultActivities: [] as string[],
    dailyLogEnabled: true,
    dailyLogTime: '09:00',
    activityPromptEnabled: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Basic Information',
    'Primary Conditions',
    'Common Symptoms',
    'Frequent Activities', 
    'Reminder Settings',
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCreateProfile();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleCreateProfile = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a profile name');
      return;
    }

    setLoading(true);
    
    try {
      // Create profile with collected information
      const profileId = await createProfile(formData.name.trim(), {
        primaryConditions: formData.primaryConditions,
        settings: {
          defaultSymptoms: formData.defaultSymptoms,
          defaultActivities: formData.defaultActivities,
          reminders: {
            dailyLogEnabled: formData.dailyLogEnabled,
            dailyLogTime: formData.dailyLogTime,
            activityPromptEnabled: formData.activityPromptEnabled,
          },
          reportPreferences: {
            includeDetailedNotes: true,
            defaultDateRange: 'month',
          },
        },
      } as Partial<Profile>);

      if (profileId) {
        await setActiveProfile(profileId);
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Error', 'Failed to create profile. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCondition = (condition: string) => {
    setFormData(prev => ({
      ...prev,
      primaryConditions: prev.primaryConditions.includes(condition)
        ? prev.primaryConditions.filter(c => c !== condition)
        : [...prev.primaryConditions, condition],
    }));
  };

  const toggleSymptom = (symptomId: string) => {
    setFormData(prev => ({
      ...prev,
      defaultSymptoms: prev.defaultSymptoms.includes(symptomId)
        ? prev.defaultSymptoms.filter(s => s !== symptomId)
        : [...prev.defaultSymptoms, symptomId],
    }));
  };

  const toggleActivity = (activityId: string) => {
    setFormData(prev => ({
      ...prev,
      defaultActivities: prev.defaultActivities.includes(activityId)
        ? prev.defaultActivities.filter(a => a !== activityId)
        : [...prev.defaultActivities, activityId],
    }));
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((_, index) => (
        <View key={index} style={styles.stepIndicatorContainer}>
          <View style={[
            styles.stepDot,
            index <= currentStep && styles.stepDotActive,
          ]} />
          {index < steps.length - 1 && (
            <View style={[
              styles.stepLine,
              index < currentStep && styles.stepLineActive,
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepDescription}>
        Let's start with a name for your profile. This helps organize your data if you manage multiple profiles.
      </Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Profile Name *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          placeholder="e.g., My Health Profile, John's Data"
          placeholderTextColor={colors.gray500}
          maxLength={50}
        />
        <Text style={styles.inputHint}>
          Choose a meaningful name that helps you identify this profile
        </Text>
      </View>
    </View>
  );

  const renderConditions = () => {
    const commonConditions = [
      'Chronic Pain', 'Fibromyalgia', 'Arthritis', 'Back Pain', 'Chronic Fatigue Syndrome',
      'Depression', 'Anxiety', 'PTSD', 'Bipolar Disorder', 'ADHD',
      'Diabetes', 'Heart Disease', 'Autoimmune Disorder', 'Neurological Condition',
      'Digestive Issues', 'Sleep Disorders', 'Migraine/Headaches', 'Other',
    ];

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Primary Conditions</Text>
        <Text style={styles.stepDescription}>
          Select your primary health conditions. This helps tailor symptom suggestions and report generation.
        </Text>
        
        <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
          {commonConditions.map((condition) => (
            <TouchableOpacity
              key={condition}
              style={[
                styles.optionItem,
                formData.primaryConditions.includes(condition) && styles.optionItemSelected,
              ]}
              onPress={() => toggleCondition(condition)}
            >
              <Text style={[
                styles.optionText,
                formData.primaryConditions.includes(condition) && styles.optionTextSelected,
              ]}>
                {condition}
              </Text>
              {formData.primaryConditions.includes(condition) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderSymptoms = () => {
    const topSymptoms = SYMPTOMS.slice(0, 12); // Show most common symptoms

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Common Symptoms</Text>
        <Text style={styles.stepDescription}>
          Select symptoms you experience regularly. These will be pre-selected for quick daily logging.
        </Text>
        
        <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
          {topSymptoms.map((symptom: SymptomDefinition) => (
            <TouchableOpacity
              key={symptom.id}
              style={[
                styles.optionItem,
                formData.defaultSymptoms.includes(symptom.id) && styles.optionItemSelected,
              ]}
              onPress={() => toggleSymptom(symptom.id)}
            >
              <View>
                <Text style={[
                  styles.optionText,
                  formData.defaultSymptoms.includes(symptom.id) && styles.optionTextSelected,
                ]}>
                  {symptom.name}
                </Text>
                <Text style={styles.optionSubtext}>
                  {symptom.description}
                </Text>
              </View>
              {formData.defaultSymptoms.includes(symptom.id) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderActivities = () => {
    const topActivities = ACTIVITIES.slice(0, 10); // Show most common activities

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Frequent Activities</Text>
        <Text style={styles.stepDescription}>
          Select activities you do regularly. These will be available for quick activity logging.
        </Text>
        
        <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
          {topActivities.map((activity: ActivityDefinition) => (
            <TouchableOpacity
              key={activity.id}
              style={[
                styles.optionItem,
                formData.defaultActivities.includes(activity.id) && styles.optionItemSelected,
              ]}
              onPress={() => toggleActivity(activity.id)}
            >
              <View>
                <Text style={[
                  styles.optionText,
                  formData.defaultActivities.includes(activity.id) && styles.optionTextSelected,
                ]}>
                  {activity.name}
                </Text>
                <Text style={styles.optionSubtext}>
                  {activity.category}
                </Text>
              </View>
              {formData.defaultActivities.includes(activity.id) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderReminders = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Reminder Settings</Text>
      <Text style={styles.stepDescription}>
        Set up reminders to help maintain consistent logging for better evidence collection.
      </Text>
      
      <View style={styles.settingsGroup}>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => setFormData(prev => ({ ...prev, dailyLogEnabled: !prev.dailyLogEnabled }))}
        >
          <View>
            <Text style={styles.settingTitle}>Daily Log Reminder</Text>
            <Text style={styles.settingSubtitle}>Get reminded to log your daily symptoms</Text>
          </View>
          <View style={[
            styles.toggle,
            formData.dailyLogEnabled && styles.toggleActive,
          ]} />
        </TouchableOpacity>

        {formData.dailyLogEnabled && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Reminder Time</Text>
            <TextInput
              style={styles.timeInput}
              value={formData.dailyLogTime}
              onChangeText={(text) => setFormData(prev => ({ ...prev, dailyLogTime: text }))}
              placeholder="09:00"
              placeholderTextColor={colors.gray500}
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => setFormData(prev => ({ ...prev, activityPromptEnabled: !prev.activityPromptEnabled }))}
        >
          <View>
            <Text style={styles.settingTitle}>Activity Prompts</Text>
            <Text style={styles.settingSubtitle}>Get prompted to log activity impacts</Text>
          </View>
          <View style={[
            styles.toggle,
            formData.activityPromptEnabled && styles.toggleActive,
          ]} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderBasicInfo();
      case 1: return renderConditions();
      case 2: return renderSymptoms();
      case 3: return renderActivities();
      case 4: return renderReminders();
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Create Profile</Text>
          <Text style={styles.headerSubtitle}>
            Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
          </Text>
        </View>
      </View>

      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      <View style={styles.footer}>
        <BigButton
          label={currentStep === steps.length - 1 ? 'Create Profile' : 'Next'}
          onPress={handleNext}
          variant="primary"
          fullWidth
          disabled={currentStep === 0 && !formData.name.trim()}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  backButtonText: {
    fontSize: typography.sizes.xxl,
    color: colors.primary600,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
    marginTop: 2,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gray300,
  },
  stepDotActive: {
    backgroundColor: colors.primary600,
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: colors.gray300,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: colors.primary600,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  stepContent: {
    gap: spacing.lg,
  },
  stepTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
  stepDescription: {
    fontSize: typography.sizes.md,
    color: colors.gray600,
    lineHeight: 22,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  inputLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium as any,
    color: colors.gray700,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.gray900,
    backgroundColor: colors.white,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.gray900,
    backgroundColor: colors.white,
    width: 100,
  },
  inputHint: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  optionItemSelected: {
    borderColor: colors.primary600,
    backgroundColor: colors.primary[50],
  },
  optionText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium as any,
    color: colors.gray900,
  },
  optionTextSelected: {
    color: colors.primary[700],
  },
  optionSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
    marginTop: 2,
  },
  checkmark: {
    fontSize: typography.sizes.lg,
    color: colors.primary600,
    fontWeight: typography.weights.bold as any,
  },
  settingsGroup: {
    gap: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  settingTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium as any,
    color: colors.gray900,
  },
  settingSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.gray300,
    position: 'relative',
  },
  toggleActive: {
    backgroundColor: colors.primary600,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
});