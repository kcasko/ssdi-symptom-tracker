# SSDI Symptom Tracker

Production-ready React Native + Expo app for SSDI documentation.

## 🎯 Overview

This is **NOT a wellness app**. It is an evidence collection and report drafting tool optimized for SSDI documentation. The focus is on functional impact, pattern consistency, and generating appropriate narrative documentation.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platforms
npm run android    # Android
npm run ios        # iOS
npm run web        # Web browser
```

**First Time Setup:**
1. App starts on Profile Picker screen
2. Create a profile (or load seed data for testing)
3. Navigate to Dashboard
4. Start logging symptoms and activities

## ✨ Core Features

✅ **Offline-First**: All data stored locally. No cloud sync. No accounts.  
✅ **Multi-Profile**: Support multiple users on one device  
✅ **SSDI-Optimized**: Controlled vocabulary and templates  
✅ **Editable Reports**: Edit sections without losing source data  
✅ **Privacy-Focused**: Optional device encryption with biometric auth  
✅ **Pattern Detection**: Automatic trend and consistency analysis  
✅ **RFC Assessment**: Generate residual functional capacity reports

## 📦 What's Included

### Complete Implementation
- ✅ 7 domain models (Profile, DailyLog, ActivityLog, Limitation, Medication, Appointment, ReportDraft)
- ✅ 60+ symptoms across 6 categories
- ✅ 50+ activities across 5 categories
- ✅ SSDI vocabulary and language rules
- ✅ 4 report templates
- ✅ Pattern detection engines (symptoms, activities, triggers, recovery)
- ✅ RFC assessment with physical/mental/work capacity analysis
- ✅ Narrative generation with SSDI-appropriate language
- ✅ 8 reusable UI components (high-contrast, large touch targets)
- ✅ 10 functional screens
- ✅ State management with Zustand + AsyncStorage persistence
- ✅ Storage layer with optional encryption
- ✅ Multi-profile support built-in

### Screens
1. **Onboarding** - First-time introduction
2. **Profile Picker** - Select/create profiles
3. **Dashboard** - Main hub with statistics and quick actions
4. **Daily Log** - Log symptoms with severity (0-10 scale) and context
5. **Activity Log** - Track activity impact and recovery requirements
6. **Limitations** - Document functional capacity limits
7. **Meds & Appointments** - Treatment compliance tracking
8. **Reports** - Generate SSDI documentation for date ranges
9. **Report Editor** - Edit sections and export as PDF
10. **Settings** - Privacy controls and profile management

## 🏗️ Architecture

The app follows a **three-layer truth architecture**:

### Layer 1: Raw Evidence
- `DailyLog`: Daily symptom entries - never edited indirectly
- `ActivityLog`: Activity attempts and impacts - factual records
- `Limitation`: Baseline functional limits - objective thresholds
- `Medication` & `Appointment`: Treatment history and medical contacts

### Layer 2: Analysis
- `PatternDetector`: Identifies recurring patterns in symptoms and activities
- `SymptomEngine`: Analyzes symptom trends, clusters, and correlations
- `ActivityImpactEngine`: Computes activity tolerance and RFC categories
- `LimitationAnalyzer`: Assesses functional capacity thresholds
- All analysis is computed from raw evidence and repeatable

### Layer 3: Narrative & Reporting
- `ReportDraft`: Editable reports that preserve links to source evidence
- `NarrativeService`: Converts analysis into SSDI-appropriate language
- `SSDINarrativeBuilder`: Generates functional statements with professional tone
- Users can edit drafts without losing underlying evidence

## 🛠️ Tech Stack

- **React Native 0.73** + **Expo SDK 50**
- **TypeScript** (strict mode)
- **Zustand** v4.5 (state management)
- **React Navigation** v6 (navigation)
- **AsyncStorage** v1.21 (local storage)
- **expo-secure-store** (optional encryption)
- **expo-local-authentication** (biometric auth)
- **expo-print** + **expo-sharing** (PDF export)
- **date-fns** v3 (date utilities)
- **uuid** v9 (ID generation)

## 📖 Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development guide including:
- Project structure deep dive
- How to add symptoms/activities/templates
- Testing with seed data
- Code style guidelines
- SSDI optimization patterns

### Key Commands

```bash
npm start          # Start development server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run in web browser
npm run lint       # Run linter
npm run type-check # TypeScript check
npm run clean      # Clean and reinstall
```

### Testing with Seed Data

```typescript
import { generateSeedData } from './src/utils/seedData';

