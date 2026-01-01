# Test Suite Documentation

This document describes the comprehensive test suite created for the SSDI Symptom Tracker application.

## Test Infrastructure

### Setup
- **Framework**: Jest with ts-jest for TypeScript support
- **Configuration**: `jest.config.js` - Configured for TypeScript testing with code coverage
- **Setup File**: `jest.setup.js` - Mocks for Expo and React Native modules

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- path/to/test.test.ts
```

## Test Files Created

### 1. Service Tests

#### RFCBuilder.test.ts (`src/services/__tests__/RFCBuilder.test.ts`)
Tests the RFC (Residual Functional Capacity) Builder service.

**Test Coverage:**
- ✓ Building RFC from daily logs and limitations
- ✓ Analyzing exertional capacity (sitting, standing, walking, lifting)
- ✓ Determining work capacity levels
- ✓ Including supporting evidence for all claims
- ✓ Detecting consistent patterns
- ✓ Analyzing postural limitations
- ✓ Analyzing mental limitations
- ✓ Handling edge cases (empty logs, no limitations)

**Key Validations:**
- RFC must have evidence backing all capacity claims
- Work capacity level correctly determined from severity
- Sedentary/light/medium/heavy/very heavy classifications
- All limitations must trace back to log entries

#### WorkImpactAnalyzer.test.ts (`src/services/__tests__/WorkImpactAnalyzer.test.ts`)
Tests the Work Impact Analyzer service.

**Test Coverage:**
- ✓ Analyzing work impact for job duties
- ✓ Determining if can return to previous job
- ✓ Identifying interfering factors for each duty
- ✓ Calculating severity scores
- ✓ Detecting lifting interference
- ✓ Detecting standing/walking interference
- ✓ Calculating occurrence percentages correctly
- ✓ Handling jobs with no essential duties
- ✓ Edge cases (empty logs, no duties, no limitations)

**Key Validations:**
- Cannot return to job if essential duties cannot be performed
- Occurrence counts match actual log data
- Severity scores proportional to impact
- All interfering factors have evidence counts

#### SSAFormBuilder.test.ts (`src/services/__tests__/SSAFormBuilder.test.ts`)  
Tests the SSA Form Builder service.

**Test Coverage:**
- ✓ Building complete form package from RFC and work impact
- ✓ Disability report generation (SSA-3368 equivalent)
- ✓ Function report generation (SSA-3373 equivalent)
- ✓ Work history report
- ✓ RFC summary
- ✓ Narrative generation (why cannot work, how conditions limit)
- ✓ Data quality assessment
- ✓ Warnings for insufficient data
- ✓ Validation that RFC is required
- ✓ Handling empty work impacts and appointments

**Key Validations:**
- Form package only pulls from validated RFC and WorkImpact
- Never uses raw logs directly (prevents premature filing)
- Data quality checks enforce minimum standards
- Warnings issued for insufficient logging history
- All form sections have complete data

#### CredibilityScorer.test.ts (`src/services/__tests__/CredibilityScorer.test.ts`)
Tests the Credibility Scorer service.

**Test Coverage:**
- ✓ Calculating overall credibility score
- ✓ Consistency scoring
- ✓ Detail scoring  
- ✓ Time range scoring
- ✓ Improvement suggestions
- ✓ Detecting symptom pattern consistency
- ✓ Rewarding frequency consistency
- ✓ Rewarding detailed descriptions
- ✓ Penalizing missing notes
- ✓ Rewarding 90+ days of logging

**Key Validations:**
- High scores for consistent, detailed, long-term logs
- Low scores for sparse or inconsistent data
- Penalties for missing details or short tracking periods
- Actionable improvement suggestions provided

#### SyncService.test.ts (`src/services/__tests__/SyncService.test.ts`)
Tests the offline sync service.

**Test Coverage:**
- ✓ Queueing operations when offline
- ✓ Processing pending operations when online
- ✓ Not syncing when offline
- ✓ Throttling rapid sync calls
- ✓ Conflict detection
- ✓ Multiple conflict resolution strategies
- ✓ Retry logic for failed operations
- ✓ Marking as failed after max retries
- ✓ Tracking sync statistics
- ✓ Clearing completed operations

**Key Validations:**
- Operations queued with unique IDs
- Network state properly monitored
- Conflicts detected and resolvable
- Exponential backoff for retries
- Sync state accurately tracked

#### CloudBackupService.test.ts (`src/services/__tests__/CloudBackupService.test.ts`)
Tests the cloud backup service.

**Test Coverage:**
- ✓ Creating encrypted backups
- ✓ Compressing backup data
- ✓ Including complete metadata
- ✓ Calculating checksums
- ✓ Restoring and decrypting backups
- ✓ Verifying checksums before restore
- ✓ Handling decryption errors
- ✓ Listing available backups
- ✓ Filtering backups by profile
- ✓ Deleting backups
- ✓ Verifying backup integrity
- ✓ Detecting corrupted backups
- ✓ Scheduling automatic backups
- ✓ Respecting backup frequency settings
- ✓ Encryption enabled/disabled modes

**Key Validations:**
- End-to-end encryption (AES-256-GCM)
- Compression reduces data size
- Checksum verification prevents corruption
- Auto-backup respects user preferences

### 2. Utility Tests

#### utilities.test.ts (`src/utils/__tests__/utilities.test.ts`)
Tests utility functions for dates, flare detection, and trend analysis.

**Test Coverage:**
- ✓ Date calculations (days between, formatting, ranges)
- ✓ Flare detection from pain increases
- ✓ Flare pattern analysis
- ✓ Trend analysis (improving/worsening/stable)
- ✓ Moving average calculations

**Key Validations:**
- Date math is accurate
- Flares detected for significant pain increases
- Trends correctly identified
- Moving averages properly calculated

### 3. Integration Tests

#### integration.test.ts (`src/__tests__/integration.test.ts`)
End-to-end workflow integration tests.

**Test Coverage:**
- ✓ Complete SSDI evidence generation pipeline (logs → RFC → WorkImpact → SSA forms)
- ✓ Data traceability throughout pipeline
- ✓ Detection of insufficient data
- ✓ Handling multiple jobs in work history
- ✓ RFC has sufficient backing evidence
- ✓ Minimum logging period requirements
- ✓ Work impact uses actual log data
- ✓ Consistency across all outputs

**Key Validations:**
- Complete evidence package can be generated
- Credibility score calculated from logs
- RFC built from validated data
- Work impact analysis references actual logs
- SSA forms pull only from RFC/WorkImpact (never raw logs)
- Data quality warnings for insufficient evidence
- RFC work capacity matches SSA form summary
- All occurrence percentages match log counts

## Test Helpers

### testHelpers.ts (`src/__tests__/testHelpers.ts`)
Utility functions for creating mock test data.

**Functions:**
- `createMockDailyLog()` - Create single daily log with overrides
- `createMockDailyLogs()` - Create array of daily logs
- `createMockLimitation()` - Create limitation with overrides
- `createMockWorkHistory()` - Create work history with overrides
- `createMockJobDuty()` - Create job duty with overrides
- `createMockActivityLog()` - Create activity log
- `createMockAppointment()` - Create appointment
- `createMockMedication()` - Create medication

These helpers ensure all mocked data matches the actual model structures.

## Current Test Status

**Note:** Some tests reference APIs that need adjustment to match actual service signatures:

### Known Issues to Fix:
1. **CredibilityScorer** - Method is `calculateCredibility()` not `calculateCredibilityScore()`, requires additional parameters (activityLogs, medications, limitations)
2. **DailyLog Structure** - Tests need to use complete DailyLog structure with all required fields (createdAt, updatedAt, logDate, timeOfDay, overallSeverity)
3. **Model Imports** - Some tests may need model structure updates

### Next Steps:
1. Update test mocks to match actual DailyLog structure
2. Fix CredibilityScorer test to use correct method name and parameters
3. Ensure all tests use testHelpers for consistent mock data
4. Run full test suite and fix any remaining type mismatches
5. Achieve target code coverage (currently set to 50% for functions/lines/branches/statements)

## Coverage Goals

Current thresholds (set conservatively for initial implementation):
- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%
- **Statements**: 50%

These can be increased once all tests are passing.

## Mocked Dependencies

The test setup mocks the following external dependencies:
- `@react-native-async-storage/async-storage` - Local storage
- `expo-file-system` - File system operations
- `expo-crypto` - Cryptography functions
- `@react-native-community/netinfo` - Network state monitoring

This allows tests to run without Expo/React Native environment.

## Test Categories

### Unit Tests
Focus on individual services and utilities in isolation.

### Integration Tests  
Test complete workflows from data input through evidence generation.

### Validation Tests
Ensure data quality checks work correctly and prevent premature filing.

## Running Specific Test Suites

```bash
# RFC Builder tests only
npm test -- RFCBuilder

