/**
 * 🛠️ HELPER UTILITIES
 * Scalable utility functions for queue optimization
 */

import { Patient } from '../core/types';

/**
 * Calculate wait time in minutes
 * O(1) operation
 */
export function calculateWaitTime(arrivalTime: string): number {
  const arrival = new Date(arrivalTime);
  const now = new Date();
  return (now.getTime() - arrival.getTime()) / 60000; // Convert ms to minutes
}

/**
 * Calculate wait times for multiple patients
 * O(n) operation
 */
export function calculateWaitTimeBatch(patients: Patient[]): Patient[] {
  return patients.map((patient) => ({
    ...patient,
    waitTime: calculateWaitTime(patient.arrivalTime),
  }));
}

/**
 * Format duration as human-readable string
 * O(1) operation
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) {
    return 'Just now';
  }

  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}

/**
 * Format time as HH:MM
 * O(1) operation
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Compare two patients for sorting
 * O(1) operation
 */
export function comparePatients(
  a: Patient,
  b: Patient,
  by: 'arrival' | 'severity' | 'id' = 'arrival'
): number {
  switch (by) {
    case 'arrival':
      return new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime();

    case 'severity': {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    }

    case 'id':
      return a.id.localeCompare(b.id);

    default:
      return 0;
  }
}

/**
 * Group patients by severity
 * O(n) operation
 */
export function groupBySeverity(patients: Patient[]): Record<string, Patient[]> {
  return patients.reduce(
    (acc, patient) => {
      if (!acc[patient.severity]) {
        acc[patient.severity] = [];
      }
      acc[patient.severity].push(patient);
      return acc;
    },
    {} as Record<string, Patient[]>
  );
}

/**
 * Filter patients by severity
 * O(n) operation
 */
export function filterBySeverity(
  patients: Patient[],
  severity: string | string[]
): Patient[] {
  const severities = Array.isArray(severity) ? severity : [severity];
  return patients.filter((p) => severities.includes(p.severity));
}

/**
 * Calculate average wait time
 * O(n) operation
 */
export function calculateAverageWait(patients: Patient[]): number {
  if (patients.length === 0) return 0;

  const total = patients.reduce((sum, p) => sum + (p.waitTime || 0), 0);
  return total / patients.length;
}

/**
 * Calculate statistics for patients
 * O(n) operation
 */
export function calculateStatistics(patients: Patient[]): {
  count: number;
  avgWait: number;
  maxWait: number;
  minWait: number;
  byteSize: number;
} {
  if (patients.length === 0) {
    return { count: 0, avgWait: 0, maxWait: 0, minWait: 0, byteSize: 0 };
  }

  const waits = patients.map((p) => p.waitTime || 0);
  const avgWait = waits.reduce((a, b) => a + b, 0) / waits.length;
  const maxWait = Math.max(...waits);
  const minWait = Math.min(...waits);
  const byteSize = JSON.stringify(patients).length;

  return {
    count: patients.length,
    avgWait,
    maxWait,
    minWait,
    byteSize,
  };
}

/**
 * Deduplicate patients by ID
 * O(n) operation
 */
export function deduplicatePatients(patients: Patient[]): Patient[] {
  const seen = new Set<string>();
  const result: Patient[] = [];

  for (const patient of patients) {
    if (!seen.has(patient.id)) {
      seen.add(patient.id);
      result.push(patient);
    }
  }

  return result;
}

/**
 * Validate patient data
 * O(1) operation per patient
 */
export function validatePatient(patient: Patient): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!patient.id) {
    errors.push('Missing patient ID');
  }

  if (!patient.arrivalTime) {
    errors.push('Missing arrival time');
  } else {
    try {
      new Date(patient.arrivalTime);
    } catch {
      errors.push('Invalid arrival time format');
    }
  }

  if (!['low', 'medium', 'high'].includes(patient.severity)) {
    errors.push(`Invalid severity: ${patient.severity}`);
  }

  if (patient.waitTime !== undefined && patient.waitTime < 0) {
    errors.push('Wait time cannot be negative');
  }

  if (patient.estimatedDuration !== undefined && patient.estimatedDuration < 0) {
    errors.push('Duration cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate batch of patients
 * O(n) operation
 */
export function validatePatients(patients: Patient[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (patients.length === 0) {
    errors.push('No patients provided');
  }

  for (const patient of patients) {
    const validation = validatePatient(patient);
    if (!validation.valid) {
      errors.push(`Patient ${patient.id}: ${validation.errors.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Paginate patients for display
 * O(1) operation
 */
export function paginate<T>(items: T[], page: number, pageSize: number): {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  pages: number;
} {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pages = Math.ceil(items.length / pageSize);

  return {
    items: items.slice(start, end),
    page,
    pageSize,
    total: items.length,
    pages,
  };
}

/**
 * Deep clone patient object
 * O(n) operation
 */
export function clonePatient(patient: Patient): Patient {
  return JSON.parse(JSON.stringify(patient));
}

/**
 * Merge patient data (updates first with second)
 * O(1) operation
 */
export function mergePatients(patient1: Patient, patient2: Partial<Patient>): Patient {
  return {
    ...patient1,
    ...patient2,
    id: patient1.id, // ID cannot be changed
  };
}
