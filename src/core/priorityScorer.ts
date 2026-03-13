/**
 * 🎯 PRIORITY SCORER
 * Calculates priority scores for patients
 * Scalable to 1000+ patients efficiently
 */

import { Patient, QueueOptimizationConfig, SeverityLevel, ScoreInfo } from './types';

export class PriorityScorer {
  private config: QueueOptimizationConfig;

  constructor(config: QueueOptimizationConfig) {
    this.config = config;
  }

  /**
   * Calculate priority score for a single patient
   * Higher score = higher priority (seen sooner)
   * O(1) time complexity
   */
  calculateScore(patient: Patient): number {
    const severityScore = this.getSeverityScore(patient.severity);
    const waitTime = patient.waitTime || 0;
    const threshold = this.getThreshold(patient.severity);

    // Wait time component (fairness)
    const waitScore = Math.min((waitTime / 60) * 100, 100);

    // Fairness boost (prevent starvation)
    let boost = 1;
    if (waitTime > threshold) {
      const excess = waitTime - threshold;
      boost = 1 + excess / 30;
    }

    // Final score: weighted base + fairness boost
    const baseScore =
      severityScore * this.config.severityWeight +
      waitScore * this.config.waitTimeWeight;

    return baseScore * boost;
  }

  /**
   * Score all patients and return sorted by score
   * O(n log n) time complexity due to sorting
   * Scalable to 10,000+ patients
   */
  scoreAllPatients(patients: Patient[]): Array<{ patient: Patient; score: number }> {
    const scored = patients.map((patient) => ({
      patient,
      score: this.calculateScore(patient),
    }));

    // Sort DESCENDING - highest score first (most urgent)
    scored.sort((a, b) => b.score - a.score);

    return scored;
  }

  /**
   * Get severity score (base priority)
   * O(1) lookup
   */
  private getSeverityScore(severity: SeverityLevel): number {
    const severityScores: Record<SeverityLevel, number> = {
      high: 150, // Critical patients
      medium: 75, // Moderate patients
      low: 25, // Non-urgent patients
    };
    return severityScores[severity] || 0;
  }

  /**
   * Get wait time threshold before fairness boost
   * O(1) lookup
   */
  private getThreshold(severity: SeverityLevel): number {
    const thresholds: Record<SeverityLevel, number> = {
      high: this.config.maxWaitTimeForHighPriority,
      medium: this.config.maxWaitTimeForMediumPriority,
      low: this.config.maxWaitTimeForLowPriority,
    };
    return thresholds[severity] || 60;
  }

  /**
   * Get detailed score information for debugging
   * O(1) computation
   */
  getScoreInfo(patient: Patient): ScoreInfo {
    const severityScore = this.getSeverityScore(patient.severity);
    const waitTime = patient.waitTime || 0;
    const threshold = this.getThreshold(patient.severity);
    const waitTimeScore = Math.min((waitTime / 60) * 100, 100);

    let boost = 1;
    if (waitTime > threshold) {
      const excess = waitTime - threshold;
      boost = 1 + excess / 30;
    }

    const baseScore =
      severityScore * this.config.severityWeight +
      waitTimeScore * this.config.waitTimeWeight;

    return {
      patientId: patient.id,
      baseSeverityScore: severityScore,
      waitTimeScore: waitTimeScore,
      fairnessBoost: boost,
      finalScore: baseScore * boost,
      position: 0, // Will be set by caller
    };
  }

  /**
   * Get human-readable explanation of patient's score
   * Useful for debugging and transparency
   */
  getScoreExplanation(patient: Patient): string {
    const info = this.getScoreInfo(patient);
    const threshold = this.getThreshold(patient.severity);
    const hasBoost = (patient.waitTime || 0) > threshold ? 'YES' : 'NO';

    return (
      `${patient.id} (${patient.severity.toUpperCase()}): ` +
      `Score=${info.finalScore.toFixed(1)} | ` +
      `Wait=${patient.waitTime || 0}min | ` +
      `Threshold=${threshold}min | ` +
      `FairnessBoost=${hasBoost}`
    );
  }

  /**
   * Validate score calculation
   * Returns true if scores are valid
   */
  validateScores(patients: Patient[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (patients.length === 0) {
      errors.push('No patients to score');
    }

    for (const patient of patients) {
      const score = this.calculateScore(patient);

      if (!isFinite(score) || score < 0) {
        errors.push(`Invalid score for patient ${patient.id}: ${score}`);
      }

      if (patient.waitTime && patient.waitTime < 0) {
        errors.push(`Invalid wait time for patient ${patient.id}: ${patient.waitTime}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<QueueOptimizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): QueueOptimizationConfig {
    return this.config;
  }
}
