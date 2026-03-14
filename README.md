# @sh66n/telemedicine-queue-optimizer

Priority queue scheduling for telemedicine. Moves urgent patients up without starving everyone else.

```bash
npm install @sh66n/telemedicine-queue-optimizer
```

---

## Usage

```typescript
import { QueueOptimizer } from '@sh66n/telemedicine-queue-optimizer';

const optimizer = new QueueOptimizer({
  severityWeight: 0.6,
  waitTimeWeight: 0.2,
  fairnessWeight: 0.2,
  maxWaitTimeForHighPriority: 20,
  maxWaitTimeForMediumPriority: 40,
  maxWaitTimeForLowPriority: 60,
});

const optimized = optimizer.optimize(patients);
```

---

## API

### `new QueueOptimizer(config)`

| Field | Type | Description |
|---|---|---|
| `severityWeight` | number | Weight for severity score (0–1) |
| `waitTimeWeight` | number | Weight for wait time score (0–1) |
| `fairnessWeight` | number | Reserved; used in weight validation (0–1) |
| `maxWaitTimeForHighPriority` | number | Minutes before fairness boost kicks in |
| `maxWaitTimeForMediumPriority` | number | Same for medium |
| `maxWaitTimeForLowPriority` | number | Same for low |

> Weights must sum to `1.0`.

---

### Methods

#### `optimize(patients)` → `Patient[]`
Reorders patients by priority score. Does not mutate input.

#### `generateQueueOrder(patients, startTime?)` → `QueueOrder[]`
Attaches estimated start/end/wait times. Pass the result of `optimize()`, not raw patients.

#### `compareQueues(patients, startTime?)` → `ComparisonResult`
Runs FIFO and optimized side by side. Returns both queues with metrics and improvement deltas.

```typescript
const { baseline, optimized, improvements } = optimizer.compareQueues(patients);
// baseline.queue, baseline.metrics
// optimized.queue, optimized.metrics
// improvements.waitTimeReduction, improvements.fairnessImprovement
```

#### `getScores(patients)` → `Array<{ patientId, score, explanation }>`
Shows why each patient ranked where they did.

#### `validate(patients)` → `{ valid, errors[] }`
Validates config weights and patient fields before running.

#### `getConfig()` → `QueueOptimizationConfig`
#### `setConfig(partial)` → `void`

---

### `new QueueSimulator(config)`

Wraps `QueueOptimizer` with richer output — recommendations, HTML reports, multi-config testing.

#### `simulate(patients, startTime?)` → `OptimizationResult`

```typescript
{
  baselineQueue: QueueOrder[],
  optimizedQueue: QueueOrder[],
  baselineMetrics: Metrics,
  optimizedMetrics: Metrics,
  improvements: {
    waitTimeReduction: string,
    fairnessImprovement: string,
    utilizationImprovement: string,
    throughputImprovement: string,
  },
  recommendations: string[]
}
```

#### `simulateWithConfig(patients, config)` → `OptimizationResult`
One-off simulation with a different config, without mutating the instance.

#### `runMultipleSimulations(patients, configs[])` → `Array<{ name, result }>`
Test multiple configs at once.

#### `compareCustomQueues(baseline, optimized)` → `{ baselineMetrics, optimizedMetrics, improvements }`
Compare two arbitrary patient orderings you supply yourself.

#### `getDetailedMetrics(queueOrders)` → `{ byPosition[], bySeverity }`
#### `exportResult(result)` → `string` (full JSON)
#### `exportSummary(result)` → `string` (compact JSON)
#### `generateHTMLReport(result)` → `string`

---

## Types

```typescript
interface Patient {
  id: string
  arrivalTime: string                    // ISO 8601
  severity: 'low' | 'medium' | 'high'
  waitTime?: number                      // minutes; calculated from arrivalTime if omitted
  estimatedDuration?: number             // minutes; predicted from severity if omitted
}

interface QueueOrder {
  position: number
  patient: Patient
  estimatedStartTime: Date
  estimatedEndTime: Date
  estimatedWaitTime: number
}

interface Metrics {
  averageWaitTime: number
  maxWaitTime: number
  minWaitTime: number
  fairnessScore: number        // 0–100
  doctorUtilization: number    // 0–100
  throughput: number           // patients/hour
}
```

---

## How it works

Every patient gets a priority score. The queue is sorted descending by score — highest score is seen first.

### Score formula

```
baseScore = (severityScore × severityWeight) + (waitScore × waitTimeWeight)
score     = baseScore × fairnessBoost
```

### Severity score

A fixed value based on clinical urgency:

| Severity | Score |
|---|---|
| high | 150 |
| medium | 75 |
| low | 25 |

### Wait score

Normalizes wait time to a 0–100 scale:

```
waitScore = min((waitTime / 60) × 100, 100)
```

A patient who has waited 60+ minutes gets the maximum wait score of 100. Someone who just arrived gets close to 0.

### Fairness boost

This is the starvation-prevention mechanism. It's a multiplier that starts at `1` (no effect) and grows once a patient's wait time exceeds their severity threshold:

```
boost = 1                                if waitTime ≤ threshold
boost = 1 + (waitTime - threshold) / 30  if waitTime > threshold
```

Default thresholds:

| Severity | Threshold |
|---|---|
| high | 20 min |
| medium | 40 min |
| low | 60 min |

Because the boost is a **multiplier on the entire score**, it compounds — a patient who has blown past their threshold doesn't just get a small additive bump, their whole score scales up. A low-severity patient waiting 3 hours will eventually outrank a medium-severity patient who just arrived.

### Example

Two patients, default config (`severityWeight: 0.6, waitTimeWeight: 0.2`):

| | P001 | P002 |
|---|---|---|
| Severity | low (25) | high (150) |
| Wait time | 120 min | 10 min |
| Wait score | 100 | 16.7 |
| Threshold | 60 min | 20 min |
| Boost | 1 + (60/30) = 3.0 | 1.0 |
| Base score | (25×0.6) + (100×0.2) = 35 | (150×0.6) + (16.7×0.2) = 93.3 |
| Final score | 35 × 3.0 = **105** | 93.3 × 1.0 = **93.3** |

P001 (low severity, waited 2 hours) ranks above P002 (high severity, just arrived). This is intentional — the fairness boost exists precisely for this scenario.

If this isn't the behavior you want, increase `maxWaitTimeForLowPriority` to delay when the boost kicks in, or increase `severityWeight` to make severity harder to overcome.

---

## Duration prediction

If `estimatedDuration` is not set, it's predicted automatically:

| Severity | Base | Variance |
|---|---|---|
| high | 25 min | ±5 min |
| medium | 20 min | ±5 min |
| low | 12 min | ±5 min |

Set `estimatedDuration` explicitly on every patient for deterministic timing.

---

## License

MIT