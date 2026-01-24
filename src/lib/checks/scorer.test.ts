import { describe, it, expect, beforeEach } from "vitest"
import { Scorer, DEFAULT_THRESHOLDS, type ThresholdConfig } from "./scorer"
import type { CheckMeta, CheckResult } from "./types"

describe("Scorer", () => {
  let scorer: Scorer

  beforeEach(() => {
    scorer = new Scorer()
  })

  describe("getSeverity", () => {
    it("returns null when value is below warning threshold", () => {
      expect(scorer.getSeverity("element-count", 100)).toBeNull()
      expect(scorer.getSeverity("element-count", 200)).toBeNull()
    })

    it("returns warning when value meets warning threshold", () => {
      expect(scorer.getSeverity("element-count", 201)).toBe("warning")
      expect(scorer.getSeverity("element-count", 300)).toBe("warning")
    })

    it("returns critical when value meets critical threshold", () => {
      expect(scorer.getSeverity("element-count", 501)).toBe("critical")
      expect(scorer.getSeverity("element-count", 1000)).toBe("critical")
    })

    it("handles RG nesting thresholds correctly", () => {
      expect(scorer.getSeverity("rg-nesting", 1)).toBeNull()
      expect(scorer.getSeverity("rg-nesting", 2)).toBe("warning")
      expect(scorer.getSeverity("rg-nesting", 3)).toBe("critical")
    })

    it("handles visible-on-load thresholds correctly", () => {
      expect(scorer.getSeverity("visible-on-load", 50)).toBeNull()
      expect(scorer.getSeverity("visible-on-load", 51)).toBe("warning")
      expect(scorer.getSeverity("visible-on-load", 101)).toBe("critical")
    })

    it("handles hidden-loaded with no critical threshold", () => {
      expect(scorer.getSeverity("hidden-loaded", 20)).toBeNull()
      expect(scorer.getSeverity("hidden-loaded", 21)).toBe("warning")
      expect(scorer.getSeverity("hidden-loaded", 1000)).toBe("warning")
    })

    it("handles anyTriggers for images-no-dimensions", () => {
      expect(scorer.getSeverity("images-no-dimensions", 0)).toBeNull()
      expect(scorer.getSeverity("images-no-dimensions", 1)).toBe("warning")
      expect(scorer.getSeverity("images-no-dimensions", 100)).toBe("warning")
    })

    it("handles RG cell count thresholds", () => {
      expect(scorer.getSeverity("rg-cell-count", 5)).toBeNull()
      expect(scorer.getSeverity("rg-cell-count", 6)).toBe("warning")
    })

    it("handles group nesting thresholds", () => {
      expect(scorer.getSeverity("group-nesting", 5)).toBeNull()
      expect(scorer.getSeverity("group-nesting", 6)).toBe("warning")
      expect(scorer.getSeverity("group-nesting", 9)).toBe("critical")
    })

    it("returns warning for unknown check with value > 0", () => {
      expect(scorer.getSeverity("unknown-check", 0)).toBeNull()
      expect(scorer.getSeverity("unknown-check", 1)).toBe("warning")
    })
  })

  describe("resultToIssue", () => {
    const mockMeta: CheckMeta = {
      id: "element-count",
      name: "Element count",
      checkNumber: 1,
      highlightable: false,
      benchmark: "Best practice: under 100 elements",
    }

    it("returns null when severity is null", () => {
      const result: CheckResult = { value: 50, message: "Found 50 elements" }
      expect(scorer.resultToIssue(mockMeta, result)).toBeNull()
    })

    it("creates issue with warning severity", () => {
      const result: CheckResult = { value: 250, message: "Found 250 elements" }
      const issue = scorer.resultToIssue(mockMeta, result)

      expect(issue).not.toBeNull()
      expect(issue?.severity).toBe("warning")
      expect(issue?.count).toBe(250)
      expect(issue?.title).toBe("Element count")
      expect(issue?.benchmark).toBe("Best practice: under 100 elements")
    })

    it("creates issue with critical severity", () => {
      const result: CheckResult = { value: 600, message: "Found 600 elements" }
      const issue = scorer.resultToIssue(mockMeta, result)

      expect(issue).not.toBeNull()
      expect(issue?.severity).toBe("critical")
    })

    it("includes elements when provided", () => {
      const mockElements = [document.createElement("div")]
      const result: CheckResult = {
        value: 250,
        message: "Found 250 elements",
        elements: mockElements,
      }
      const issue = scorer.resultToIssue(mockMeta, result)

      expect(issue?.elements).toBe(mockElements)
    })

    it("does not include elements when not provided", () => {
      const result: CheckResult = { value: 250, message: "Found 250 elements" }
      const issue = scorer.resultToIssue(mockMeta, result)

      expect(issue).not.toBeNull()
      expect("elements" in (issue ?? {})).toBe(false)
    })
  })

  describe("getThreshold", () => {
    it("returns threshold config for known check", () => {
      const threshold = scorer.getThreshold("element-count")
      expect(threshold).toBeDefined()
      expect(threshold?.warning).toBe(201)
      expect(threshold?.critical).toBe(501)
    })

    it("returns undefined for unknown check", () => {
      const threshold = scorer.getThreshold("unknown-check")
      expect(threshold).toBeUndefined()
    })
  })

  describe("setThreshold", () => {
    it("allows overriding thresholds", () => {
      const customThreshold: ThresholdConfig = {
        checkId: "element-count",
        warning: 100,
        critical: 200,
      }
      scorer.setThreshold(customThreshold)

      expect(scorer.getSeverity("element-count", 99)).toBeNull()
      expect(scorer.getSeverity("element-count", 100)).toBe("warning")
      expect(scorer.getSeverity("element-count", 200)).toBe("critical")
    })
  })

  describe("custom thresholds via constructor", () => {
    it("uses custom thresholds when provided", () => {
      const customThresholds: ThresholdConfig[] = [
        { checkId: "element-count", warning: 10, critical: 20 },
      ]
      const customScorer = new Scorer(customThresholds)

      expect(customScorer.getSeverity("element-count", 9)).toBeNull()
      expect(customScorer.getSeverity("element-count", 10)).toBe("warning")
      expect(customScorer.getSeverity("element-count", 20)).toBe("critical")
    })
  })
})

describe("DEFAULT_THRESHOLDS", () => {
  it("contains all 7 checks", () => {
    expect(DEFAULT_THRESHOLDS).toHaveLength(7)
  })

  it("has correct check IDs", () => {
    const checkIds = DEFAULT_THRESHOLDS.map((t) => t.checkId)
    expect(checkIds).toContain("element-count")
    expect(checkIds).toContain("rg-nesting")
    expect(checkIds).toContain("visible-on-load")
    expect(checkIds).toContain("hidden-loaded")
    expect(checkIds).toContain("images-no-dimensions")
    expect(checkIds).toContain("rg-cell-count")
    expect(checkIds).toContain("group-nesting")
  })
})
