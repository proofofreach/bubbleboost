import { scorer } from "./scorer"
import type { Check, CheckMeta, CheckResult } from "./types"
import type { Issue } from "~lib/store"

/**
 * Cache entry storing a check result with its DOM hash for invalidation.
 */
interface CacheEntry {
  result: CheckResult
  domHash: string
}

/**
 * Cache statistics for debugging and monitoring.
 */
export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
}

/**
 * Compute a hash of the DOM relevant to a specific check.
 * Different checks may care about different parts of the DOM.
 */
function computeDomHash(checkId: string): string {
  // Check-specific DOM hashing for fine-grained invalidation
  switch (checkId) {
    case "element-count":
    case "visible-on-load":
    case "hidden-loaded":
    case "group-nesting": {
      // These checks care about bubble elements
      const elements = document.querySelectorAll('[data-element-id], [class*="bubble-element"]')
      return `${checkId}:${elements.length}:${hashElements(elements)}`
    }
    case "rg-nesting":
    case "rg-cell-count": {
      // These checks care about repeating groups
      const rgs = document.querySelectorAll('[data-source]:not([data-source=""])')
      return `${checkId}:${rgs.length}:${hashElements(rgs)}`
    }
    case "images-no-dimensions": {
      // This check cares about images
      const images = document.querySelectorAll("img")
      return `${checkId}:${images.length}:${hashElements(images)}`
    }
    default: {
      // Fallback: hash all bubble elements
      const allElements = document.querySelectorAll('[data-element-id]')
      return `${checkId}:${allElements.length}:${hashElements(allElements)}`
    }
  }
}

/**
 * Generate a lightweight hash from a NodeList for cache comparison.
 * Uses element structure (tag, class prefix, id) rather than full content.
 */
function hashElements(elements: NodeListOf<Element>): string {
  // Sample up to 30 elements for performance
  const sample = Array.from(elements).slice(0, 30)
  const fingerprints = sample.map((el) => {
    const tag = el.tagName
    const classPrefix = (el.className || "").toString().slice(0, 15)
    const dataId = el.getAttribute("data-element-id") ?? ""
    return `${tag}:${classPrefix}:${dataId.slice(0, 8)}`
  })
  return fingerprints.join("|")
}

/**
 * Registry that holds all checks and provides methods to run them.
 * Includes per-check caching with DOM-hash-based invalidation.
 */
class CheckRegistry {
  private checks: Map<string, Check> = new Map()
  private cache: Map<string, CacheEntry> = new Map()
  private cacheHits = 0
  private cacheMisses = 0

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
   * Run a single check with caching.
   * Returns cached result if DOM hash matches, otherwise runs check and caches.
   */
  private runCheckWithCache(check: Check): CheckResult | null {
    const checkId = check.meta.id
    const currentHash = computeDomHash(checkId)
    const cached = this.cache.get(checkId)

    if (cached !== undefined && cached.domHash === currentHash) {
      this.cacheHits++
      return cached.result
    }

    this.cacheMisses++
    const result = check.run()

    if (result !== null) {
      this.cache.set(checkId, { result, domHash: currentHash })
    } else {
      // Clear cache entry if check returns null
      this.cache.delete(checkId)
    }

    return result
  }

  /**
   * Run all checks and return results as Issues.
   * Uses caching to skip re-running checks when DOM hasn't changed.
   * Uses the Scorer to apply severity thresholds to raw check results.
   */
  runAll(): Issue[] {
    const issues: Issue[] = []

    for (const check of this.getAll()) {
      const result = this.runCheckWithCache(check)
      if (result !== null) {
        const issue = scorer.resultToIssue(check.meta, result)
        if (issue !== null) {
          issues.push(issue)
        }
      }
    }

    this.logCacheStats()
    return issues
  }

  /**
   * Run all checks and return raw results (without scoring).
   * Uses caching to skip re-running checks when DOM hasn't changed.
   */
  runAllRaw(): Array<{ meta: CheckMeta; result: CheckResult }> {
    const results: Array<{ meta: CheckMeta; result: CheckResult }> = []

    for (const check of this.getAll()) {
      const result = this.runCheckWithCache(check)
      if (result !== null) {
        results.push({ meta: check.meta, result })
      }
    }

    this.logCacheStats()
    return results
  }

  /**
   * Get cache statistics for monitoring.
   */
  getCacheStats(): CacheStats {
    const total = this.cacheHits + this.cacheMisses
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: total > 0 ? this.cacheHits / total : 0,
    }
  }

  /**
   * Log cache statistics to console.
   * Called after each runAll() for debugging.
   */
  private logCacheStats(): void {
    const stats = this.getCacheStats()
    if (stats.hits > 0 || stats.misses > 0) {
      console.debug(
        `[BubbleBoost] Cache stats: ${stats.hits} hits, ${stats.misses} misses, ` +
          `${(stats.hitRate * 100).toFixed(1)}% hit rate`
      )
    }
  }

  /**
   * Clear the check result cache.
   * Call when forcing a full re-analysis.
   */
  clearCache(): void {
    this.cache.clear()
    console.debug("[BubbleBoost] Check cache cleared")
  }

  /**
   * Reset cache statistics.
   */
  resetCacheStats(): void {
    this.cacheHits = 0
    this.cacheMisses = 0
  }

  /**
   * Clear all registered checks. Useful for testing.
   */
  clear(): void {
    this.checks.clear()
    this.cache.clear()
    this.resetCacheStats()
  }
}

// Singleton instance
export const registry = new CheckRegistry()
