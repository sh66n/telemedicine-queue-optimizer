/**
 * 🕐 DURATION PREDICTOR
 * Predicts consultation duration based on severity
 * Scalable ML-ready architecture
 */

import { Patient, SeverityLevel } from './types';

export class DurationPredictor {
  // Base durations by severity (minutes)
  private baseDurations: Record<SeverityLevel, number> = {
    high: 25, // Complex cases need investigation
    medium: 20, // Moderate complexity
    low: 12, // Quick consultations
  };

  // Variance range for realism
  private varianceRange: number = 10; // ±5 minutes

  constructor(durations?: Partial<Record<SeverityLevel, number>>) {
    if (durations) {
      this.baseDurations = { ...this.baseDurations, ...durations };
    }
  }

  /**
   * Predict duration for a single patient
   * O(1) time complexity
   */
  predictDuration(patient: Patient): number {
    // If already estimated, use it
    if (patient.estimatedDuration) {
      return patient.estimatedDuration;
    }

    // Get base duration for severity
    const baseDuration = this.baseDurations[patient.severity];

    // Add variance (±5 minutes) for realism
    const variance = (Math.random() - 0.5) * this.varianceRange;
    const predicted = Math.max(5, baseDuration + variance); // Minimum 5 minutes

    return Math.round(predicted);
  }

  /**
   * Predict duration for multiple patients
   * O(n) time complexity
   * Ensures consistency across batch operations
   */
  predictDurationBatch(patients: Patient[]): Patient[] {
    return patients.map((patient) => ({
      ...patient,
      estimatedDuration: this.predictDuration(patient),
    }));
  }

  /**
   * Get base duration for a severity level (no variance)
   * O(1) lookup
   */
  getBaseDuration(severity: SeverityLevel): number {
    return this.baseDurations[severity];
  }

  /**
   * Set base durations (for testing different scenarios)
   * O(1) update
   */
  setBaseDurations(durations: Partial<Record<SeverityLevel, number>>): void {
    this.baseDurations = { ...this.baseDurations, ...durations };
  }

  /**
   * Set variance range
   * Lower variance = more consistent predictions
   */
  setVarianceRange(range: number): void {
    this.varianceRange = Math.max(0, range);
  }

  /**
   * Get average duration for all patients
   * O(n) computation
   */
  getAverageDuration(patients: Patient[]): number {
    if (patients.length === 0) return 0;

    const total = patients.reduce((sum, patient) => {
      return sum + this.predictDuration(patient);
    }, 0);

    return total / patients.length;
  }

  /**
   * Get total duration needed for all patients
   * O(n) computation
   */
  getTotalDuration(patients: Patient[]): number {
    return patients.reduce((sum, patient) => {
      return sum + this.predictDuration(patient);
    }, 0);
  }

  /**
   * Get distribution of durations
   * O(n) computation
   */
  getDurationDistribution(
    patients: Patient[]
  ): Record<SeverityLevel, { count: number; avgDuration: number }> {
    const distribution: Record<SeverityLevel, { count: number; totalDuration: number }> = {
      high: { count: 0, totalDuration: 0 },
      medium: { count: 0, totalDuration: 0 },
      low: { count: 0, totalDuration: 0 },
    };

    for (const patient of patients) {
      const severity = patient.severity;
      distribution[severity].count++;
      distribution[severity].totalDuration += this.predictDuration(patient);
    }

    return {
      high: {
        count: distribution.high.count,
        avgDuration: distribution.high.count > 0 ? distribution.high.totalDuration / distribution.high.count : 0,
      },
      medium: {
        count: distribution.medium.count,
        avgDuration: distribution.medium.count > 0 ? distribution.medium.totalDuration / distribution.medium.count : 0,
      },
      low: {
        count: distribution.low.count,
        avgDuration: distribution.low.count > 0 ? distribution.low.totalDuration / distribution.low.count : 0,
      },
    };
  }

  /**
   * Validate predictions
   */
  validatePredictions(patients: Patient[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const patient of patients) {
      const duration = this.predictDuration(patient);

      if (!isFinite(duration) || duration < 5 || duration > 120) {
        errors.push(`Invalid duration for patient ${patient.id}: ${duration}min`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): {
    baseDurations: Record<SeverityLevel, number>;
    varianceRange: number;
  } {
    return {
      baseDurations: { ...this.baseDurations },
      varianceRange: this.varianceRange,
    };
  }
}
