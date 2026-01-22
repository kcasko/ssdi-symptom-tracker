/**
 * Voice Logging Service
 * Processes natural language voice input for symptom logging
 */

import { getSymptomById, SYMPTOMS } from '../data/symptoms';
import { SymptomEntry } from '../domain/models/DailyLog';

export interface VoiceLogResult {
  symptoms: SymptomEntry[];
  notes?: string;
  confidence: number;
  unrecognizedText?: string;
}

interface SymptomMatch {
  symptomId: string;
  confidence: number;
  severity?: number;
  location?: string;
  notes?: string;
}

// Common severity keywords mapping
const SEVERITY_KEYWORDS: Record<string, number> = {
  // Mild (1-3)
  'mild': 2,
  'slight': 2,
  'minor': 2,
  'little': 2,
  'barely': 1,
  'minimal': 1,
  
  // Moderate (4-6)
  'moderate': 5,
  'medium': 5,
  'noticeable': 4,
  'some': 4,
  'fair': 4,
  'significant': 6,
  
  // Severe (7-10)
  'severe': 8,
  'bad': 7,
  'terrible': 9,
  'awful': 9,
  'intense': 8,
  'extreme': 10,
  'unbearable': 10,
  'worst': 10,
  'excruciating': 10,
  'horrible': 8,
};

// Numeric severity mapping
const NUMERIC_SEVERITY: Record<string, number> = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
};

// Common body location keywords
const LOCATION_KEYWORDS = [
  'head', 'neck', 'shoulder', 'arm', 'hand', 'wrist', 'finger',
  'chest', 'back', 'spine', 'hip', 'leg', 'knee', 'ankle', 'foot',
  'stomach', 'abdomen', 'side', 'joint', 'muscle', 'lower', 'upper',
  'left', 'right', 'both'
];

export class VoiceLoggingService {
  /**
   * Process voice transcription into structured symptom data
   */
  static processVoiceInput(transcription: string): VoiceLogResult {
    const text = transcription.toLowerCase().trim();
    
    if (!text) {
      return {
        symptoms: [],
        confidence: 0,
        unrecognizedText: transcription,
      };
    }

    try {
      const symptoms = this.extractSymptoms(text);
      const notes = this.extractGeneralNotes(text, symptoms);
      const confidence = this.calculateOverallConfidence(symptoms, text);

      return {
        symptoms: symptoms.map(match => ({
          symptomId: match.symptomId,
          severity: match.severity ?? -1,
          notes: match.notes,
          location: match.location,
        })),
        notes,
        confidence,
        unrecognizedText: confidence < 0.3 ? transcription : undefined,
      };
    } catch (error) {
      console.error('Voice processing error:', error);
      return {
        symptoms: [],
        confidence: 0,
        unrecognizedText: transcription,
      };
    }
  }

  /**
   * Extract symptom matches from text
   */
  private static extractSymptoms(text: string): SymptomMatch[] {
    const matches: SymptomMatch[] = [];

    for (const symptom of SYMPTOMS) {
      const match = this.matchSymptom(text, symptom);
      if (match) {
        matches.push(match);
      }
    }

    // Remove duplicates and sort by confidence
    return this.deduplicateMatches(matches)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Limit to 5 symptoms max
  }

  /**
   * Check if text matches a specific symptom
   */
  private static matchSymptom(text: string, symptom: any): SymptomMatch | null {
    const name = symptom.name.toLowerCase();
    const words = name.split(' ');
    const searchTerms = [
      name,
      ...words,
      ...(symptom.tags || []),
      ...(symptom.commonQualifiers || []),
    ].map(term => term.toLowerCase());

    let confidence = 0;
    let matchedTerms: string[] = [];

    // Check for exact matches
    for (const term of searchTerms) {
      if (text.includes(term)) {
        confidence += term.length > 4 ? 0.8 : 0.6;
        matchedTerms.push(term);
      }
    }

    // Check for partial matches (for longer symptoms)
    if (confidence === 0 && name.length > 8) {
      const nameWords = name.split(' ');
      for (const word of nameWords) {
        if (word.length > 4 && text.includes(word)) {
          confidence += 0.4;
          matchedTerms.push(word);
        }
      }
    }

    if (confidence === 0) return null;

    // Extract severity and location context around the match
    const severity = this.extractSeverity(text, matchedTerms);
    const location = this.extractLocation(text, matchedTerms);
    const notes = this.extractSymptomNotes(text, matchedTerms);

    return {
      symptomId: symptom.id,
      confidence: Math.min(confidence, 1.0),
      severity,
      location,
      notes,
    };
  }

