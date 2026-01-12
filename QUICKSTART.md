
# Quick Start Guide

## First Time Setup

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:

- React Native and Expo
- Navigation libraries
- State management (Zustand)
- Storage and encryption
- PDF export capabilities

### 2. Start Development Server

```bash
npm start
```

This opens the Expo developer tools. You'll see:

- QR code for mobile testing
- Options to run on iOS, Android, or web

### 3. Run on Platform

### Option A: Mobile Device (Recommended)

1. Install "Expo Go" app on your phone

2. Scan the QR code from step 2
3. App will load on your device

### Option B: iOS Simulator (Mac only)

```bash

npm run ios
```

### Option C: Android Emulator  

```bash

npm run android
```

### Option D: Web Browser (Limited functionality)

```bash

npm run web
```

## Using the App

### First Launch Flow

1. **Onboarding Screen** - Brief introduction
2. **Create Profile** - Add your first profile
3. **Dashboard** - Main hub appears

### Daily Workflow

#### Morning: Log Symptoms

1. Dashboard → "Log Today's Symptoms"
2. Select symptoms (tap to add)
3. Rate severity (0-10 scale)
4. Add notes if needed
5. Save

#### After Activity: Log Impact

1. Dashboard → "Log Activity"
2. Select activity from list
3. Enter duration
4. Rate impact severity
5. Note if you had to stop early
6. Save

#### Weekly: Generate Report

1. Navigate to "Reports"
2. Select date range (e.g., "Last 7 Days")
3. Choose template:
   - Daily Summary (quick overview)
   - Activity Impact (work capacity)
   - RFC Assessment (functional limits)
   - Complete SSDI (comprehensive)
4. Review generated report
5. Edit sections as needed
6. Export as PDF

## Testing with Sample Data

To explore the app with realistic data:

```typescript
// Option 1: Modify App.tsx to load seed data on first run
import { generateSeedData } from './src/utils/seedData';

// In useEffect after initialization:
const seed = generateSeedData();
// Apply seed data to stores...
```

This creates:

- 1 test profile
- 30 days of daily logs
- 15 activity logs
- 5 functional limitations

## Tips for Best Results

### Logging Symptoms

- Log daily, even on "good" days (shows consistency)
- Be specific with notes about triggers
- Use the same time each day if possible

### Logging Activities

- Track duration accurately
- Note recovery time needed
- Document if you had to stop early

### Generating Reports

- Use longer date ranges (30-90 days) for patterns
- Edit reports to add context, but keep functional language
- Export regularly for your records

## Privacy & Security

### Default Setup

- All data stored locally on your device
- No cloud sync
- No user account required
- No tracking or telemetry

### Optional Security

Settings → Privacy → Enable Encryption

- Encrypts sensitive data
- Requires device PIN or biometric
- Recommended for shared devices

## Troubleshooting

### App Won't Start

```bash
# Clean install
npm run clean
npm install
npm start
```

### Data Not Persisting

- Check if storage permissions are granted
- Verify AsyncStorage is working: check console for errors

### Can't Generate PDF

- Ensure expo-print is installed
- Check device storage space
- Try a shorter date range

## Next Steps

1. ✅ Create your profile
2. ✅ Log symptoms for 7+ days
3. ✅ Log a few activities
4. ✅ Generate your first report
5. ✅ Explore settings and customization

## Development Commands

```bash
npm start          # Start Expo dev server
npm run android    # Launch on Android
npm run ios        # Launch on iOS
npm run web        # Launch in browser
npm run lint       # Check code quality
npm run type-check # Verify TypeScript
npm run clean      # Clean and reinstall
```

## Getting Help

- See [README.md](README.md) for full documentation
- See [DEVELOPMENT.md](DEVELOPMENT.md) for technical details
- See [CHECKLIST.md](CHECKLIST.md) for deployment prep

---

**Ready to start?** Run `npm install` then `npm start`!
