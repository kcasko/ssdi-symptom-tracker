# Daymark

Daymark is a personal health tracker built with React Native and Expo.

It focuses on:

- Symptom logs
- Medication and side-effect tracking
- Doctor appointment notes
- Activity impact tracking
- Personal summaries and exports
- Local backup and restore

Daymark does not provide medical advice, diagnosis, treatment recommendations, legal advice, or administrative guidance. It summarizes user-entered records so a person can review patterns and prepare clearer notes for appointments.

## Development

```bash
npm install
npm run start
```

Useful checks:

```bash
npm run typecheck
npm run lint
npm test
```

## Data

Records are stored locally on the device through AsyncStorage. Optional app lock and export features are available from settings.
