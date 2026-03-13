# Telemedicine Queue Optimizer

[![npm version](https://img.shields.io/npm/v/@sh66n/telemedicine-queue-optimizer)](https://www.npmjs.com/package/@sh66n/telemedicine-queue-optimizer)
[![npm downloads](https://img.shields.io/npm/dm/@sh66n/telemedicine-queue-optimizer)](https://www.npmjs.com/package/@sh66n/telemedicine-queue-optimizer)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-blue)](https://www.typescriptlang.org/)

Intelligent queue optimization for telemedicine platforms.
Reduces patient wait times while preserving fairness and respecting medical urgency.

---

## Overview

Telemedicine systems often rely on simple FIFO queues, which can lead to long waits, poor prioritization of urgent cases, and inefficient doctor utilization.

This library provides a priority-based scheduling system designed for healthcare queues. It combines severity, waiting time, and fairness adjustments to produce optimized queue ordering.

The optimizer is lightweight, dependency-free, and designed for integration in Node.js services, backend APIs, or web applications.

---

## Installation

```bash
npm install @sh66n/telemedicine-queue-optimizer
```

---

## Quick Example

```ts
import { QueueOptimizer } from '@sh66n/telemedicine-queue-optimizer';

const patients = [
  {
    id: 'P001',
    arrivalTime: new Date(Date.now() - 45 * 60000).toISOString(),
    severity: 'high',
    waitTime: 45
  },
  {
    id: 'P002',
    arrivalTime: new Date(Date.now() - 60 * 60000).toISOString(),
    severity: 'low',
    waitTime: 60
  }
];

const optimizer = new QueueOptimizer();

const optimizedQueue = optimizer.optimize(patients);

console.log(optimizedQueue);
```

---

## Simulation

The simulator allows comparison between baseline FIFO ordering and optimized queue ordering.

```ts
import { QueueSimulator } from '@sh66n/telemedicine-queue-optimizer';

const simulator = new QueueSimulator();

const result = simulator.simulate(patients);

console.log(result.baselineMetrics.averageWaitTime);
console.log(result.optimizedMetrics.averageWaitTime);
console.log(result.improvements);
```

---

## Configuration

Queue behavior can be tuned using weights and waiting thresholds.

```ts
import { QueueOptimizer } from '@sh66n/telemedicine-queue-optimizer';

const optimizer = new QueueOptimizer({
  severityWeight: 0.6,
  waitTimeWeight: 0.2,
  fairnessWeight: 0.2,
  maxWaitTimeForHighPriority: 20,
  maxWaitTimeForMediumPriority: 40,
  maxWaitTimeForLowPriority: 60
});
```

---

## API

### QueueOptimizer

Primary class responsible for calculating queue priority.

```
constructor(config?: Partial<QueueOptimizationConfig>)

optimize(patients: Patient[]): Patient[]

generateQueueOrder(
  patients: Patient[],
  startTime?: Date
): QueueOrder[]

compareQueues(patients: Patient[]): {
  baseline: QueueOrder[]
  optimized: QueueOrder[]
}

getConfig(): QueueOptimizationConfig

setConfig(config: Partial<QueueOptimizationConfig>): void

debugScores(patients: Patient[]): Array<{
  patient: Patient
  explanation: string
}>
```

### QueueSimulator

Runs full simulations and generates performance metrics.

```
constructor(config?: Partial<QueueOptimizationConfig>)

simulate(patients: Patient[]): OptimizationResult
```

---

## Data Types

### Patient

```ts
interface Patient {
  id: string
  arrivalTime: string
  severity: 'low' | 'medium' | 'high'
  waitTime?: number
  estimatedDuration?: number
}
```

### QueueOrder

```ts
interface QueueOrder {
  position: number
  patient: Patient
  estimatedStartTime: Date
  estimatedEndTime: Date
  estimatedWaitTime: number
}
```

### Metrics

```ts
interface Metrics {
  averageWaitTime: number
  maxWaitTime: number
  minWaitTime: number
  fairnessScore: number
  doctorUtilization: number
  throughput: number
}
```

---

## Algorithm

Each patient receives a priority score based on three factors:

* Severity level
* Waiting time
* Fairness adjustment

Priority score:

```
Score = (SeverityWeight × SeverityScore)
      + (WaitTimeWeight × WaitScore)
      + (FairnessWeight × FairnessBoost)
```

Severity scores:

```
High    → 150
Medium  → 75
Low     → 25
```

Fairness boosting ensures patients waiting beyond configured thresholds gradually increase in priority, preventing starvation.

Patients are then sorted by score to generate the optimized queue.

---

## Integration Example (Express)

```ts
import express from 'express'
import { QueueSimulator } from '@sh66n/telemedicine-queue-optimizer'

const app = express()
const simulator = new QueueSimulator()

app.post('/optimize', express.json(), (req, res) => {
  const result = simulator.simulate(req.body.patients)
  res.json(result)
})

app.listen(3000)
```

---

## Validation

```ts
import { validateConfig } from '@sh66n/telemedicine-queue-optimizer'

const validation = validateConfig({
  severityWeight: 0.5,
  waitTimeWeight: 0.3,
  fairnessWeight: 0.2
})

if (!validation.valid) {
  console.error(validation.errors)
}
```

---

## Development

Install dependencies:

```
npm install
```

Run tests:

```
npm test
```

Build:

```
npm run build
```

---

## License

MIT License.

---

## Contributing

Contributions are welcome.
Open an issue or submit a pull request if you would like to improve the optimizer or add new scheduling strategies.

---

## Links

npm: https://www.npmjs.com/package/@sh66n/telemedicine-queue-optimizer
repository: https://github.com/sh66n/telemedicine-queue-optimizer
