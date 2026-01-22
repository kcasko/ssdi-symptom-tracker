/**
 * Gap Explanation Model
 * Captures optional context when logging resumes after a gap
 */

export interface GapExplanation {
  id: string;
  profileId: string;
  startDate: string; // Inclusive gap start date
  endDate: string;   // Inclusive gap end date
  lengthDays: number;
  note?: string;
  createdAt: string;
}
