/**
 * 📊 METRICS CALCULATOR
 * Calculates performance metrics for queues
 * Scalable to 10,000+ patients
 */

import { QueueOrder, Metrics } from './types';

export class MetricsCalculator {
  /**
   * Calculate metrics for a queue
   * O(n) time complexity
   */
  static calculateMetrics(queueOrders: QueueOrder[]): Metrics {
    if (queueOrders.length === 0) {
      return {
        averageWaitTime: 0,
        maxWaitTime: 0,
        minWaitTime: 0,
        fairnessScore: 100,
        doctorUtilization: 0,
        throughput: 0,
      };
    }

    // Calculate wait times
    const waitTimes = queueOrders.map((order) => order.estimatedWaitTime);

    // Basic statistics
    const averageWaitTime = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
    const maxWaitTime = Math.max(...waitTimes);
    const minWaitTime = Math.min(...waitTimes);

    // Fairness score (based on standard deviation)
    const variance =
      waitTimes.reduce((sum, time) => sum + Math.pow(time - averageWaitTime, 2), 0) /
      waitTimes.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = averageWaitTime > 0 ? stdDev / averageWaitTime : 0;
    const fairnessScore = Math.max(0, 100 - coefficientOfVariation * 100);

    // Doctor utilization
    const totalConsultationTime = queueOrders.reduce((sum, order) => {
      const duration =
        (order.estimatedEndTime.getTime() - order.estimatedStartTime.getTime()) / 60000;
      return sum + duration;
    }, 0);

    const totalAvailableTime =
      (queueOrders[queueOrders.length - 1].estimatedEndTime.getTime() -
        queueOrders[0].estimatedStartTime.getTime()) /
      60000;

    const doctorUtilization =
      totalAvailableTime > 0 ? (totalConsultationTime / totalAvailableTime) * 100 : 0;

    // Throughput (patients per hour)
    const totalMinutes =
      (queueOrders[queueOrders.length - 1].estimatedEndTime.getTime() -
        queueOrders[0].estimatedStartTime.getTime()) /
      60000;

    const throughput = totalMinutes > 0 ? (queueOrders.length / totalMinutes) * 60 : 0;

    return {
      averageWaitTime: Math.max(0, averageWaitTime),
      maxWaitTime: Math.max(0, maxWaitTime),
      minWaitTime: Math.max(0, minWaitTime),
      fairnessScore: Math.min(100, Math.max(0, fairnessScore)),
      doctorUtilization: Math.min(100, Math.max(0, doctorUtilization)),
      throughput: Math.max(0, throughput),
    };
  }

  /**
   * Calculate improvement percentages
   * O(1) computation
   */
  static calculateImprovements(
    baselineMetrics: Metrics,
    optimizedMetrics: Metrics
  ): {
    waitTimeReduction: string;
    fairnessImprovement: string;
    utilizationImprovement: string;
    throughputImprovement: string;
  } {
    const waitTimeReduction =
      baselineMetrics.averageWaitTime > 0
        ? ((baselineMetrics.averageWaitTime - optimizedMetrics.averageWaitTime) /
            baselineMetrics.averageWaitTime) *
          100
        : 0;

    const fairnessImprovement = optimizedMetrics.fairnessScore - baselineMetrics.fairnessScore;

    const utilizationImprovement =
      optimizedMetrics.doctorUtilization - baselineMetrics.doctorUtilization;

    const throughputImprovement =
      baselineMetrics.throughput > 0
        ? ((optimizedMetrics.throughput - baselineMetrics.throughput) /
            baselineMetrics.throughput) *
          100
        : 0;

    return {
      waitTimeReduction: waitTimeReduction.toFixed(1),
      fairnessImprovement: fairnessImprovement.toFixed(1),
      utilizationImprovement: utilizationImprovement.toFixed(1),
      throughputImprovement: throughputImprovement.toFixed(1),
    };
  }

  /**
   * Get detailed metrics breakdown
   * O(n) computation
   */
  static getMetricsBreakdown(queueOrders: QueueOrder[]): {
    byPosition: Array<{ position: number; waitTime: number; patientId: string }>;
    bySeverity: Record<string, { count: number; avgWait: number }>;
  } {
    const byPosition = queueOrders.map((order) => ({
      position: order.position,
      waitTime: order.estimatedWaitTime,
      patientId: order.patient.id,
    }));

    const bySeverity: Record<string, { count: number; totalWait: number }> = {
      high: { count: 0, totalWait: 0 },
      medium: { count: 0, totalWait: 0 },
      low: { count: 0, totalWait: 0 },
    };

    for (const order of queueOrders) {
      const severity = order.patient.severity;
      bySeverity[severity].count++;
      bySeverity[severity].totalWait += order.estimatedWaitTime;
    }

    return {
      byPosition,
      bySeverity: {
        high: {
          count: bySeverity.high.count,
          avgWait: bySeverity.high.count > 0 ? bySeverity.high.totalWait / bySeverity.high.count : 0,
        },
        medium: {
          count: bySeverity.medium.count,
          avgWait:
            bySeverity.medium.count > 0
              ? bySeverity.medium.totalWait / bySeverity.medium.count
              : 0,
        },
        low: {
          count: bySeverity.low.count,
          avgWait: bySeverity.low.count > 0 ? bySeverity.low.totalWait / bySeverity.low.count : 0,
        },
      },
    };
  }

