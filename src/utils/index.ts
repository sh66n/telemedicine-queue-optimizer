/**
 * 🛠️ UTILS MODULE EXPORTS
 * Utility functions and helpers
 */

export { Logger, createLogger, LogLevel, globalLogger } from './logger';
export {
  calculateWaitTime,
  calculateWaitTimeBatch,
  formatDuration,
  formatTime,
  comparePatients,
  groupBySeverity,
  filterBySeverity,
  calculateAverageWait,
  calculateStatistics,
  deduplicatePatients,
  validatePatient,
  validatePatients,
  paginate,
  clonePatient,
  mergePatients,
} from './helpers';
