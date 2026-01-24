import { scorer } from "./scorer"
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
   * Uses the Scorer to apply severity thresholds to raw check results.
   */
  runAll(): Issue[] {
    const issues: Issue[] = []

    for (const check of this.getAll()) {
      const result = check.run()
      if (result !== null) {
        const issue = scorer.resultToIssue(check.meta, result)
        if (issue !== null) {
          issues.push(issue)
        }
      }
    }

    return issues
  }

  /**
   * Run all checks and return raw results (without scoring).
   * Useful for debugging or custom scoring logic.
   */
  runAllRaw(): Array<{ meta: CheckMeta; result: CheckResult }> {
    const results: Array<{ meta: CheckMeta; result: CheckResult }> = []

    for (const check of this.getAll()) {
      const result = check.run()
      if (result !== null) {
        results.push({ meta: check.meta, result })
      }
    }

    return results
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