# Work Impact tests only
npm test -- WorkImpactAnalyzer

# SSA Form tests only
npm test -- SSAFormBuilder

# Credibility tests only
npm test -- CredibilityScorer

# Sync tests only
npm test -- SyncService

# Backup tests only
npm test -- CloudBackupService

# Utility tests only
npm test -- utilities

# Integration tests only
npm test -- integration
```

## Important Testing Principles

### 1. Evidence Traceability
All tests verify that evidence chains back to original log entries. Every RFC capacity claim, every work impact statement, every SSA form field must have supporting evidence IDs.

### 2. Data Quality Validation
Tests ensure that insufficient data triggers appropriate warnings and recommendations. SSA form generation requires:
- ≥90 days of logging (recommended)
- ≥75% logging consistency (recommended)
- Completed RFC analysis
- Completed Work Impact analysis

### 3. Safe Form Generation
Tests verify SSA forms NEVER pull from raw logs directly. They only use validated RFC and WorkImpact data to prevent premature or inaccurate filing.

### 4. Realistic Test Data
Tests use realistic symptom patterns, severity levels, and job requirements to ensure analysis produces valid results.

## Future Test Additions

Consider adding tests for:
- [ ] Photo attachment validation
- [ ] Multi-device sync edge cases
- [ ] Cloud provider switching
- [ ] Backup restoration with schema migration
- [ ] Voice logging transcription
- [ ] Weather correlation analysis
- [ ] Medication correlation
- [ ] Report export formats
- [ ] HIPAA compliance checks
- [ ] UI component testing (when components implemented)