  /**
   * Generate recommendations based on metrics
   * O(1) computation
   */
  static generateRecommendations(
    baselineMetrics: Metrics,
    optimizedMetrics: Metrics,
    improvements: ReturnType<typeof MetricsCalculator.calculateImprovements>
  ): string[] {
    const recommendations: string[] = [];

    // Wait time improvement
    const waitReduction = parseFloat(improvements.waitTimeReduction);
    if (waitReduction > 50) {
      recommendations.push(
        `✅ Significant wait time reduction by ${waitReduction.toFixed(1)}% (${baselineMetrics.averageWaitTime.toFixed(1)} → ${optimizedMetrics.averageWaitTime.toFixed(1)} minutes)`
      );
    } else if (waitReduction > 0) {
      recommendations.push(
        `✅ Optimize queue to reduce average wait time by ${waitReduction.toFixed(1)}% (${baselineMetrics.averageWaitTime.toFixed(1)} → ${optimizedMetrics.averageWaitTime.toFixed(1)} minutes)`
      );
    } else if (waitReduction < -10) {
      recommendations.push(
        `⚠️ Wait times increased by ${Math.abs(waitReduction).toFixed(1)}%. Review algorithm configuration.`
      );
    }

    // Fairness improvement
    const fairnessGain = parseFloat(improvements.fairnessImprovement);
    if (fairnessGain > 15) {
      recommendations.push(
        `✅ Significant fairness improvement by ${fairnessGain.toFixed(1)} points (${baselineMetrics.fairnessScore.toFixed(1)} → ${optimizedMetrics.fairnessScore.toFixed(1)})`
      );
    } else if (fairnessGain > 0) {
      recommendations.push(
        `✅ Fairness improves by ${fairnessGain.toFixed(1)} points (${baselineMetrics.fairnessScore.toFixed(1)} → ${optimizedMetrics.fairnessScore.toFixed(1)})`
      );
    } else if (fairnessGain < -10) {
      recommendations.push(
        `⚠️ Fairness score declined by ${Math.abs(fairnessGain).toFixed(1)} points. Some patients may be waiting too long.`
      );
    }

    // Utilization improvement
    const utilGain = parseFloat(improvements.utilizationImprovement);
    if (utilGain > 0) {
      recommendations.push(
        `✅ Doctor utilization increases by ${utilGain.toFixed(1)}% (${baselineMetrics.doctorUtilization.toFixed(1)} → ${optimizedMetrics.doctorUtilization.toFixed(1)}%)`
      );
    }

    // Fairness threshold warning
    if (optimizedMetrics.fairnessScore < 60) {
      recommendations.push(
        `⚠️ Fairness score is low (${optimizedMetrics.fairnessScore.toFixed(1)}/100). Some patients may be waiting too long. Consider adjusting weights.`
      );
    }

    // High urgency wait warning
    if (optimizedMetrics.maxWaitTime > 50) {
      recommendations.push(
        `⚠️ High-priority patients are waiting ${optimizedMetrics.maxWaitTime.toFixed(1)} minutes. Consider adjusting priority weights.`
      );
    }

    // Throughput optimization
    const throughputGain = parseFloat(improvements.throughputImprovement);
    if (throughputGain > 10) {
      recommendations.push(
        `✅ Throughput improves by ${throughputGain.toFixed(1)}% - more patients can be served per hour`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(`✅ Queue is already well optimized`);
    }

    return recommendations;
  }

  /**
   * Validate metrics
   */
  static validateMetrics(metrics: Metrics): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (metrics.averageWaitTime < 0) {
      errors.push('Average wait time cannot be negative');
    }

    if (metrics.maxWaitTime < metrics.minWaitTime) {
      errors.push('Max wait time cannot be less than min wait time');
    }

    if (metrics.fairnessScore < 0 || metrics.fairnessScore > 100) {
      errors.push('Fairness score must be between 0 and 100');
    }

    if (metrics.doctorUtilization < 0 || metrics.doctorUtilization > 100) {
      errors.push('Doctor utilization must be between 0 and 100%');
    }

    if (metrics.throughput < 0) {
      errors.push('Throughput cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
