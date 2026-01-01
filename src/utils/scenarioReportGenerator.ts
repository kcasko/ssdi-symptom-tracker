// scenarioReportGenerator.ts
// Script to generate and validate reports for Users A, B, and C using scenario seed data

import { generateMildScenarioSeedData, generateModerateScenarioSeedData, generateSevereScenarioSeedData } from './seedData';
import { ReportService } from '../services/ReportService';
import { REPORT_TEMPLATES } from '../data/reportTemplates';

async function generateAndValidate(label: string, seedData: any) {
  const { profile, dailyLogs, activityLogs, limitations } = seedData;
  const start = dailyLogs.length > 0 ? dailyLogs[dailyLogs.length - 1].logDate : undefined;
  const end = dailyLogs.length > 0 ? dailyLogs[0].logDate : undefined;
  if (!start || !end) {
    console.log(`No daily logs for ${label}`);
    return;
  }
  for (const template of REPORT_TEMPLATES) {
    const draft = await ReportService.generateReportDraft({
      profileId: profile.id,
      dateRange: { start, end },
      templateId: template.type,
      includeSections: []
    }, dailyLogs, activityLogs, limitations);
    const validation = ReportService.validateReport(draft);
    console.log(`\n=== ${label}: ${template.title} ===`);
    console.log('Sections:', draft.sections.length, 'Words:', draft.sections.map(s => s.blocks.length).reduce((a,b)=>a+b,0));
    if (validation.isComplete) {
      console.log('Report is complete.');
    } else {
      console.log('Warnings:', validation.warnings);
      console.log('Errors:', validation.errors);
    }
    // Optionally print a sample section
    if (draft.sections.length > 0) {
      console.log('Sample Section:', draft.sections[0].title);
      console.log(draft.sections[0].blocks.map(b => b.content).join('\n'));
    }
  }
}

async function main() {
  await generateAndValidate('User A (Mild)', generateMildScenarioSeedData());
  await generateAndValidate('User B (Moderate)', generateModerateScenarioSeedData());
  await generateAndValidate('User C (Severe)', generateSevereScenarioSeedData());
}

main();
