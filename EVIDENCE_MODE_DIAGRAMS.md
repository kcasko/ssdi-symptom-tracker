# Evidence Mode System Diagram

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EVIDENCE MODE CHECK                         │
│  Is Evidence Mode enabled?                                       │
│  • Yes → Apply immutable timestamp                              │
│  • No  → Standard log creation                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOG CREATION/EDIT                          │
│  • Creating new log → Save with timestamps                      │
│  • Editing existing → Check finalization status                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
         ┌──────────────────┐  ┌──────────────────┐
         │  NOT FINALIZED   │  │    FINALIZED     │
         │  • Allow edits   │  │  • Block edits   │
         │  • Update log    │  │  • Offer revision│
         └──────────────────┘  └──────────────────┘
                                         │
                                         ▼
                            ┌────────────────────────┐
                            │  REVISION WORKFLOW     │
                            │  1. User provides      │
                            │     reason             │
                            │  2. System creates     │
                            │     revision record    │
                            │  3. Original preserved │
                            └────────────────────────┘
```

## Report Generation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SELECT DATE RANGE                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GATHER DATA                                   │
│  • Filter daily logs by date range                              │
│  • Filter activity logs by date range                           │
│  • Collect revisions for those logs                             │
│  • Count finalized logs                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 ANALYZE & CATEGORIZE                             │
│  • Group symptoms by type                                        │
│  • Calculate frequencies and averages                           │
│  • Map to functional domains                                    │
│  • Identify patterns                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               GENERATE STANDARDIZED NARRATIVES                   │
│  • Use fixed sentence templates                                 │
│  • Insert calculated data                                       │
│  • Maintain neutral language                                    │
│  • Build revision summary                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STRUCTURE REPORT                              │
│  Section 1: Data Summary                                        │
│  Section 2: Symptom Documentation                               │
│  Section 3: Activity Impact Documentation                       │
│  Section 4: Functional Limitations by Domain                    │
│  Section 5: Revision History (if applicable)                    │
│  Section 6: Disclaimer                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPORT OPTIONS                                │
│  • Plain text (.txt)                                            │
│  • HTML for PDF                                                 │
│  • Structured JSON data                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
SettingsScreen
├── EvidenceModeControls
│   ├── Toggle Switch
│   ├── Status Display
│   └── Error Display
└── SubmissionPackBuilder
    ├── Form (title, dates)
    ├── Create Button
    └── SubmissionPackList
        └── PackCard (for each pack)
            ├── Pack metadata
            ├── Statistics
            └── Immutable badge

DailyLogScreen
├── Log Form Fields
├── Evidence Timestamp Display (if present)
├── LogFinalizationControls
│   ├── Finalization Status
│   ├── Revision Count
│   ├── Finalize Button (if not finalized)
│   └── Read-Only Badge (if finalized)
└── Revision History Button
    └── RevisionHistoryViewer (modal)
        └── RevisionCard (for each revision)
            ├── Timestamp
            ├── Field changed
            ├── Reason
            ├── Original value
            └── Updated value

ReportsScreen
├── Date Range Selector
├── Generate Report Button
└── Report Display
    ├── Data Summary
    ├── Symptom Narratives
    ├── Activity Narratives
    ├── Functional Limitations
    ├── Revision Summary
    └── Disclaimer
```

## State Management Structure

```
App State
│
├── profileStore
│   ├── profiles[]
│   ├── activeProfile
│   └── actions (create, update, delete)
│
├── logStore
│   ├── dailyLogs[]
│   ├── activityLogs[]
│   ├── limitations[]
│   ├── medications[]
│   └── actions (add, update, delete)
│
├── evidenceModeStore (NEW)
│   ├── config {enabled, enabledAt, enabledBy}
│   ├── finalizations[]
│   ├── revisions[]
│   ├── submissionPacks[]
│   └── actions
│       ├── enableEvidenceMode()
│       ├── disableEvidenceMode()
│       ├── finalizeLog()
│       ├── createRevision()
│       └── createPack()
│
├── reportStore
│   ├── reportDrafts[]
│   └── actions (create, update, delete)
│
└── settingsStore
    ├── settings{}
    └── actions (update, reset)
```

## Functional Domain Mapping Visualization

```
SYMPTOM: "back-pain"
    ↓
    └─ Maps to Functional Domains:
       ├─ sitting
       ├─ standing
       ├─ walking
       ├─ lifting
       ├─ carrying
       └─ reaching

ACTIVITY: "desk-work"
    ↓
    └─ Maps to Functional Domains:
       ├─ sitting
       ├─ concentration
       ├─ persistence
       └─ handling

REPORT GENERATION:
    ↓
    └─ Groups by Functional Domain:
       
       SITTING DOMAIN
       ├─ back-pain (from symptoms)
       └─ desk-work (from activities)
       
       CONCENTRATION DOMAIN
       ├─ brain-fog (from symptoms)
       ├─ desk-work (from activities)
       └─ meetings (from activities)
```

## Revision Tracking Example

