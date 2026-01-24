import { registry } from "./registry"
import { scorer } from "./scorer"
import type { Check, CheckResult } from "./types"
import type { Issue } from "~lib/store"

const CHECK_META = {
  id: "element-count",
  name: "Element count",
  checkNumber: 1,
  highlightable: false,
  benchmark: "Best practice: under 100 elements",
} as const

/**
 * Check 1: Element count
 * Count DOM elements with [data-element-id] or Bubble class markers.
 * Returns raw count - scorer determines severity based on thresholds.
 */
function runCheck(): CheckResult {
  // Count elements with Bubble markers
  const elementsWithDataId = document.querySelectorAll("[data-element-id]")
  const elementsWithBubbleClass = document.querySelectorAll(
    '[class*="bubble-element"]'
  )

  // Use a Set to avoid counting the same element twice
  const allElements = new Set<Element>()
  elementsWithDataId.forEach((el) => allElements.add(el))
  elementsWithBubbleClass.forEach((el) => allElements.add(el))

  const count = allElements.size

  return {
    value: count,
    message: `Found ${count} Bubble elements on the page`,
  }
}

const elementCountCheck: Check = {
  meta: CHECK_META,
  run: runCheck,
}

// Self-register with the registry
registry.register(elementCountCheck)

/**
 * Legacy function for backward compatibility.
 * Returns an Issue directly (used by existing scoring.ts).
 */
export function checkElementCount(): Issue | null {
  const result = runCheck()
  return scorer.resultToIssue(CHECK_META, result)
}

export { elementCountCheck }
