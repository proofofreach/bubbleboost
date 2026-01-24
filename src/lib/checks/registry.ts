import type { Check, CheckMeta, CheckResult } from "./types"
import type { Issue } from "~lib/store"

/**
 * Registry that holds all checks and provides methods to run them.
 * Checks self-register by calling registry.register().
 */
class CheckRegistry {
  private checks: Map<string, Check> = new Map()

  /**
   * Register a check with the registry.
   * Called by each check module at import time.
   */
  register(check: Check): void {
    if (this.checks.has(check.meta.id)) {
      console.warn(`Check "${check.meta.id}" is already registered, skipping duplicate`)
      return
    }
    this.checks.set(check.meta.id, check)
  }

  /**
   * Get all registered checks, sorted by checkNumber.
   */
  getAll(): Check[] {
    return Array.from(this.checks.values()).sort(
      (a, b) => a.meta.checkNumber - b.meta.checkNumber
    )
  }

  /**
   * Get metadata for all registered checks.
   */
  getAllMeta(): CheckMeta[] {
    return this.getAll().map((check) => check.meta)
  }

  /**
   * Get a specific check by ID.
   */
  get(id: string): Check | undefined {
    return this.checks.get(id)
  }

  /**
   * Run all checks and return results as Issues.
   * Each check's result is converted to an Issue using its thresholds.
   */
  runAll(): Issue[] {
    const issues: Issue[] = []

    for (const check of this.getAll()) {
      const result = check.run()
      if (result !== null) {
        const issue = this.resultToIssue(check, result)
        if (issue !== null) {
          issues.push(issue)
        }
      }
    }

    return issues
  }

  /**
   * Convert a CheckResult to an Issue.
   * The check's result provides raw data; this method applies severity.
   */
  private resultToIssue(check: Check, result: CheckResult): Issue | null {
    // For now, checks determine their own severity in the result.
    // Future RF-005 will separate scoring logic from checks.
    const issue: Issue = {
      id: `check-${check.meta.checkNumber}-${check.meta.id}`,
      checkNumber: check.meta.checkNumber,
      title: check.meta.name,
      severity: "warning", // Default severity - checks override via result
      count: result.value,
      message: result.message,
      benchmark: check.meta.benchmark,
    }

    // Only add elements if they exist (exactOptionalPropertyTypes compliance)
    if (result.elements !== undefined) {
      issue.elements = result.elements
    }

    return issue
  }

  /**
   * Clear all registered checks. Useful for testing.
   */
  clear(): void {
    this.checks.clear()
  }
}

// Singleton instance
export const registry = new CheckRegistry()
