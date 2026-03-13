/**
 * 🏥 QUEUE SIMULATOR
 * Full simulation comparing baseline vs optimized
 * Scalable to 10,000+ patients
 */

import {
  Patient,
  QueueOptimizationConfig,
  OptimizationResult,
  Metrics,
  QueueOrder,
} from './types';
import { QueueOptimizer } from './queueOptimizer';
import { MetricsCalculator } from './metricsCalculator';

export class QueueSimulator {
  private optimizer: QueueOptimizer;
  private config: QueueOptimizationConfig;

  constructor(config: QueueOptimizationConfig) {
    this.config = config;
    this.optimizer = new QueueOptimizer(config);
  }

  /**
   * Run full simulation: baseline vs optimized
   * Returns comprehensive optimization result
   * O(n log n) time complexity
   */
  simulate(patients: Patient[], startTime: Date = new Date()): OptimizationResult {
    if (patients.length === 0) {
      return {
        baselineQueue: [],
        optimizedQueue: [],
        baselineMetrics: MetricsCalculator.calculateMetrics([]),
        optimizedMetrics: MetricsCalculator.calculateMetrics([]),
        improvements: {
          waitTimeReduction: '0.0',
          fairnessImprovement: '0.0',
          utilizationImprovement: '0.0',
          throughputImprovement: '0.0',
        },
        recommendations: ['No patients to simulate'],
      };
    }

    // Validate input
    const validation = this.optimizer.validate(patients);
    if (!validation.valid) {
      throw new Error(`Invalid patients: ${validation.errors.join(', ')}`);
    }

    // Run comparison
    const comparison = this.optimizer.compareQueues(patients, startTime);

    // Calculate improvements
    const improvements = MetricsCalculator.calculateImprovements(
      comparison.baseline.metrics,
      comparison.optimized.metrics
    );

    // Generate recommendations
    const recommendations = MetricsCalculator.generateRecommendations(
      comparison.baseline.metrics,
      comparison.optimized.metrics,
      improvements
    );

    return {
      baselineQueue: comparison.baseline.queue,
      optimizedQueue: comparison.optimized.queue,
      baselineMetrics: comparison.baseline.metrics,
      optimizedMetrics: comparison.optimized.metrics,
      improvements: {
        waitTimeReduction: improvements.waitTimeReduction,
        fairnessImprovement: improvements.fairnessImprovement,
        utilizationImprovement: improvements.utilizationImprovement,
        throughputImprovement: improvements.throughputImprovement,
      },
      recommendations,
    };
  }

  /**
   * Get detailed metrics breakdown
   * O(n) computation
   */
  getDetailedMetrics(queueOrders: QueueOrder[]): {
    byPosition: Array<{ position: number; waitTime: number; patientId: string }>;
    bySeverity: Record<string, { count: number; avgWait: number }>;
  } {
    return MetricsCalculator.getMetricsBreakdown(queueOrders);
  }

  /**
   * Simulate with different configurations
   * Useful for testing sensitivity to parameter changes
   * O(n log n) per simulation
   */
  simulateWithConfig(
    patients: Patient[],
    config: Partial<QueueOptimizationConfig>,
    startTime: Date = new Date()
  ): OptimizationResult {
    const mergedConfig = { ...this.config, ...config };
    const simulator = new QueueSimulator(mergedConfig);
    return simulator.simulate(patients, startTime);
  }

  /**
   * Run multiple simulations with different configurations
   * Useful for optimization/tuning
   * O(k * n log n) where k = number of configs
   */
  runMultipleSimulations(
    patients: Patient[],
    configs: Array<{ name: string; config: Partial<QueueOptimizationConfig> }>
  ): Array<{
    name: string;
    result: OptimizationResult;
  }> {
    return configs.map((item) => ({
      name: item.name,
      result: this.simulateWithConfig(patients, item.config),
    }));
  }

  /**
   * Get comparison between two specific queues
   * O(n) computation
   */
  compareCustomQueues(
    baseline: Patient[],
    optimized: Patient[],
    startTime: Date = new Date()
  ): {
    baselineMetrics: Metrics;
    optimizedMetrics: Metrics;
    improvements: Record<string, string>;
  } {
    const baselineOrders = this.optimizer['generateQueueOrder'](baseline, startTime);
    const optimizedOrders = this.optimizer['generateQueueOrder'](optimized, startTime);

    const baselineMetrics = MetricsCalculator.calculateMetrics(baselineOrders);
    const optimizedMetrics = MetricsCalculator.calculateMetrics(optimizedOrders);

    const improvements = MetricsCalculator.calculateImprovements(
      baselineMetrics,
      optimizedMetrics
    );

    return {
      baselineMetrics,
      optimizedMetrics,
      improvements,
    };
  }

