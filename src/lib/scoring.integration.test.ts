import { describe, it, expect, beforeEach, vi } from "vitest"
import { runAnalysis, calculateScoreFromIssues, runAllChecks } from "./scoring"
import type { Issue } from "./store"

/**
 * Integration test for the full analysis flow.
 * Tests that runAnalysis correctly:
 * 1. Runs all 7 checks on mock Bubble page HTML
 * 2. Generates appropriate issues with correct severities
 * 3. Calculates the final score based on issues
 */

// Mock Bubble page HTML with realistic structure
function createMockBubblePage(config: {
  elementCount?: number
  rgNestingDepth?: number
  visibleElements?: number
  hiddenDataElements?: number
  imagesWithoutDimensions?: number
  rgCellElements?: number
  groupNestingDepth?: number
}): string {
  const {
    elementCount = 50,
    rgNestingDepth = 0,
    visibleElements = 20,
    hiddenDataElements = 0,
    imagesWithoutDimensions = 0,
    rgCellElements = 3,
    groupNestingDepth = 2,
  } = config

  let html = ""

  // Create visible Bubble elements
  for (let i = 0; i < visibleElements; i++) {
    html += `<div data-element-id="visible-el-${i}" class="bubble-element">Visible ${i}</div>\n`
  }

  // Create additional hidden elements to reach element count
  const hiddenCount = elementCount - visibleElements
  for (let i = 0; i < hiddenCount; i++) {
    html += `<div data-element-id="hidden-el-${i}" class="bubble-element" style="display: none;">Hidden ${i}</div>\n`
  }

  // Create nested repeating groups if needed
  if (rgNestingDepth > 0) {
    let rgHtml = `<div data-element-id="rg-cell" class="bubble-element">Cell content</div>`
    for (let i = 0; i < rgNestingDepth; i++) {
      rgHtml = `<div class="RepeatingGroup" data-element-id="RepeatingGroup-${i}">${rgHtml}</div>`
    }
    html += rgHtml
  }

  // Create hidden but loaded elements (with data-source)
  for (let i = 0; i < hiddenDataElements; i++) {
    html += `<div data-element-id="hidden-data-${i}" data-source="db-source-${i}" style="display: none;">Hidden Data ${i}</div>\n`
  }

  // Create images without dimensions
  for (let i = 0; i < imagesWithoutDimensions; i++) {
    html += `<img src="image-${i}.jpg" alt="Image ${i}">\n`
  }

  // Create a repeating group with cells containing elements
  if (rgCellElements > 0) {
    let cellContent = ""
    for (let i = 0; i < rgCellElements; i++) {
      cellContent += `<div data-element-id="cell-item-${i}" class="bubble-element">Cell item ${i}</div>`
    }
    html += `<div class="RepeatingGroup" data-element-id="RepeatingGroup-main">
      <div class="RepeatingGroupCell" data-element-id="cell-0">${cellContent}</div>
    </div>\n`
  }

  // Create nested groups
  if (groupNestingDepth > 0) {
    let groupHtml = `<div data-element-id="inner-content" class="bubble-element">Inner content</div>`
    for (let i = 0; i < groupNestingDepth; i++) {
      groupHtml = `<div class="Group" data-element-id="Group-${i}">${groupHtml}</div>`
    }
    html += groupHtml
  }

  return html
}

