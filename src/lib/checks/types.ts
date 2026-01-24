/**
 * Metadata for a check - describes the check without running it.
 */
export interface CheckMeta {
  /** Unique identifier for the check (e.g., "element-count") */
  id: string
  /** Display name for the check (e.g., "Element count") */
  name: string
  /** Check number for ordering (e.g., 1, 2, 3...) */
  checkNumber: number
  /** Whether this check can highlight specific elements */
  highlightable: boolean
  /** Benchmark description (e.g., "Best practice: under 100 elements") */
  benchmark: string
}

/**
 * Raw result from a check before scoring is applied.
 * Checks return raw data; a separate module (scorer.ts) handles severity thresholds.
 */
export interface CheckResult {
  /** Numeric value measured by the check (count, depth, etc.) */
  value: number
  /** Human-readable message about what was found */
  message: string
  /** Elements that can be highlighted (if highlightable) */
  elements?: Element[]
}

/**
 * A complete check definition: metadata + execution function.
 * Checks should return raw data without determining severity.
 * Severity is determined by the Scorer based on configurable thresholds.
 */
export interface Check {
  meta: CheckMeta
  run: () => CheckResult | null
}
