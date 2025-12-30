/**
 * Profile Store
 * Manages profile data and active profile selection
 */

import { create } from 'zustand';
import { Profile, createProfile, touchProfile } from '../domain/models/Profile';
import { ProfileStorage } from '../storage/storage';
import { ids } from '../utils/ids';

interface ProfileState {
  // Data
  profiles: Profile[];
  activeProfileId: string | null;
  activeProfile: Profile | null;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Actions
  loadProfiles: () => Promise<void>;
  setActiveProfile: (profileId: string | null) => Promise<void>;
  createProfile: (name: string) => Promise<string | null>;
  updateProfile: (profile: Profile) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;
  clearError: () => void;
  
  // Computed
  getProfile: (id: string) => Profile | undefined;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  // Initial state
  profiles: [],
  activeProfileId: null,
  activeProfile: null,
  loading: false,
  error: null,

  // Actions
  loadProfiles: async () => {
    set({ loading: true, error: null });
    
    try {
      const [profiles, activeProfileId] = await Promise.all([
        ProfileStorage.getAllProfiles(),
        ProfileStorage.getActiveProfileId(),
      ]);
      
      const activeProfile = profiles.find(p => p.id === activeProfileId) || null;
      
      set({
        profiles,
        activeProfileId,
        activeProfile,
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load profiles',
      });
    }
  },

  setActiveProfile: async (profileId: string | null) => {
    try {
      await ProfileStorage.setActiveProfileId(profileId);
      const { profiles } = get();
      const activeProfile = profileId ? profiles.find(p => p.id === profileId) || null : null;
      
      set({
        activeProfileId: profileId,
        activeProfile,
        error: null,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to set active profile',
      });
    }
  },

  createProfile: async (name: string) => {
    set({ loading: true, error: null });
    
    try {
      const profileId = ids.profile();
      const newProfile = createProfile(name, profileId);
      
      const { profiles } = get();
      const updatedProfiles = [...profiles, newProfile];
      
      await ProfileStorage.saveProfiles(updatedProfiles);
      
      // If this is the first profile, make it active
      if (profiles.length === 0) {
        await ProfileStorage.setActiveProfileId(profileId);
        set({
          profiles: updatedProfiles,
          activeProfileId: profileId,
          activeProfile: newProfile,
          loading: false,
        });
      } else {
        set({
          profiles: updatedProfiles,
          loading: false,
        });
      }
      
      return profileId;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to create profile',
      });
      return null;
    }
  },

  updateProfile: async (updatedProfile: Profile) => {
    set({ loading: true, error: null });
    
    try {
      const touchedProfile = touchProfile(updatedProfile);
      const { profiles, activeProfileId } = get();
      
      const updatedProfiles = profiles.map(p => 
        p.id === touchedProfile.id ? touchedProfile : p
      );
      
      await ProfileStorage.saveProfiles(updatedProfiles);
      
      // Update active profile if it's the one being updated
      const activeProfile = activeProfileId === touchedProfile.id 
        ? touchedProfile 
        : get().activeProfile;
      
      set({
        profiles: updatedProfiles,
        activeProfile,
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      });
    }
  },

  deleteProfile: async (profileId: string) => {
    set({ loading: true, error: null });
    
    try {
      const { profiles, activeProfileId } = get();
      const updatedProfiles = profiles.filter(p => p.id !== profileId);
      
      await ProfileStorage.saveProfiles(updatedProfiles);
      
      // If deleted profile was active, set new active profile
      let newActiveProfileId = activeProfileId;
      let newActiveProfile = get().activeProfile;
      
      if (activeProfileId === profileId) {
        newActiveProfileId = updatedProfiles.length > 0 ? updatedProfiles[0].id : null;
        newActiveProfile = updatedProfiles.length > 0 ? updatedProfiles[0] : null;
        await ProfileStorage.setActiveProfileId(newActiveProfileId);
      }
      
      set({
        profiles: updatedProfiles,
        activeProfileId: newActiveProfileId,
        activeProfile: newActiveProfile,
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to delete profile',
      });
    }
  },

  clearError: () => set({ error: null }),

  // Computed
  getProfile: (id: string) => {
    return get().profiles.find(p => p.id === id);
  },
}));