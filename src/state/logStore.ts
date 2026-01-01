/**
 * Log Store
 * Manages daily logs, activity logs, limitations, medications, and appointments
 */

import { create } from 'zustand';
import { DailyLog } from '../domain/models/DailyLog';
import { ActivityLog } from '../domain/models/ActivityLog';
import { Limitation } from '../domain/models/Limitation';
import { Medication } from '../domain/models/Medication';
import { Appointment } from '../domain/models/Appointment';
import { PhotoAttachment } from '../domain/models/PhotoAttachment';
import { LogStorage } from '../storage/storage';
import { ids } from '../utils/ids';
import { isSameDayAs } from '../utils/dates';

interface LogState {
  // Data
  dailyLogs: DailyLog[];
  activityLogs: ActivityLog[];
  limitations: Limitation[];
  medications: Medication[];
  appointments: Appointment[];
  photos: PhotoAttachment[];
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Current profile
  currentProfileId: string | null;
  
  // Actions
  setCurrentProfile: (profileId: string | null) => void;
  loadData: (profileId: string) => Promise<void>;
  
  // Daily logs
  addDailyLog: (log: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDailyLog: (log: DailyLog) => Promise<void>;
  deleteDailyLog: (logId: string) => Promise<void>;
  getDailyLogForDate: (date: string) => DailyLog | undefined;
  
  // Activity logs
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateActivityLog: (log: ActivityLog) => Promise<void>;
  deleteActivityLog: (logId: string) => Promise<void>;
  
  // Limitations
  addLimitation: (limitation: Omit<Limitation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLimitation: (limitation: Limitation) => Promise<void>;
  deleteLimitation: (limitationId: string) => Promise<void>;
  getActiveLimitations: () => Limitation[];
  
  // Medications
  addMedication: (medication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMedication: (medication: Medication) => Promise<void>;
  deleteMedication: (medicationId: string) => Promise<void>;
  getActiveMedications: () => Medication[];
  
  // Appointments
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAppointment: (appointment: Appointment) => Promise<void>;
  deleteAppointment: (appointmentId: string) => Promise<void>;
  
  // Photos
  addPhoto: (photo: Omit<PhotoAttachment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePhoto: (photo: PhotoAttachment) => Promise<void>;
  deletePhoto: (photoId: string) => Promise<void>;
  getPhotosByEntity: (entityType: string, entityId: string) => PhotoAttachment[];
  
  // Utility
  clearError: () => void;
  clearData: () => void;
}

export const useLogStore = create<LogState>((set, get) => ({
  // Initial state
  dailyLogs: [],
  activityLogs: [],
  limitations: [],
  medications: [],
  appointments: [],
  photos: [],
  loading: false,
  error: null,
  currentProfileId: null,

  // Actions
  setCurrentProfile: (profileId: string | null) => {
    const current = get().currentProfileId;
    if (current === profileId) return; // Prevent redundant updates
    
    set({ currentProfileId: profileId });
    if (profileId) {
      get().loadData(profileId);
    } else {
      get().clearData();
    }
  },

  loadData: async (profileId: string) => {
    set({ loading: true, error: null });
    
    try {
      const [dailyLogs, activityLogs, limitations, medications, appointments, photos] = await Promise.all([
        LogStorage.getDailyLogs(profileId),
        LogStorage.getActivityLogs(profileId),
        LogStorage.getLimitations(profileId),
        LogStorage.getMedications(profileId),
        LogStorage.getAppointments(profileId),
        LogStorage.getPhotos(profileId),
      ]);
      
      set({
        dailyLogs,
        activityLogs,
        limitations,
        medications,
        appointments,
        photos,
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      });
    }
  },

  // Daily logs
  addDailyLog: async (logData) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;
    
    try {
      const logId = ids.dailyLog();
      const now = new Date().toISOString();
      
      const newLog: DailyLog = {
        ...logData,
        id: logId,
        profileId: currentProfileId,
        createdAt: now,
        updatedAt: now,
      };
      
      const { dailyLogs } = get();
      const updatedLogs = [...dailyLogs, newLog];
      
      await LogStorage.saveDailyLogs(currentProfileId, updatedLogs);
      set({ dailyLogs: updatedLogs, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add daily log' });
    }
  },

  updateDailyLog: async (updatedLog) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;
    
    try {
      const logWithTimestamp = {
        ...updatedLog,
        updatedAt: new Date().toISOString(),
      };
      
      const { dailyLogs } = get();
      const updatedLogs = dailyLogs.map(log => 
        log.id === updatedLog.id ? logWithTimestamp : log
      );
      
      await LogStorage.saveDailyLogs(currentProfileId, updatedLogs);
      set({ dailyLogs: updatedLogs, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update daily log' });
    }
  },

  deleteDailyLog: async (logId) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;
    
    try {
      const { dailyLogs } = get();
      const updatedLogs = dailyLogs.filter(log => log.id !== logId);
      
      await LogStorage.saveDailyLogs(currentProfileId, updatedLogs);
      set({ dailyLogs: updatedLogs, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete daily log' });
    }
  },

  getDailyLogForDate: (date: string) => {
    const { dailyLogs } = get();
    return dailyLogs.find(log => isSameDayAs(log.logDate, date));
  },

  // Activity logs
  addActivityLog: async (logData) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;
    
    try {
      const logId = ids.activityLog();
      const now = new Date().toISOString();
      
      const newLog: ActivityLog = {
        ...logData,
        id: logId,
        profileId: currentProfileId,
        createdAt: now,
        updatedAt: now,
      };
      
      const { activityLogs } = get();
      const updatedLogs = [...activityLogs, newLog];
      
      await LogStorage.saveActivityLogs(currentProfileId, updatedLogs);
      set({ activityLogs: updatedLogs, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add activity log' });
    }
  },

  updateActivityLog: async (updatedLog) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;
    
    try {
      const logWithTimestamp = {
        ...updatedLog,
        updatedAt: new Date().toISOString(),
      };
      
      const { activityLogs } = get();
      const updatedLogs = activityLogs.map(log => 
        log.id === updatedLog.id ? logWithTimestamp : log
      );
      
      await LogStorage.saveActivityLogs(currentProfileId, updatedLogs);
      set({ activityLogs: updatedLogs, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update activity log' });
    }
  },

  deleteActivityLog: async (logId) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;
    
    try {
      const { activityLogs } = get();
      const updatedLogs = activityLogs.filter(log => log.id !== logId);
      
      await LogStorage.saveActivityLogs(currentProfileId, updatedLogs);
      set({ activityLogs: updatedLogs, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete activity log' });
    }
  },

  // Limitations
  addLimitation: async (limitationData) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;
    
    try {
      const limitationId = ids.limitation();
      const now = new Date().toISOString();
      
      const newLimitation: Limitation = {
        ...limitationData,
        id: limitationId,
        profileId: currentProfileId,
        createdAt: now,
        updatedAt: now,
      };
      
      const { limitations } = get();
      const updatedLimitations = [...limitations, newLimitation];
      
      await LogStorage.saveLimitations(currentProfileId, updatedLimitations);
      set({ limitations: updatedLimitations, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add limitation' });
    }
  },

  updateLimitation: async (updatedLimitation) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;
    
    try {
      const limitationWithTimestamp = {
        ...updatedLimitation,
        updatedAt: new Date().toISOString(),
      };
      
      const { limitations } = get();
      const updatedLimitations = limitations.map(limitation => 
        limitation.id === updatedLimitation.id ? limitationWithTimestamp : limitation
      );
      
      await LogStorage.saveLimitations(currentProfileId, updatedLimitations);
      set({ limitations: updatedLimitations, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update limitation' });
    }
  },

  deleteLimitation: async (limitationId) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;
    
    try {
      const { limitations } = get();
      const updatedLimitations = limitations.filter(limitation => limitation.id !== limitationId);
      
      await LogStorage.saveLimitations(currentProfileId, updatedLimitations);
      set({ limitations: updatedLimitations, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete limitation' });
    }
  },

  getActiveLimitations: () => {
    const { limitations } = get();
    return limitations.filter(limitation => limitation.isActive);
  },

  // Medications
  addMedication: async (medicationData) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;
    
    try {
      const medicationId = ids.medication();
      const now = new Date().toISOString();
      
      const newMedication: Medication = {
        ...medicationData,
        id: medicationId,
        profileId: currentProfileId,
        createdAt: now,
        updatedAt: now,
      };
      
      const { medications } = get();
      const updatedMedications = [...medications, newMedication];
      
      await LogStorage.saveMedications(currentProfileId, updatedMedications);
      set({ medications: updatedMedications, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add medication' });
    }
  },

  updateMedication: async (updatedMedication) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;
    
    try {
      const medicationWithTimestamp = {
        ...updatedMedication,
        updatedAt: new Date().toISOString(),
      };
      
      const { medications } = get();
      const updatedMedications = medications.map(medication => 
        medication.id === updatedMedication.id ? medicationWithTimestamp : medication
      );
      
      await LogStorage.saveMedications(currentProfileId, updatedMedications);
      set({ medications: updatedMedications, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update medication' });
    }
  },

  deleteMedication: async (medicationId) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;
    
    try {
      const { medications } = get();
      const updatedMedications = medications.filter(medication => medication.id !== medicationId);
      
      await LogStorage.saveMedications(currentProfileId, updatedMedications);
      set({ medications: updatedMedications, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete medication' });
    }
  },

  getActiveMedications: () => {
    const { medications } = get();
    return medications.filter(medication => medication.isActive);
  },

  // Appointments
  addAppointment: async (appointmentData) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;
    
    try {
      const appointmentId = ids.appointment();
      const now = new Date().toISOString();
      
      const newAppointment: Appointment = {
        ...appointmentData,
        id: appointmentId,
        profileId: currentProfileId,
        createdAt: now,
        updatedAt: now,
      };
      
      const { appointments } = get();
      const updatedAppointments = [...appointments, newAppointment];
      
      await LogStorage.saveAppointments(currentProfileId, updatedAppointments);
      set({ appointments: updatedAppointments, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add appointment' });
    }
  },

  updateAppointment: async (updatedAppointment) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;
    
    try {
      const appointmentWithTimestamp = {
        ...updatedAppointment,
        updatedAt: new Date().toISOString(),
      };
      
      const { appointments } = get();
      const updatedAppointments = appointments.map(appointment => 
        appointment.id === updatedAppointment.id ? appointmentWithTimestamp : appointment
      );
      
      await LogStorage.saveAppointments(currentProfileId, updatedAppointments);
      set({ appointments: updatedAppointments, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update appointment' });
    }
  },

  deleteAppointment: async (appointmentId) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;
    
    try {
      const { appointments } = get();
      const updatedAppointments = appointments.filter(appointment => appointment.id !== appointmentId);
      
      await LogStorage.saveAppointments(currentProfileId, updatedAppointments);
      set({ appointments: updatedAppointments, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete appointment' });
    }
  },

  // Photos
  addPhoto: async (photoData) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;
    
    try {
      // Photo already has id, capturedAt, addedAt from PhotoService
      // Just add it to the store
      const { photos } = get();
      const updatedPhotos = [...photos, photoData];
      
      await LogStorage.savePhotos(currentProfileId, updatedPhotos);
      set({ photos: updatedPhotos, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add photo' });
    }
  },

  updatePhoto: async (updatedPhoto) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;
    
    try {
      const { photos } = get();
      const updatedPhotos = photos.map(photo => 
        photo.id === updatedPhoto.id ? updatedPhoto : photo
      );
      
      await LogStorage.savePhotos(currentProfileId, updatedPhotos);
      set({ photos: updatedPhotos, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update photo' });
    }
  },

  deletePhoto: async (photoId) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;
    
    try {
      const { photos } = get();
      const updatedPhotos = photos.filter(photo => photo.id !== photoId);
      
      await LogStorage.savePhotos(currentProfileId, updatedPhotos);
      set({ photos: updatedPhotos, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete photo' });
    }
  },

  getPhotosByEntity: (entityType: string, entityId: string) => {
    const { photos } = get();
    return photos.filter(photo => 
      photo.entityType === entityType && photo.entityId === entityId
    );
  },

  // Utility
  clearError: () => set({ error: null }),

  clearData: () => set({
    dailyLogs: [],
    activityLogs: [],
    limitations: [],
    medications: [],
    appointments: [],
    photos: [],
    currentProfileId: null,
    error: null,
  }),
}));