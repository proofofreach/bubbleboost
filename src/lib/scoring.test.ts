import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  runAllChecks,
  calculateScoreFromIssues,
  runAnalysis,
  runAnalysisWithHistory,
} from "./scoring"
import { registry } from "./checks"
import type { Issue } from "./store"

// Import all checks to ensure they're registered
import "./checks/elementCount"
import "./checks/rgNestingDepth"
import "./checks/visibleOnLoad"
import "./checks/hiddenButLoaded"
import "./checks/imagesWithoutDimensions"
import "./checks/rgCellElementCount"
import "./checks/groupNestingDepth"

/**
 * Integration test for full analysis flow.
 * Tests end-to-end analysis on mock Bubble page HTML.
 */
describe("Full Analysis Flow (Integration)", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
    document.head.innerHTML = ""
    registry.clearCache()
    registry.resetCacheStats()
  })

  describe("runAnalysis on clean page", () => {
    it("returns perfect score (100) for page with no Bubble elements", () => {
      document.body.innerHTML = `
        <div>Regular HTML page</div>
        <p>No Bubble elements here</p>
      `

      const { issues, score } = runAnalysis()

      expect(score).toBe(100)
      expect(issues).toHaveLength(0)
    })

    it("returns perfect score for minimal well-optimized page", () => {
      // A simple page with few elements, no issues
      document.body.innerHTML = `
        <div data-element-id="header" class="bubble-element">
          <div data-element-id="logo" class="bubble-element">Logo</div>
          <div data-element-id="nav" class="bubble-element">Nav</div>
        </div>
        <div data-element-id="main" class="bubble-element">
          <div data-element-id="content" class="bubble-element">
            <img src="hero.jpg" width="800" height="600" alt="Hero">
          </div>
        </div>
      `

      const { issues, score } = runAnalysis()

      expect(score).toBe(100)
      expect(issues).toHaveLength(0)
    })
  })

  describe("runAnalysis on problematic pages", () => {
    it("detects high element count (warning)", () => {
      // Create 250 elements (above 200 warning threshold, below 500 critical)
      // Use style="display:none" to avoid triggering visible-on-load check
      let html = '<div id="container">'
      for (let i = 0; i < 250; i++) {
        html += `<div data-element-id="el${i}" class="bubble-element" style="display:none">Element ${i}</div>`
      }
      html += "</div>"
      document.body.innerHTML = html

      const { issues, score } = runAnalysis()

      // Should have element-count warning
      const elementCountIssue = issues.find((i) => i.id.includes("element-count"))
      expect(elementCountIssue).toBeDefined()
      expect(elementCountIssue?.severity).toBe("warning")
      expect(elementCountIssue?.count).toBe(250)

      // Score should be reduced by warning penalty (5 points)
      expect(score).toBe(95)
    })

    it("detects high element count (critical)", () => {
      // Create 600 elements (above 500 critical threshold)
      // Use style="display:none" to avoid triggering visible-on-load check
      let html = '<div id="container">'
      for (let i = 0; i < 600; i++) {
        html += `<div data-element-id="el${i}" class="bubble-element" style="display:none">Element ${i}</div>`
      }
      html += "</div>"
      document.body.innerHTML = html

      const { issues, score } = runAnalysis()

      const elementCountIssue = issues.find((i) => i.id.includes("element-count"))
      expect(elementCountIssue).toBeDefined()
      expect(elementCountIssue?.severity).toBe("critical")
      expect(elementCountIssue?.count).toBe(600)

      // Score should be reduced by critical penalty (15 points)
      expect(score).toBe(85)
    })

    it("detects images without dimensions", () => {
      document.body.innerHTML = `
        <div data-element-id="container" class="bubble-element">
          <img src="image1.jpg" data-element-id="img1">
          <img src="image2.jpg" data-element-id="img2">
          <img src="image3.jpg" width="100" height="100" data-element-id="img3">
        </div>
      `

      const { issues, score } = runAnalysis()

      const imagesIssue = issues.find((i) => i.id.includes("images-no-dimensions"))
      expect(imagesIssue).toBeDefined()
      expect(imagesIssue?.severity).toBe("warning")
      expect(imagesIssue?.count).toBe(2) // 2 images without dimensions

      // Warning penalty
      expect(score).toBe(95)
    })

    it("detects deep repeating group nesting", () => {
      // Create nested RGs (depth 3 should trigger critical)
      // RG check looks for class*="RepeatingGroup" or data-element-id*="RepeatingGroup"
      document.body.innerHTML = `
        <div data-element-id="page" class="bubble-element" style="display:none">
          <div class="RepeatingGroup" data-element-id="RepeatingGroup-rg1" style="display:none">
            <div class="RepeatingGroup" data-element-id="RepeatingGroup-rg2" style="display:none">
              <div class="RepeatingGroup" data-element-id="RepeatingGroup-rg3" style="display:none">
                <div class="RepeatingGroup" data-element-id="RepeatingGroup-rg4" style="display:none">
                  <div data-element-id="content" class="bubble-element" style="display:none">Deep content</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `

      const { issues, score } = runAnalysis()

      const rgNestingIssue = issues.find((i) => i.id.includes("rg-nesting"))
      expect(rgNestingIssue).toBeDefined()
      expect(rgNestingIssue?.severity).toBe("critical")
      expect(rgNestingIssue?.count).toBe(3) // depth 3 (innermost has 3 ancestors)

      // Critical penalty
      expect(score).toBe(85)
    })

    it("detects deep group nesting", () => {
      // Create deeply nested groups (depth 7 should trigger warning, >5 threshold)
      // Group check looks for class containing "Group" (but not "RepeatingGroup")
      document.body.innerHTML = `
        <div data-element-id="Group-g1" class="Group bubble-element" style="display:none">
          <div data-element-id="Group-g2" class="Group bubble-element" style="display:none">
            <div data-element-id="Group-g3" class="Group bubble-element" style="display:none">
              <div data-element-id="Group-g4" class="Group bubble-element" style="display:none">
                <div data-element-id="Group-g5" class="Group bubble-element" style="display:none">
                  <div data-element-id="Group-g6" class="Group bubble-element" style="display:none">
                    <div data-element-id="Group-g7" class="Group bubble-element" style="display:none">
                      Content
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `

      const { issues, score } = runAnalysis()

      const groupNestingIssue = issues.find((i) => i.id.includes("group-nesting"))
      expect(groupNestingIssue).toBeDefined()
      expect(groupNestingIssue?.severity).toBe("warning")
      expect(groupNestingIssue?.count).toBe(7) // depth 7
    })
  })

  describe("runAnalysis on realistic Bubble page", () => {
    it("correctly analyzes a typical Bubble app page", () => {
      // Simulate a realistic Bubble app structure with multiple issues
      document.body.innerHTML = createRealisticBubblePage({
        elementCount: 300, // Warning threshold
        rgNestingDepth: 2, // At warning threshold
        imagesWithoutDimensions: 3,
        groupNestingDepth: 4, // Below threshold
      })

      const { issues, score } = runAnalysis()

      // Should detect element count warning and images warning
      expect(issues.length).toBeGreaterThanOrEqual(2)

      // Verify specific issues
      const issueIds = issues.map((i) => i.id)
      expect(issueIds.some((id) => id.includes("element-count"))).toBe(true)
      expect(issueIds.some((id) => id.includes("images-no-dimensions"))).toBe(true)

      // Score should reflect penalties
      // Element count warning: -5, Images warning: -5, RG nesting warning: -5
      expect(score).toBeLessThan(100)
      expect(score).toBeGreaterThanOrEqual(0)
    })
  })

  describe("runAnalysisWithHistory", () => {
    it("tracks score history correctly", () => {
      let storeState = { score: 100 }
      let previousScore: number | null = null
      let storedIssues: Issue[] = []
      let storedScore = 100

      // First analysis on clean page
      document.body.innerHTML = `<div data-element-id="el1" class="bubble-element">Clean</div>`

      runAnalysisWithHistory(
        () => storeState,
        (score) => {
          storedScore = score
          storeState = { score }
        },
        (prev) => {
          previousScore = prev
        },
        (issues) => {
          storedIssues = issues
        }
      )

      expect(previousScore).toBe(100) // Previous score saved
      expect(storedScore).toBe(100) // New score calculated
      expect(storedIssues).toHaveLength(0)

      // Second analysis with issues
      // Use style="display:none" to avoid triggering visible-on-load check
      let html = ""
      for (let i = 0; i < 250; i++) {
        html += `<div data-element-id="el${i}" class="bubble-element" style="display:none">Element ${i}</div>`
      }
      document.body.innerHTML = html

      runAnalysisWithHistory(
        () => storeState,
        (score) => {
          storedScore = score
          storeState = { score }
        },
        (prev) => {
          previousScore = prev
        },
        (issues) => {
          storedIssues = issues
        }
      )

      expect(previousScore).toBe(100) // Previous score from first analysis
      expect(storedScore).toBe(95) // New score with warning
      expect(storedIssues.length).toBeGreaterThan(0)
    })
  })

  describe("calculateScoreFromIssues", () => {
    it("returns 100 for no issues", () => {
      expect(calculateScoreFromIssues([])).toBe(100)
    })

    it("applies warning penalty correctly", () => {
      const issues: Issue[] = [
        createMockIssue("test-1", "warning"),
        createMockIssue("test-2", "warning"),
      ]
      // 100 - 5 - 5 = 90
      expect(calculateScoreFromIssues(issues)).toBe(90)
    })

    it("applies critical penalty correctly", () => {
      const issues: Issue[] = [
        createMockIssue("test-1", "critical"),
        createMockIssue("test-2", "critical"),
      ]
      // 100 - 15 - 15 = 70
      expect(calculateScoreFromIssues(issues)).toBe(70)
    })

    it("applies mixed penalties correctly", () => {
      const issues: Issue[] = [
        createMockIssue("test-1", "critical"),
        createMockIssue("test-2", "warning"),
        createMockIssue("test-3", "warning"),
        createMockIssue("test-4", "info"),
      ]
      // 100 - 15 - 5 - 5 - 0 = 75
      expect(calculateScoreFromIssues(issues)).toBe(75)
    })

    it("never goes below 0", () => {
      const issues: Issue[] = []
      for (let i = 0; i < 10; i++) {
        issues.push(createMockIssue(`test-${i}`, "critical"))
      }
      // 100 - (10 * 15) = -50, but should clamp to 0
      expect(calculateScoreFromIssues(issues)).toBe(0)
    })
  })

  describe("runAllChecks", () => {
    it("returns array of issues", () => {
      document.body.innerHTML = '<div data-element-id="el1" class="bubble-element">Test</div>'

      const issues = runAllChecks()

      expect(Array.isArray(issues)).toBe(true)
    })

    it("runs all 7 checks", () => {
      // Create HTML that triggers multiple checks
      let html = ""
      for (let i = 0; i < 250; i++) {
        html += `<div data-element-id="el${i}" class="bubble-element">Element ${i}</div>`
      }
      html += '<img src="test.jpg" data-element-id="img1">' // Image without dimensions
      document.body.innerHTML = html

      const issues = runAllChecks()

      // Should have at least element count and images issues
      expect(issues.length).toBeGreaterThanOrEqual(2)

      // Verify issues have proper structure
      for (const issue of issues) {
        expect(issue).toHaveProperty("id")
        expect(issue).toHaveProperty("checkNumber")
        expect(issue).toHaveProperty("title")
        expect(issue).toHaveProperty("severity")
        expect(issue).toHaveProperty("count")
        expect(issue).toHaveProperty("message")
        expect(issue).toHaveProperty("benchmark")
      }
    })
  })
})

