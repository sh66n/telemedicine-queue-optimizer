/**
 * 🔧 DEFAULT CONFIGURATION
 * Safe defaults for queue optimization
 */

import { QueueOptimizationConfig } from '../core/types';

export const DEFAULT_CONFIG: QueueOptimizationConfig = {
  // Weights for priority score calculation (must sum to 1.0)
  severityWeight: 0.5,        // 50% - Medical urgency is most important
  waitTimeWeight: 0.3,        // 30% - Fairness matters
  fairnessWeight: 0.2,        // 20% - Prevent starvation

  // Wait time thresholds before fairness boost kicks in
  maxWaitTimeForHighPriority: 30,     // High urgency: max 30 min
  maxWaitTimeForMediumPriority: 45,   // Medium urgency: max 45 min
  maxWaitTimeForLowPriority: 60,      // Low urgency: max 60 min
};

/**
 * Validate configuration to ensure it's correct
 */
export function validateConfig(config: Partial<QueueOptimizationConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (config.severityWeight !== undefined) {
    if (config.severityWeight < 0 || config.severityWeight > 1) {
      errors.push('severityWeight must be between 0 and 1');
    }
  }

  if (config.waitTimeWeight !== undefined) {
    if (config.waitTimeWeight < 0 || config.waitTimeWeight > 1) {
      errors.push('waitTimeWeight must be between 0 and 1');
    }
  }

  if (config.fairnessWeight !== undefined) {
    if (config.fairnessWeight < 0 || config.fairnessWeight > 1) {
      errors.push('fairnessWeight must be between 0 and 1');
    }
  }

  // Check weights sum to approximately 1.0
  const totalWeight = (config.severityWeight ?? DEFAULT_CONFIG.severityWeight) +
                     (config.waitTimeWeight ?? DEFAULT_CONFIG.waitTimeWeight) +
                     (config.fairnessWeight ?? DEFAULT_CONFIG.fairnessWeight);

  if (Math.abs(totalWeight - 1.0) > 0.01) {
    errors.push(`Weights must sum to 1.0 (currently ${totalWeight.toFixed(2)})`);
  }

  // Validate wait time thresholds
  if (config.maxWaitTimeForHighPriority !== undefined && config.maxWaitTimeForHighPriority < 5) {
    errors.push('maxWaitTimeForHighPriority must be at least 5 minutes');
  }

  if (config.maxWaitTimeForMediumPriority !== undefined && config.maxWaitTimeForMediumPriority < 10) {
    errors.push('maxWaitTimeForMediumPriority must be at least 10 minutes');
  }

  if (config.maxWaitTimeForLowPriority !== undefined && config.maxWaitTimeForLowPriority < 15) {
    errors.push('maxWaitTimeForLowPriority must be at least 15 minutes');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Merge user config with defaults
 */
export function mergeConfig(userConfig?: Partial<QueueOptimizationConfig>): QueueOptimizationConfig {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
  };
}
