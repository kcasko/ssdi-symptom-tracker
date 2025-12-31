/**
 * Report Store
 * Manages report drafts and generation
 */

import { create } from 'zustand';
import { ReportDraft, createReportDraft, ReportType } from '../domain/models/ReportDraft';
import { LogStorage } from '../storage/storage';
import { ids } from '../utils/ids';

interface ReportState {
  // Data
  drafts: ReportDraft[];
  currentDraft: ReportDraft | null;
  
  // Loading states
  loading: boolean;
  generating: boolean;
  exporting: boolean;
  error: string | null;
  
  // Current profile
  currentProfileId: string | null;
  
  // Actions
  setCurrentProfile: (profileId: string | null) => void;
  loadDrafts: (profileId: string) => Promise<void>;
  
  // Draft management
  createDraft: (
    title: string,
    reportType: ReportType,
    dateRange: { start: string; end: string }
  ) => Promise<string | null>;
  updateDraft: (draft: ReportDraft) => Promise<void>;
  deleteDraft: (draftId: string) => Promise<void>;
  setCurrentDraft: (draftId: string | null) => void;
  
  // Draft operations
  generateDraft: (draftId: string) => Promise<void>;
  regenerateSection: (draftId: string, sectionId: string) => Promise<void>;
  exportDraft: (draftId: string, format: 'text' | 'pdf') => Promise<string | null>;
  
  // Utility
  clearError: () => void;
  clearData: () => void;
}

export const useReportStore = create<ReportState>((set, get) => ({
  // Initial state
  drafts: [],
  currentDraft: null,
  loading: false,
  generating: false,
  exporting: false,
  error: null,
  currentProfileId: null,

  // Actions
  setCurrentProfile: (profileId: string | null) => {
    const current = get().currentProfileId;
    if (current === profileId) return; // Prevent redundant updates
    
    set({ currentProfileId: profileId });
    if (profileId) {
      get().loadDrafts(profileId);
    } else {
      get().clearData();
    }
  },

  loadDrafts: async (profileId: string) => {
    set({ loading: true, error: null });
    
    try {
      const drafts = await LogStorage.getReportDrafts(profileId);
      
      set({
        drafts,
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load drafts',
      });
    }
  },

  // Draft management
  createDraft: async (title: string, reportType: ReportType, dateRange: { start: string; end: string }) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return null;
    
    set({ loading: true, error: null });
    
    try {
      const draftId = ids.reportDraft();
      const newDraft = createReportDraft(draftId, currentProfileId, title, reportType, dateRange);
      
      const { drafts } = get();
      const updatedDrafts = [...drafts, newDraft];
      
      await LogStorage.saveReportDrafts(currentProfileId, updatedDrafts);
      
      set({
        drafts: updatedDrafts,
        currentDraft: newDraft,
        loading: false,
      });
      
      return draftId;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to create draft',
      });
      return null;
    }
  },

  updateDraft: async (updatedDraft: ReportDraft) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;
    
    try {
      const draftWithTimestamp = {
        ...updatedDraft,
        updatedAt: new Date().toISOString(),
      };
      
      const { drafts } = get();
      const updatedDrafts = drafts.map(draft => 
        draft.id === updatedDraft.id ? draftWithTimestamp : draft
      );
      
      await LogStorage.saveReportDrafts(currentProfileId, updatedDrafts);
      
      // Update current draft if it's the one being updated
      const currentDraft = get().currentDraft;
      const newCurrentDraft = currentDraft && currentDraft.id === updatedDraft.id 
        ? draftWithTimestamp 
        : currentDraft;
      
      set({ 
        drafts: updatedDrafts,
        currentDraft: newCurrentDraft,
        error: null,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update draft' });
    }
  },

  deleteDraft: async (draftId: string) => {
    const { currentProfileId } = get();
    if (!currentProfileId) return;
    
    try {
      const { drafts, currentDraft } = get();
      const updatedDrafts = drafts.filter(draft => draft.id !== draftId);
      
      await LogStorage.saveReportDrafts(currentProfileId, updatedDrafts);
      
      // Clear current draft if it's the one being deleted
      const newCurrentDraft = currentDraft && currentDraft.id === draftId ? null : currentDraft;
      
      set({ 
        drafts: updatedDrafts,
        currentDraft: newCurrentDraft,
        error: null,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete draft' });
    }
  },

  setCurrentDraft: (draftId: string | null) => {
    const { drafts } = get();
    const currentDraft = draftId ? drafts.find(d => d.id === draftId) || null : null;
    set({ currentDraft });
  },

  // Draft operations
  generateDraft: async (draftId: string) => {
    set({ generating: true, error: null });
    
    try {
      // This is a placeholder - actual generation would be implemented
      // in the ReportService and called from here
      
      // For now, just simulate generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { drafts } = get();
      const draft = drafts.find(d => d.id === draftId);
      
      if (draft) {
        const updatedDraft = {
          ...draft,
          generatedAt: new Date().toISOString(),
          lastRegeneratedAt: new Date().toISOString(),
          status: 'draft' as const,
          updatedAt: new Date().toISOString(),
        };
        
        await get().updateDraft(updatedDraft);
      }
      
      set({ generating: false });
    } catch (error) {
      set({
        generating: false,
        error: error instanceof Error ? error.message : 'Failed to generate draft',
      });
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  regenerateSection: async (draftId: string, _sectionId: string) => {
    set({ generating: true, error: null });
    
    try {
      // This is a placeholder - actual section regeneration would be implemented
      // in the ReportService
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { drafts } = get();
      const draft = drafts.find(d => d.id === draftId);
      
      if (draft) {
        const updatedDraft = {
          ...draft,
          lastRegeneratedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        await get().updateDraft(updatedDraft);
      }
      
      set({ generating: false });
    } catch (error) {
      set({
        generating: false,
        error: error instanceof Error ? error.message : 'Failed to regenerate section',
      });
    }
  },

  exportDraft: async (draftId: string, format: 'text' | 'pdf') => {
    set({ exporting: true, error: null });
    
    try {
      // This is a placeholder - actual export would be implemented
      // in the TextExporter/PdfExporter services
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { drafts } = get();
      const draft = drafts.find(d => d.id === draftId);
      
      if (draft) {
        const exportRecord = {
          exportedAt: new Date().toISOString(),
          format,
          filename: `${draft.title}_${format}_${new Date().toISOString().split('T')[0]}.${format}`,
        };
        
        const updatedDraft = {
          ...draft,
          exports: [...draft.exports, exportRecord],
          status: 'exported' as const,
          updatedAt: new Date().toISOString(),
        };
        
        await get().updateDraft(updatedDraft);
        
        set({ exporting: false });
        return exportRecord.filename;
      }
      
      set({ exporting: false });
      return null;
    } catch (error) {
      set({
        exporting: false,
        error: error instanceof Error ? error.message : 'Failed to export draft',
      });
      return null;
    }
  },

  // Utility
  clearError: () => set({ error: null }),

  clearData: () => set({
    drafts: [],
    currentDraft: null,
    currentProfileId: null,
    error: null,
  }),
}));