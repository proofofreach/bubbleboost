import type { CheckMeta, CheckResult } from "./types"
import type { Issue } from "~lib/store"

/**
 * Threshold configuration for a check.
 * Defines at what values different severities trigger.
 */
export interface ThresholdConfig {
  /** Check ID this threshold applies to */
  checkId: string
  /** Value at or above which warning severity triggers (null = no warning) */
  warning: number | null
  /** Value at or above which critical severity triggers (null = no critical) */
  critical: number | null
  /** If true, trigger when value > 0 (for "any is bad" checks like images without dimensions) */
  anyTriggers?: boolean
}

/**
 * Default thresholds for all checks.
 * These can be overridden via configuration.
 */
export const DEFAULT_THRESHOLDS: ThresholdConfig[] = [
  // Check 1: Element count - warn >200, critical >500
  { checkId: "element-count", warning: 201, critical: 501 },
  // Check 2: RG nesting depth - warn >1, critical >2
  { checkId: "rg-nesting", warning: 2, critical: 3 },
  // Check 3: Visible on load - warn >50, critical >100
  { checkId: "visible-on-load", warning: 51, critical: 101 },
  // Check 4: Hidden but loaded - warn >20
  { checkId: "hidden-loaded", warning: 21, critical: null },
  // Check 5: Images without dimensions - any triggers warning
  { checkId: "images-no-dimensions", warning: 1, critical: null, anyTriggers: true },
  // Check 6: RG cell element count - warn >5
  { checkId: "rg-cell-count", warning: 6, critical: null },
  // Check 7: Group nesting depth - warn >5, critical >8
  { checkId: "group-nesting", warning: 6, critical: 9 },
]

/**
 * Scorer class that applies thresholds to check results.
 * Separates DOM query logic (in checks) from scoring logic (here).
 */
export class Scorer {
  private thresholds: Map<string, ThresholdConfig>

  constructor(thresholdConfigs: ThresholdConfig[] = DEFAULT_THRESHOLDS) {
    this.thresholds = new Map()
    for (const config of thresholdConfigs) {
      this.thresholds.set(config.checkId, config)
    }
  }

  /**
   * Get the threshold config for a check.
   */
  getThreshold(checkId: string): ThresholdConfig | undefined {
    return this.thresholds.get(checkId)
  }

  /**
   * Update a threshold configuration.
   */
  setThreshold(config: ThresholdConfig): void {
    this.thresholds.set(config.checkId, config)
  }

  /**
   * Determine severity for a check result based on thresholds.
   * Returns null if the value doesn't trigger any severity.
   */
  getSeverity(checkId: string, value: number): Issue["severity"] | null {
    const threshold = this.thresholds.get(checkId)
    if (threshold === undefined) {
      // No threshold config - default to warning if any value
      return value > 0 ? "warning" : null
    }

    // Check critical threshold first (higher priority)
    if (threshold.critical !== null && value >= threshold.critical) {
      return "critical"
    }

    // Check warning threshold
    if (threshold.warning !== null && value >= threshold.warning) {
      return "warning"
    }

    // For "anyTriggers" checks, any non-zero value is significant
    if (threshold.anyTriggers === true && value > 0) {
      return "warning"
    }

    return null
  }

  /**
   * Convert a CheckResult to an Issue by applying severity thresholds.
   * Returns null if the check result doesn't trigger any severity.
   */
  resultToIssue(meta: CheckMeta, result: CheckResult): Issue | null {
    const severity = this.getSeverity(meta.id, result.value)

    // No severity triggered - no issue
    if (severity === null) {
      return null
    }

    const issue: Issue = {
      id: `check-${meta.checkNumber}-${meta.id}`,
      checkNumber: meta.checkNumber,
      title: meta.name,
      severity,
      count: result.value,
      message: result.message,
      benchmark: meta.benchmark,
    }

    // Only add elements if they exist (exactOptionalPropertyTypes compliance)
    if (result.elements !== undefined) {
      issue.elements = result.elements
    }

    return issue
  }
}

// Singleton instance with default thresholds
export const scorer = new Scorer()
