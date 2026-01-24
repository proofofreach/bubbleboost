import { registry } from "./registry"
import type { Check } from "./types"
import type { Issue } from "~lib/store"

const CHECK_META = {
  id: "rg-nesting",
  name: "RG nesting depth",
  checkNumber: 2,
  highlightable: true,
  benchmark: "Best practice: avoid nesting repeating groups",
} as const

/**
 * Check 2: RG nesting depth
 * Detect nested repeating groups via DOM traversal.
 * Warn >1 level, critical >2.
 */
function runCheck(): { value: number; severity: Issue["severity"]; elements: Element[] } | null {
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
  const severity: Issue["severity"] = maxDepth > 2 ? "critical" : "warning"

  return { value: maxDepth, severity, elements: nestedElements }
}

const rgNestingDepthCheck: Check = {
  meta: CHECK_META,
  run: () => {
    const result = runCheck()
    if (result === null) return null
    return {
      value: result.value,
      message: `Repeating groups nested ${result.value} levels deep`,
      elements: result.elements,
    }
  },
}

// Self-register with the registry
registry.register(rgNestingDepthCheck)

/**
 * Legacy function for backward compatibility.
 */
export function checkRgNestingDepth(): Issue | null {
  const result = runCheck()
  if (result === null) return null

  return {
    id: `check-${CHECK_META.checkNumber}-${CHECK_META.id}`,
    checkNumber: CHECK_META.checkNumber,
    title: CHECK_META.name,
    severity: result.severity,
    count: result.value,
    message: `Repeating groups nested ${result.value} levels deep`,
    benchmark: CHECK_META.benchmark,
    elements: result.elements,
  }
}

export { rgNestingDepthCheck }
