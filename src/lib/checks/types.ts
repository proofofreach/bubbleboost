import type { Issue } from "~lib/store"

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
 * Checks return raw data; a separate module handles severity and scoring.
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
 */
export interface Check {
  meta: CheckMeta
  run: () => CheckResult | null
}

/**
 * Converts a CheckResult to an Issue by applying severity thresholds.
 */
export type ThresholdFn = (value: number) => Issue["severity"] | null
