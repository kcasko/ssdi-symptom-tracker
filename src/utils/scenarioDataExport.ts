// scenarioDataExport.ts
// Script to generate and print scenario data for Users A, B, and C

import { generateMildScenarioSeedData, generateModerateScenarioSeedData, generateSevereScenarioSeedData } from './seedData';

function printScenarioData(label: string, data: any) {
  console.log(`\n=== ${label} ===`);
  console.log('Profile:', data.profile);
  console.log('Daily Logs:', data.dailyLogs.length);
  console.log('Activity Logs:', data.activityLogs.length);
  console.log('Limitations:', data.limitations.length);
  // Optionally print sample entries
  if (data.dailyLogs.length > 0) {
    console.log('Sample Daily Log:', data.dailyLogs[0]);
  }
  if (data.activityLogs.length > 0) {
    console.log('Sample Activity Log:', data.activityLogs[0]);
  }
  if (data.limitations.length > 0) {
    console.log('Sample Limitation:', data.limitations[0]);
  }
}

function main() {
  const mild = generateMildScenarioSeedData();
  const moderate = generateModerateScenarioSeedData();
  const severe = generateSevereScenarioSeedData();

  printScenarioData('User A (Mild)', mild);
  printScenarioData('User B (Moderate)', moderate);
  printScenarioData('User C (Severe)', severe);
}

main();
