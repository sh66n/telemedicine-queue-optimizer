/**
 * 📝 CORE TYPES
 * Scalable TypeScript interfaces for queue optimization
 */

/**
 * Patient interface - represents a patient in the queue
 */
export interface Patient {
  id: string;
  arrivalTime: string; // ISO datetime
  severity: 'low' | 'medium' | 'high';
  waitTime?: number; // Minutes waited so far
  estimatedDuration?: number; // Predicted consultation duration in minutes
}

/**
 * Queue order interface - patient position with timing
 */
export interface QueueOrder {
  position: number;
  patient: Patient;
  estimatedStartTime: Date;
  estimatedEndTime: Date;
  estimatedWaitTime: number; // Minutes
}

/**
 * Metrics interface - performance measurements
 */
export interface Metrics {
  averageWaitTime: number; // Minutes
  maxWaitTime: number; // Minutes
  minWaitTime: number; // Minutes
  fairnessScore: number; // 0-100
  doctorUtilization: number; // 0-100%
  throughput: number; // Patients per hour
}

/**
 * Configuration interface - algorithm parameters
 */
export interface QueueOptimizationConfig {
  // Weights for priority score (must sum to 1.0)
  severityWeight: number; // 0-1, recommended 0.5
  waitTimeWeight: number; // 0-1, recommended 0.3
  fairnessWeight: number; // 0-1, recommended 0.2

  // Maximum acceptable wait times before fairness boost kicks in
  maxWaitTimeForHighPriority: number; // Minutes, default 30
  maxWaitTimeForMediumPriority: number; // Minutes, default 45
  maxWaitTimeForLowPriority: number; // Minutes, default 60
}

/**
 * Optimization result interface - full simulation results
 */
export interface OptimizationResult {
  baselineQueue: QueueOrder[]; // FIFO ordering
  optimizedQueue: QueueOrder[]; // Smart algorithm ordering
  baselineMetrics: Metrics; // FIFO metrics
  optimizedMetrics: Metrics; // Optimized metrics
  improvements: {
    waitTimeReduction: string; // Percentage string
    fairnessImprovement: string; // Points
    utilizationImprovement: string; // Percentage
    throughputImprovement: string; // Percentage
  };
  recommendations: string[]; // AI recommendations
}

/**
 * Simulation input interface
 */
export interface SimulationInput {
  patients: Patient[];
  config?: Partial<QueueOptimizationConfig>;
}

/**
 * Severity level type
 */
export type SeverityLevel = 'low' | 'medium' | 'high';

/**
 * Score information for debugging
 */
export interface ScoreInfo {
  patientId: string;
  baseSeverityScore: number;
  waitTimeScore: number;
  fairnessBoost: number;
  finalScore: number;
  position: number;
}

/**
 * Comparison result interface
 */
export interface ComparisonResult {
  baseline: {
    queue: QueueOrder[];
    metrics: Metrics;
  };
  optimized: {
    queue: QueueOrder[];
    metrics: Metrics;
  };
  improvements: {
    waitTimeReduction: number; // Percentage
    fairnessImprovement: number; // Points
  };
}
