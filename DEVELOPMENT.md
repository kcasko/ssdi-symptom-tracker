# Development Guide

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

## Project Structure

```
src/
├── components/        # Reusable UI components
├── data/             # Static data (symptoms, activities, templates)
├── domain/           # Domain models and business rules
│   ├── models/       # TypeScript interfaces with helpers
│   └── rules/        # Business logic rules
├── engine/           # Analysis and narrative engines
├── navigation/       # React Navigation setup
├── screens/          # Screen components
├── services/         # Service layer (orchestration)
├── state/            # Zustand stores
├── storage/          # AsyncStorage wrapper + encryption
├── theme/            # Design system (colors, spacing, typography)
└── utils/            # Utility functions
```

## Architecture

### Three-Layer System

1. **Raw Evidence** → Daily logs, activity logs, limitations
2. **Analysis** → Pattern detection, RFC assessment, trend analysis
3. **Narrative** → SSDI-optimized reports with editable sections

### Key Design Principles

- **Offline-first**: All data stored locally with AsyncStorage
- **Privacy-focused**: No cloud sync, no accounts, optional encryption
- **Multi-profile**: Support multiple users on one device
- **SSDI-optimized**: Functional language, not diagnostic/emotional
- **High-contrast UI**: Large touch targets, minimal animations

## Development Workflow

### Adding a New Symptom

1. Add to `src/data/symptoms.ts`
2. Categorize appropriately (pain/cognitive/physical/etc)
3. Include SSDI-appropriate description

### Adding a New Activity

1. Add to `src/data/activities.ts`
2. Categorize (physical/household/cognitive/social/self-care)
3. Include functional description

### Creating a New Report Template

1. Add to `src/data/reportTemplates.ts`
2. Define sections with placeholders
3. Map to narrative builder in `ReportService`

### Adding Analysis Logic

1. Update appropriate engine (`SymptomEngine`, `ActivityImpactEngine`, etc)
2. Add to `AnalysisService` if coordination needed
3. Connect to `NarrativeService` for report generation

## Testing with Seed Data

```typescript
import { generateSeedData } from './utils/seedData';

// In development, load seed data
const seed = generateSeedData();
// Apply to stores...
```

## State Management

Uses Zustand with AsyncStorage persistence:

- `profileStore` - Profile management
- `logStore` - Daily and activity logs
- `reportStore` - Report drafts
- `settingsStore` - App settings

All coordinated via `useAppState` hook.

## Storage Schema

Current version: **v1**

Migrations handled automatically via `src/storage/migrations.ts`

## Encryption

Optional device-level encryption using:

- `expo-secure-store` for keys
- `expo-local-authentication` for biometrics
- AES encryption for data

Enable in Settings → Privacy → Device Encryption

## SSDI Optimization

### Language Rules

- Use functional terms: "unable to", "limited to", "requires"
- Avoid diagnostic language: "I feel", "my condition"
- Focus on consistency and frequency
- Document recovery requirements

### RFC Categories

- Sedentary: < 10 lbs lifting
- Light: 10-20 lbs
- Medium: 20-50 lbs
- Heavy: 50-100 lbs
- Very Heavy: > 100 lbs

### Pattern Detection

- Symptom frequency and severity trends
- Activity tolerance thresholds
- Time-of-day patterns
- Trigger identification
- Recovery time analysis

## Code Style

- TypeScript strict mode
- Functional approach with immutable updates
- Helper functions for model operations
- Comments explaining SSDI-specific logic

## Important Notes

⚠️ **Privacy**: Never commit user data files
⚠️ **SSDI Focus**: This is NOT a wellness app - it's evidence collection
⚠️ **Editable Reports**: Report sections link to source data but can be edited without regeneration
⚠️ **Multi-profile**: All operations scoped to active profile
