/**
 * Evidence-Hardened v1.0 Audit Report Generator
 * 
 * Reads test results and generates credibility audit report
 */

const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '../reports/credibility-audit-template.md');
const OUTPUT_PATH = path.join(__dirname, '../reports/credibility-audit.md');
const TEST_RESULTS_PATH = path.join(__dirname, '../test-artifacts/latest/test-results.json');

function generateAuditReport() {
  console.log('Generating Evidence-Hardened v1.0 Credibility Audit Report...');

  // Read template
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`ERROR: Template not found at ${TEMPLATE_PATH}`);
    process.exit(1);
  }

  let template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  // Read test results (if available)
  let testResults = null;
  if (fs.existsSync(TEST_RESULTS_PATH)) {
    testResults = JSON.parse(fs.readFileSync(TEST_RESULTS_PATH, 'utf-8'));
  }

  // Generate timestamp
  const timestamp = new Date().toISOString();
  template = template.replace('[TIMESTAMP]', timestamp);

  // Determine run number
  const artifactDir = path.join(__dirname, '../test-artifacts');
  let runNumber = 'LATEST';
  
  if (fs.existsSync(artifactDir)) {
    const runs = fs.readdirSync(artifactDir)
      .filter(f => f.startsWith('run-'))
      .map(f => parseInt(f.replace('run-', '')))
      .filter(n => !isNaN(n));
    
    if (runs.length > 0) {
      runNumber = Math.max(...runs);
    }
  }

  template = template.replace(/\[RUN_NUMBER\]/g, runNumber);

  // Calculate summary statistics
  let passed = 0;
  let failed = 0;
  let criticalFailures = 0;

  if (testResults && testResults.numPassedTests !== undefined) {
    passed = testResults.numPassedTests;
    failed = testResults.numFailedTests;
    
    // Determine overall status
    const overallStatus = failed === 0 ? 'PASS' : (criticalFailures > 0 ? 'FAIL' : 'PARTIAL');
    
    template = template.replace('[PASS / FAIL / PARTIAL]', overallStatus);
    template = template.replace('[COUNT]', criticalFailures.toString());
    template = template.replace(/\[Requirements Passed\]: \[COUNT\]/, `Requirements Passed: ${passed}`);
    template = template.replace(/\[Requirements Failed\]: \[COUNT\]/, `Requirements Failed: ${failed}`);
  } else {
    // No test results available - mark for manual completion
    template = template.replace('[PASS / FAIL / PARTIAL]', 'PENDING - Tests not run');
  }

  // Placeholder guidance
  template = template.replace(/\[PASS\/FAIL\]/g, '⚠️ PENDING - Run tests to populate');

  // Write output
  fs.writeFileSync(OUTPUT_PATH, template);

  console.log(`✅ Audit report generated: ${OUTPUT_PATH}`);
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log('');
  console.log('⚠️  NOTE: Auto-generated report contains placeholders.');
  console.log('    Manual review and completion required for full audit.');
}

// Run
try {
  generateAuditReport();
} catch (error) {
  console.error('ERROR generating audit report:', error);
  process.exit(1);
}