/**
 * Helper to create a mock Issue for testing score calculation.
 */
function createMockIssue(id: string, severity: Issue["severity"]): Issue {
  return {
    id,
    checkNumber: 1,
    title: "Test Issue",
    severity,
    count: 1,
    message: "Test message",
    benchmark: "Test benchmark",
  }
}

/**
 * Helper to create realistic Bubble page HTML with configurable issues.
 */
function createRealisticBubblePage(config: {
  elementCount: number
  rgNestingDepth: number
  imagesWithoutDimensions: number
  groupNestingDepth: number
}): string {
  let html = '<div data-element-id="page" class="bubble-element">'

  // Add header section
  html += '<div data-element-id="header" class="bubble-element">'
  html += '<div data-element-id="logo" class="bubble-element">Logo</div>'
  html += '<div data-element-id="nav" class="bubble-element">Navigation</div>'
  html += "</div>"

  // Add images (some without dimensions)
  for (let i = 0; i < config.imagesWithoutDimensions; i++) {
    html += `<img src="image${i}.jpg" data-element-id="img${i}" class="bubble-element">`
  }
  // Add an image with dimensions
  html += '<img src="good-image.jpg" width="400" height="300" data-element-id="goodimg" class="bubble-element">'

  // Add nested repeating groups
  let rgHtml = ""
  for (let depth = 0; depth < config.rgNestingDepth; depth++) {
    rgHtml += `<div data-source="rg${depth}" data-element-id="rg${depth}" class="bubble-element">`
  }
  rgHtml += '<div data-element-id="rg-content" class="bubble-element">RG Content</div>'
  for (let depth = 0; depth < config.rgNestingDepth; depth++) {
    rgHtml += "</div>"
  }
  html += rgHtml

  // Add nested groups
  let groupHtml = ""
  for (let depth = 0; depth < config.groupNestingDepth; depth++) {
    groupHtml += `<div data-element-id="group${depth}" class="bubble-element bubble-r-container-group">`
  }
  groupHtml += '<div data-element-id="group-content" class="bubble-element">Group Content</div>'
  for (let depth = 0; depth < config.groupNestingDepth; depth++) {
    groupHtml += "</div>"
  }
  html += groupHtml

  // Add remaining elements to reach count
  const existingCount = 10 + config.imagesWithoutDimensions + config.rgNestingDepth + config.groupNestingDepth
  const remaining = Math.max(0, config.elementCount - existingCount)
  for (let i = 0; i < remaining; i++) {
    html += `<div data-element-id="el${i}" class="bubble-element">Element ${i}</div>`
  }

  html += "</div>"
  return html
}
