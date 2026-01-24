import { registry } from "./registry"
import { scorer } from "./scorer"
import type { Check, CheckResult } from "./types"
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
 * Returns raw depth - scorer determines severity based on thresholds.
 */
function runCheck(): CheckResult {
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

  const result: CheckResult = {
    value: maxDepth,
    message: maxDepth > 0
      ? `Repeating groups nested ${maxDepth} levels deep`
      : "No nested repeating groups found",
  }

  if (nestedElements.length > 0) {
    result.elements = nestedElements
  }

  return result
}

const rgNestingDepthCheck: Check = {
  meta: CHECK_META,
  run: runCheck,
}

// Self-register with the registry
registry.register(rgNestingDepthCheck)

/**
 * Legacy function for backward compatibility.
 */
export function checkRgNestingDepth(): Issue | null {
  const result = runCheck()
  return scorer.resultToIssue(CHECK_META, result)
}

export { rgNestingDepthCheck }
