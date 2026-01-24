import type { Issue } from "~lib/store"

/**
 * Check 2: RG nesting depth
 * Detect nested repeating groups via DOM traversal.
 * Warn >1 level, critical >2.
 */
export function checkRgNestingDepth(): Issue | null {
  // Find all repeating groups - Bubble uses class containing "RepeatingGroup"
  const repeatingGroups = document.querySelectorAll(
    '[class*="RepeatingGroup"], [data-element-id*="RepeatingGroup"]'
  )

  let maxDepth = 0
  const nestedElements: Element[] = []

  repeatingGroups.forEach((rg) => {
    // Check how many RG ancestors this element has
    let depth = 0
    let parent = rg.parentElement

    while (parent) {
      if (
        parent.className?.includes?.("RepeatingGroup") ||
        parent.getAttribute("data-element-id")?.includes("RepeatingGroup")
      ) {
        depth++
      }
      parent = parent.parentElement
    }

    if (depth > 0) {
      // This RG is nested
      nestedElements.push(rg)
    }

    if (depth > maxDepth) {
      maxDepth = depth
    }
  })

  // No nesting or only 1 level is acceptable
  if (maxDepth <= 1) {
    return null
  }

  // Determine severity
  let severity: "critical" | "warning" | "info"
  if (maxDepth > 2) {
    severity = "critical"
  } else {
    severity = "warning"
  }

  return {
    id: "check-2-rg-nesting",
    checkNumber: 2,
    title: "RG nesting depth",
    severity,
    count: maxDepth,
    message: `Repeating groups nested ${maxDepth} levels deep`,
    benchmark: "Best practice: avoid nesting repeating groups",
    elements: nestedElements,
  }
}
