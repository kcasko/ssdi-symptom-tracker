/**
 * Settings Screen
 * App settings and profile management
 */

import React from 'react';
import {
  View,
  Text,
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
import { BigButton, EvidenceModeControls, SubmissionPackBuilder } from '../components';
import { useAppState } from '../state/useAppState';

type SettingsProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export const SettingsScreen: React.FC<SettingsProps> = ({ navigation }) => {
  const { activeProfile, setActiveProfile, settings, updateSettings } = useAppState();

  const handleSwitchProfile = () => {
    setActiveProfile(null);
    navigation.replace('ProfilePicker');
  };

  const handleToggleEncryption = () => {
    Alert.alert(
      'Encryption',
      settings.encryptionEnabled
        ? 'Disabling encryption will make data accessible without authentication'
        : 'Enabling encryption requires device authentication to access data',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => updateSettings({ encryptionEnabled: !settings.encryptionEnabled }),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Active Profile</Text>
            <Text style={styles.settingValue}>{activeProfile?.name || 'None'}</Text>
          </View>
          <BigButton
            label="Switch Profile"
            onPress={handleSwitchProfile}
            variant="secondary"
            fullWidth
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          <TouchableOpacity style={styles.settingRow} onPress={handleToggleEncryption}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Device Encryption</Text>
              <Text style={styles.settingDescription}>
                Require device authentication to access data
              </Text>
            </View>
            <View
              style={[
                styles.toggle,
                settings.encryptionEnabled && styles.toggleActive,
              ]}
            >
              <Text style={styles.toggleText}>
                {settings.encryptionEnabled ? 'ON' : 'OFF'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => updateSettings({ darkMode: !settings.darkMode })}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Text style={styles.settingDescription}>
                Switch to dark color scheme
              </Text>
            </View>
            <View
              style={[
                styles.toggle,
                settings.darkMode && styles.toggleActive,
              ]}
            >
              <Text style={styles.toggleText}>
                {settings.darkMode ? 'ON' : 'OFF'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Privacy Notice</Text>
            <Text style={styles.infoText}>
              • All data stored locally on your device{'\n'}
              • No cloud sync or accounts{'\n'}
              • You control your data
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Record Integrity</Text>
          {activeProfile && (
            <>
              <EvidenceModeControls profileId={activeProfile.id} />
              <View style={{ marginTop: spacing.lg }}>
                <SubmissionPackBuilder profileId={activeProfile.id} appVersion="1.0.0" />
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <BigButton
            label="About This App"
            onPress={() => navigation.navigate('About')}
            variant="secondary"
            fullWidth
          />
          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Daymark</Text>
            <Text style={styles.infoText}>
              A calm, neutral tool for marking your days. Track symptoms and patterns without judgment.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
  settingCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
  },
  settingInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  settingLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: colors.gray900,
  },
  settingValue: {
    fontSize: typography.sizes.md,
    color: colors.gray600,
  },
  settingDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
  },
  toggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray300,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: colors.primaryMain,
  },
  toggleText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold as any,
    color: colors.white,
  },
  infoCard: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  infoTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: colors.primaryMain,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.gray700,
    lineHeight: 20,
  },
});