// Generate 30 days of sample data
const seed = generateSeedData();

// Or minimal data (7 days)
const minimal = generateMinimalSeedData();
```

## 📱 Core User Flow

### Minimum Viable Flow
1. **Profile Setup**: Create or select a profile
2. **Daily Logging**: Log symptoms in under 60 seconds
3. **Activity Tracking**: Record activities and their impacts
4. **Limitation Setting**: Define functional baselines
5. **Report Generation**: Create professional reports
6. **Report Editing**: Customize drafts while preserving evidence
7. **Export**: Generate PDF or copyable text

### Key Screens
- **ProfilePickerScreen**: Multi-profile management
- **DashboardScreen**: Quick access to all functions
- **DailyLogScreen**: Fast symptom entry
- **ActivityLogScreen**: Activity impact documentation
- **LimitationsScreen**: Functional capacity assessment
- **ReportsScreen**: Report management and generation
- **ReportEditorScreen**: Edit drafts with section reordering

## 🔧 Key Components

### Data Models
- **Profile**: User profiles with settings and preferences
- **DailyLog**: Daily symptom entries with severity, duration, triggers
- **ActivityLog**: Activity attempts with impact and recovery data
- **Limitation**: Functional limitations with thresholds and consequences
- **ReportDraft**: Editable reports with structured sections and text blocks

### UI Components
- **PainScale**: 0-10 severity input with visual feedback
- **SymptomPicker**: Multi-select symptom picker with categories
- **DurationPicker**: Time duration input with presets
- **BigButton**: Large, accessible action buttons
- **SummaryCard**: Data summary displays

### Services
- **LogService**: Manages all logging operations
- **AnalysisService**: Computes patterns and insights
- **NarrativeService**: Generates SSDI-appropriate text
- **ReportService**: Assembles and manages reports

## 📊 Report Types

### 1. Daily Summary
- **Purpose**: Quick overview for appointments
- **Length**: 1-2 pages
- **Content**: Daily patterns, severity trends, key symptoms

### 2. Activity Impact Summary
- **Purpose**: Work capacity evaluation
- **Length**: 2-3 pages
- **Content**: Activity tolerance, recovery times, functional limits

### 3. Functional Limitations Assessment
- **Purpose**: RFC (Residual Functional Capacity) documentation
- **Length**: 2-4 pages
- **Content**: Sitting/standing/walking limits, cognitive capacity

### 4. Complete SSDI Documentation
- **Purpose**: Full disability application support
- **Length**: 4-8 pages
- **Content**: Comprehensive narrative with all evidence types

## 🔒 Privacy & Security

### Data Storage
- All data stored locally using AsyncStorage
- No cloud synchronization or external data transmission
- Optional encryption using device secure storage
- Data keyed by profile ID for complete separation

### Optional Security Features
- **App Lock**: PIN or biometric authentication
- **Encryption**: Secure storage for sensitive data
- **Device Authentication**: Biometric unlock where available

### Export Privacy
- Personal information excluded from exports by default
- Configurable data inclusion for different use cases
- No identifying information in generated filenames

## 🧩 Extending the App

### Adding New Symptoms
Edit [src/data/symptoms.ts](src/data/symptoms.ts):
```typescript
export const SYMPTOMS: SymptomDefinition[] = [
  // Add new symptom definition
  {
    id: 'new_symptom',
    name: 'New Symptom',
    category: 'appropriate_category',
    commonLocations: ['location1', 'location2'],
    commonQualifiers: ['qualifier1', 'qualifier2'],
    description: 'Description for UI',
    tags: ['tag1', 'tag2'],
  },
  // ... existing symptoms
];
```

### Adding New Activities
Edit [src/data/activities.ts](src/data/activities.ts):
```typescript
export const ACTIVITIES: ActivityDefinition[] = [
  // Add new activity definition
  {
    id: 'new_activity',
    name: 'New Activity',
    category: 'appropriate_category',
    description: 'Activity description',
    typicalDuration: 30, // minutes
    intensityGuide: {
      light: 'Light version description',
      moderate: 'Moderate version description',
      heavy: 'Heavy version description'
    },
    tags: ['tag1', 'tag2'],
  },
  // ... existing activities
];
```

### Adding New Report Templates
Edit [src/data/reportTemplates.ts](src/data/reportTemplates.ts) to add new report types with appropriate sections and content hints.

### Customizing SSDI Vocabulary
Edit [src/data/ssdiVocabulary.ts](src/data/ssdiVocabulary.ts) to modify the controlled vocabulary for your specific use case.

## 🔄 Data Migrations

The app includes a migration system for handling schema changes:

```typescript
// Adding a new migration
{
  version: 2,
  name: 'add_new_field',
  description: 'Add new field to existing data',
  migrate: async () => {
    // Migration logic here
  },
}
```

Run `npm run typecheck` to validate TypeScript after schema changes.

## 🧪 Development

### Available Scripts
- `npm start`: Start Expo development server
- `npm run android`: Run on Android
- `npm run ios`: Run on iOS  
- `npm run web`: Run in web browser
- `npm run lint`: Run ESLint
- `npm run typecheck`: Run TypeScript compiler check

### Development Features
- Sample data generation for testing
- Storage statistics logging
- Debug mode with additional UI elements
- Hot reloading for rapid iteration

### Code Organization
- **Domain-Driven Design**: Business logic separated from UI
- **Clean Architecture**: Clear separation of concerns
- **Type Safety**: Full TypeScript coverage
- **State Management**: Zustand for predictable state updates

## 📋 Production Deployment

### Build for Production
```bash
# Build standalone app
expo build:android
expo build:ios

