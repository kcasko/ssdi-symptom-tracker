/**
 * Report Store
 * Manages report drafts and generation
 */

import { create } from 'zustand';
import { ReportDraft, createReportDraft, ReportType } from '../domain/models/ReportDraft';
import { ReportService } from '../services/ReportService';
import { ExportService } from '../services/ExportService';
import { generatePlainTextReport, generateStrictPDFHtml } from '../services/EvidencePDFExportService';
import { ids } from '../utils/ids';
import { ProfileStorage, LogStorage } from '../storage/storage';

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
      const { drafts, currentProfileId } = get();
      const draft = drafts.find(d => d.id === draftId);
      
      if (!draft || !currentProfileId) {
        throw new Error('Draft not found or no profile selected');
      }

      // Load required data from storage
      const dailyLogs = await LogStorage.getDailyLogs(currentProfileId);
      const activityLogs = await LogStorage.getActivityLogs(currentProfileId);
      const limitations = await LogStorage.getLimitations(currentProfileId);

      // Filter data by date range
      const filteredDailyLogs = dailyLogs.filter(log => 
        log.logDate >= draft.dateRange.start && log.logDate <= draft.dateRange.end
      );
      const filteredActivityLogs = activityLogs.filter(log => 
        log.activityDate >= draft.dateRange.start && log.activityDate <= draft.dateRange.end
      );

      // Use ReportService to generate the actual report content
      const generatedDraft = await ReportService.generateReportDraft(
        {
          profileId: currentProfileId,
          dateRange: draft.dateRange,
          templateId: draft.reportType, // Use reportType as templateId
          includeSections: draft.sections.map(s => s.sectionType),
        },
        filteredDailyLogs,
        filteredActivityLogs,
        limitations
      );

      // Update the draft with generated content
      const updatedDraft = {
        ...draft,
        sections: generatedDraft.sections,
        generatedAt: new Date().toISOString(),
        lastRegeneratedAt: new Date().toISOString(),
        status: 'draft' as const,
        updatedAt: new Date().toISOString(),
      };
      
      await get().updateDraft(updatedDraft);
      set({ generating: false });
    } catch (error) {
      set({
        generating: false,
        error: error instanceof Error ? error.message : 'Failed to generate draft',
      });
    }
  },

   
  regenerateSection: async (draftId: string, sectionId: string) => {
    set({ generating: true, error: null });
    
    try {
      const { drafts, currentProfileId } = get();
      const draft = drafts.find(d => d.id === draftId);
      
      if (!draft || !currentProfileId) {
        throw new Error('Draft not found or no profile selected');
      }

      const sectionToRegenerate = draft.sections.find(s => s.id === sectionId);
      if (!sectionToRegenerate) {
        throw new Error('Section not found');
      }

      // Load required data from storage
      const dailyLogs = await LogStorage.getDailyLogs(currentProfileId);
      const activityLogs = await LogStorage.getActivityLogs(currentProfileId);
      const limitations = await LogStorage.getLimitations(currentProfileId);

      // Filter data by date range
      const filteredDailyLogs = dailyLogs.filter(log => 
        log.logDate >= draft.dateRange.start && log.logDate <= draft.dateRange.end
      );
      const filteredActivityLogs = activityLogs.filter(log => 
        log.activityDate >= draft.dateRange.start && log.activityDate <= draft.dateRange.end
      );

      // Use ReportService to regenerate the specific section
      const regeneratedDraft = await ReportService.regenerateSection(
        draft,
        sectionId,
        filteredDailyLogs,
        filteredActivityLogs,
        limitations
      );

      // Update the draft with regenerated content
      const updatedDraft = {
        ...draft,
        sections: regeneratedDraft.sections,
        lastRegeneratedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await get().updateDraft(updatedDraft);
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
      const { drafts, currentProfileId } = get();
      const draft = drafts.find(d => d.id === draftId);
      
      if (!draft || !currentProfileId) {
        throw new Error('Draft not found');
      }

      // Generate a filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${draft.title}_${format}_${timestamp}.${format}`;

      // Convert draft to text content for export
      const reportContent = draft.sections
        .map(section => {
          const blockTexts = section.blocks.map(block => block.content).join('\n\n');
          return `${section.title}\n${'='.repeat(section.title.length)}\n\n${blockTexts}`;
        })
        .join('\n\n\n');

      // Use appropriate export service based on format
      if (format === 'pdf') {
        // Load supporting data for strict, doctor-first PDF
        const [profiles, dailyLogs, activityLogs, medications, appointments, gapExplanations] = await Promise.all([
          ProfileStorage.getAllProfiles(),
          LogStorage.getDailyLogs(currentProfileId),
          LogStorage.getActivityLogs(currentProfileId),
          LogStorage.getMedications(currentProfileId),
          LogStorage.getAppointments(currentProfileId),
          LogStorage.getGapExplanations(currentProfileId),
        ]);

        const profile = profiles.find((p: any) => p.id === currentProfileId);
        const filteredDailyLogs = dailyLogs.filter((log: any) =>
          log.logDate >= draft.dateRange.start && log.logDate <= draft.dateRange.end
        );
        const filteredActivityLogs = activityLogs.filter((log: any) =>
          log.activityDate >= draft.dateRange.start && log.activityDate <= draft.dateRange.end
        );
        const filteredMeds = medications; // meds are not date-bound in data model; include all for context
        const filteredAppointments = appointments.filter((appt: any) =>
          appt.date ? appt.date >= draft.dateRange.start && appt.date <= draft.dateRange.end : true
        );
        const filteredGapExplanations = gapExplanations.filter(
          (g: any) => g.startDate >= draft.dateRange.start && g.endDate <= draft.dateRange.end
        );

        const gatherText = (types: string[]) =>
          draft.sections
            .filter((s) => s.included && types.includes(s.sectionType))
            .map((s) => s.blocks.map((b) => b.content).join(' '))
            .join(' ')
            .trim();

        const narrativeSections = draft.sections.filter(
          (s) => s.included && (s.sectionType === 'narrative' || s.sectionType === 'custom')
        );

        const sourceDates = [
          ...filteredDailyLogs.map((l: any) => l.logDate),
          ...filteredActivityLogs.map((l: any) => l.activityDate),
        ];

        const narratives = narrativeSections.map((s) => ({
          heading: s.title,
          paragraphs: s.blocks.map((b) => b.content),
          sourceDates,
        }));

        const pdfHtml = generateStrictPDFHtml({
          title: draft.title || 'Symptom & Functional Log',
          profileName: profile?.name || profile?.id || 'Profile',
          dateRange: draft.dateRange,
          exportDate: new Date().toISOString(),
          disclaimer:
            'This document records user-entered health and activity information. It assists review and does not make legal, medical, or disability determinations.',
          rawDailyLogs: filteredDailyLogs,
          rawActivityLogs: filteredActivityLogs,
          medications: filteredMeds,
          appointments: filteredAppointments,
          gapExplanations: filteredGapExplanations,
          summaries: {
            frequency: gatherText(['summary', 'patterns']),
            activity: gatherText(['activity_impact']),
            limitations: gatherText(['functional_limitations']),
          },
          analyses: {
            rfc: draft.sections
              .filter((s) => s.included && s.sectionType === 'functional_limitations')
              .map((s) => s.blocks.map((b) => b.content).join(' ')),
            workImpact: draft.sections
              .filter((s) => s.included && s.sectionType === 'activity_impact')
              .map((s) => s.blocks.map((b) => b.content).join(' ')),
            consistency: draft.sections
              .filter((s) => s.included && s.sectionType === 'patterns')
              .map((s) => s.blocks.map((b) => b.content).join(' ')),
          },
          narratives,
        });

        await ExportService.exportReportToPDF(pdfHtml, filename);
      } else {
        await ExportService.exportReportToText(reportContent, filename);
      }
      
      const exportRecord = {
        exportedAt: new Date().toISOString(),
        format,
        filename,
      };
      
      const updatedDraft = {
        ...draft,
        exports: [...draft.exports, exportRecord],
        status: 'exported' as const,
        updatedAt: new Date().toISOString(),
      };
      
      await get().updateDraft(updatedDraft);
      
      set({ exporting: false });
      return filename;
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