```
TIMELINE:

Day 1: Create Daily Log
┌─────────────────────────┐
│ Date: 2024-01-15       │
│ Pain Severity: 7       │
│ Notes: "Moderate pain" │
│ finalized: false       │
└─────────────────────────┘

Day 3: Finalize Log
┌─────────────────────────┐
│ Date: 2024-01-15       │
│ Pain Severity: 7       │
│ Notes: "Moderate pain" │
│ finalized: true        │
│ finalizedAt: 2024-01-17│
└─────────────────────────┘

Day 10: Attempt Edit → Creates Revision
┌─────────────────────────────────────────┐
│ ORIGINAL LOG (unchanged)                │
│ Date: 2024-01-15                        │
│ Pain Severity: 7                        │
│ Notes: "Moderate pain"                  │
│ finalized: true                         │
│ finalizedAt: 2024-01-17                 │
└─────────────────────────────────────────┘
                │
                ├─ REVISION RECORD
                │  ┌──────────────────────────────┐
                │  │ Revision ID: rev_001         │
                │  │ Field: "symptoms[0].severity"│
                │  │ Original Value: 7            │
                │  │ Updated Value: 8             │
                │  │ Reason: "Understated pain"   │
                │  │ Timestamp: 2024-01-24        │
                │  └──────────────────────────────┘
                ▼
        Both visible in UI
        Both included in reports
```

## Submission Pack Structure

```
SUBMISSION PACK
┌────────────────────────────────────────────────────────┐
│ ID: pack_20240315_abc123                               │
│ Title: "Initial Filing - Q1 2024"                      │
│ Date Range: 2024-01-01 to 2024-03-31                   │
│ Created: 2024-03-15 14:30:00                           │
│ immutable: true                                        │
│                                                        │
│ INCLUDED LOGS:                                         │
│ ├─ Daily Logs: 85 (IDs: [log_001, log_002, ...])      │
│ ├─ Activity Logs: 42 (IDs: [act_001, act_002, ...])   │
│ └─ Reports: 2 (IDs: [rep_001, rep_002])               │
│                                                        │
│ METADATA:                                              │
│ ├─ App Version: 1.0.0                                  │
│ ├─ Evidence Mode: Enabled                              │
│ ├─ Total Finalized: 127                                │
│ └─ Total Revisions: 3                                  │
└────────────────────────────────────────────────────────┘
       │
       └─ Can be exported as:
          ├─ PDF (clean, professional)
          ├─ Text file
          └─ JSON data
```

## Storage Keys and Data Structure

```
AsyncStorage Structure:

@ssdi/evidence_mode_config
└─ {enabled: true, enabledAt: "...", enabledBy: "profile_123"}

@ssdi/log_finalizations
└─ [
     {logId: "log_001", logType: "daily", finalizedAt: "...", finalizedBy: "..."},
     {logId: "log_002", logType: "daily", finalizedAt: "...", finalizedBy: "..."},
     ...
   ]

@ssdi/revisions
└─ [
     {id: "rev_001", logId: "log_001", fieldPath: "...", originalValue: ..., updatedValue: ..., reason: "...", timestamp: "..."},
     {id: "rev_002", logId: "log_003", fieldPath: "...", originalValue: ..., updatedValue: ..., reason: "...", timestamp: "..."},
     ...
   ]

@ssdi/submission_packs
└─ [
     {id: "pack_001", title: "...", startDate: "...", endDate: "...", includedDailyLogs: [...], includedActivityLogs: [...], ...},
     ...
   ]
```

## Report Template Example

```
═══════════════════════════════════════════════════════════════
                      EVIDENCE REPORT
═══════════════════════════════════════════════════════════════

Report Information
───────────────────────────────────────────────────────────────
Title: Symptom Documentation - Q1 2024
Generated: March 15, 2024, 2:30 PM
Date Range: January 1, 2024 to March 31, 2024
Application Version: 1.0.0

Data Summary
───────────────────────────────────────────────────────────────
The user reports symptom and activity data for the period from 
January 1, 2024 to March 31, 2024. This period spans 90 days. 
Logs were created on 85 of 90 days.

Data coverage: 85 of 90 days (94 percent). Finalized entries: 
127. Entries with revisions: 3.

Symptom Documentation
───────────────────────────────────────────────────────────────
1. back-pain
   Logs indicate back-pain was recorded on 75 of 85 logged days
   (88 percent). Average reported severity was 7.2 on a scale 
   of 0 to 10.

2. fatigue
   Logs indicate fatigue was recorded on 68 of 85 logged days
   (80 percent). Average reported severity was 6.8 on a scale 
   of 0 to 10.

[... continues with more sections ...]

Revision History
───────────────────────────────────────────────────────────────
Total revisions: 3

1. Entry for January 15, 2024: Field "symptoms[0].severity" 
   was revised on January 24, 2024.

2. Entry for February 3, 2024: Field "notes" was revised on 
   February 10, 2024.

[... continues ...]

Disclaimer
───────────────────────────────────────────────────────────────
This report documents user-reported information only. The 
application does not provide medical advice, diagnosis, or 
treatment recommendations. Data presented reflects logged 
entries and does not constitute clinical assessment.

═══════════════════════════════════════════════════════════════
```

## Legend

```
┌─┐  UI Component
│ │  
└─┘

┌──────────┐  Data Store
│          │
└──────────┘

───▶  Data Flow

┌────┐
│    │  Process/Decision
└────┘

[...]  Array/List

{...}  Object/Map
```
