# Evidence Mode - Legal Documentation System

## What is Evidence Mode?

Evidence Mode transforms the SSDI Symptom Tracker into a credible evidence-generation system suitable for legal proceedings, disability claims, and professional documentation. It adds immutable timestamps, revision tracking, and standardized reporting to ensure data integrity and legal defensibility.

## Key Principles

### 1. **Immutability**

When Evidence Mode is enabled, all logs receive creation timestamps that cannot be edited. This establishes a clear record of when data was entered.

### 2. **Transparency**

All changes to finalized logs are tracked as revisions, preserving the original entry alongside the modification. Nothing is hidden or deleted.

### 3. **Neutrality**

Reports use standardized, boring language. No emotional descriptors, no speculation, no legal advice.

### 4. **User Control**

Evidence Mode is opt-in. Users decide when to enable it, when to finalize logs, and what to include in submission packs.

### 5. **Restraint Over Convenience**

The system favors accuracy and defensibility over ease of use. Finalized logs cannot be casually edited.

## User Journey

### For Self-Represented Individuals

**Week 1: Initial Setup**

1. Install app and create profile
2. Review Evidence Mode in Settings
3. Decide whether to enable Evidence Mode now or later
4. Begin logging symptoms and activities

**Week 2-12: Regular Logging**

1. Create daily logs and activity logs
2. Review entries for accuracy
3. Finalize logs when confident they're complete
4. Continue building documentation

**Month 3: Preparing Submission**

1. Review all logs for date range needed
2. Finalize any remaining logs
3. Generate evidence report using date range
4. Review report for accuracy
5. Create submission pack
6. Export PDF for submission

### For Attorney-Represented Individuals

**Initial Consultation**

1. Attorney recommends enabling Evidence Mode
2. User enables Evidence Mode
3. Begin systematic logging per attorney guidance

**Pre-Hearing Preparation**

1. Review and finalize all logs
2. Generate evidence report
3. Share PDF with attorney
4. Attorney reviews for gaps or inconsistencies
5. Create submission pack for hearing

**Post-Hearing**

1. Submission pack is immutable record
2. Available for appeals or follow-ups
3. Can generate additional reports from same data

## Features in Detail

### Evidence Mode Toggle

**What it does:**

- Adds immutable `evidenceTimestamp` to all new logs
- Provides visual indicator in UI
- Tracks when mode was enabled and by whom

**When to use:**

- At start of claims process
- When preparing for legal proceedings
- When building documentation for medical providers

**When NOT to use:**

- Casual symptom tracking without legal intent
- Experimental logging to find patterns
- Short-term symptom monitoring

### Log Finalization

**What it does:**

- Marks a log as read-only
- Prevents accidental modifications
- Requires revisions for any changes

**When to finalize:**

- When you're confident the entry is complete and accurate
- Before generating reports
- When preparing documentation for submission

**What gets finalized:**

- Daily logs (symptoms, severity, notes, environmental factors)
- Activity logs (activities, impacts, recovery time, assistance)

### Revision Tracking

**What it does:**

- Creates a record when you need to change a finalized log
- Preserves the original entry
- Requires you to explain why the change was made
- Shows both versions in reports

**Example scenario:**
You finalized a daily log showing back pain severity of 7/10. Later you realize you meant 8/10.

Instead of changing the 7 to 8 directly:

1. System detects log is finalized
2. Prompts for revision reason: "Initial entry understated severity"
3. Creates revision record with original value (7) and new value (8)
4. Both values are preserved
5. Report shows: "Entry revised on [date]. Original: 7, Updated: 8. Reason: Initial entry understated severity."

### Standardized Reports

**What they include:**

- Data summary (date range, coverage, finalization status)
- Symptom documentation (frequency, severity, patterns)
- Activity impact documentation (attempts, completion, assistance)
- Functional limitations (grouped by domain: sitting, walking, concentration, etc.)
- Revision history (if applicable)
- Neutral disclaimer

**What they DON'T include:**

- Medical advice
- Legal strategy
- Approval predictions
- Emotional language
- Speculative causation

**Example language:**

- ✓ "Logs indicate back-pain was recorded on 45 of 60 logged days (75 percent)."
- ✗ "Patient suffers from severe chronic back pain."
- ✓ "The user reports requiring assistance for grocery shopping on 12 of 15 logged attempts (80 percent)."
- ✗ "User is unable to shop independently."

### Functional Domain Mappings

**What they are:**
Internal classifications that group symptoms and activities by functional impact areas like sitting, standing, walking, concentration, etc.

**Why they exist:**
To structure reports logically and align with functional capacity assessment frameworks.

**Important:**

- NOT labeled as "SSA fields" in the UI
- Users don't need to understand them
- Used only for report organization
- Aligned with common disability assessment domains

**Example:**

- Back pain internally maps to: sitting, standing, walking, lifting, carrying, reaching
- Desk work internally maps to: sitting, concentration, persistence, handling
- Reports group data by these domains for clarity