describe("Integration: Full Analysis Flow", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  describe("runAnalysis", () => {
    it("returns perfect score for optimal page", () => {
      // Create a page with all checks passing (below thresholds)
      document.body.innerHTML = createMockBubblePage({
        elementCount: 50, // Below 200 warning threshold
        rgNestingDepth: 0, // No nesting
        visibleElements: 30, // Below 50 warning threshold
        hiddenDataElements: 0, // None
        imagesWithoutDimensions: 0, // None
        rgCellElements: 3, // Below 5 threshold
        groupNestingDepth: 3, // Below 5 warning threshold
      })

      const { issues, score } = runAnalysis()

      // No issues should be generated
      expect(issues).toHaveLength(0)
      // Score should be perfect
      expect(score).toBe(100)
    })

    it("detects element count warning", () => {
      // Create 250 elements (above 200 warning threshold)
      let html = ""
      for (let i = 0; i < 250; i++) {
        html += `<div data-element-id="el-${i}">Element ${i}</div>`
      }
      document.body.innerHTML = html

      const { issues, score } = runAnalysis()

      const elementCountIssue = issues.find((i) => i.id.includes("element-count"))
      expect(elementCountIssue).toBeDefined()
      expect(elementCountIssue?.severity).toBe("warning")
      expect(elementCountIssue?.count).toBe(250)

      // Score should be reduced by warning penalty (5 points)
      expect(score).toBeLessThan(100)
    })

    it("detects element count critical", () => {
      // Create 550 elements (above 500 critical threshold)
      let html = ""
      for (let i = 0; i < 550; i++) {
        html += `<div data-element-id="el-${i}">Element ${i}</div>`
      }
      document.body.innerHTML = html

      const { issues, score } = runAnalysis()

      const elementCountIssue = issues.find((i) => i.id.includes("element-count"))
      expect(elementCountIssue).toBeDefined()
      expect(elementCountIssue?.severity).toBe("critical")
      expect(elementCountIssue?.count).toBe(550)

      // Score should be reduced by critical penalty (15 points)
      expect(score).toBeLessThanOrEqual(85)
    })

    it("detects nested repeating groups", () => {
      // Create triply nested RGs (depth 2 triggers warning - inner RG has 2 ancestors)
      document.body.innerHTML = `
        <div class="RepeatingGroup" data-element-id="RG-outer">
          <div class="RepeatingGroup" data-element-id="RG-middle">
            <div class="RepeatingGroup" data-element-id="RG-inner">
              <div data-element-id="content">Content</div>
            </div>
          </div>
        </div>
      `

      const { issues } = runAnalysis()

      const rgNestingIssue = issues.find((i) => i.id.includes("rg-nesting"))
      expect(rgNestingIssue).toBeDefined()
      expect(rgNestingIssue?.severity).toBe("warning")
    })

    it("detects visible elements above threshold", () => {
      // Create 60 visible elements (above 50 warning threshold)
      let html = ""
      for (let i = 0; i < 60; i++) {
        html += `<div data-element-id="visible-${i}" class="bubble-element">Visible ${i}</div>`
      }
      document.body.innerHTML = html

      const { issues } = runAnalysis()

      const visibleIssue = issues.find((i) => i.id.includes("visible-on-load"))
      expect(visibleIssue).toBeDefined()
      expect(visibleIssue?.severity).toBe("warning")
      expect(visibleIssue?.count).toBe(60)
    })

    it("detects hidden but loaded data elements", () => {
      // Create 25 hidden elements with data-source (above 20 warning threshold)
      let html = ""
      for (let i = 0; i < 25; i++) {
        html += `<div data-source="source-${i}" style="display: none;">Hidden data ${i}</div>`
      }
      document.body.innerHTML = html

      const { issues } = runAnalysis()

      const hiddenLoadedIssue = issues.find((i) => i.id.includes("hidden-loaded"))
      expect(hiddenLoadedIssue).toBeDefined()
      expect(hiddenLoadedIssue?.severity).toBe("warning")
      expect(hiddenLoadedIssue?.count).toBe(25)
    })

    it("detects images without dimensions", () => {
      // Create images without width/height (any triggers warning)
      document.body.innerHTML = `
        <img src="image1.jpg" alt="Image 1">
        <img src="image2.jpg" alt="Image 2">
      `

      const { issues } = runAnalysis()

      const imagesIssue = issues.find((i) => i.id.includes("images-no-dimensions"))
      expect(imagesIssue).toBeDefined()
      expect(imagesIssue?.severity).toBe("warning")
      expect(imagesIssue?.count).toBe(2)
    })

    it("does not flag images with proper dimensions", () => {
      document.body.innerHTML = `
        <img src="image1.jpg" alt="Image 1" width="100" height="100">
        <img src="image2.jpg" alt="Image 2" style="width: 200px; height: 200px;">
      `

      const { issues } = runAnalysis()

      const imagesIssue = issues.find((i) => i.id.includes("images-no-dimensions"))
      expect(imagesIssue).toBeUndefined()
    })

    it("detects bloated RG cells", () => {
      // Create RG with cells containing 8 elements (above 5 threshold)
      let cellContent = ""
      for (let i = 0; i < 8; i++) {
        cellContent += `<div data-element-id="cell-item-${i}" class="bubble-element">Item ${i}</div>`
      }
      document.body.innerHTML = `
        <div class="RepeatingGroup" data-element-id="RepeatingGroup-main">
          <div class="RepeatingGroupCell" data-element-id="cell-0">${cellContent}</div>
        </div>
      `

      const { issues } = runAnalysis()

      const rgCellIssue = issues.find((i) => i.id.includes("rg-cell-count"))
      expect(rgCellIssue).toBeDefined()
      expect(rgCellIssue?.severity).toBe("warning")
      expect(rgCellIssue?.count).toBe(8) // Max elements per cell
    })

    it("detects deep group nesting", () => {
      // Create 7 levels of nested groups (above 5 warning threshold)
      let groupHtml = `<div data-element-id="content">Content</div>`
      for (let i = 0; i < 7; i++) {
        groupHtml = `<div class="Group" data-element-id="Group-${i}">${groupHtml}</div>`
      }
      document.body.innerHTML = groupHtml

      const { issues } = runAnalysis()

      const groupNestingIssue = issues.find((i) => i.id.includes("group-nesting"))
      expect(groupNestingIssue).toBeDefined()
      expect(groupNestingIssue?.severity).toBe("warning")
      expect(groupNestingIssue?.count).toBe(7)
    })

    it("detects multiple issues simultaneously", () => {
      // Create a page with multiple problems
      let html = ""

      // 300 elements (warning)
      for (let i = 0; i < 300; i++) {
        html += `<div data-element-id="el-${i}">Element ${i}</div>`
      }

      // 3 images without dimensions (warning)
      html += `<img src="a.jpg"><img src="b.jpg"><img src="c.jpg">`

      // 30 hidden data elements (warning)
      for (let i = 0; i < 30; i++) {
        html += `<div data-source="s-${i}" style="display: none;">H</div>`
      }

      document.body.innerHTML = html

      const { issues, score } = runAnalysis()

      // Should have multiple issues
      expect(issues.length).toBeGreaterThanOrEqual(3)

      // Score should reflect multiple penalties
      // Starting at 100, each warning deducts 5 points
      // With at least 3+ warnings, score should be ≤ 85
      expect(score).toBeLessThanOrEqual(85)
    })

    it("combines critical and warning penalties correctly", () => {
      // Create a page with both critical and warning issues
      let html = ""

      // 550 elements (critical - 15 points)
      for (let i = 0; i < 550; i++) {
        html += `<div data-element-id="el-${i}">Element ${i}</div>`
      }

      // Images without dimensions (warning - 5 points)
      html += `<img src="test.jpg">`

      document.body.innerHTML = html

      const { issues, score } = runAnalysis()

      const criticalIssues = issues.filter((i) => i.severity === "critical")
      const warningIssues = issues.filter((i) => i.severity === "warning")

      expect(criticalIssues.length).toBeGreaterThanOrEqual(1)
      expect(warningIssues.length).toBeGreaterThanOrEqual(1)

      // Score = 100 - (criticals * 15) - (warnings * 5)
      const expectedMax = 100 - criticalIssues.length * 15 - warningIssues.length * 5
      expect(score).toBeLessThanOrEqual(expectedMax)
    })
  })

  describe("calculateScoreFromIssues", () => {
    it("returns 100 for no issues", () => {
      const score = calculateScoreFromIssues([])
      expect(score).toBe(100)
    })

    it("deducts 5 for each warning", () => {
      const issues: Issue[] = [
        createMockIssue("warning"),
        createMockIssue("warning"),
      ]
      const score = calculateScoreFromIssues(issues)
      expect(score).toBe(90) // 100 - 5 - 5
    })

    it("deducts 15 for each critical", () => {
      const issues: Issue[] = [
        createMockIssue("critical"),
        createMockIssue("critical"),
      ]
      const score = calculateScoreFromIssues(issues)
      expect(score).toBe(70) // 100 - 15 - 15
    })

    it("does not deduct for info severity", () => {
      const issues: Issue[] = [
        createMockIssue("info"),
        createMockIssue("info"),
      ]
      const score = calculateScoreFromIssues(issues)
      expect(score).toBe(100)
    })

    it("combines different severities correctly", () => {
      const issues: Issue[] = [
        createMockIssue("critical"), // -15
        createMockIssue("warning"), // -5
        createMockIssue("warning"), // -5
        createMockIssue("info"), // 0
      ]
      const score = calculateScoreFromIssues(issues)
      expect(score).toBe(75) // 100 - 15 - 5 - 5
    })

    it("never goes below 0", () => {
      const issues: Issue[] = []
      // Create 10 critical issues (-150 points)
      for (let i = 0; i < 10; i++) {
        issues.push(createMockIssue("critical"))
      }
      const score = calculateScoreFromIssues(issues)
      expect(score).toBe(0)
    })
  })

  describe("runAllChecks", () => {
    it("runs all 7 checks", () => {
      // Set up a page that triggers all checks
      document.body.innerHTML = createMockBubblePage({
        elementCount: 300, // Triggers element count warning
        rgNestingDepth: 2, // Triggers RG nesting warning
        visibleElements: 60, // Triggers visible-on-load warning
        hiddenDataElements: 25, // Triggers hidden-loaded warning
        imagesWithoutDimensions: 2, // Triggers images warning
        rgCellElements: 8, // Triggers RG cell count warning
        groupNestingDepth: 7, // Triggers group nesting warning
      })

      const issues = runAllChecks()

      // Verify issues come from different checks
      const checkIds = new Set(issues.map((i) => i.id))

      // Should have issues from multiple checks
      expect(checkIds.size).toBeGreaterThanOrEqual(5)
    })

    it("returns deterministic results for same DOM", () => {
      document.body.innerHTML = createMockBubblePage({
        elementCount: 250,
        visibleElements: 60,
      })

      const result1 = runAllChecks()
      const result2 = runAllChecks()

      expect(result1).toEqual(result2)
    })
  })

  describe("Issue structure", () => {
    it("includes all required fields", () => {
      // Create a page that triggers an issue
      let html = ""
      for (let i = 0; i < 250; i++) {
        html += `<div data-element-id="el-${i}">Element ${i}</div>`
      }
      document.body.innerHTML = html

      const { issues } = runAnalysis()

      expect(issues.length).toBeGreaterThan(0)

      const issue = issues[0]
      expect(issue).toBeDefined()
      expect(issue).toHaveProperty("id")
      expect(issue).toHaveProperty("checkNumber")
      expect(issue).toHaveProperty("title")
      expect(issue).toHaveProperty("severity")
      expect(issue).toHaveProperty("count")
      expect(issue).toHaveProperty("message")
      expect(issue).toHaveProperty("benchmark")
    })

    it("includes elements array for highlightable checks", () => {
      // Create triply nested RGs to trigger warning (depth 2 = inner has 2 ancestors)
      document.body.innerHTML = `
        <div class="RepeatingGroup" data-element-id="RG-outer">
          <div class="RepeatingGroup" data-element-id="RG-middle">
            <div class="RepeatingGroup" data-element-id="RG-inner">
              <div data-element-id="content">Content</div>
            </div>
          </div>
        </div>
      `

      const { issues } = runAnalysis()

      const rgIssue = issues.find((i) => i.id.includes("rg-nesting"))
      expect(rgIssue).toBeDefined()
      expect(rgIssue?.elements).toBeDefined()
      expect(rgIssue?.elements?.length).toBeGreaterThan(0)
    })
  })
})

// Helper function to create mock issues
function createMockIssue(severity: Issue["severity"]): Issue {
  return {
    id: `test-issue-${Math.random()}`,
    checkNumber: 1,
    title: "Test Issue",
    severity,
    count: 1,
    message: "Test message",
    benchmark: "Test benchmark",
  }
}