  /**
   * Extract severity from text context
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static extractSeverity(text: string, _matchedTerms: string[]): number | undefined {
    // Look for numeric ratings (1-10)
    const numericMatch = text.match(/(?:level|rating|severity|pain)?\s*(?:is\s*)?(?:about\s*)?(\d+)(?:\s*out\s*of\s*10)?/i);
    if (numericMatch) {
      const num = parseInt(numericMatch[1]);
      if (num >= 1 && num <= 10) return num;
    }

    // Look for word numbers
    for (const [word, value] of Object.entries(NUMERIC_SEVERITY)) {
      if (text.includes(word)) return value;
    }

    // Look for severity keywords
    let bestMatch = 0;
    for (const [keyword, severity] of Object.entries(SEVERITY_KEYWORDS)) {
      if (text.includes(keyword)) {
        bestMatch = Math.max(bestMatch, severity);
      }
    }

    return bestMatch > 0 ? bestMatch : undefined;
  }

  /**
   * Extract location information
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static extractLocation(text: string, _matchedTerms: string[]): string | undefined {
    const locations: string[] = [];

    for (const location of LOCATION_KEYWORDS) {
      if (text.includes(location)) {
        locations.push(location);
      }
    }

    // Look for "in my [location]" patterns
    const locationPattern = /in\s+my\s+(\w+)/g;
    let match;
    while ((match = locationPattern.exec(text)) !== null) {
      locations.push(match[1]);
    }

    return locations.length > 0 ? locations.join(', ') : undefined;
  }

  /**
   * Extract additional notes for specific symptom
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static extractSymptomNotes(text: string, _matchedTerms: string[]): string | undefined {
    // Look for descriptive words near the symptom
    const descriptors = ['sharp', 'dull', 'aching', 'burning', 'stabbing', 'throbbing', 
                        'constant', 'intermittent', 'getting worse', 'better', 'same'];
    
    const notes: string[] = [];
    for (const descriptor of descriptors) {
      if (text.includes(descriptor)) {
        notes.push(descriptor);
      }
    }

    return notes.length > 0 ? notes.join(', ') : undefined;
  }

  /**
   * Extract general notes not specific to symptoms
   */
  private static extractGeneralNotes(text: string, symptoms: SymptomMatch[]): string | undefined {
    // Remove symptom-specific content to find general notes
    let remainingText = text;
    
    // Remove matched symptom terms
    for (const match of symptoms) {
      const symptom = getSymptomById(match.symptomId);
      if (symptom) {
        const terms = [symptom.name, ...(symptom.tags || [])];
        for (const term of terms) {
          remainingText = remainingText.replace(new RegExp(term.toLowerCase(), 'g'), '');
        }
      }
    }

    // Remove severity and location keywords
    Object.keys(SEVERITY_KEYWORDS).forEach(keyword => {
      remainingText = remainingText.replace(new RegExp(keyword, 'g'), '');
    });

    LOCATION_KEYWORDS.forEach(location => {
      remainingText = remainingText.replace(new RegExp(location, 'g'), '');
    });

    // Clean up and extract meaningful phrases
    remainingText = remainingText
      .replace(/\b\d+\b/g, '') // Remove numbers
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    // Look for trigger or context information
    const triggerWords = ['after', 'when', 'during', 'because', 'due to', 'from'];
    const triggers: string[] = [];
    
    for (const trigger of triggerWords) {
      const regex = new RegExp(`${trigger}\\s+([\\w\\s]+?)(?:\\.|$|\\band\\b|\\bbut\\b)`, 'i');
      const match = text.match(regex);
      if (match) {
        triggers.push(`${trigger} ${match[1].trim()}`);
      }
    }

    const allNotes = [...triggers];
    if (remainingText.length > 10) {
      allNotes.push(remainingText);
    }

    return allNotes.length > 0 ? allNotes.join('; ') : undefined;
  }

  /**
   * Remove duplicate symptom matches
   */
  private static deduplicateMatches(matches: SymptomMatch[]): SymptomMatch[] {
    const seen = new Set<string>();
    return matches.filter(match => {
      if (seen.has(match.symptomId)) {
        return false;
      }
      seen.add(match.symptomId);
      return true;
    });
  }

  /**
   * Calculate overall confidence in the voice processing
   */
  private static calculateOverallConfidence(symptoms: SymptomMatch[], text: string): number {
    if (symptoms.length === 0) return 0;

    const avgSymptomConfidence = symptoms.reduce((sum, s) => sum + s.confidence, 0) / symptoms.length;
    const textComplexity = Math.min(text.split(' ').length / 20, 1); // Longer text = potentially more complex
    const recognizedRatio = symptoms.length / Math.max(text.split(' ').length / 3, 1);

    return Math.min(avgSymptomConfidence * 0.7 + textComplexity * 0.2 + recognizedRatio * 0.1, 1.0);
  }

  /**
   * Generate helpful feedback for users
   */
  static generateFeedback(result: VoiceLogResult): string {
    if (result.confidence < 0.3) {
      return "I didn't recognize many symptoms in what you said. Try being more specific, like 'I have severe back pain' or 'mild headache in my temples'.";
    }

    if (result.symptoms.length === 0) {
      return "I didn't detect any specific symptoms. Try describing your symptoms clearly, for example: 'I have a headache, fatigue, and joint pain'.";
    }

    const symptomNames = result.symptoms.map(s => {
      const symptom = getSymptomById(s.symptomId);
      return symptom?.name || 'unknown symptom';
    });

    return `I logged ${symptomNames.length} symptom${symptomNames.length > 1 ? 's' : ''}: ${symptomNames.join(', ')}. You can review and edit the details.`;
  }
}
