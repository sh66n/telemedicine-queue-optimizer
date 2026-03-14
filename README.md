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

## How scoring works

```
score = (severityScore × severityWeight + waitScore × waitTimeWeight) × fairnessBoost
```

| Severity | Base score |
|---|---|
| high | 150 |
| medium | 75 |
| low | 25 |

`fairnessBoost` starts at `1`. Once `waitTime` exceeds the threshold for that severity, it grows as `1 + (excess / 30)` — preventing low-severity patients from waiting indefinitely.

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