### Submission Packs

**What they are:**
Immutable bundles containing finalized logs, reports, and metadata for a specific date range.

**What's included:**

- All finalized daily logs in range
- All finalized activity logs in range
- Generated evidence reports
- Revision summary
- Generation metadata (timestamp, app version, Evidence Mode status)

**Why they're useful:**

- Single package for lawyer review
- Consistent documentation for appeals
- Immutable record of what was submitted
- Can't be accidentally modified after creation

**Example use:**
You create a submission pack for January 1 - March 31, 2024. This pack includes 85 daily logs, 42 activity logs, and 3 revisions. Once created, it's marked immutable. You can export it as PDF, share with your attorney, or keep as archival record.

## Best Practices

### For Maximum Credibility

1. **Enable Evidence Mode Early**
   - Turn on Evidence Mode before you start systematic logging
   - This creates the longest possible evidence trail

2. **Log Consistently**
   - Daily logs are more credible than sporadic entries
   - Pattern of regular documentation shows commitment

3. **Finalize Thoughtfully**
   - Review entries before finalizing
   - Don't finalize if you're unsure
   - Better to wait than to create unnecessary revisions

4. **Minimize Revisions**
   - Every revision requires explanation
   - Too many revisions can raise questions
   - Take time to get it right the first time

5. **Use Neutral Language in Notes**
   - Stick to observable facts
   - "Pain prevented completion" vs "I couldn't do it"
   - Align with the app's neutral tone

### For Effective Documentation

1. **Be Specific**
   - "Sat for 30 minutes before pain escalated to 8/10" is better than "sitting hurts"
   - Record actual durations, severities, impacts

2. **Document Context**
   - Environmental factors (weather, stress)
   - What you were doing before symptoms started
   - Recovery actions taken

3. **Track Assistance**
   - When you needed help
   - What kind of help
   - How often this occurs

4. **Note Patterns**
   - Activities that consistently cause problems
   - Symptoms that appear together
   - Time-of-day variations

## Common Questions

**Q: Should I enable Evidence Mode right away?**
A: If you're pursuing SSDI or building documentation for medical/legal purposes, yes. If you're just tracking symptoms casually, it's optional.

**Q: Can I turn Evidence Mode off later?**
A: Yes. Existing logs will keep their timestamps, but new logs won't receive them.

**Q: What if I make a mistake in a finalized log?**
A: Create a revision. The system will preserve the original and track the change.

**Q: Can I delete a finalized log?**
A: This is blocked by default. Finalized logs should remain in the record.

**Q: How many revisions is too many?**
A: No hard limit, but excessive revisions may raise credibility questions. Aim for accuracy on the first entry.

**Q: Do I have to finalize all my logs?**
A: No. Finalize when you're confident and ready. You can generate reports from non-finalized logs too.

**Q: What format are the PDF exports?**
A: Clean, minimal formatting. Black text on white background, Times New Roman font, clear section headers. Professional and lawyer-ready.

**Q: Can lawyers or case workers see my revision history?**
A: Yes, if you include it in reports. Revision summaries are factual and neutral - they just show what changed and when.

**Q: Is this compliant with SSA requirements?**
A: The app documents user-reported information. It doesn't diagnose or assess disability. Reports are tools for documentation, not medical evidence.

## Technical Notes

### Data Integrity

- Evidence timestamps use ISO 8601 format (UTC)
- Revisions store complete snapshots when possible
- Submission packs are marked `immutable: true`
- All changes are logged with timestamps

### Storage

All Evidence Mode data is stored locally using AsyncStorage:

- `@ssdi/evidence_mode_config` - Evidence Mode status
- `@ssdi/log_finalizations` - Finalized log records
- `@ssdi/revisions` - Revision history
- `@ssdi/submission_packs` - Created packs

### Privacy

- All data stays on device unless you explicitly share
- No automatic cloud sync of Evidence Mode data
- Exports are generated locally
- You control what gets shared

## Limitations

### What Evidence Mode Doesn't Do

- **Not medical evidence**: Reports document user entries, not medical facts
- **Not legal advice**: System never suggests strategy or likelihood of approval
- **Not tamper-proof**: Data is stored locally and can be modified with technical skills
- **Not certification**: App doesn't certify accuracy of entered data
- **Not authentication**: No digital signatures or blockchain verification

### What It DOES Do

- Creates consistent documentation
- Preserves revision trails
- Generates professional reports
- Supports systematic tracking
- Provides neutral language
- Organizes data logically

## Support and Questions

This is a documentation tool, not a legal service. For questions about:

- **SSDI eligibility**: Consult Social Security Administration
- **Legal strategy**: Consult disability attorney
- **Medical questions**: Consult healthcare provider
- **App technical issues**: See app documentation

---

**Remember:** Evidence Mode adds rigor to documentation, but the quality of evidence depends on accurate, honest, and consistent logging by the user.