  /**
   * Get configuration
   * O(1) operation
   */
  getConfig(): QueueOptimizationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * O(1) operation
   */
  setConfig(config: Partial<QueueOptimizationConfig>): void {
    this.config = { ...this.config, ...config };
    this.optimizer.setConfig(this.config);
  }

  /**
   * Export simulation result as JSON
   * O(n) operation
   */
  exportResult(result: OptimizationResult): string {
    return JSON.stringify(result, null, 2);
  }

  /**
   * Export simulation summary
   * O(n) operation
   */
  exportSummary(result: OptimizationResult): string {
    const summary = {
      timestamp: new Date().toISOString(),
      patientCount: result.baselineQueue.length,
      baselineMetrics: {
        avgWaitTime: result.baselineMetrics.averageWaitTime.toFixed(2),
        maxWaitTime: result.baselineMetrics.maxWaitTime.toFixed(2),
        fairnessScore: result.baselineMetrics.fairnessScore.toFixed(2),
      },
      optimizedMetrics: {
        avgWaitTime: result.optimizedMetrics.averageWaitTime.toFixed(2),
        maxWaitTime: result.optimizedMetrics.maxWaitTime.toFixed(2),
        fairnessScore: result.optimizedMetrics.fairnessScore.toFixed(2),
      },
      improvements: result.improvements,
    };

    return JSON.stringify(summary, null, 2);
  }

  /**
   * Generate HTML report
   * O(n) operation
   */
  generateHTMLReport(result: OptimizationResult): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Queue Optimization Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .metric { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
    .improvement { color: green; font-weight: bold; }
    .warning { color: orange; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Queue Optimization Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>

  <h2>Summary</h2>
  <div class="metric">
    <strong>Patients:</strong> ${result.baselineQueue.length}
  </div>
  <div class="metric">
    <strong>Wait Time Reduction:</strong> <span class="improvement">${result.improvements.waitTimeReduction}%</span>
  </div>
  <div class="metric">
    <strong>Fairness Improvement:</strong> <span class="improvement">${result.improvements.fairnessImprovement} points</span>
  </div>

  <h2>Baseline Metrics (FIFO)</h2>
  <table>
    <tr>
      <th>Metric</th>
      <th>Value</th>
    </tr>
    <tr>
      <td>Average Wait Time</td>
      <td>${result.baselineMetrics.averageWaitTime.toFixed(2)} min</td>
    </tr>
    <tr>
      <td>Max Wait Time</td>
      <td>${result.baselineMetrics.maxWaitTime.toFixed(2)} min</td>
    </tr>
    <tr>
      <td>Fairness Score</td>
      <td>${result.baselineMetrics.fairnessScore.toFixed(2)}/100</td>
    </tr>
    <tr>
      <td>Doctor Utilization</td>
      <td>${result.baselineMetrics.doctorUtilization.toFixed(2)}%</td>
    </tr>
  </table>

  <h2>Optimized Metrics</h2>
  <table>
    <tr>
      <th>Metric</th>
      <th>Value</th>
    </tr>
    <tr>
      <td>Average Wait Time</td>
      <td>${result.optimizedMetrics.averageWaitTime.toFixed(2)} min</td>
    </tr>
    <tr>
      <td>Max Wait Time</td>
      <td>${result.optimizedMetrics.maxWaitTime.toFixed(2)} min</td>
    </tr>
    <tr>
      <td>Fairness Score</td>
      <td>${result.optimizedMetrics.fairnessScore.toFixed(2)}/100</td>
    </tr>
    <tr>
      <td>Doctor Utilization</td>
      <td>${result.optimizedMetrics.doctorUtilization.toFixed(2)}%</td>
    </tr>
  </table>

  <h2>Recommendations</h2>
  <ul>
    ${result.recommendations.map((rec) => `<li>${rec}</li>`).join('')}
  </ul>
</body>
</html>
    `;

    return html;
  }
}
