import { describe, it, expect, beforeEach, vi } from "vitest"
import type { Check, CheckMeta, CheckResult } from "./types"

// Create a fresh registry for testing (not the singleton)
class TestRegistry {
  private checks: Map<string, Check> = new Map()
  private cache: Map<string, { result: CheckResult; domHash: string }> = new Map()
  private cacheHits = 0
  private cacheMisses = 0

  register(check: Check): void {
    if (this.checks.has(check.meta.id)) {
      console.warn(`Check "${check.meta.id}" is already registered, skipping duplicate`)
      return
    }
    this.checks.set(check.meta.id, check)
  }

  getAll(): Check[] {
    return Array.from(this.checks.values()).sort(
      (a, b) => a.meta.checkNumber - b.meta.checkNumber
    )
  }

  getAllMeta(): CheckMeta[] {
    return this.getAll().map((check) => check.meta)
  }

  get(id: string): Check | undefined {
    return this.checks.get(id)
  }

  getCacheStats() {
    const total = this.cacheHits + this.cacheMisses
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: total > 0 ? this.cacheHits / total : 0,
    }
  }

  clearCache(): void {
    this.cache.clear()
  }

  resetCacheStats(): void {
    this.cacheHits = 0
    this.cacheMisses = 0
  }

  clear(): void {
    this.checks.clear()
    this.cache.clear()
    this.resetCacheStats()
  }
}

describe("CheckRegistry", () => {
  let registry: TestRegistry

  const createMockCheck = (id: string, checkNumber: number): Check => ({
    meta: {
      id,
      name: `Test Check ${checkNumber}`,
      checkNumber,
      highlightable: false,
      benchmark: "Test benchmark",
    },
    run: () => ({ value: 1, message: "Test message" }),
  })

  beforeEach(() => {
    registry = new TestRegistry()
  })

  describe("register", () => {
    it("registers a check", () => {
      const check = createMockCheck("test-check", 1)
      registry.register(check)
      expect(registry.get("test-check")).toBe(check)
    })

    it("warns and skips duplicate registration", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
      const check = createMockCheck("test-check", 1)
      registry.register(check)
      registry.register(check)
      expect(warnSpy).toHaveBeenCalledWith(
        'Check "test-check" is already registered, skipping duplicate'
      )
      warnSpy.mockRestore()
    })
  })

  describe("getAll", () => {
    it("returns empty array when no checks registered", () => {
      expect(registry.getAll()).toEqual([])
    })

    it("returns checks sorted by checkNumber", () => {
      registry.register(createMockCheck("check-3", 3))
      registry.register(createMockCheck("check-1", 1))
      registry.register(createMockCheck("check-2", 2))

      const checks = registry.getAll()
      expect(checks.map((c) => c.meta.checkNumber)).toEqual([1, 2, 3])
    })
  })

  describe("getAllMeta", () => {
    it("returns metadata for all checks", () => {
      registry.register(createMockCheck("check-1", 1))
      registry.register(createMockCheck("check-2", 2))

      const meta = registry.getAllMeta()
      expect(meta).toHaveLength(2)
      expect(meta[0]?.id).toBe("check-1")
      expect(meta[1]?.id).toBe("check-2")
    })
  })

  describe("get", () => {
    it("returns check by id", () => {
      const check = createMockCheck("test-check", 1)
      registry.register(check)
      expect(registry.get("test-check")).toBe(check)
    })

    it("returns undefined for unknown check", () => {
      expect(registry.get("unknown")).toBeUndefined()
    })
  })

  describe("getCacheStats", () => {
    it("returns zero stats initially", () => {
      const stats = registry.getCacheStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
      expect(stats.hitRate).toBe(0)
    })
  })

  describe("clear", () => {
    it("clears all checks and cache", () => {
      registry.register(createMockCheck("test-check", 1))
      registry.clear()
      expect(registry.getAll()).toEqual([])
    })
  })

  describe("resetCacheStats", () => {
    it("resets cache statistics", () => {
      registry.resetCacheStats()
      const stats = registry.getCacheStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
    })
  })
})

// Test the actual singleton to verify it has checks registered
describe("registry singleton", () => {
  it("has checks auto-registered on import", async () => {
    // Import the actual registry and all checks
    const { registry } = await import("./registry")
    await import("./elementCount")
    await import("./rgNestingDepth")
    await import("./visibleOnLoad")
    await import("./hiddenButLoaded")
    await import("./imagesWithoutDimensions")
    await import("./rgCellElementCount")
    await import("./groupNestingDepth")

    const checks = registry.getAll()
    expect(checks.length).toBe(7)
  })

  it("can get cache stats", async () => {
    const { registry } = await import("./registry")
    const stats = registry.getCacheStats()
    expect(stats).toHaveProperty("hits")
    expect(stats).toHaveProperty("misses")
    expect(stats).toHaveProperty("hitRate")
  })
})
