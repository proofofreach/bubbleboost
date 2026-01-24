/**
 * DOM Batcher - Batches DOM reads and executes during idle time.
 *
 * Prevents layout thrashing by:
 * 1. Collecting DOM read operations
 * 2. Executing them in batch during requestIdleCallback
 * 3. Adding performance marks for monitoring
 */

/**
 * A queued DOM read operation.
 */
interface QueuedRead<T> {
  operation: () => T
  resolve: (value: T) => void
  reject: (error: unknown) => void
}

/**
 * Performance statistics for DOM batching.
 */
export interface BatchStats {
  totalBatches: number
  totalOperations: number
  averageBatchSize: number
  totalIdleTimeMs: number
}

/**
 * Options for scheduling DOM reads.
 */
export interface ScheduleOptions {
  /** Timeout in ms before forcing execution (default: 1000) */
  timeout?: number
  /** Priority hint - 'high' skips idle scheduling for critical reads */
  priority?: "normal" | "high"
}

// Internal state
let readQueue: QueuedRead<unknown>[] = []
let scheduledFlush: number | null = null
let isProcessing = false

// Performance tracking
let stats: BatchStats = {
  totalBatches: 0,
  totalOperations: 0,
  averageBatchSize: 0,
  totalIdleTimeMs: 0,
}

// Default timeout for requestIdleCallback
const DEFAULT_TIMEOUT_MS = 1000

/**
 * Schedule a DOM read operation to be executed during idle time.
 * Returns a promise that resolves with the operation result.
 */
export function scheduleDomRead<T>(
  operation: () => T,
  options: ScheduleOptions = {}
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT_MS, priority = "normal" } = options

  // High priority operations execute immediately
  if (priority === "high") {
    return Promise.resolve(operation())
  }

  return new Promise((resolve, reject) => {
    readQueue.push({
      operation,
      resolve: resolve as (value: unknown) => void,
      reject,
    })

    // Schedule flush if not already scheduled
    if (scheduledFlush === null) {
      scheduleFlush(timeout)
    }
  })
}

/**
 * Schedule multiple DOM read operations as a batch.
 * More efficient than calling scheduleDomRead multiple times.
 */
export function scheduleDomReadBatch<T>(
  operations: Array<() => T>,
  options: ScheduleOptions = {}
): Promise<T[]> {
  const { priority = "normal" } = options

  // High priority operations execute immediately
  if (priority === "high") {
    return Promise.resolve(operations.map((op) => op()))
  }

  const promises = operations.map((operation) =>
    scheduleDomRead(operation, { ...options, priority: "normal" })
  )

  return Promise.all(promises)
}

/**
 * Schedule a flush using requestIdleCallback (with fallback).
 */
function scheduleFlush(timeout: number): void {
  if (typeof requestIdleCallback !== "undefined") {
    scheduledFlush = requestIdleCallback(
      (deadline) => {
        flushQueue(deadline)
      },
      { timeout }
    )
  } else {
    // Fallback for environments without requestIdleCallback
    scheduledFlush = setTimeout(() => {
      flushQueue(null)
    }, 0) as unknown as number
  }
}

/**
 * Execute all queued DOM reads.
 * Called during idle time via requestIdleCallback.
 */
function flushQueue(deadline: IdleDeadline | null): void {
  if (isProcessing || readQueue.length === 0) {
    scheduledFlush = null
    return
  }

  isProcessing = true
  const startTime = performance.now()
  performance.mark("bubbleboost-dom-batch-start")

  const batch = [...readQueue]
  readQueue = []
  scheduledFlush = null

  // Execute all queued reads
  for (const { operation, resolve, reject } of batch) {
    try {
      // Check if we have time remaining (if deadline provided)
      if (deadline !== null && deadline.timeRemaining() <= 0) {
        // Out of time - re-queue remaining operations
        const remaining = batch.slice(batch.indexOf({ operation, resolve, reject } as QueuedRead<unknown>))
        readQueue.push(...remaining)
        scheduleFlush(DEFAULT_TIMEOUT_MS)
        break
      }

      const result = operation()
      resolve(result)
    } catch (error) {
      reject(error)
    }
  }

  const endTime = performance.now()
  const batchTime = endTime - startTime

  // Update stats
  stats.totalBatches++
  stats.totalOperations += batch.length
  stats.averageBatchSize = stats.totalOperations / stats.totalBatches
  stats.totalIdleTimeMs += batchTime

  performance.mark("bubbleboost-dom-batch-end")
  performance.measure("bubbleboost-dom-batch", "bubbleboost-dom-batch-start", "bubbleboost-dom-batch-end")

  isProcessing = false

  // If more operations were queued during processing, schedule another flush
  if (readQueue.length > 0 && scheduledFlush === null) {
    scheduleFlush(DEFAULT_TIMEOUT_MS)
  }
}

/**
 * Force immediate flush of all queued operations.
 * Use sparingly - bypasses idle scheduling.
 */
export function flushImmediately(): void {
  if (scheduledFlush !== null) {
    if (typeof cancelIdleCallback !== "undefined") {
      cancelIdleCallback(scheduledFlush)
    } else {
      clearTimeout(scheduledFlush)
    }
    scheduledFlush = null
  }

  if (readQueue.length === 0) {
    return
  }

  isProcessing = true
  performance.mark("bubbleboost-dom-flush-immediate-start")

  const batch = [...readQueue]
  readQueue = []

  for (const { operation, resolve, reject } of batch) {
    try {
      const result = operation()
      resolve(result)
    } catch (error) {
      reject(error)
    }
  }

  performance.mark("bubbleboost-dom-flush-immediate-end")
  performance.measure(
    "bubbleboost-dom-flush-immediate",
    "bubbleboost-dom-flush-immediate-start",
    "bubbleboost-dom-flush-immediate-end"
  )

  stats.totalBatches++
  stats.totalOperations += batch.length
  stats.averageBatchSize = stats.totalOperations / stats.totalBatches

  isProcessing = false
}

/**
 * Get current batch statistics.
 */
export function getBatchStats(): BatchStats {
  return { ...stats }
}

/**
 * Reset batch statistics.
 */
export function resetBatchStats(): void {
  stats = {
    totalBatches: 0,
    totalOperations: 0,
    averageBatchSize: 0,
    totalIdleTimeMs: 0,
  }
}

/**
 * Log batch statistics to console.
 */
export function logBatchStats(): void {
  const s = getBatchStats()
  console.debug(
    `[BubbleBoost] DOM Batch stats: ${s.totalBatches} batches, ` +
    `${s.totalOperations} operations, ` +
    `avg ${s.averageBatchSize.toFixed(1)} ops/batch, ` +
    `${s.totalIdleTimeMs.toFixed(2)}ms total idle time`
  )
}

/**
 * Check if there are pending operations in the queue.
 */
export function hasPendingOperations(): boolean {
  return readQueue.length > 0
}

/**
 * Get the number of pending operations.
 */
export function getPendingCount(): number {
  return readQueue.length
}
