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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { BigButton } from '../components';
import { useAppState } from '../state/useAppState';
import { formatDateShort } from '../utils/dates';

type ProfilePickerProps = NativeStackScreenProps<RootStackParamList, 'ProfilePicker'>;

export const ProfilePickerScreen: React.FC<ProfilePickerProps> = ({ navigation }) => {
  const { profiles, setActiveProfile, createProfile } = useAppState();

  const handleSelectProfile = (profileId: string) => {
    setActiveProfile(profileId);
    navigation.replace('Dashboard');
  };

  const handleCreateProfile = () => {
    const name = `Profile ${profiles.length + 1}`;
    const profile = createProfile(name);
    setActiveProfile(profile.id);
    navigation.replace('Dashboard');
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
          <TouchableOpacity
            key={profile.id}
            style={styles.profileCard}
            onPress={() => handleSelectProfile(profile.id)}
          >
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.displayName}</Text>
              <Text style={styles.profileMeta}>
                Created {formatDateShort(profile.createdAt)}
              </Text>
              <Text style={styles.profileMeta}>
                Last updated {formatDateShort(profile.lastAccessed)}
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
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
    backgroundColor: colors.background,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
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
    color: colors.primary,
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
