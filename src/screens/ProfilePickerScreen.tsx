/**
 * Profile Picker Screen
 * Select or create a profile
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
import { BigButton } from '../components';
import { useAppState } from '../state/useAppState';
import { formatDate, DISPLAY_DATE_SHORT } from '../utils/dates';

type ProfilePickerProps = NativeStackScreenProps<RootStackParamList, 'ProfilePicker'>;

export const ProfilePickerScreen: React.FC<ProfilePickerProps> = ({ navigation }) => {
  const { profiles, setActiveProfile, deleteProfile } = useAppState();

  const handleSelectProfile = (profileId: string) => {
    setActiveProfile(profileId);
    navigation.replace('Dashboard');
  };

  const handleCreateProfile = async () => {
    navigation.navigate('ProfileCreation');
  };

  const handleDeleteProfile = (profileId: string, profileName: string) => {
    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete "${profileName}"? This action cannot be undone and will remove all associated data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProfile(profileId);
            } catch {
              Alert.alert('Error', 'Failed to delete profile. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Profile</Text>
        <Text style={styles.subtitle}>
          Multi-profile support for privacy and organization
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {profiles.map((profile) => (
          <View key={profile.id} style={styles.profileCard}>
            <TouchableOpacity
              style={styles.profileMain}
              onPress={() => handleSelectProfile(profile.id)}
            >
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profile.name}</Text>
                <Text style={styles.profileMeta}>
                  Created {formatDate(profile.createdAt, DISPLAY_DATE_SHORT)}
                </Text>
                <Text style={styles.profileMeta}>
                  Last updated {formatDate(profile.updatedAt, DISPLAY_DATE_SHORT)}
                </Text>
              </View>
              <Text style={styles.arrow}>></Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteProfile(profile.id, profile.name)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))}

        {profiles.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No profiles yet</Text>
            <Text style={styles.emptySubtext}>Create your first profile to begin</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <BigButton
          label="Create New Profile"
          onPress={handleCreateProfile}
          variant="primary"
          fullWidth
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
    padding: spacing.lg,
    backgroundColor: colors.white,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.gray600,
  },
  scrollView: {
    flex: 1,
    padding: spacing.lg,
  },
  profileCard: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.gray200,
    flexDirection: 'row',
  },
  profileMain: {
    flex: 1,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  profileName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: colors.gray900,
  },
  profileMeta: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
  },
  arrow: {
    fontSize: typography.sizes.xxl,
    color: colors.primary600,
  },
  deleteButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.gray200,
    minWidth: 56,
  },
  deleteButtonText: {
    fontSize: 20,
    color: colors.error.main,
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: colors.gray600,
  },
  emptySubtext: {
    fontSize: typography.sizes.md,
    color: colors.gray500,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
});
