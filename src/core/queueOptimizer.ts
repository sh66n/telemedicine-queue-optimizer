/**
 * 🚀 QUEUE OPTIMIZER
 * Main class that orchestrates queue optimization
 * Scalable to 10,000+ patients
 */

import { Patient, QueueOrder, QueueOptimizationConfig, ComparisonResult } from './types';
import { DurationPredictor } from './predictor';
import { PriorityScorer } from './priorityScorer';
import { MetricsCalculator } from './metricsCalculator';

export class QueueOptimizer {
  private predictor: DurationPredictor;
  private priorityScorer: PriorityScorer;
  private config: QueueOptimizationConfig;

  constructor(config: QueueOptimizationConfig) {
    this.config = config;
    this.predictor = new DurationPredictor();
    this.priorityScorer = new PriorityScorer(config);
  }

  /**
   * Main optimization function
   * Reorders patients by priority
   * O(n log n) time complexity
   */
  optimize(patients: Patient[]): Patient[] {
    if (patients.length === 0) return [];

    // Step 1: Predict durations for all patients
    const patientsWithDurations = this.predictor.predictDurationBatch(patients);

    // Step 2: Score and sort by priority
    const scoredPatients = this.priorityScorer.scoreAllPatients(patientsWithDurations);

    // Step 3: Extract and return optimized order
    return scoredPatients.map(({ patient }) => patient);
  }

  /**
   * Generate queue orders with timing information
   * Shows each patient's position, start/end time, wait time
   * O(n) time complexity
   */
  generateQueueOrder(patients: Patient[], startTime: Date = new Date()): QueueOrder[] {
    if (patients.length === 0) return [];

    const queueOrders: QueueOrder[] = [];
    let currentTime = new Date(startTime);

    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      const estimatedStartTime = new Date(currentTime);

      // Get duration (use estimated if available, otherwise predict)
      const duration = patient.estimatedDuration || this.predictor.predictDuration(patient);
      const estimatedEndTime = new Date(currentTime.getTime() + duration * 60000);

      // Calculate wait time (use provided or calculate from arrival)
      let estimatedWaitTime = patient.waitTime || 0;
      if (!patient.waitTime && patient.arrivalTime) {
        estimatedWaitTime =
          (currentTime.getTime() - new Date(patient.arrivalTime).getTime()) / 60000;
      }

      queueOrders.push({
        patient,
        position: i + 1,
        estimatedStartTime,
        estimatedEndTime,
        estimatedWaitTime: Math.max(0, estimatedWaitTime),
      });

      currentTime = estimatedEndTime;
    }

    return queueOrders;
  }

  /**
   * Compare baseline (FIFO) queue with optimized queue
   * Used for showing improvement metrics
   * O(n log n) time complexity
   */
  compareQueues(patients: Patient[], startTime: Date = new Date()): ComparisonResult {
    if (patients.length === 0) {
      return {
        baseline: { queue: [], metrics: MetricsCalculator.calculateMetrics([]) },
        optimized: { queue: [], metrics: MetricsCalculator.calculateMetrics([]) },
        improvements: { waitTimeReduction: 0, fairnessImprovement: 0 },
      };
    }

    // Predict durations consistently for all patients
    const patientsWithDurations = this.predictor.predictDurationBatch(patients);

    // Baseline: FIFO order (first-come-first-serve)
    const baselineQueue = [...patientsWithDurations].sort((a, b) => {
      return new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime();
    });

    // Optimized: our algorithm
    const optimizedQueue = this.optimize(patientsWithDurations);

    // Generate queue orders
    const baselineOrders = this.generateQueueOrder(baselineQueue, startTime);
    const optimizedOrders = this.generateQueueOrder(optimizedQueue, startTime);

    // Calculate metrics
    const baselineMetrics = MetricsCalculator.calculateMetrics(baselineOrders);
    const optimizedMetrics = MetricsCalculator.calculateMetrics(optimizedOrders);

    // Calculate improvements
    const improvements = MetricsCalculator.calculateImprovements(
      baselineMetrics,
      optimizedMetrics
    );

    return {
      baseline: { queue: baselineOrders, metrics: baselineMetrics },
      optimized: { queue: optimizedOrders, metrics: optimizedMetrics },
      improvements: {
        waitTimeReduction: parseFloat(improvements.waitTimeReduction),
        fairnessImprovement: parseFloat(improvements.fairnessImprovement),
      },
    };
  }

  /**
   * Get optimizer configuration
   * O(1) operation
   */
  getConfig(): QueueOptimizationConfig {
    return { ...this.config };
  }

  /**
   * Update optimizer configuration
   * O(1) operation
   */
  setConfig(config: Partial<QueueOptimizationConfig>): void {
    this.config = { ...this.config, ...config };
    this.priorityScorer.setConfig(this.config);
  }

  /**
   * Get priority scores for all patients (for debugging)
   * O(n) computation
   */
  getScores(patients: Patient[]): Array<{ patientId: string; score: number; explanation: string }> {
    return patients.map((patient) => {
      const score = this.priorityScorer['calculateScore'](patient);
      const explanation = this.priorityScorer['getScoreExplanation'](patient);

      return {
        patientId: patient.id,
        score,
        explanation,
      };
    });
  }

  /**
   * Validate optimizer setup
   * O(n) validation
   */
  validate(patients: Patient[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate config
    const weights =
      this.config.severityWeight + this.config.waitTimeWeight + this.config.fairnessWeight;
    if (Math.abs(weights - 1.0) > 0.01) {
      errors.push(`Weights must sum to 1.0 (currently ${weights.toFixed(2)})`);
    }

    // Validate patients
    if (patients.length === 0) {
      errors.push('No patients provided');
    }

    for (const patient of patients) {
      if (!patient.id) {
        errors.push('Patient missing ID');
      }

      if (!patient.arrivalTime) {
        errors.push(`Patient ${patient.id} missing arrival time`);
      }

      if (!['low', 'medium', 'high'].includes(patient.severity)) {
        errors.push(`Patient ${patient.id} has invalid severity: ${patient.severity}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get predictor instance for advanced usage
   */
  getPredictor(): DurationPredictor {
    return this.predictor;
  }

  /**
   * Get scorer instance for advanced usage
   */
  getScorer(): PriorityScorer {
    return this.priorityScorer;
  }

  /**
   * Get static metrics calculator
   */
  static getMetricsCalculator(): typeof MetricsCalculator {
    return MetricsCalculator;
  }
}