# Or use EAS Build (recommended)
eas build --platform android
eas build --platform ios
```

### Pre-Deployment Checklist
- [ ] Replace placeholder icons with actual assets
- [ ] Test on multiple devices and screen sizes  
- [ ] Verify SSDI vocabulary accuracy with legal/medical professionals
- [ ] Test all export formats
- [ ] Validate privacy controls
- [ ] Performance testing with large datasets
- [ ] Accessibility testing

### App Store Guidelines
- Clearly communicate medical disclaimer
- Ensure compliance with health data regulations
- Include appropriate privacy policy
- Test with disability advocacy groups

## 🤝 Contributing

This app is designed for people with disabilities and their advocates. When contributing:

1. **Test with real users** - Include people with disabilities in testing
2. **Maintain accessibility** - Follow WCAG guidelines
3. **Preserve privacy** - No features that compromise local-only storage
4. **Validate SSDI compliance** - Ensure language remains appropriate
5. **Document changes** - Update migration system for schema changes

## 📄 License

This project is designed to help people with disabilities access benefits they're entitled to. Please use responsibly and consider the privacy and security implications for vulnerable populations.

## ⚠️ Important Disclaimers

- **Not Medical Advice**: This app is for documentation only, not medical diagnosis or treatment
- **Legal Consultation**: Always consult with qualified professionals for SSDI applications  
- **Data Responsibility**: Users are responsible for the accuracy of their logged data
- **Privacy Notice**: App stores data locally - users should back up important information

## 📞 Support

For issues related to SSDI applications, consult:
- Qualified disability attorneys
- Social Security Administration resources
- Disability advocacy organizations

For app technical issues, refer to the project's issue tracker and documentation.

---

**Built with ❤️ for the disability community**

This app represents thousands of hours of research into SSDI requirements, accessibility best practices, and the real needs of people navigating the disability system. Use it to collect the evidence you need to tell your story clearly and professionally.