/**
 * 🏥 QUEUE OPTIMIZER - NPM PACKAGE
 * Intelligent queue optimization for telemedicine platforms
 * 
 * @packageDocumentation
 */

// Core exports
export { QueueOptimizer } from './core/queueOptimizer';
export { QueueSimulator } from './core/simulator';
export { PriorityScorer } from './core/priorityScorer';
export { DurationPredictor } from './core/predictor';
export { MetricsCalculator } from './core/metricsCalculator';

// Type exports
export type {
  Patient,
  QueueOrder,
  Metrics,
  QueueOptimizationConfig,
  OptimizationResult,
  SimulationInput,
} from './core/types';

// Config exports
export { DEFAULT_CONFIG, validateConfig } from './config/defaults';

// Utility exports

// Version
export const VERSION = '1.0.0';
export const PACKAGE_NAME = '@sh66n/telemedicine-queue-optimizer';
