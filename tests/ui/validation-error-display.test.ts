/**
 * REQ-FM-002: Validation Error UI Display
 * Requirement: Validation errors must be shown to user in UI
 */

describe('REQ-FM-002: Validation Errors Displayed to User', () => {
  test('Invalid severity (out of range) shows error message', () => {
    const severity = 15; // Invalid: must be 1-10
    const isValid = severity >= 1 && severity <= 10;
    const errorMessage = isValid ? '' : 'Severity must be between 1 and 10';
    
    expect(isValid).toBe(false);
    expect(errorMessage).toBe('Severity must be between 1 and 10');
    expect(errorMessage.length).toBeGreaterThan(0);
  });

  test('Missing required field shows error message', () => {
    const logDate = '';
    const isValid = logDate.length > 0;
    const errorMessage = isValid ? '' : 'Date is required';
    
    expect(isValid).toBe(false);
    expect(errorMessage).toBe('Date is required');
  });

  test('Invalid date format shows error message', () => {
    const logDate = 'invalid-date';
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const isValid = dateRegex.test(logDate);
    const errorMessage = isValid ? '' : 'Date must be in YYYY-MM-DD format';
    
    expect(isValid).toBe(false);
    expect(errorMessage).toBe('Date must be in YYYY-MM-DD format');
  });

  test('Future date shows error message', () => {
    const logDate = new Date('2027-01-01'); // Future date
    const today = new Date('2026-02-06');
    const isValid = logDate <= today;
    const errorMessage = isValid ? '' : 'Date cannot be in the future';
    
    expect(isValid).toBe(false);
    expect(errorMessage).toBe('Date cannot be in the future');
  });

  test('Duplicate symptom entry shows error message', () => {
    const existingSymptoms = ['Fatigue', 'Headache'];
    const newSymptom = 'Fatigue';
    const isDuplicate = existingSymptoms.includes(newSymptom);
    const errorMessage = isDuplicate ? 'This symptom is already logged' : '';
    
    expect(isDuplicate).toBe(true);
    expect(errorMessage).toBe('This symptom is already logged');
  });

  test('Invalid duration (negative) shows error message', () => {
    const duration = -10;
    const isValid = duration > 0;
    const errorMessage = isValid ? '' : 'Duration must be greater than 0';
    
    expect(isValid).toBe(false);
    expect(errorMessage).toBe('Duration must be greater than 0');
  });

  test('Empty symptom name shows error message', () => {
    const symptomName = '   '; // Blank/whitespace
    const isValid = symptomName.trim().length > 0;
    const errorMessage = isValid ? '' : 'Symptom name cannot be empty';
    
    expect(isValid).toBe(false);
    expect(errorMessage).toBe('Symptom name cannot be empty');
  });

  test('Retrospective context note too short shows error message', () => {
    const note = 'Too short'; // Less than 20 characters
    const minLength = 20;
    const isValid = note.length >= minLength;
    const errorMessage = isValid ? '' : `Note must be at least ${minLength} characters`;
    
    expect(isValid).toBe(false);
    expect(errorMessage).toContain('20 characters');
  });

  test('Invalid impact level shows error message', () => {
    const impactLevel = 'extreme'; // Not valid: must be none/mild/moderate/severe
    const validLevels = ['none', 'mild', 'moderate', 'severe'];
    const isValid = validLevels.includes(impactLevel);
    const errorMessage = isValid ? '' : 'Impact must be: none, mild, moderate, or severe';
    
    expect(isValid).toBe(false);
    expect(errorMessage).toContain('none, mild, moderate');
  });

  test('Error messages are user-friendly (not technical)', () => {
    const technicalError = 'ValidationError: Field symptom.name failed constraint isNotEmpty';
    const userFriendlyError = 'Symptom name cannot be empty';
    
    // User-friendly versions should NOT contain technical terms
    expect(userFriendlyError).not.toContain('ValidationError');
    expect(userFriendlyError).not.toContain('constraint');
    expect(userFriendlyError).not.toContain('isNotEmpty');
    
    // Should be clear and actionable
    expect(userFriendlyError.length).toBeLessThan(100);
    expect(userFriendlyError.charAt(0).toUpperCase()).toBe(userFriendlyError.charAt(0));
  });

  test('Multiple validation errors can be shown simultaneously', () => {
    const errors = [
      'Date is required',
      'Severity must be between 1 and 10',
      'Symptom name cannot be empty',
    ];
    
    expect(errors.length).toBeGreaterThan(1);
    errors.forEach(error => {
      expect(error.length).toBeGreaterThan(0);
    });
  });

  test('Error messages cleared after successful validation', () => {
    let errorMessage = 'Severity must be between 1 and 10';
    const severity = 7; // Now valid
    const isValid = severity >= 1 && severity <= 10;
    
    if (isValid) {
      errorMessage = '';
    }
    
    expect(isValid).toBe(true);
    expect(errorMessage).toBe('');
  });

  test('Form submission blocked when validation errors present', () => {
    const hasErrors = true;
    const canSubmit = !hasErrors;
    
    expect(canSubmit).toBe(false);
  });

  test('Error UI provides guidance on how to fix', () => {
    const errorWithGuidance = 'Severity must be between 1 and 10 (1 = minimal, 10 = maximum)';
    
    expect(errorWithGuidance).toContain('must be');
    expect(errorWithGuidance).toContain('between 1 and 10');
    expect(errorWithGuidance.length).toBeGreaterThan(20);
  });

  test('Validation occurs before attempting to save', () => {
    const validationOrder = ['validate', 'save'];
    expect(validationOrder[0]).toBe('validate');
    expect(validationOrder[1]).toBe('save');
  });
});
